#!/usr/bin/env bash
set -euo pipefail

TIMEOUT_SECONDS="${1:-60}"
PUBLIC_URL="https://mathquest.mainuddintalukdar.cloud/api/health"

echo "=== Running MathQuest Health Verification (Timeout: ${TIMEOUT_SECONDS}s) ==="

START_TIME=$(date +%s)

check_internal_scoring() {
  docker exec mathquest-scoring python -c "import urllib.request; res = urllib.request.urlopen('http://127.0.0.1:8005/healthz'); exit(0 if res.getcode() == 200 else 1)" 2>/dev/null
}

check_internal_web() {
  docker exec mathquest-web wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1
}

check_external_https() {
  curl -fsSL --max-time 5 "$PUBLIC_URL" >/dev/null 2>&1
}

# 1. Wait for internal scoring container
echo "Waiting for mathquest-scoring internal health..."
while true; do
  if check_internal_scoring; then
    echo "PASS: mathquest-scoring is healthy on port 8005"
    break
  fi
  NOW=$(date +%s)
  if [ $((NOW - START_TIME)) -ge "$TIMEOUT_SECONDS" ]; then
    echo "FAIL: mathquest-scoring failed health check after ${TIMEOUT_SECONDS}s"
    docker logs --tail 20 mathquest-scoring || true
    exit 1
  fi
  sleep 2
done

# 2. Wait for internal web container
echo "Waiting for mathquest-web internal health..."
while true; do
  if check_internal_web; then
    echo "PASS: mathquest-web is healthy on port 3000"
    break
  fi
  NOW=$(date +%s)
  if [ $((NOW - START_TIME)) -ge "$TIMEOUT_SECONDS" ]; then
    echo "FAIL: mathquest-web failed health check after ${TIMEOUT_SECONDS}s"
    docker logs --tail 20 mathquest-web || true
    exit 1
  fi
  sleep 2
done

# 3. Check external HTTPS route through Caddy (if DNS and Caddy are already active)
echo "Checking external public URL: $PUBLIC_URL..."
if check_external_https; then
  echo "PASS: Public HTTPS health endpoint is live and returning 200 OK"
else
  echo "WARN: Public HTTPS health endpoint not yet responding over internet (check DNS propagation or Caddy snippet reload)."
  echo "Internal containers are healthy and running."
fi

echo "=== MathQuest Health Check Completed Successfully ==="
