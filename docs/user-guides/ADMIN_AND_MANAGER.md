# Admin & Manager Guide / Guía Admin y Manager

> Audience: club owners (`admin`) and operational managers (`manager`). These roles share most of the UI; differences are explicitly noted.

## Overview / Resumen

The `admin` role belongs to the person who registered the club and pays the SaaS subscription. The `manager` role is for trusted operators who handle day-to-day work. Both roles have full access to operational modules. Only `admin` can manage employees, billing, and club-level settings.

| Capability | admin | manager |
|---|---|---|
| Dashboard, analytics, metrics | ✅ | ✅ |
| Members CRUD, manual point adjustments | ✅ | ✅ |
| Events, guest lists, VIP tables, drink specials | ✅ | ✅ |
| Incidents (create, resolve, view stats) | ✅ | ✅ (resolve = admin/manager only) |
| Transactions and refunds | ✅ | ✅ |
| Invite / deactivate employees | ✅ | ❌ |
| Club settings (`PUT /clubs/:clubId/settings`) | ✅ | ❌ |
| Webhooks | ✅ | ❌ |

For the authoritative endpoint × role table, see [`../architecture/rbac-matrix.md`](../architecture/rbac-matrix.md).

---

## Logging in / Cómo entrar

1. Navigate to `https://app.com/login` (or your subdomain `https://<club-slug>.app.com/login`).
2. Enter the email and password set at registration or invitation acceptance.
3. The backend issues a JWT (access token) plus a refresh token stored in Redis. Refresh is automatic.
4. Successful login redirects to `/admin`.

API: `POST /api/auth/login` → `{ status: 'success', data: { user, token, refreshToken } }`.

---

## Dashboard walkthrough / Recorrido del Dashboard

URL: `/admin`

Top-level KPIs (the four cards):

| KPI | Source endpoint |
|---|---|
| Visits today | `GET /clubs/:clubId/visits/stats/today` (alias of `/visits/today/count`) |
| Revenue today | `GET /clubs/:clubId/transactions/stats/today-revenue` |
| Active members (last 30 days) | `GET /clubs/:clubId/metrics/members?days=30` |
| Current occupancy / capacity | `GET /clubs/:clubId` returns `current_occupancy` and `max_capacity` |

Below the KPIs:

- **Tonight's event card** — `GET /clubs/:clubId/events/tonight`.
- **Tonight's incidents** — `GET /clubs/:clubId/incidents/tonight`.
- **Active drink specials right now** — `GET /clubs/:clubId/drink-specials/tonight`.
- **Quick actions** — buttons that link to `/admin/members/new`, `/admin/events`, `/admin/vip`.

---

## Member management / Gestión de clientes

URL: `/admin/members`

### Search & list
1. The list paginates members ordered by registration date, newest first.
2. Search box accepts name, email or phone. Backend uses `ILIKE` matching against `full_name`, `email`, `phone`.
3. API: `GET /clubs/:clubId/members?q=<query>&page=1&limit=20`.

### View a profile
1. Click any row → modal or `/admin/members/[id]` shows: full name, email, phone, tier, points balance, lifetime points, total visits, total spent, last visit, QR code.
2. APIs used:
   - `GET /clubs/:clubId/members/:memberId`
   - `GET /clubs/:clubId/members/:memberId/stats`
   - `GET /clubs/:clubId/members/:memberId/tier-progress` (returns `currentTier`, `nextTier`, `pointsToNextTier`)
   - `GET /clubs/:clubId/members/:memberId/points/history?page=1`

### Create a member (admin-created flow)
1. Click **New Member** (`/admin/members/new`).
2. Fill: full name (required), email, phone, date of birth, optional initial tier.
3. Submit → `POST /clubs/:clubId/members`.
4. Backend creates the row, generates a unique `qr_code_id` of the form `${clubId}-${uuid}`, and an `activation_token` valid for 7 days.
5. The UI shows the activation link (`/activate-member?token=...`). Copy and send to the member by WhatsApp / email — the member sets their own password on activation.
6. If the member did not activate yet, click **Resend activation** → `POST /clubs/:clubId/members/:memberId/resend-activation`. A new 7-day token is issued.

### Adjust points manually
1. On the member profile, scroll to **Adjust Points**.
2. Enter a positive delta and a reason (both required).
3. Submit:
   - To add: `POST /clubs/:clubId/members/:memberId/points/credit`, body `{ delta: 100, reason: "Compensation for spilled drink" }`.
   - To remove: `POST /clubs/:clubId/members/:memberId/points/debit` with the same shape.
4. Backend inserts a row in `points_history` (delta + reason + `actor_user_id` + timestamp). A DB trigger keeps `club_members.points_balance` in sync. An `AuditLog` row is emitted.

> **Rule**: never bypass the ledger. The point balance is derived from `SUM(points_history.delta)`. See [`.claude/rules/loyalty.md`](../../.claude/rules/loyalty.md).

### Soft-delete a member
1. Click **Delete** (admin/manager only).
2. `DELETE /clubs/:clubId/members/:memberId`.
3. Sets `deleted_at` (soft delete). Visit / transaction history is preserved for accounting.

### Tier progress
- Tiers are configured in the `membership_tiers` table per club.
- The trigger `update_member_tier` recalculates `membership_tier_id` based on lifetime points whenever a point change occurs.

---

## Employee management / Gestión de empleados (admin only)

URL: `/admin/employees`

### Invite an employee
1. Click **Invite Employee**.
2. Enter email and select role: `manager`, `bartender`, `doorman`, `security`, `staff`, `promoter`.
3. `POST /clubs/:clubId/employees/invite` body `{ email, role }`.
4. A row is created in `employee_invitations` with a 48-hour token.
5. The UI shows the activation URL (today; once email provider is wired it will be sent automatically).
6. Forward the link to the employee. They go to `/accept-invite?token=...`, set a password, and become a `club_users` row.

### View invitations and employees
- `GET /clubs/:clubId/employees` — current active employees.
- `GET /clubs/:clubId/employees/invitations` — pending invitations.

### Revoke or deactivate
- Revoke a pending invitation: `DELETE /clubs/:clubId/employees/invitations/:id`.
- Deactivate an active employee: `DELETE /clubs/:clubId/employees/:userId` (sets `is_active = false`; soft-deactivation). The employee can no longer log in but historical actions remain auditable.

---

## Events / Eventos

URL: `/admin/events`

### Create an event
1. Click **Create Event**.
2. Fill: event name, date, start time, optional end time, type (`special_event`, `private`, etc.), description, featured image URL, **capacity** (must be ≤ `clubs.max_capacity` typically), **entry price**, **VIP discount %**, `isPublic`.
3. `POST /clubs/:clubId/events` (admin/manager only).

### View registrations / attendance
- `GET /clubs/:clubId/events/:eventId/registrations` — list of registered members.
- `POST /clubs/:clubId/events/:eventId/register` — registers a member (anyone authenticated).
- `POST /clubs/:clubId/events/:eventId/attendance/:memberId` — mark attendance (admin/manager/bartender). Bumps `members.total_visits` and records a visit row.
- `GET /clubs/:clubId/events/:eventId/stats` — returns attended count, revenue, etc.

### Cover charges per event
- `GET /clubs/:clubId/cover-charges` and `POST /clubs/:clubId/cover-charges` allow defining cover ($) per event, per night, or per tier.

### Update / delete an event
- `PUT /clubs/:clubId/events/:eventId`.
- `DELETE /clubs/:clubId/events/:eventId` — soft-delete.

---

## Guest lists / Listas de invitados

URL: `/admin/guest-lists`

### Create a guest list
1. Click **New List**.
2. Name, description, optional `eventId`, `maxCapacity`.
3. `POST /clubs/:clubId/guest-lists` (admin/manager/promoter).

### Add guests
1. Click a list → **Add Guest**.
2. Fields: guest name (required), email, phone, plus-ones (0–10), notes.
3. `POST /clubs/:clubId/guest-lists/:listId/entries`.
4. Each entry gets a unique `qr_token` (32-char hex). Show or print the QR for the guest.

### Export CSV
- Button **Export CSV** → `GET /clubs/:clubId/guest-lists/:listId/export`. Returns `text/csv` with: name, email, phone, plus-ones, checked-in (yes/no), check-in time, QR token.

### Stats
- `GET /clubs/:clubId/guest-lists/:listId/stats` — entries total, plus-ones total, checked-in count.

### Check-in
- Manually from the admin UI: `POST /clubs/:clubId/guest-lists/:listId/entries/:entryId/check-in`.
- From the door / security flow: see [Doorman guide](./DOORMAN.md#guest-list-check-in--check-in-de-guest-list).

### Promoter commissions
- `GET /clubs/:clubId/promoter/commissions` — admin/manager sees all, a `promoter` sees only their own.

---

## VIP tables / Mesas VIP

URL: `/admin/vip`

The page has two sub-views: **Floor View** (grid of tables, color-coded) and **Reservation List**.

### Tables
- `GET /clubs/:clubId/vip/tables` — list with capacity, minimum spend, location.
- `POST /clubs/:clubId/vip/tables` — create: `tableName`, `tableNumber`, `capacity`, `minimumSpend`, `location`, `imageUrl`.
- `PUT /clubs/:clubId/vip/tables/:tableId` and `DELETE` — manage.

### Reservations
- Statuses: `pending` → `confirmed` → `seated` → `completed` (or `cancelled` / `no_show`).
- Create reservation: click an available table → **Create Reservation**.
  1. Body fields (`POST /clubs/:clubId/vip/reservations`): `tableId`, `memberId?`, `guestName`, `guestEmail?`, `guestPhone?`, `reservationDate`, `partySize`, `specialRequests?`, `depositAmount?`.
  2. Table card turns yellow.
- Update status: `PATCH /clubs/:clubId/vip/reservations/:reservationId/status` with `{ status: 'seated' }`. Table card turns red.
- Mark `completed` when the party leaves; the table returns to green.
- Tonight's reservations: `GET /clubs/:clubId/vip/reservations/tonight` (used in the door staff sidebar too).
- Cancel: `DELETE /clubs/:clubId/vip/reservations/:reservationId`.

### Color codes
- 🟢 Available
- 🟡 Reserved (`pending` / `confirmed`)
- 🔴 Occupied (`seated`)
- ⚫ Out of service (table `isAvailable=false`)

---

## Security incidents / Incidentes

URL: `/admin/security`

### Create incident
1. Click **New Incident**.
2. Fields: `incidentType` (e.g. "fight", "medical", "theft"), `severity` (`low` / `medium` / `high` / `critical`), `description`, optional `location`, `involvedMemberId`, `involvedPersons` (free text).
3. `POST /clubs/:clubId/incidents` (admin / manager / security).

### Resolve incident
1. Open incident → **Resolve** button.
2. `POST /clubs/:clubId/incidents/:incidentId/resolve` (admin / manager only).
3. Sets `resolved_at` and `resolved_by`.

### Tonight, history, stats
- `GET /clubs/:clubId/incidents/tonight` — currently visible on the security dashboard.
- `GET /clubs/:clubId/incidents?severity=high&page=1` — full filterable list.
- `GET /clubs/:clubId/incidents/stats` — counts grouped by severity and type (admin/manager).

---

## Drink specials / Promociones de bebidas

URL: `/admin/events` (sub-tab) or via the API directly.

### Create
1. Fields: `specialName`, `description`, `originalPrice`, `specialPrice`, `discountPercentage` (auto-calc), `specialType` (`happy_hour`, `daily_special`, `weekly_special`, `seasonal`, `event_special`), `daysOfWeek` (0=Sunday..6=Saturday), `startTime`, `endTime`, `startDate`, `endDate`.
2. `POST /clubs/:clubId/drink-specials`.

### Tonight feed
- `GET /clubs/:clubId/drink-specials/tonight` — used on the bar page so bartenders see what's active right now.

### Update / Delete
- `PUT /clubs/:clubId/drink-specials/:specialId` and `DELETE` (admin / manager only).

---

## Club settings / Configuración del club (admin only)

URL: `/admin/settings`

`PUT /clubs/:clubId/settings` accepts (all optional):

| Field | Description |
|---|---|
| `name` | Display name of the club |
| `description` | Marketing text shown on the public landing |
| `city`, `country` | Location |
| `pointsPerDollar` | Loyalty rate. `1.00` means 1 point per $1. Range 0–100. |
| `maxCapacity` | Hard limit used at the door to refuse new entries |

A `CLUB_SETTINGS_CHANGED` audit log row is generated on every change.

### Webhooks (admin only)
- `GET /clubs/:clubId/webhooks` — list registered outgoing webhooks.
- `POST /clubs/:clubId/webhooks` body `{ url, events: ['visit.created', 'transaction.created', ...] }`.
- `DELETE /clubs/:clubId/webhooks/:webhookId`.

---

## Analytics / Analítica

URL: `/admin/analytics`

### Overview metrics
- `GET /clubs/:clubId/metrics/overview?days=30` → revenue, members and engagement summary.
- `GET /clubs/:clubId/metrics/revenue?days=30` → monthly revenue, average transaction value, trend series.
- `GET /clubs/:clubId/metrics/members?days=30` → total / active / new members, churn %, retention %, top spenders, top visitors.
- `GET /clubs/:clubId/metrics/engagement?days=30` → daily visits, avg visits per member, repeat visit rate, trends.
- `GET /clubs/:clubId/metrics/daily/:date` → revenue + visit count for a single day.
- `GET /clubs/:clubId/metrics/export?days=30` → CSV download.

### Charts
- **Revenue breakdown by transaction type** — `GET /clubs/:clubId/analytics/revenue-breakdown?days=30`. Pie / bar chart by `drink_sale`, `food_sale`, `entry_fee`, `table_service`.
- **Hourly traffic heatmap** — `GET /clubs/:clubId/analytics/heatmap?days=30`. Day-of-week × hour-of-day grid; identifies peak hours.

---

## Common workflows / Flujos frecuentes

For step-by-step diagrams of the key cross-module workflows (member check-in, bar transaction with points, guest list check-in, employee invitation, VIP reservation lifecycle, points adjustment), see [`../workflows/KEY_WORKFLOWS.md`](../workflows/KEY_WORKFLOWS.md).

## Cheat sheet / Atajos

| Action | Path | Endpoint |
|---|---|---|
| New member | `/admin/members/new` | `POST /clubs/:clubId/members` |
| New event | `/admin/events` | `POST /clubs/:clubId/events` |
| New guest list | `/admin/guest-lists` | `POST /clubs/:clubId/guest-lists` |
| New VIP reservation | `/admin/vip` | `POST /clubs/:clubId/vip/reservations` |
| Log incident | `/admin/security` | `POST /clubs/:clubId/incidents` |
| Add drink special | `/admin/events` | `POST /clubs/:clubId/drink-specials` |
| Invite employee | `/admin/employees` | `POST /clubs/:clubId/employees/invite` |
| Adjust member points | `/admin/members/[id]` | `POST /clubs/:clubId/members/:memberId/points/credit` |
| Update club settings | `/admin/settings` | `PUT /clubs/:clubId/settings` |
