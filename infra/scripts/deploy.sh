#!/usr/bin/env bash
set -euo pipefail

TARGET_SHA="${1:-}"
if [ -z "$TARGET_SHA" ]; then
  echo "Usage: $0 <git-commit-sha>"
  exit 1
fi

DEPLOY_DIR="${DEPLOY_DIR:-/opt/mathquest}"
COMPOSE_FILE="${DEPLOY_DIR}/infra/compose/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env.production"
LKG_FILE="${DEPLOY_DIR}/.last-known-good"

echo "=== Deploying MathQuest Release: $TARGET_SHA ==="

# 1. Validate environment file
if [ ! -f "$ENV_FILE" ]; then
  echo "FATAL: Required environment file $ENV_FILE does not exist."
  exit 1
fi

# 2. Validate stack network
if ! docker network ls --format '{{.Name}}' | grep -E '^stack$' >/dev/null; then
  echo "FATAL: Required external Docker network 'stack' does not exist."
  exit 1
fi

# 3. Save current release before updating
CURRENT_CONTAINER_IMAGE=$(docker inspect mathquest-web --format '{{.Config.Image}}' 2>/dev/null || true)
if [ -n "$CURRENT_CONTAINER_IMAGE" ]; then
  PREV_TAG=$(echo "$CURRENT_CONTAINER_IMAGE" | awk -F':' '{print $2}')
  if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$TARGET_SHA" ]; then
    echo "$PREV_TAG" > "$LKG_FILE"
    echo "Saved previous known release tag: $PREV_TAG"
  fi
fi

# 4. Pull target images
export IMAGE_TAG="$TARGET_SHA"
echo "Pulling container images for tag $IMAGE_TAG..."
docker compose -f "$COMPOSE_FILE" pull

# 5. Start containers without touching unrelated projects
echo "Starting MathQuest containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# 6. Verify health
echo "Verifying deployment health..."
if "${DEPLOY_DIR}/infra/scripts/health-check.sh" 60; then
  echo "=== Deployment Succeeded: Release $TARGET_SHA is healthy and live ==="
  echo "$TARGET_SHA" > "$LKG_FILE"
  exit 0
else
  echo "ERROR: Health check failed! Initiating automatic rollback..."
  if [ -f "$LKG_FILE" ]; then
    "${DEPLOY_DIR}/infra/scripts/rollback.sh"
  else
    echo "FATAL: Health check failed and no prior release recorded in $LKG_FILE."
  fi
  exit 1
fi
