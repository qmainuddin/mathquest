#!/usr/bin/env bash
set -euo pipefail

echo "=== Checking Dependency Policy (Zero Floating Versions) ==="

# 1. Check for floating ranges in package.json files (^, ~, *, latest)
# Exclude scripts and descriptions, check "dependencies" and "devDependencies"
ERRORS=0

while IFS= read -r pkg_json; do
  echo "Checking $pkg_json..."
  # Check for ^ or ~ in version strings
  if grep -E '": "[~^]' "$pkg_json"; then
    echo "ERROR: Found prohibited floating prefix (^ or ~) in $pkg_json"
    ERRORS=$((ERRORS + 1))
  fi
  # Check for "latest"
  if grep -E '": "latest"' "$pkg_json"; then
    echo "ERROR: Found prohibited 'latest' in $pkg_json"
    ERRORS=$((ERRORS + 1))
  fi
  # Check for "*"
  if grep -E '": "\*"' "$pkg_json"; then
    echo "ERROR: Found prohibited '*' in $pkg_json"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find . -name "package.json" -not -path "*/node_modules/*")

# 2. Check Dockerfiles for floating base tags (must include @sha256:)
while IFS= read -r dockerfile; do
  echo "Checking $dockerfile..."
  # Ignore internal multi-stage alias targets (base, builder, deps, runner, scratch)
  UNPINNED=$(grep -E "^FROM " "$dockerfile" | grep -v "@sha256:" | grep -vE "^FROM (base|builder|deps|runner|scratch)( |$)" || true)
  if [ -n "$UNPINNED" ]; then
    echo "ERROR: Docker base image in $dockerfile is not pinned to an immutable SHA-256 digest:"
    echo "$UNPINNED"
    ERRORS=$((ERRORS + 1))
  fi
  if grep -E "^FROM " "$dockerfile" | grep -iE ":latest|:stable|:current|:slim@"; then
    echo "ERROR: Docker base image in $dockerfile uses floating tag (latest/stable/current/slim without patch)"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find . -name "Dockerfile" -not -path "*/node_modules/*")

# 3. Check GitHub Actions workflows for unpinned actions (must use full 40-char commit SHA)
if [ -d .github/workflows ]; then
  while IFS= read -r workflow; do
    echo "Checking $workflow..."
    # Check lines with `uses:` that do not have `@<40 hex chars>`
    # Ignore local actions (./) or docker actions (docker://)
    while IFS= read -r line; do
      ACTION=$(echo "$line" | awk '{print $2}')
      if [[ "$ACTION" =~ ^\./ ]] || [[ "$ACTION" =~ ^docker:// ]]; then
        continue
      fi
      if ! [[ "$ACTION" =~ @[a-f0-9]{40}$ ]]; then
        echo "ERROR: GitHub Action is not pinned to a 40-character commit SHA in $workflow: $ACTION"
        ERRORS=$((ERRORS + 1))
      fi
    done < <(grep -E '^\s*uses:\s+[^ \t]+' "$workflow" || true)
  done < <(find .github/workflows -name "*.yml" -o -name "*.yaml")
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS dependency policy violations detected."
  exit 1
fi

echo "=== Dependency Policy Check Passed: Zero Floating Versions ==="
