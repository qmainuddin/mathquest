# ADR 0009: Exact Version and Digest Pinning Policy

## Status
Accepted

## Context
Floating version tags (e.g. `^`, `~`, `latest`, unpinned base images, unpinned GitHub Actions) introduce supply-chain vulnerabilities, unexpected breaking changes, and build flakiness.

## Decision
1. All direct package dependencies are pinned to exact versions (no `^` or `~`).
2. Lockfiles (`pnpm-lock.yaml`, `uv.lock`) are committed and installed with `--frozen-lockfile` / `--frozen`.
3. Docker base images specify both exact patch version and immutable SHA-256 multi-arch digest:
   - `node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e`
   - `python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254`
4. GitHub Actions are pinned to full 40-character commit SHAs.
5. Automated script `infra/scripts/check-dependency-policy.sh` runs in CI and fails if any floating tags or unpinned actions are detected.

## Consequences
- 100% deterministic builds across local workstations, CI runners, and production servers.
- Immune to upstream tag mutations or breaking patch releases.
