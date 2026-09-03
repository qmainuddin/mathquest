# ADR 0001: Hostinger VPS Production with Optional Vercel Previews

## Status
Accepted

## Context
MathQuest requires reliable, low-cost hosting that can support both a Next.js frontend/BFF and a private Python scoring microservice. The owner maintains a Hostinger VPS (`srv1702496`) hosting multiple web applications and Docker workloads. Vercel provides seamless preview deployments for pull requests but does not easily support long-lived private Docker networks for microservices on its free/standard tiers.

## Decision
1. Production runs exclusively on the Hostinger VPS using Docker Compose.
2. Vercel is reserved optionally for frontend preview deployments only.
3. Next.js standalone container deployment guarantees full portability between local, VPS Docker, and any container runtime.

## Consequences
- Cost remains zero extra hosting overhead.
- Deployment scripts must manage VPS SSH, Docker pulling, and container restarts.
- Eliminates vendor lock-in to proprietary edge platforms.
