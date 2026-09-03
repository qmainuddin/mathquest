# ADR 0003: Next.js App Router as Backend-For-Frontend (BFF)

## Status
Accepted

## Context
Educational applications for young children require strict answer security and privacy boundaries. If the client browser evaluates math questions or communicates directly with the Python scoring microservice, answer keys could leak in JavaScript bundles, and sensitive child identifiers could be forged.

## Decision
1. Next.js 16 App Router acts as the single authenticated Backend-for-Frontend (BFF).
2. The browser never receives question answer keys or solutions.
3. Server route handlers (`/api/learning/attempt/submit`, `/api/learning/session/complete`) perform guardian session validation, child ownership checks, answer verification against private database tables, and aggregated score updates.
4. Next.js communicates with the private Python scoring service over `mathquest-internal` using an internal service token (`INTERNAL_SERVICE_TOKEN`).

## Consequences
- Impossible for children or curious users to extract solutions by inspecting network payloads or React state.
- Single unified authentication perimeter managed via Supabase SSR cookies.
