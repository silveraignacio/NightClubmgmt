# ADR-009: Defer Postgres Row Level Security to a future phase

## Status

Proposed — implementation deferred until backend GUC wiring is in place.

## Context

Multi-tenancy in NightClubmgmt is enforced today entirely at the application
layer: every service that touches a tenant-scoped table is expected to include
`AND club_id = $X` in its `WHERE` clause, with `clubId` sourced from the
authenticated JWT via `ensureClubAccess` middleware. See
`.claude/rules/multi-tenancy.md`.

This approach works but has a single point of failure: any new query that
forgets the filter (or a future ORM migration that bypasses it) silently
creates a cross-tenant data leak. PostgreSQL Row Level Security (RLS)
provides defense-in-depth by enforcing isolation at the database layer.

We considered enabling RLS now as part of Fase 7 hardening. RLS requires
the backend to execute:

```sql
SET LOCAL app.club_id = '<club-uuid>'
```

at the start of each request transaction so that the row policy:

```sql
USING (club_id = current_setting('app.club_id', true)::uuid)
```

resolves correctly. The current backend uses `pool.query` directly in
auto-commit mode for most operations — there is no per-request transaction
boundary where the GUC could be set.

## Decision

Create the RLS migration files (`database/migrations/012_rls.sql` and
`backend/migrations/1737000012000_rls.js`) but ship them as no-ops with
the SQL commented out. They serve as a blueprint and reservation of the
migration slot.

Defer actual enablement until the following preconditions are met:

1. A connection-scoped middleware wraps tenant-scoped requests in a
   transaction and runs `SET LOCAL app.club_id = $clubIdFromJwt`.
2. Services migrate from `pool.query` to a `tenantQuery` helper that
   acquires a client, sets the GUC, and runs the statement.
3. Cross-tenant denial tests confirm RLS catches violations even when
   application-layer filters are removed.
4. A staging rollout verifies that no operational query relies on
   bypassing tenant scope (e.g., audit log aggregations, super-admin
   tools, cron jobs).

## Consequences

Positive:

- The migration slot is reserved and the design is documented.
- The hardening backlog has a concrete next step.
- Application-layer multi-tenancy continues to work unchanged.

Negative / trade-offs:

- We continue to rely on a single layer of defense (application filters).
- A future RLS rollout will touch every service that issues queries.

Risks:

- If someone runs the SQL inside `012_rls.sql` manually before the backend
  wiring lands, the application will start returning zero rows for all
  `club_members` queries. Mitigation: the SQL is commented out and the
  file carries a large warning header.

## Alternatives Considered

- **Enable RLS now.** Rejected: breaks production until the backend
  wiring exists.
- **Skip RLS entirely and rely on application filters + tests.**
  Rejected: testing catches known patterns but not novel queries.
- **Use a schema-per-tenant model.** Rejected: large operational change,
  complicates migrations and connection pooling, and is hard to reverse.
