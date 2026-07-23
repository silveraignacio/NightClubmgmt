# API Reference

> Authoritative reference for the NightClubmgmt REST API. The backend is Express 4 + TypeScript at `backend/src/`.

## Conventions

- **Base path**: `/api`. The frontend axios client prepends `/api` automatically (see `frontend/lib/api.ts`).
- **Auth**: JWT bearer token via `Authorization: Bearer <token>` for all non-public endpoints.
- **Tenancy**: every endpoint with `:clubId` runs through the `ensureClubAccess` middleware, which validates that `JWT.clubId == req.params.clubId` (or the user is a `platform_admin`, not currently in scope).
- **Validation**: request bodies are validated with Zod schemas (see `backend/src/utils/validators.ts`). Failures return `400` with the offending field.
- **Rate limits**:
  - `apiLimiter` on `/api/*` — 100 req/min/IP in production.
  - `authLimiter` on `/auth/login`, `/auth/register/*` — 5 req/15 min/IP in production.
  - `scanLimiter` on `/visits`, `/transactions` POSTs — 60 req/min.
- **Response shape** (success):
  ```json
  { "status": "success", "data": { ... } }
  ```
- **Response shape** (error):
  ```json
  { "status": "fail" | "error", "message": "human-readable error" }
  ```

For the canonical role × endpoint permission matrix see [`rbac-matrix.md`](./rbac-matrix.md).

---

## 1. Authentication

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/auth/register/club` | public | n/a | Register a new club + admin owner |
| POST | `/auth/register/member` | public | n/a | Self-register a customer (requires Turnstile) |
| POST | `/auth/login` | public | any | Issue JWT + refresh token |
| POST | `/auth/refresh` | public | any | Exchange refresh token for new access token |
| POST | `/auth/logout` | bearer | any | Invalidate refresh token in Redis |
| GET | `/auth/verify` | bearer | any | Return current user payload from token |
| POST | `/auth/accept-invitation` | public | n/a | Employee activates with invitation token |
| POST | `/auth/activate-member` | public | n/a | Member activates admin-created account |
| POST | `/auth/verify-email` | public | n/a | Confirm email-verification token |
| POST | `/auth/resend-verification` | bearer | member | Re-issue email-verification token |
| POST | `/auth/forgot-password` | public | n/a | Start password reset flow |
| POST | `/auth/reset-password` | public | n/a | Reset password with token |
| GET | `/auth/export-my-data` | bearer | member | GDPR export (ZIP/JSON) |
| POST | `/auth/delete-my-account` | bearer | member | GDPR delete |

### POST /auth/register/club

Request:
```json
{
  "email": "owner@club.com",
  "password": "minimum8chars",
  "fullName": "Maria Owner",
  "clubName": "The Midnight Lounge"
}
```

Response `201`:
```json
{
  "status": "success",
  "data": {
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "admin", "clubId": "..." },
    "club": { "id": "...", "slug": "the-midnight-lounge" },
    "token": "<jwt>",
    "refreshToken": "<opaque>"
  }
}
```

### POST /auth/login

Request:
```json
{ "email": "user@example.com", "password": "..." }
```

Response `200`:
```json
{
  "status": "success",
  "data": {
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "manager", "clubId": "..." },
    "token": "<jwt>",
    "refreshToken": "<opaque>"
  }
}
```

### POST /auth/refresh

Request: `{ "refreshToken": "<opaque>" }`. Response: `{ "data": { "token": "<new-jwt>" } }`.

### POST /auth/accept-invitation

Used by new employees with a token from `employee_invitations`.

```json
{ "token": "...", "password": "minimum8chars", "fullName": "John Doorman" }
```

### POST /auth/activate-member

Used by members created by an admin (7-day token).

```json
{ "token": "...", "password": "minimum8chars" }
```

---

## 2. Clubs

| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/clubs/by-slug/:slug` | public | n/a |
| GET | `/clubs/:clubId` | bearer | any (own club) |
| PUT | `/clubs/:clubId/settings` | bearer | admin |

### GET /clubs/by-slug/:slug

Public — used by the subdomain landing page. Returns minimal info:

```json
{
  "status": "success",
  "data": {
    "id": "...", "name": "...", "slug": "...",
    "description": "...", "logo_url": "...", "cover_image_url": "...",
    "city": "...", "country": "...", "subscription_plan": "trial",
    "max_capacity": 500, "current_occupancy": 120, "members_count": 1893
  }
}
```

### PUT /clubs/:clubId/settings

Body (all optional):
```json
{
  "name": "...", "description": "...", "city": "...", "country": "...",
  "pointsPerDollar": 1.0,
  "maxCapacity": 500
}
```

---

## 3. Members

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/members?q=&page=&limit=` | all roles (read) |
| POST | `/clubs/:clubId/members` | admin, manager |
| GET | `/clubs/:clubId/members/by-qr/:qrCodeId` | all roles |
| GET | `/clubs/:clubId/members/:memberId` | all roles |
| PATCH | `/clubs/:clubId/members/:memberId` | all roles (own profile rules apply at controller level) |
| DELETE | `/clubs/:clubId/members/:memberId` | admin, manager |
| GET | `/clubs/:clubId/members/:memberId/qr-code` | all roles |
| GET | `/clubs/:clubId/members/:memberId/stats` | all roles |
| GET | `/clubs/:clubId/members/:memberId/tier-progress` | all roles |
| POST | `/clubs/:clubId/members/:memberId/resend-activation` | admin, manager |
| GET | `/clubs/:clubId/members/:memberId/points/history?page=&limit=` | all roles |
| POST | `/clubs/:clubId/members/:memberId/points/credit` | admin, manager |
| POST | `/clubs/:clubId/members/:memberId/points/debit` | admin, manager |

### POST /clubs/:clubId/members

Request:
```json
{
  "email": "client@x.com",
  "phone": "+5491111111",
  "fullName": "Customer Name",
  "dateOfBirth": "1992-04-12",
  "membershipTierId": "uuid-optional"
}
```

Response `201`:
```json
{
  "status": "success",
  "data": {
    "id": "...", "clubId": "...", "fullName": "...", "qrCodeId": "${clubId}-${uuid}",
    "pointsBalance": 0, "membershipTierId": "...",
    "activationToken": "<long-string>",
    "activationExpiresAt": "2026-05-24T00:00:00Z"
  }
}
```

The frontend uses `activationToken` to build an activation link.

### POST /clubs/:clubId/members/:memberId/points/credit

```json
{ "delta": 100, "reason": "Compensation for spilled drink" }
```

Both fields required. `delta` is positive. Use `/points/debit` to subtract.

Response includes the new balance:
```json
{ "status": "success", "data": { "balance": 320, "ledgerId": "..." } }
```

---

## 4. Visits

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/visits` | admin, manager |
| POST | `/clubs/:clubId/visits` | admin, manager, doorman |
| GET | `/clubs/:clubId/visits/today/count` | all |
| GET | `/clubs/:clubId/visits/stats/today` | all (alias) |
| GET | `/clubs/:clubId/members/:memberId/visits` | all |

### POST /clubs/:clubId/visits

Must include **either** `qrCodeId` or `memberId`.

```json
{
  "qrCodeId": "<clubId>-<uuid>",
  "entryMethod": "qr_scan",     // or 'manual', 'list_entry'
  "entryType": "free_entry",    // or 'paid_entry', 'vip_pass', 'promotional'
  "guestCount": 1
}
```

Rate-limited by `scanLimiter` (60 req/min).

---

## 5. Transactions

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/transactions` | all |
| POST | `/clubs/:clubId/transactions` | admin, manager, bartender |
| GET | `/clubs/:clubId/transactions/:transactionId` | all |
| POST | `/clubs/:clubId/transactions/:id/refund` | admin, manager |
| GET | `/clubs/:clubId/transactions/today/revenue` | all |
| GET | `/clubs/:clubId/transactions/stats/today-revenue` | all (alias) |

### POST /clubs/:clubId/transactions

```json
{
  "memberId": "uuid",
  "transactionType": "drink_sale",
  "description": "2 cocktails + 1 shot",
  "amount": 24.50,
  "paymentMethod": "card"
}
```

Side effects: inserts in `transactions`, credits points via the ledger, recalculates tier if needed, emits audit log.

### POST /clubs/:clubId/transactions/:id/refund

No body required. Inserts a compensating transaction, debits the points that had been credited, and writes a `TRANSACTION_REFUNDED` audit log.

---

## 6. Events

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/events` | all |
| POST | `/clubs/:clubId/events` | admin, manager |
| GET | `/clubs/:clubId/events/upcoming` | all |
| GET | `/clubs/:clubId/events/tonight` | all |
| GET | `/clubs/:clubId/events/:eventId` | all |
| PUT | `/clubs/:clubId/events/:eventId` | admin, manager |
| DELETE | `/clubs/:clubId/events/:eventId` | admin, manager |
| GET | `/clubs/:clubId/events/:eventId/registrations` | all |
| POST | `/clubs/:clubId/events/:eventId/register` | all |
| DELETE | `/clubs/:clubId/events/:eventId/register/:memberId` | admin, manager |
| POST | `/clubs/:clubId/events/:eventId/attendance/:memberId` | admin, manager, bartender |
| GET | `/clubs/:clubId/events/:eventId/stats` | all |
| GET/POST/PUT/DELETE | `/clubs/:clubId/cover-charges[...]` | admin, manager (writes) |

### POST /clubs/:clubId/events

```json
{
  "eventName": "Friday Live DJ",
  "description": "DJ XYZ + visuals",
  "eventDate": "2026-06-06",
  "startTime": "23:00",
  "endTime": "05:00",
  "eventType": "special_event",
  "featuredImageUrl": "https://...",
  "capacity": 400,
  "entryPrice": 20,
  "vipDiscount": 50,
  "isPublic": true
}
```

---

## 7. Guest lists

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/guest-lists` | all |
| POST | `/clubs/:clubId/guest-lists` | admin, manager, promoter |
| GET | `/clubs/:clubId/guest-lists/by-qr/:qrToken` | admin, manager, doorman, security |
| GET | `/clubs/:clubId/guest-lists/:listId/export` | admin, manager |
| GET | `/clubs/:clubId/guest-lists/:listId` | all |
| PUT | `/clubs/:clubId/guest-lists/:listId` | admin, manager |
| DELETE | `/clubs/:clubId/guest-lists/:listId` | admin, manager |
| GET | `/clubs/:clubId/guest-lists/:listId/stats` | all |
| GET | `/clubs/:clubId/guest-lists/:listId/entries` | all |
| POST | `/clubs/:clubId/guest-lists/:listId/entries` | admin, manager |
| DELETE | `/clubs/:clubId/guest-lists/:listId/entries/:entryId` | admin, manager |
| POST | `/clubs/:clubId/guest-lists/:listId/entries/:entryId/check-in` | admin, manager, security, doorman |
| GET | `/clubs/:clubId/promoter/commissions` | admin, manager, promoter |

### POST /clubs/:clubId/guest-lists/:listId/entries

```json
{
  "guestName": "Alex Friend",
  "guestEmail": "alex@x.com",
  "guestPhone": "+5491111",
  "plusOnes": 1,
  "notes": "VIP guest of DJ XYZ"
}
```

Each entry is created with a generated `qr_token` (32-char hex). The token is the only key needed at the door.

---

## 8. VIP

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/vip/tables` | all |
| POST | `/clubs/:clubId/vip/tables` | admin, manager |
| GET | `/clubs/:clubId/vip/tables/:tableId` | all |
| PUT | `/clubs/:clubId/vip/tables/:tableId` | admin, manager |
| DELETE | `/clubs/:clubId/vip/tables/:tableId` | admin, manager |
| GET | `/clubs/:clubId/vip/tables/available/:date` | all |
| GET | `/clubs/:clubId/vip/reservations` | all |
| POST | `/clubs/:clubId/vip/reservations` | all (any authenticated) |
| GET | `/clubs/:clubId/vip/reservations/tonight` | all |
| GET | `/clubs/:clubId/vip/reservations/:reservationId` | all |
| DELETE | `/clubs/:clubId/vip/reservations/:reservationId` | all |
| PATCH | `/clubs/:clubId/vip/reservations/:reservationId/status` | all |

### POST /clubs/:clubId/vip/reservations

```json
{
  "tableId": "uuid",
  "memberId": "uuid-optional",
  "guestName": "Diana Star",
  "guestEmail": "diana@...",
  "guestPhone": "+...",
  "reservationDate": "2026-06-06",
  "partySize": 6,
  "specialRequests": "Birthday cake",
  "depositAmount": 200
}
```

### PATCH /clubs/:clubId/vip/reservations/:reservationId/status

`{ "status": "confirmed" | "seated" | "completed" | "no_show" | "cancelled" }`.

---

## 9. Incidents

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/incidents` | admin, manager, security |
| GET | `/clubs/:clubId/incidents/tonight` | admin, manager, security |
| GET | `/clubs/:clubId/incidents/stats` | admin, manager |
| GET | `/clubs/:clubId/incidents/:incidentId` | admin, manager, security |
| POST | `/clubs/:clubId/incidents` | admin, manager, security |
| PUT | `/clubs/:clubId/incidents/:incidentId` | admin, manager, security |
| POST | `/clubs/:clubId/incidents/:incidentId/resolve` | admin, manager |

### POST /clubs/:clubId/incidents

```json
{
  "incidentType": "fight",
  "description": "Two patrons engaged in physical altercation by the bar",
  "severity": "high",
  "location": "Bar area",
  "involvedMemberId": "uuid-optional",
  "involvedPersons": "Two unknown males, ~25y, blue shirt"
}
```

---

## 10. Drink specials

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/drink-specials` | all |
| GET | `/clubs/:clubId/drink-specials/tonight` | all |
| GET | `/clubs/:clubId/drink-specials/:specialId` | all |
| POST | `/clubs/:clubId/drink-specials` | admin, manager |
| PUT | `/clubs/:clubId/drink-specials/:specialId` | admin, manager |
| DELETE | `/clubs/:clubId/drink-specials/:specialId` | admin, manager |

### POST /clubs/:clubId/drink-specials

```json
{
  "specialName": "Happy Hour Cocktails",
  "originalPrice": 12.00,
  "specialPrice": 7.00,
  "specialType": "happy_hour",
  "daysOfWeek": [4, 5],
  "startTime": "20:00",
  "endTime": "22:00",
  "isActive": true
}
```

`daysOfWeek` uses ISO numbering: 0=Sunday … 6=Saturday.

---

## 11. Rewards

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/rewards` | all |
| POST | `/clubs/:clubId/rewards` | admin, manager |
| GET | `/clubs/:clubId/rewards/:rewardId` | all |
| PATCH | `/clubs/:clubId/rewards/:rewardId` | admin, manager |
| DELETE | `/clubs/:clubId/rewards/:rewardId` | admin, manager |
| POST | `/clubs/:clubId/rewards/:rewardId/redeem` | admin, manager, bartender |
| GET | `/clubs/:clubId/members/:memberId/rewards` | all |

### POST /clubs/:clubId/rewards

```json
{
  "rewardName": "Free Cocktail",
  "description": "Any cocktail on the menu",
  "pointsRequired": 500,
  "rewardType": "free_item",
  "value": 12,
  "quantityAvailable": 100,
  "validUntil": "2026-12-31T23:59:59Z"
}
```

---

## 12. Analytics & metrics

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/metrics/overview?days=30` | admin, manager |
| GET | `/clubs/:clubId/metrics/revenue?days=30` | admin, manager |
| GET | `/clubs/:clubId/metrics/members?days=30` | admin, manager |
| GET | `/clubs/:clubId/metrics/engagement?days=30` | admin, manager |
| GET | `/clubs/:clubId/metrics/daily/:date` | admin, manager |
| GET | `/clubs/:clubId/metrics/export?days=30` | admin, manager |
| GET | `/clubs/:clubId/analytics/heatmap?days=30` | admin, manager |
| GET | `/clubs/:clubId/analytics/revenue-breakdown?days=30` | admin, manager |

### GET /clubs/:clubId/metrics/overview

```json
{
  "status": "success",
  "data": {
    "metrics": {
      "revenue": { "totalRevenue": 18450.50, "transactionCount": 612, "averageTransaction": 30.14 },
      "members":  { "totalMembers": 1893, "activeMembers": 412, "newMembers": 38,
                    "churnRate": 4.2, "retentionRate": 78.4 },
      "engagement": { "dailyVisits": 211, "avgVisitsPerMember": 2.1, "repeatVisitRate": 64.5 }
    },
    "period": "30 days"
  }
}
```

---

## 13. Employees

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/employees` | admin |
| POST | `/clubs/:clubId/employees/invite` | admin |
| GET | `/clubs/:clubId/employees/invitations` | admin |
| DELETE | `/clubs/:clubId/employees/invitations/:id` | admin |
| DELETE | `/clubs/:clubId/employees/:userId` | admin |

### POST /clubs/:clubId/employees/invite

```json
{ "email": "newhire@x.com", "role": "doorman" }
```

Allowed roles: `admin | manager | bartender | doorman | security | staff | promoter`.

Response includes the activation URL (until the email provider is wired):
```json
{ "status": "success", "data": { "invitationId": "...", "activationUrl": "https://app.com/accept-invite?token=..." } }
```

---

## 14. Webhooks

| Method | Path | Roles |
|---|---|---|
| GET | `/clubs/:clubId/webhooks` | admin |
| POST | `/clubs/:clubId/webhooks` | admin |
| DELETE | `/clubs/:clubId/webhooks/:webhookId` | admin |

### POST /clubs/:clubId/webhooks

```json
{
  "url": "https://my-pos-integration.example.com/hooks",
  "events": ["visit.created", "transaction.created", "incident.created"]
}
```

The platform will (Phase 6) POST signed payloads to the URL when matching events fire.

---

## 15. Health & meta

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | Liveness + DB + Redis readiness |
| GET | `/api/auth/verify` | bearer | Decode and validate current JWT |

---

## Audit log

Every sensitive action emits an `audit_logs` row via `auditService`. There is no public endpoint to read them today; queries are run directly on the database. Action types include: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REGISTRATION`, `MEMBER_CREATED/UPDATED/DELETED`, `EMPLOYEE_INVITED`, `EMPLOYEE_ACTIVATED`, `ROLE_CHANGED`, `POINTS_MANUAL_ADJUSTMENT`, `TRANSACTION_CREATED`, `TRANSACTION_REFUNDED`, `INCIDENT_CREATED`, `INCIDENT_RESOLVED`, `CLUB_SETTINGS_CHANGED`, `UNAUTHORIZED_ACCESS_ATTEMPT`, `RATE_LIMIT_EXCEEDED`, `SUSPICIOUS_ACTIVITY`.

See [`.claude/rules/security.md`](../../.claude/rules/security.md) for the complete policy.
