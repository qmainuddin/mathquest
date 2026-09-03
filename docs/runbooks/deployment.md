# Operator Runbook: Production Deployment

**Target Host**: Hostinger VPS (`srv1702496`)  
**Domain**: `https://mathquest.mainuddintalukdar.cloud`

---

## 1. Automated Deployment Flow (GitHub Actions)

Deployments trigger automatically on every push to the `main` branch once the `CI` workflow passes. You can also trigger a manual deployment via GitHub Actions **Workflow Dispatch** on `.github/workflows/deploy.yml`.

### Deployment Steps Executed by CI/CD:
1. Builds immutable container images tagged with the full Git commit SHA:
   - `ghcr.io/<owner>/mathquest-web:<sha>`
   - `ghcr.io/<owner>/mathquest-scoring:<sha>`
2. Pushes images to GitHub Container Registry (GHCR).
3. Connects to Hostinger VPS via SSH using `deploy` user and strict host key verification.
4. Invokes `/opt/mathquest/deploy.sh <sha>`.

---

## 2. Manual Deployment via SSH (Emergency or Direct)

If you need to deploy or redeploy manually directly on the VPS:

```bash
# 1. SSH into the server as user deploy
ssh deploy@<vps-ip>

# 2. Navigate to the deployment directory
cd /opt/mathquest

# 3. Pull latest compose and deploy script (if tracked or synced)
# or run deploy.sh with the target Git SHA
./deploy.sh <full-git-commit-sha>
```

---

## 3. What `deploy.sh` Does Under the Hood:

1. Verifies `/opt/mathquest/.env.production` exists and has `0600` permissions.
2. Checks that the external Docker network `stack` exists.
3. Authenticates to GHCR using the provided credentials.
4. Records the current active release in `/opt/mathquest/.last-known-good`.
5. Pulls `ghcr.io/<owner>/mathquest-web:<sha>` and `ghcr.io/<owner>/mathquest-scoring:<sha>`.
6. Executes `docker compose -f docker-compose.prod.yml up -d --remove-orphans`.
7. Calls `health-check.sh` to poll:
   - `http://127.0.0.1:8005/healthz` (via container exec)
   - `https://mathquest.mainuddintalukdar.cloud/api/health`
8. If health checks do not pass within 60 seconds, it automatically triggers `rollback.sh`.

---

## 4. Post-Deployment Verification

Run the health check script on the server:
```bash
/opt/mathquest/health-check.sh
```
Or test via curl from anywhere:
```bash
curl -f https://mathquest.mainuddintalukdar.cloud/api/health
```
Expected output:
```json
{"status":"healthy","version":"<sha>","scoring_service":"connected","timestamp":"..."}
```
