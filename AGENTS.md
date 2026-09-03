# AGENTS.md — MathQuest Repository Guide & Operational Rules

## 1. Project Overview
MathQuest is a puzzle-based mathematics learning platform for primary-school children (ages 7–11) and their guardians.
- **Production URL**: `https://mathquest.mainuddintalukdar.cloud`
- **Hosting**: Hostinger VPS (`srv1702496`) behind an existing global Caddy reverse proxy (`stack-caddy-1`) on the `stack` Docker network.
- **Database & Auth**: Supabase Cloud PostgreSQL with strict Row Level Security (RLS) and Passwordless Guardian Auth.
- **Architecture**:
  - `apps/web`: Next.js 16 (App Router, TypeScript, React 19) standalone container acting as authenticated Backend-for-Frontend (BFF).
  - `services/scoring`: Python 3.12 FastAPI microservice providing deterministic mastery scoring and next-practice recommendations on internal port `8005`.
  - `packages/contracts`: Shared TypeScript data contracts and Pydantic validation schemas.
  - Zero host ports published in production; all external traffic arrives via Caddy on the `stack` network.

---

## 2. Mandatory Version & Dependency Policy
Every language, package manager, container base image, and GitHub Action is pinned to exact versions:
- **Node.js**: `24.20.0` (Active LTS "Krypton")
- **Node Docker Base**: `node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e`
- **Python**: `3.12.14` (Active maintenance release)
- **Python Docker Base**: `python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254`
- **Package Managers**: `pnpm@11.25.0` (frozen lockfile), Astral `uv@0.12.7` (frozen lockfile)
- **Next.js**: `16.3.4`
- **React**: `19.2.8`
- **TypeScript**: `7.0.2`
- **Tailwind CSS**: `4.3.3`
- **FastAPI**: `0.141.1`
- **Pydantic**: `2.13.4`
- **Uvicorn**: `0.52.4`
- **Playwright**: `1.62.1`
- **Supabase JS**: `2.114.0`
- **Supabase CLI**: `2.116.0`
- **Docker Compose**: Production compose file uses immutable full Git commit tags for application images.

### Prohibited Patterns
- Floating tags (`latest`, `^`, `~`, `*`, `> =`, unpinned GitHub Actions, unpinned base images) are strictly forbidden in committed production code.
- Run `make dependency-check` and `make check-runtime-consistency` before committing.

---

## 3. Deterministic Commands (`Makefile`)
CI and local developers run the exact same targets:
- `make versions`: Print verified tool and runtime versions.
- `make setup`: Install dependencies with frozen lockfiles.
- `make dev`: Run web and scoring services locally.
- `make lint`: Run linters for web, python, and contracts.
- `make format-check`: Run code formatting checks.
- `make typecheck`: Run TypeScript and Python type checkers.
- `make test`: Run all unit, integration, and contract tests.
- `make test-unit`: Run unit tests for web and scoring.
- `make test-integration`: Run integration and route handler tests.
- `make test-e2e`: Run Playwright end-to-end tests.
- `make build`: Build web and scoring applications.
- `make docker-build`: Build Docker images locally.
- `make dependency-check`: Enforce zero floating version policy.
- `make check-runtime-consistency`: Ensure all version configuration files match.
- `make migration-check`: Validate Supabase migrations and RLS tests.
- `make health`: Check internal and external health endpoints.
- `make deploy`: Deploy an immutable release to VPS.
- `make rollback`: Restore previous known-good release on VPS.

---

## 4. Key Architectural Invariants
1. **Answer Masking**: Correct answers and solutions are NEVER sent in client question payloads. Answer evaluation happens strictly server-side in Next.js API routes against private database tables.
2. **Child Privacy & Safety**: Children do not have email accounts or public profiles. Only guardians authenticate. Child records use nicknames and age/year bands. Full birth dates, locations, and chat logs are never collected.
3. **Scoring Microservice Isolation**:
   - Listens on port **8005** (relocated from 8000 to prevent collisions with host services such as `tradiepulse-ai-agent`).
   - Attached only to private network `mathquest-internal`.
   - Requires internal token header: `X-Internal-Secret`.
   - Returns versioned composite scores (70% accuracy, 20% attempt efficiency, 10% pace) with explainable reason codes.
4. **Caddy Reverse Proxy**:
   - `stack-caddy-1` handles TLS termination on ports 80/443.
   - `mathquest-web:3000` joins `stack` and receives proxied traffic.
   - Global Caddy is never recreated or overwritten.
