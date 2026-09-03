# ADR 0002: Integration with Existing Global Caddy Reverse Proxy

## Status
Accepted

## Context
The Hostinger VPS (`srv1702496`) already runs a production Caddy container (`stack-caddy-1`) handling TLS termination and routing for multiple subdomains on the `stack` Docker network. Running a second Caddy container would cause host port conflicts on 80/443 and complicate ACME certificate issuance.

## Decision
1. Do not deploy a second Caddy or reverse proxy container.
2. Join `mathquest-web` to the existing external `stack` network.
3. Provide an additive Caddyfile snippet (`infra/caddy/mathquest.caddy`):
   ```caddyfile
   mathquest.mainuddintalukdar.cloud {
       encode zstd gzip
       reverse_proxy mathquest-web:3000
   }
   ```
4. Reload the existing Caddy instance safely via `docker exec stack-caddy-1 caddy reload` without interrupting other running services.

## Consequences
- Single point of TLS management and Let's Encrypt automation.
- Zero extra reverse proxy overhead.
- Requires operator setup once to append the snippet.
