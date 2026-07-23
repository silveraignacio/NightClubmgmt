# Key Workflows / Flujos Clave

> Cross-module, step-by-step flows. Each one shows the path through the UI plus the API calls under the hood.

The role-specific user guides ([Admin & Manager](../user-guides/ADMIN_AND_MANAGER.md), [Doorman](../user-guides/DOORMAN.md), [Bartender](../user-guides/BARTENDER.md), [Promoter](../user-guides/PROMOTER.md), [Member](../user-guides/MEMBER_CLIENT.md)) reference these workflows.

---

## Workflow 1: Member check-in at the door

```
Member arrives at the club
      │
      ▼
Doorman opens /admin/door (mobile)
      │
      ├─► Tap "Start Camera"
      │
      ▼
Camera reads QR with jsQR → string of form ${clubId}-${uuid}
      │
      ▼
GET /api/clubs/:clubId/members/by-qr/:qrCodeId
      │
      ▼
UI shows: full name, tier badge, points, last visit
      │
      ├─► Doorman taps "Confirm Entry"
      │
      ▼
POST /api/clubs/:clubId/visits
   body { qrCodeId, entryMethod: 'qr_scan', entryType: 'free_entry' }
      │
      ▼
Backend:
   1. Verify member belongs to clubId (multi-tenant guard)
   2. INSERT INTO visits (...)
   3. UPDATE clubs SET current_occupancy = current_occupancy + 1
      (with SELECT FOR UPDATE — race-safe)
   4. UPDATE club_members SET total_visits += 1, last_visit_at = NOW()
      WHERE id = $1 AND club_id = $2
   5. auditService.logAction('VISIT_CREATED', ...)
      │
      ▼
UI: ✅ entry confirmed + live occupancy counter ticks up
```

**Fallback**: if the camera fails the doorman can use **Search Member** (`GET /clubs/:clubId/members?q=...`) or paste the QR string manually. The visit is created with `entryMethod: 'manual'`.

---

## Workflow 2: Bar transaction with points

```
Customer at the bar
      │
      ▼
Bartender opens /admin/bar (mobile)
      │
      ├─► Scan customer QR OR Search member
      │
      ▼
GET /clubs/:clubId/members/by-qr/:qrCodeId
      │
      ▼
UI shows: customer profile, tier multiplier (e.g. 1.5x), points balance
      │
      ├─► Bartender enters:
      │      amount, payment method (cash/card/points/mixed),
      │      type (drink_sale/food_sale/entry_fee/table_service),
      │      description (free text)
      │
      ▼
POST /clubs/:clubId/transactions
   body {
     memberId, amount: 24.50, paymentMethod: "card",
     transactionType: "drink_sale", description: "2 cocktails"
   }
      │
      ▼
Backend transactionsService.create:
   1. INSERT INTO transactions (...)
   2. points = floor(amount × club.points_per_dollar × tier.points_multiplier)
   3. loyaltyService.creditPoints(clubId, memberId, points, "Transaction #...", txId)
        → INSERT INTO points_history (delta = +points, reason, actor_user_id, tx_id)
        → Trigger updates club_members.points_balance
        → Trigger recalculates membership_tier_id if threshold crossed
   4. auditService.logAction('TRANSACTION_CREATED', ...)
      │
      ▼
UI: ✅ payment registered + "+24 points earned" toast
```

> Today the tier multiplier is not yet applied in `transactionsService.create` (see [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)). The ledger and DB trigger are already in place.

---

## Workflow 3: Guest list check-in

```
PREPARATION (days before)
─────────────────────────
Admin (or Promoter) at /admin/guest-lists
      │
      ├─► POST /clubs/:clubId/guest-lists
      │      body { listName, eventId, maxCapacity }
      │
      ├─► For each guest:
      │      POST /clubs/:clubId/guest-lists/:listId/entries
      │      body { guestName, guestEmail, guestPhone, plusOnes }
      │   Each entry gets a unique qr_token (32-char hex)
      │
      ├─► (Optional) Export CSV via GET /guest-lists/:listId/export
      │
      └─► Share QR with each guest (email / WhatsApp)


NIGHT OF EVENT
──────────────
Guest arrives, shows QR
      │
      ▼
Doorman / security scans the QR at /admin/door
      │
      ├─► Format detection: 32-char hex ⇒ guest list QR
      │   (not ${clubId}-${uuid} ⇒ not a member QR)
      │
      ▼
GET /clubs/:clubId/guest-lists/by-qr/:qrToken
      │
      ▼
UI shows: guest name, list name, plus_ones, checked_in flag
      │
      ├─► Doorman taps "Check In"
      │
      ▼
POST /clubs/:clubId/guest-lists/:listId/entries/:entryId/check-in
      │
      ▼
Backend:
   1. UPDATE guest_list_entries SET checked_in = true, checked_in_at = NOW()
      WHERE id = $1 AND club_id = $2  ← tenant guard
   2. auditService.logAction('GUEST_CHECKED_IN', ...)
      │
      ▼
UI: ✅ checked-in
```

Allowed roles for guest-list check-in: `admin`, `manager`, `doorman`, `security`.

---

## Workflow 4: New employee invitation

```
Admin at /admin/employees
      │
      ├─► Click "Invite Employee"
      │
      ▼
Form: email, role (manager / bartender / doorman / security / staff / promoter)
      │
      ▼
POST /clubs/:clubId/employees/invite
   body { email, role }
   (RBAC: admin only)
      │
      ▼
Backend:
   1. Generate secure 48-hour token
   2. INSERT INTO employee_invitations (club_id, email, role, token, expires_at, invited_by)
   3. (Phase 4 with email provider) send email with activation link
      Today: link is displayed in the admin UI for copy/paste
      │
      ▼
Admin copies link, sends via WhatsApp / external email
      │
      ▼
Employee opens /accept-invite?token=xxx
      │
      ├─► Fills: full name, password
      │
      ▼
POST /api/auth/accept-invitation
   body { token, password, fullName }
      │
      ▼
Backend:
   1. Validate token (exists, not expired, not accepted)
   2. bcrypt.hash(password)
   3. INSERT INTO club_users (club_id, email, password_hash, full_name, role, is_active=true)
   4. UPDATE employee_invitations SET accepted_at = NOW()
   5. auditService.logAction('EMPLOYEE_ACTIVATED', ...)
      │
      ▼
Employee can now POST /api/auth/login
   → role-aware redirect:
       admin/manager → /admin
       doorman/security → /admin/door
       bartender → /admin/bar
       promoter → /admin/promoter
```

The admin can:
- See pending invitations: `GET /clubs/:clubId/employees/invitations`.
- Revoke a pending one: `DELETE /clubs/:clubId/employees/invitations/:id`.
- Deactivate an active employee (soft): `DELETE /clubs/:clubId/employees/:userId`.

---

## Workflow 5: VIP table reservation lifecycle

```
Setup
─────
Admin defines tables (one time)
   POST /clubs/:clubId/vip/tables
   body { tableName, capacity, minimumSpend, location }


Booking
───────
Admin / Manager at /admin/vip → Floor View
      │
      ▼
Green table card → click → "Create Reservation"
      │
      ▼
Form: tableId, guestName (or memberId), partySize, reservationDate,
      specialRequests, depositAmount?
      │
      ▼
POST /clubs/:clubId/vip/reservations
      │
      ▼
Backend:
   1. Verify table is available for date
   2. INSERT INTO vip_reservations (status = 'pending', ...)
      │
      ▼
Floor View: card turns yellow (reserved)


Night of event
──────────────
Door / staff sees reservation in tonight's panel
   GET /clubs/:clubId/vip/reservations/tonight

When party arrives:
      │
      ▼
Manager clicks table → "Seat Party"
      │
      ▼
PATCH /clubs/:clubId/vip/reservations/:reservationId/status
   body { status: 'seated' }
      │
      ▼
Card turns red (occupied)


When party leaves:
      │
      ▼
PATCH ... { status: 'completed' }
      │
      ▼
Card returns to green (available)
```

Other status transitions:
- `pending → cancelled`: `DELETE /clubs/:clubId/vip/reservations/:reservationId`.
- `pending → no_show`: PATCH with `{ status: 'no_show' }` when party never arrives.

---

## Workflow 6: Manual points adjustment

```
Admin or Manager at /admin/members → click a member
      │
      ▼
Member profile shows balance, lifetime points, tier
      │
      ├─► "Adjust Points" section
      │      Input: delta (positive int)
      │      Input: reason (required, free text)
      │      Buttons: Credit (+) or Debit (-)
      │
      ▼
POST /clubs/:clubId/members/:memberId/points/credit
   body { delta: 100, reason: "Compensation for bad experience" }

OR

POST /clubs/:clubId/members/:memberId/points/debit
   body { delta: 50, reason: "Correction of duplicate credit" }
      │
      ▼
loyaltyService.creditPoints / debitPoints:
   1. (debit only) Verify member.points_balance >= delta — else 400 "Insufficient points"
   2. INSERT INTO points_history
      (club_id, member_id, delta = ±N, reason, actor_user_id = req.user.id,
       created_at = NOW())
   3. DB trigger updates club_members.points_balance
   4. DB trigger recalculates membership_tier_id if a threshold crossed
   5. auditService.logAction('POINTS_MANUAL_ADJUSTMENT', userId, clubId,
        { memberId, delta, reason }, req)
      │
      ▼
UI: ✅ updated balance, ledger entry visible at /member/points
```

Rules enforced by [`.claude/rules/loyalty.md`](../../.claude/rules/loyalty.md):

- Direct `UPDATE club_members SET points_balance` is forbidden.
- Every change has a `reason` and an `actor_user_id`.
- `points_history` is append-only — corrections go in as new compensating rows, never as edits.
- RBAC: admin or manager only.

---

## Cross-reference

| Workflow | Roles involved | Primary endpoints |
|---|---|---|
| 1. Door check-in | doorman | `/members/by-qr`, `/visits` |
| 2. Bar transaction | bartender + member | `/members/by-qr`, `/transactions` |
| 3. Guest list check-in | admin/promoter (prep) + doorman/security (night) | `/guest-lists/*`, `/guest-lists/:listId/entries/:entryId/check-in` |
| 4. Employee invitation | admin + new employee | `/employees/invite`, `/auth/accept-invitation` |
| 5. VIP reservation | admin/manager | `/vip/tables`, `/vip/reservations/:id/status` |
| 6. Points adjustment | admin/manager | `/members/:id/points/credit`, `/debit` |

For a full endpoint × role table see [`../architecture/rbac-matrix.md`](../architecture/rbac-matrix.md).
