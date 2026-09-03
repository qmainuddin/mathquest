# MathQuest

[![CI](https://github.com/qmainuddin/mathquest/actions/workflows/ci.yml/badge.svg)](https://github.com/qmainuddin/mathquest/actions/workflows/ci.yml)
[![Security Audit](https://github.com/qmainuddin/mathquest/actions/workflows/security.yml/badge.svg)](https://github.com/qmainuddin/mathquest/actions/workflows/security.yml)

MathQuest is a puzzle-based mathematics learning platform designed for primary-school children (ages 7–11) and their guardians.

- **Production URL**: [https://mathquest.mainuddintalukdar.cloud](https://mathquest.mainuddintalukdar.cloud)
- **Deployment Host**: Hostinger VPS (`srv1702496`) behind an existing global Caddy reverse proxy (`stack-caddy-1`) on the `stack` Docker network.
- **Database & Auth**: Supabase Cloud PostgreSQL with Row Level Security (RLS) and Passwordless Guardian Auth.
- **Architecture**:
  - `apps/web`: Next.js 16 (App Router, TypeScript 7, React 19) standalone container acting as authenticated Backend-for-Frontend (BFF).
  - `services/scoring`: Python 3.12 FastAPI microservice providing deterministic mastery scoring and next-practice recommendations on internal port `8005`.
  - `packages/contracts`: Shared TypeScript data contracts and Pydantic validation schemas.
  - Zero host ports published in production; all external traffic arrives via Caddy on the `stack` network.

---

## 1. System Architecture & Traffic Flow

```text
[ Internet Client ]
        |
        | HTTPS (Port 443 / 80)
        v
[ stack-caddy-1 ]  (on Docker network: stack)
        |
        | Reverse Proxy HTTP -> mathquest-web:3000
        v
[ mathquest-web ]  (on networks: stack AND mathquest-internal)
        |
        +-----> [ Supabase Cloud ] (Auth & PostgreSQL via strict RLS)
        |
        | Private HTTP -> mathquest-scoring:8005
        | (Header: X-Internal-Secret, X-Correlation-ID)
        v
[ mathquest-scoring ] (on network: mathquest-internal ONLY)
```

### Invariant Privacy & Security Principles
1. **Strict Server-Side Grading**: Question answers and solutions are **never** delivered to client browsers. Answer validation is executed server-side against private database tables.
2. **Child Privacy First (COPPA / GDPR-K)**: Children do not have email accounts, passwords, or public profiles. Only guardians authenticate. Child records require only a nickname and an age/year band. Full birth dates, locations, and chat logs are never collected.
3. **Microservice Isolation**: `mathquest-scoring` listens on port **8005** (relocated from 8000 to prevent collisions with host services like `tradiepulse-ai-agent`). It has no public internet access and requires `X-Internal-Secret`.

---

## 2. Pinned Tooling & Dependency Baseline

All runtimes, container bases, and GitHub actions are strictly pinned:

| Component | Selected Version / Digest | Status |
| :--- | :--- | :--- |
| **Node.js** | `24.20.0` | Active LTS ("Krypton") |
| **Node Docker Base** | `node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e` | Immutable Multi-Arch Digest |
| **Python** | `3.12.14` | Active Maintenance Release |
| **Python Docker Base** | `python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254` | Immutable Multi-Arch Digest |
| **pnpm** | `11.25.0` | Frozen lockfile |
| **Astral uv** | `0.12.7` | Frozen lockfile |
| **Next.js** | `16.3.4` | App Router, Standalone Build |
| **React** | `19.2.8` | Concurrent UI |
| **TypeScript** | `7.0.2` | Static Type Safety |
| **Tailwind CSS** | `4.3.3` | Styling Engine |
| **FastAPI** | `0.141.1` | Python Scoring Microservice |
| **Supabase JS** | `2.114.0` | Client SDK |
| **Supabase CLI** | `2.116.0` | Dev Tooling |

---

## 3. Deterministic Developer Commands (`Makefile`)

Both CI and local developers run the exact same deterministic targets:

```bash
make versions                   # Print verified tool and runtime versions
make setup                      # Install monorepo dependencies with frozen lockfiles
make dev                        # Launch development environment
make lint                       # Run linters across packages
make format-check               # Verify code formatting
make typecheck                  # Run TypeScript and Python type checks
make test                       # Run full test suite (unit and integration)
make test-unit                  # Run unit tests
make test-integration           # Run integration and answer masking tests
make test-e2e                   # Run Playwright E2E scenarios
make build                      # Build packages and Next.js standalone app
make docker-build               # Build production Docker images locally
make dependency-check           # Enforce zero floating version policy
make check-runtime-consistency  # Verify all configuration files agree on exact versions
make migration-check            # Validate Supabase migrations and RLS tests
make health                     # Verify internal and external health checks
make deploy                     # Deploy release tag to Hostinger VPS
make rollback                   # Roll back to last-known-good release on VPS
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js `24.20.0` (or managed via `.nvmrc` / `.tool-versions`)
- Python `3.12.14`
- `pnpm@11.25.0` (`corepack enable && corepack prepare pnpm@11.25.0 --activate`)
- Astral `uv@0.12.7`

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/qmainuddin/mathquest.git
cd mathquest

# 2. Verify runtimes and dependency policy
make check-runtime-consistency
make dependency-check

# 3. Install dependencies
make setup

# 4. Copy environment template
cp .env.example .env.local

# 5. Run tests
make test
```

---

## 5. Hostinger VPS Deployment & Caddy Integration

### Initial Caddy Setup
Inspect your existing `stack-caddy-1` container on the VPS:
```bash
docker inspect stack-caddy-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```
Add the MathQuest snippet (`infra/caddy/mathquest.caddy`):
```caddyfile
mathquest.mainuddintalukdar.cloud {
    encode zstd gzip
    reverse_proxy mathquest-web:3000
}
```
Reload Caddy safely without downtime:
```bash
docker exec -w /etc/caddy stack-caddy-1 caddy reload
```

### Production Deployment
Deployments are performed automatically on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`), or manually:
```bash
IMAGE_TAG=<full-git-commit-sha> make deploy
```

---

## 6. Architecture Documentation & Runbooks

- [System Architecture Specification](docs/specs/000-bootstrap.spec.md)
- [Dependency Baseline & Support Status](docs/dependency-baseline.md)
- [Architecture Decision Records (ADRs)](docs/adr/)
- [First-Time Hostinger VPS Setup Runbook](docs/runbooks/first-time-vps-setup.md)
- [Deployment Runbook](docs/runbooks/deployment.md)
- [Rollback Runbook](docs/runbooks/rollback.md)
- [Troubleshooting Runbook (14 Failure Modes)](docs/runbooks/troubleshooting.md)
