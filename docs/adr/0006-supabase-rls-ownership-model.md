# ADR 0006: Supabase Row Level Security (RLS) Ownership Model

## Status
Accepted

## Context
Children under 13 require strict data privacy under COPPA and GDPR-K. MathQuest links child learning data to authenticated guardians. Children do not have login credentials or email addresses.

## Decision
1. PostgreSQL Row Level Security (RLS) is enabled on 100% of exposed database tables.
2. The `children` table requires `guardian_id = auth.uid()`.
3. Learning sessions and question attempts are restricted to children belonging to the authenticated guardian.
4. Lesson content and questions are public read-only (`SELECT true`).
5. Solutions and answers are stored in `question_solutions` with `SELECT false` for public and authenticated users, queryable ONLY by `service_role`.
6. Mastery scores and practice recommendations are read-only for guardians and writable only via `service_role` from the Next.js server.

## Consequences
- Guaranteed multi-tenant isolation at the database engine level.
- Even if a client bypasses the frontend UI, the database forbids reading other guardians' children or reading answers.
