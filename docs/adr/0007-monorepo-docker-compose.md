# ADR 0007: Monorepo Structure with Docker Compose

## Status
Accepted

## Context
MathQuest consists of a TypeScript frontend, shared data contracts, database migrations, infrastructure scripts, and a Python microservice. Maintaining separate repositories would complicate atomic commits, contract verification, CI/CD coordination, and version synchronization.

## Decision
1. Organize the project into a single monorepo using `pnpm` workspaces for TypeScript packages and `uv` for Python:
   - `apps/web`: Next.js 16 application
   - `services/scoring`: Python 3.12 FastAPI microservice
   - `packages/contracts`: Shared data contracts
   - `packages/shared-config`: Shared ESLint and TypeScript configs
   - `supabase`: Database migrations, seed data, and SQL tests
   - `infra`: Caddy snippets, Docker Compose files, and deployment scripts
2. Production is orchestrated using `infra/compose/docker-compose.prod.yml`.

## Consequences
- Single commit references entire feature changes across frontend, backend, and contracts.
- Automated CI tests contract compatibility in every pull request.
