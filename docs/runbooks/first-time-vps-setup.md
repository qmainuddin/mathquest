# Operator Runbook: First-Time Hostinger VPS Setup & Caddy Integration

**Target Host**: Hostinger VPS (`srv1702496`)  
**Deployment User**: `deploy` (or `root` with `sudo`)  
**Domain**: `mathquest.mainuddintalukdar.cloud`

---

## 1. Finding Your Existing Caddy Configuration on the VPS

To determine how `stack-caddy-1` is configured and where its `Caddyfile` is mounted, run these commands over SSH on the VPS:

### Step 1.1: Inspect the Caddy Container Mounts
```bash
docker inspect stack-caddy-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```
*Sample output*:
```text
/home/deploy/stack/Caddyfile -> /etc/caddy/Caddyfile
/home/deploy/stack/caddy_data -> /data
/home/deploy/stack/caddy_config -> /config
```
This tells you the exact path on the host filesystem where Caddy's configuration lives (e.g. `/home/deploy/stack/Caddyfile`).

### Step 1.2: View the Current Caddyfile
```bash
docker exec stack-caddy-1 cat /etc/caddy/Caddyfile
```
Look for lines like:
- `import /etc/caddy/sites-enabled/*.caddy` (indicates a modular snippet directory)
- Or multiple domain blocks written directly inside the file (e.g. `example.com { ... }`)

### Step 1.3: Check the Docker Network
```bash
docker network inspect stack --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\n"}}{{end}}'
```
Confirm `stack-caddy-1` is listed on this network.

---

## 2. Integrating the MathQuest Reverse Proxy Snippet

Depending on how your Caddyfile is structured from Step 1.2:

### Option A: If your Caddyfile imports snippets (`import .../*.caddy`)
1. Place `infra/caddy/mathquest.caddy` into the host's snippet directory:
   ```bash
   sudo cp infra/caddy/mathquest.caddy /home/deploy/stack/sites-enabled/
   ```
2. Validate the configuration:
   ```bash
   docker exec -w /etc/caddy stack-caddy-1 caddy validate
   ```
3. Reload Caddy non-disruptively:
   ```bash
   docker exec -w /etc/caddy stack-caddy-1 caddy reload
   ```

### Option B: If your Caddyfile is a single file
1. Append the MathQuest block to the host's Caddyfile (e.g. `/home/deploy/stack/Caddyfile`):
   ```caddyfile
   mathquest.mainuddintalukdar.cloud {
       encode zstd gzip
       reverse_proxy mathquest-web:3000
   }
   ```
2. Validate before reloading:
   ```bash
   docker exec -w /etc/caddy stack-caddy-1 caddy validate
   ```
3. Reload Caddy non-disruptively:
   ```bash
   docker exec -w /etc/caddy stack-caddy-1 caddy reload
   ```

---

## 3. Preparing the MathQuest Application Directory

On the VPS, as user `deploy`:
```bash
# Create application directory
sudo mkdir -p /opt/mathquest
sudo chown -R deploy:deploy /opt/mathquest
cd /opt/mathquest

# Prepare environment file with restricted permissions (0600)
touch .env.production
chmod 600 .env.production
```

Add the production variables to `/opt/mathquest/.env.production`:
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://mathquest.mainuddintalukdar.cloud
PORT=3000

# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Scoring Service
SCORING_SERVICE_URL=http://mathquest-scoring:8005
INTERNAL_SERVICE_TOKEN=<generate-a-secure-random-token-here>
```

---

## 4. DNS Configuration in Hostinger DNS Panel

1. Log into your Hostinger Account -> DNS Management for `mainuddintalukdar.cloud`.
2. Add an **A Record**:
   - **Name / Host**: `mathquest`
   - **Type**: `A`
   - **Points to / Value**: `<VPS-IPv4-Address>`
   - **TTL**: `300` (or automatic)
3. Verify propagation:
   ```bash
   dig +short mathquest.mainuddintalukdar.cloud
   ```
