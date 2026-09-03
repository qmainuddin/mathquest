# ADR 0008: Immutable Image Deployment and Automated Rollback

## Status
Accepted

## Context
Deploying Docker images with the `:latest` tag causes non-deterministic deployments, cache invalidation bugs, and inability to safely roll back when a deployment fails health checks.

## Decision
1. All application container images are tagged with the exact full Git commit SHA:
   - `ghcr.io/<owner>/mathquest-web:<full-git-sha>`
   - `ghcr.io/<owner>/mathquest-scoring:<full-git-sha>`
2. Deployments record the current release identifier into `.last-known-good` before starting new containers.
3. Post-deployment health verification checks both internal container health and external HTTPS health (`https://mathquest.mainuddintalukdar.cloud/api/health`).
4. If health checks fail within 60 seconds, `rollback.sh` is automatically invoked to restart the previous release images.

## Consequences
- Guaranteed reproducibility of every deployed release.
- Safe rollback without human intervention during failed CI/CD runs.
- Database migrations are designed to be strictly backward-compatible.
