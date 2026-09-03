#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/mathquest}"
COMPOSE_FILE="${DEPLOY_DIR}/infra/compose/docker-compose.prod.yml"
LKG_FILE="${DEPLOY_DIR}/.last-known-good"

echo "=== Initiating MathQuest Automated Rollback ==="

if [ ! -f "$LKG_FILE" ]; then
  echo "FATAL: Cannot rollback: No last-known-good release file found at $LKG_FILE"
  exit 1
fi

PREVIOUS_TAG=$(cat "$LKG_FILE" | tr -d '[:space:]')
if [ -z "$PREVIOUS_TAG" ]; then
  echo "FATAL: $LKG_FILE is empty"
  exit 1
fi

echo "Rolling back to previous release tag: $PREVIOUS_TAG"

export IMAGE_TAG="$PREVIOUS_TAG"

# Pull previous images
docker compose -f "$COMPOSE_FILE" pull

# Restart with previous image tag
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Verify health
if "${DEPLOY_DIR}/infra/scripts/health-check.sh" 30; then
  echo "SUCCESS: Rollback to $PREVIOUS_TAG completed and verified healthy."
else
  echo "FATAL: Rollback to $PREVIOUS_TAG failed health checks!"
  exit 1
fi
