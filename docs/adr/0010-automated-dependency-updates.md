# ADR 0010: Reviewed Automated Dependency Updates

## Status
Accepted

## Context
While dependencies are pinned to exact versions, security vulnerabilities and bug fixes must still be incorporated regularly in a safe, controlled manner.

## Decision
1. Configure automated weekly dependency updates via GitHub Dependabot (`.github/dependabot.yml`).
2. Dependabot monitors npm packages, Python packages, Docker base images, and GitHub Actions.
3. Safe patch updates are grouped into consolidated pull requests.
4. Auto-merging of major version bumps is strictly prohibited.
5. All update pull requests must pass the complete CI suite (linters, typecheck, unit, integration, E2E, accessibility, and container builds) before manual review and merge.

## Consequences
- Prevents technical debt without risking unexpected production breakage.
- Security vulnerabilities are surfaced and patched weekly through reviewed pull requests.
