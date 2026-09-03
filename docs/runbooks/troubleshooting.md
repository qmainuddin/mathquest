# Operator Runbook: Comprehensive Troubleshooting Guide

This guide covers resolution steps for all operational failure modes in the MathQuest ecosystem.

---

## 1. DNS Failure
- **Symptom**: `curl https://mathquest.mainuddintalukdar.cloud` fails with `Could not resolve host`.
- **Diagnosis**:
  ```bash
  dig +short mathquest.mainuddintalukdar.cloud
  nslookup mathquest.mainuddintalukdar.cloud 8.8.8.8
  ```
- **Fix**: Check Hostinger DNS management for `mainuddintalukdar.cloud`. Ensure an `A` record exists for `mathquest` pointing to the VPS IPv4 address. Wait 5–15 minutes for propagation.

---

## 2. TLS / Certificate Failure
- **Symptom**: Browser reports SSL certificate error (e.g. `SSL_ERROR_INTERNAL_ERROR_ALERT` or self-signed cert).
- **Diagnosis**:
  ```bash
  docker logs --tail 100 stack-caddy-1 | grep -i tls
  ```
- **Fix**: Verify Caddy has write permissions to `/data`. Check if Let's Encrypt rate limits were hit. Ensure DNS resolves directly to the VPS on port 80/443 so the HTTP-01 challenge succeeds.

---

## 3. Caddy 502 Bad Gateway
- **Symptom**: Public URL returns `502 Bad Gateway`.
- **Diagnosis**:
  ```bash
  # Check if mathquest-web is running
  docker ps | grep mathquest-web
  # Check if mathquest-web is attached to stack
  docker network inspect stack | grep mathquest-web
  # Test connection from Caddy container to web container
  docker exec stack-caddy-1 wget -qO- http://mathquest-web:3000/api/health
  ```
- **Fix**: If `mathquest-web` is stopped, check its logs: `docker logs mathquest-web`. If not attached to `stack`, verify `docker-compose.prod.yml` defines `networks: stack: external: true`.

---

## 4. Missing `stack` Docker Network
- **Symptom**: `docker compose up` fails with `network stack declared as external, but could not be found`.
- **Diagnosis**:
  ```bash
  docker network ls | grep stack
  ```
- **Fix**:
  ```bash
  docker network create stack
  docker network connect stack stack-caddy-1
  ```

---

## 5. Unhealthy Web Container
- **Symptom**: `docker ps` reports `mathquest-web (unhealthy)`.
- **Diagnosis**:
  ```bash
  docker logs --tail 100 mathquest-web
  docker exec mathquest-web curl -f http://127.0.0.1:3000/api/health
  ```
- **Fix**: Check for missing environment variables in `/opt/mathquest/.env.production` (such as `NEXT_PUBLIC_SUPABASE_URL` or `INTERNAL_SERVICE_TOKEN`).

---

## 6. Unhealthy Scoring Container
- **Symptom**: `mathquest-scoring (unhealthy)` or web logs show `Scoring microservice unavailable`.
- **Diagnosis**:
  ```bash
  docker logs --tail 100 mathquest-scoring
  docker exec mathquest-scoring curl -f http://127.0.0.1:8005/healthz
  ```
- **Fix**: Confirm port `8005` is configured. Confirm `INTERNAL_SERVICE_TOKEN` is set. Verify the container has not run out of memory.

---

## 7. Supabase Redirect Errors / Auth Callback Failures
- **Symptom**: Magic link login redirects to `localhost` or displays `redirect_uri_mismatch`.
- **Diagnosis**: Check the Supabase Dashboard -> Authentication -> URL Configuration.
- **Fix**: Add `https://mathquest.mainuddintalukdar.cloud` to **Site URL** and `https://mathquest.mainuddintalukdar.cloud/**` to **Redirect URLs**.

---

## 8. Row Level Security (RLS) Permission Denied
- **Symptom**: Next.js logs error `new row violates row-level security policy for table "..."`.
- **Diagnosis**: Run the RLS test suite: `make migration-check`.
- **Fix**: Check whether the authenticated user has an active session (`auth.uid()`). Ensure child profiles match `guardian_id = auth.uid()`. For system-level writes (mastery scores), ensure the call uses `SUPABASE_SERVICE_ROLE_KEY`.

---

## 9. Migration Failures
- **Symptom**: `supabase db push` fails with syntax or constraint errors.
- **Diagnosis**: Check migration logs. Verify migration order in `supabase/migrations/`.
- **Fix**: Test migrations against a clean local database: `pnpm exec supabase db reset`. Apply only backward-compatible DDL.

---

## 10. GHCR Authorization Failures
- **Symptom**: `docker pull ghcr.io/<owner>/mathquest-web:<sha>` returns `denied: requested access to the resource is denied`.
- **Diagnosis**:
  ```bash
  docker login ghcr.io -u <github-username> --password-stdin
  ```
- **Fix**: Ensure the Personal Access Token (PAT) or `GITHUB_TOKEN` has `read:packages` and `write:packages` scopes. In GitHub Package settings, link the package repository to `MathQuest`.

---

## 11. SSH Deployment Failures
- **Symptom**: GitHub Actions deploy step fails with `Host key verification failed` or `Permission denied (publickey)`.
- **Diagnosis**:
  ```bash
  ssh -v -i deploy_key deploy@<vps-ip>
  ```
- **Fix**: Ensure GitHub Secret `VPS_SSH_KEY` matches an authorized key in `/home/deploy/.ssh/authorized_keys`. Ensure `VPS_KNOWN_HOSTS` contains the host's public SSH fingerprint.

---

## 12. Dependency Lockfile Mismatch
- **Symptom**: CI fails on `pnpm install --frozen-lockfile` with `ERR_PNPM_LOCKFILE_OUTDATED`.
- **Diagnosis**: A package in `package.json` was updated without regenerating `pnpm-lock.yaml`.
- **Fix**:
  ```bash
  pnpm install --frozen-lockfile=false
  git add pnpm-lock.yaml package.json
  ```

---

## 13. Runtime Version Mismatch
- **Symptom**: `make check-runtime-consistency` fails.
- **Diagnosis**: Compare `.tool-versions`, `.node-version`, `.nvmrc`, `package.json`, and Dockerfiles.
- **Fix**: Ensure all files state Node `24.20.0` and Python `3.12.14`.

---

## 14. Docker Digest Unavailable
- **Symptom**: Docker build fails with `manifest unknown` for pinned SHA digest.
- **Diagnosis**:
  ```bash
  docker buildx imagetools inspect node:24.20.0-bookworm-slim
  ```
- **Fix**: The image tag may have been republished with a new digest. Fetch the updated multi-arch index digest from Docker Hub API and update `docs/dependency-baseline.md` and Dockerfiles.

---

## 15. Public Health-Check Failure
- **Symptom**: `curl -f https://mathquest.mainuddintalukdar.cloud/api/health` returns non-200.
- **Diagnosis**: Run `infra/scripts/health-check.sh` on the VPS to see verbose output.
- **Fix**: Verify both `mathquest-web` and `mathquest-scoring` containers are running. Check Caddy routing logs: `docker logs stack-caddy-1`.
