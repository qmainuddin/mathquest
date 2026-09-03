# Multi-stage Dockerfile for Next.js standalone application
# Syntax and base image strictly pinned to exact version and multi-arch digest

FROM node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

# -----------------------------------------------------------------------------
# Dependency Stage
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy monorepo configuration and package definitions
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install; \
    fi

# -----------------------------------------------------------------------------
# Build Stage
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=deps /app/packages/shared-config/node_modules ./packages/shared-config/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

# Build packages and Next.js standalone application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @mathquest/contracts build || true
RUN pnpm --filter @mathquest/web build

# -----------------------------------------------------------------------------
# Runner Stage
# -----------------------------------------------------------------------------
FROM node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user and group
RUN groupadd -g 10001 nodejs && \
    useradd -u 10001 -g nodejs -s /bin/bash -m nodejs

# Copy public static files
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy standalone server and static assets with correct ownership
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
