#!/usr/bin/env bash
set -euo pipefail

echo "=== Checking Runtime Version Consistency ==="

EXPECTED_NODE="24.20.0"
EXPECTED_PYTHON="3.12.14"

# 1. Check .node-version
if [ -f .node-version ]; then
  NODE_VER=$(tr -d '[:space:]' < .node-version)
  if [ "$NODE_VER" != "$EXPECTED_NODE" ]; then
    echo "ERROR: .node-version ($NODE_VER) does not match expected ($EXPECTED_NODE)"
    exit 1
  fi
  echo "OK: .node-version is $NODE_VER"
fi

# 2. Check .nvmrc
if [ -f .nvmrc ]; then
  NVMRC_VER=$(tr -d '[:space:]' < .nvmrc)
  if [ "$NVMRC_VER" != "$EXPECTED_NODE" ]; then
    echo "ERROR: .nvmrc ($NVMRC_VER) does not match expected ($EXPECTED_NODE)"
    exit 1
  fi
  echo "OK: .nvmrc is $NVMRC_VER"
fi

# 3. Check .tool-versions
if [ -f .tool-versions ]; then
  TV_NODE=$(grep "nodejs" .tool-versions | awk '{print $2}' | tr -d '[:space:]')
  TV_PYTHON=$(grep "python" .tool-versions | awk '{print $2}' | tr -d '[:space:]')
  if [ "$TV_NODE" != "$EXPECTED_NODE" ]; then
    echo "ERROR: .tool-versions nodejs ($TV_NODE) does not match expected ($EXPECTED_NODE)"
    exit 1
  fi
  if [ "$TV_PYTHON" != "$EXPECTED_PYTHON" ]; then
    echo "ERROR: .tool-versions python ($TV_PYTHON) does not match expected ($EXPECTED_PYTHON)"
    exit 1
  fi
  echo "OK: .tool-versions nodejs ($TV_NODE) and python ($TV_PYTHON) match"
fi

# 4. Check apps/web/Dockerfile if present
if [ -f apps/web/Dockerfile ]; then
  if ! grep -q "FROM node:${EXPECTED_NODE}-bookworm-slim" apps/web/Dockerfile; then
    echo "ERROR: apps/web/Dockerfile does not use expected node version ${EXPECTED_NODE}"
    exit 1
  fi
  echo "OK: apps/web/Dockerfile uses node:${EXPECTED_NODE}"
fi

# 5. Check services/scoring/Dockerfile if present
if [ -f services/scoring/Dockerfile ]; then
  if ! grep -q "FROM python:${EXPECTED_PYTHON}-slim-bookworm" services/scoring/Dockerfile; then
    echo "ERROR: services/scoring/Dockerfile does not use expected python version ${EXPECTED_PYTHON}"
    exit 1
  fi
  echo "OK: services/scoring/Dockerfile uses python:${EXPECTED_PYTHON}"
fi

echo "=== All Runtime Versions Are Strictly Consistent ==="
