# MathQuest Dependency Baseline

**Document Date**: September 3, 2026  
**Status**: Production Approved

This document provides the authoritative record of all runtimes, base images, package managers, frameworks, and deployment actions selected for the MathQuest project. All versions are strictly pinned per Section 1 of the architecture specification.

---

## 1. Runtimes & Container Base Images

| Component | Selected Version | Official Source | Status | Selection & Compatibility Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `24.20.0` | [nodejs.org](https://nodejs.org/dist/index.json) | Active LTS ("Krypton") | Selected newest production Active LTS release. Required by `@supabase/supabase-js >=22.0.0`. Full support through Oct 2027. |
| **Node.js Docker Base** | `node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e` | [Docker Hub](https://hub.docker.com/_/node) | Immutable Digest | Debian Bookworm Slim variant minimized attack surface. Multi-arch index SHA-256 verified directly from Docker Hub Registry API. |
| **Python** | `3.12.14` | [python.org](https://www.python.org/downloads/) | Active Maintenance | Active maintenance release (Aug 12, 2026). Fully supported by FastAPI 0.141.1, Pydantic 2.13.4, and Uvicorn 0.52.4. |
| **Python Docker Base** | `python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254` | [Docker Hub](https://hub.docker.com/_/python) | Immutable Digest | Debian Bookworm Slim variant with exact security patch level and multi-arch digest verified directly from Docker Hub API. |

---

## 2. Package Managers & Build Tools

| Tool | Selected Version | Official Registry / Release | Purpose |
| :--- | :--- | :--- | :--- |
| **pnpm** | `11.25.0` | [npmjs.com/package/pnpm](https://www.npmjs.com/package/pnpm) | Monorepo package manager for web, contracts, and shared configs. Enforces frozen lockfile installation. |
| **Astral uv** | `0.12.7` | [astral.sh](https://github.com/astral-sh/uv) | High-performance Python project & dependency manager with frozen `uv.lock`. |
| **TypeScript** | `7.0.2` | [npmjs.com/package/typescript](https://www.npmjs.com/package/typescript) | Static type safety with native compiler performance across web and contracts. |
| **Tailwind CSS** | `4.3.3` | [npmjs.com/package/tailwindcss](https://www.npmjs.com/package/tailwindcss) | Modern styling engine with zero-runtime CSS-first build. |

---

## 3. Application Frameworks & Client Libraries

| Library | Selected Version | Registry | Role |
| :--- | :--- | :--- | :--- |
| **Next.js** | `16.3.4` | npmjs | Modern App Router, standalone server build, React 19 server actions. |
| **React** | `19.2.8` | npmjs | UI component library with concurrent features. |
| **React DOM** | `19.2.8` | npmjs | DOM renderer for React 19. |
| **@supabase/supabase-js** | `2.114.0` | npmjs | Supabase JavaScript client with type-safe schema bindings. |
| **@supabase/ssr** | `0.12.5` | npmjs | SSR cookie-based authentication helpers for Next.js App Router. |
| **supabase CLI** | `2.116.0` | npmjs | Pinned project development dependency for migrations and RLS verification. |
| **FastAPI** | `0.141.1` | PyPI | High-performance typed Python API framework for scoring service. |
| **Pydantic** | `2.13.4` | PyPI | Data validation and JSON schema enforcement. |
| **Uvicorn** | `0.52.4` | PyPI | Production ASGI web server running FastAPI. |
| **Playwright** | `1.62.1` | npmjs | Automated end-to-end testing browser framework. |
| **Pytest** | `8.3.4` | PyPI | Python unit, integration, and property test framework. |
| **HTTPX** | `0.28.1` | PyPI | Async HTTP client for Python scoring API integration tests. |

---

## 4. GitHub Actions (Pinned to Full 40-Character Commit SHAs)

| Action | Tag / Release | Pinned Commit SHA |
| :--- | :--- | :--- |
| `actions/checkout` | `v4.2.2` | `11bd71901bbe5b1630ceea73d27597364c9af683` |
| `actions/setup-node` | `v4.2.0` | `1d0ff469b7ec7b3cb9d8673fde0c81c44821de2a` |
| `actions/setup-python` | `v5.4.0` | `42375524e23c412d93fb67b49958b491fce71c38` |
| `pnpm/action-setup` | `v4.1.0` | `a7487c7e89a18df4991f7f222e4898a00d66ddda` |
| `astral-sh/setup-uv` | `v5.3.0` | `1edb52594c857e2b5b13128931090f0640537287` |
| `docker/setup-buildx-action` | `v3.10.0` | `b5ca514318bd6ebac0fb2aedd5d36ec1b5c232a2` |
| `docker/login-action` | `v3.3.0` | `9780b0c442fbb1117ed29e0efdff1e18412f7567` |
| `docker/build-push-action` | `v6.15.0` | `471d1dc4e07e5cdedd4c2171150001c434f0b7a4` |

---

## 5. Network & Port Allocation Baseline (Hostinger VPS `srv1702496`)

| Container / Service | Port | Network | Binding Policy |
| :--- | :--- | :--- | :--- |
| `mathquest-web` | `3000` | `stack` (external) & `mathquest-internal` (private) | No host port published. Proxied by `stack-caddy-1:3000`. |
| `mathquest-scoring` | `8005` | `mathquest-internal` (private only) | No host port published. Reached only by `mathquest-web:8005`. |
| `stack-caddy-1` | `80`, `443` | `stack` | Reverse proxy edge terminating TLS. |
