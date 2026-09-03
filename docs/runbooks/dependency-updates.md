# Operator Runbook: Safe Dependency Updates

MathQuest enforces zero floating versions in committed production code. Dependencies must be updated in a controlled, predictable manner.

---

## 1. Automated Weekly Updates (Dependabot)

Dependabot is configured in `.github/dependabot.yml` to check for updates weekly across:
- `npm` dependencies (`apps/web`, `packages/contracts`, `packages/shared-config`)
- `pip` / Python dependencies (`services/scoring`)
- `docker` base images (`apps/web/Dockerfile`, `services/scoring/Dockerfile`)
- `github-actions` (`.github/workflows/*.yml`)

---

## 2. Reviewing & Merging Dependency Pull Requests

1. **Verify CI Passes**: A pull request cannot be merged unless all checks pass:
   - Consistency check (`infra/scripts/check-runtime-consistency.sh`)
   - Floating version scanner (`infra/scripts/check-dependency-policy.sh`)
   - Unit and contract tests
   - Docker build checks
   - Playwright end-to-end tests
2. **Review Changelogs**: For minor and major releases, inspect upstream release notes for deprecations or behavioral changes.
3. **No Floating Versions**: Ensure Dependabot PRs preserve exact pinning without introducing `^`, `~`, or floating Docker tags.

---

## 3. Manual Local Dependency Updates

### Updating JavaScript Dependencies:
```bash
# Update a specific package to an exact version
pnpm add <package-name>@<exact-version> --save-exact
# Regenerate lockfile
pnpm install --frozen-lockfile=false
# Test policy
make dependency-check
make test
```

### Updating Python Dependencies:
```bash
cd services/scoring
# Update package in pyproject.toml with exact version
# Re-sync frozen lockfile
uv sync
cd ../..
make test-unit
```

### Updating Docker Base Images:
1. Inspect the official Docker Hub API or tag list to find the newest exact patch release and multi-arch SHA-256 digest.
2. Update the `FROM` line in `apps/web/Dockerfile` or `services/scoring/Dockerfile`:
   ```dockerfile
   FROM node:<new-version>-bookworm-slim@sha256:<verified-digest>
   ```
3. Update `docs/dependency-baseline.md`.
4. Run `make docker-build` to verify successful local container build.
