# RBAC Matrix

> Authoritative matrix of which roles can access which endpoints.
> Source of truth: actual `restrictTo(...)` middleware in `backend/src/routes/`.
> Keep this in sync when adding/changing endpoints.

## Roles

- `admin` — Club owner / co-owner. Full access within their club.
- `manager` — Operational manager. Almost everything except billing.
- `bartender` — Bar staff. Bar UI + scan QR + transactions.
- `doorman` — Door staff. Door UI + scan QR + visits + guest list.
- `security` — Security staff. Incidents + capacity view.
- `staff` — Generic fallback. Read-only mostly.
- `member` — Customer. Separate auth, separate tables.

## Members

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/members` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET    `/clubs/:clubId/members/by-qr/:qrCodeId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET    `/clubs/:clubId/members/:memberId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/members` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH  `/clubs/:clubId/members/:memberId` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DELETE `/clubs/:clubId/members/:memberId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET    `/clubs/:clubId/members/:memberId/qr-code` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET    `/clubs/:clubId/members/:memberId/stats` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET    `/clubs/:clubId/members/:memberId/points/history` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/members/:memberId/points/credit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST   `/clubs/:clubId/members/:memberId/points/debit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Visits

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/visits` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/visits` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

## Transactions

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/transactions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/transactions` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET    `/clubs/:clubId/transactions/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/transactions/:id/refund` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Rewards

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/rewards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/rewards` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH  `/clubs/:clubId/rewards/:rewardId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/rewards/:rewardId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST   `/clubs/:clubId/rewards/:rewardId/redeem` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## Events

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/events` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/events` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT    `/clubs/:clubId/events/:eventId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/events/:eventId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST   `/clubs/:clubId/events/:eventId/attendance/:memberId` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## Guest Lists

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/guest-lists` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/guest-lists` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT    `/clubs/:clubId/guest-lists/:listId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/guest-lists/:listId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST   `/clubs/:clubId/guest-lists/:listId/entries` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST   `/clubs/:clubId/guest-lists/:listId/entries/:entryId/check-in` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

## VIP

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/vip/tables` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/vip/tables` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT    `/clubs/:clubId/vip/tables/:tableId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/vip/tables/:tableId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET    `/clubs/:clubId/vip/reservations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/vip/reservations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Incidents

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/incidents` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| POST   `/clubs/:clubId/incidents` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| PUT    `/clubs/:clubId/incidents/:incidentId` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| POST   `/clubs/:clubId/incidents/:incidentId/resolve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET    `/clubs/:clubId/incidents/stats` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Drink Specials

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/drink-specials` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST   `/clubs/:clubId/drink-specials` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT    `/clubs/:clubId/drink-specials/:specialId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/drink-specials/:specialId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Metrics

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/metrics/overview` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET    `/clubs/:clubId/metrics/revenue` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Employees (Phase 2)

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| GET    `/clubs/:clubId/employees` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| POST   `/clubs/:clubId/employees/invite` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET    `/clubs/:clubId/employees/invitations` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/employees/invitations/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE `/clubs/:clubId/employees/:userId` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| POST   `/auth/accept-invitation` (public) | n/a | n/a | n/a | n/a | n/a | n/a |
