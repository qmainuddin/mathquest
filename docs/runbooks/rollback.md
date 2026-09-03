# Operator Runbook: Rollback Procedure

**Target Host**: Hostinger VPS (`srv1702496`)  
**Domain**: `https://mathquest.mainuddintalukdar.cloud`

---

## 1. Automated Rollback

If a new deployment fails internal or external health checks, `deploy.sh` automatically invokes `rollback.sh` without requiring human intervention.

---

## 2. Manual Rollback via CLI

If a post-deployment issue is discovered after health checks pass (e.g. an unexpected runtime bug):

```bash
# 1. SSH into the VPS
ssh deploy@<vps-ip>

# 2. Navigate to application folder
cd /opt/mathquest

# 3. View the last known good commit SHA
cat .last-known-good

# 4. Trigger the rollback script
./rollback.sh
```

---

## 3. Rollback to a Specific Previous SHA

If you want to roll back to an older specific Git commit SHA rather than the immediate previous release:

```bash
cd /opt/mathquest
./deploy.sh <target-prior-sha>
```

---

## 4. Database Migration Rollback Policy

> [!WARNING]
> **Database migrations are NEVER rolled back automatically.**
> - Automated database rollbacks (`down` migrations) carry severe risk of data loss.
> - All MathQuest schema migrations are strictly forward-compatible (additive columns, non-destructive alterations).
> - If a schema rollback is required, an explicit forward migration must be written, tested, and applied.
