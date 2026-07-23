# Bartender Guide / Guía del Bartender

> Audience: bar staff (`bartender`) registering customer purchases. The platform is **not** a POS — it records transactions for loyalty purposes only.

## Scope / Alcance

What a bartender can do:

| Capability | Allowed |
|---|---|
| Open `/admin/bar` | ✅ |
| Scan a member QR | ✅ |
| Create a transaction | ✅ (admin / manager / bartender) |
| View transactions list | ✅ |
| Redeem a reward for a member | ✅ |
| View members list (read-only) | ✅ |
| Mark event attendance | ✅ |
| Refund a transaction | ❌ (admin / manager only) |
| Create / edit members, events, VIP, drink specials, settings | ❌ |
| See analytics, metrics, incidents detail | ❌ |

For the authoritative table see [`../architecture/rbac-matrix.md`](../architecture/rbac-matrix.md).

---

## The bar page / La página de barra

URL: `/admin/bar`

Three main blocks, mobile-friendly:

1. **Member scanner / search** at the top.
2. **Transaction form**: items, amount, payment method, description.
3. **Active drink specials right now** — list updated from `GET /clubs/:clubId/drink-specials/tonight`. The bartender can apply the special's price manually.

---

## Identify a customer / Identificar al cliente

1. Tap **Scan QR** → camera opens.
2. Customer shows their QR (from `/member` portal or their printed card).
3. Decoded string is `${clubId}-${uuid}`.
4. Page calls `GET /api/clubs/:clubId/members/by-qr/:qrCodeId`.
5. UI shows full name, tier badge, current points balance, points multiplier of the tier (e.g. `1.50x`).

Alternative: tap **Search Member**, type name → choose from list.

---

## Process a transaction / Registrar una compra

1. With the customer identified, fill the transaction form:
   - **Description** (required, free text — e.g. "2 cocktails + 1 shot").
   - **Amount** in the club's currency.
   - **Transaction type**: `drink_sale`, `food_sale`, `entry_fee`, `table_service`.
   - **Payment method**: `cash`, `card`, `points`, `mixed`.
   - Optional `menuItemId`, `deviceId`.
2. Tap **Process Payment**.
3. `POST /api/clubs/:clubId/transactions` body:
   ```json
   {
     "memberId": "uuid-of-member",
     "transactionType": "drink_sale",
     "description": "2 cocktails + 1 shot",
     "amount": 24.50,
     "paymentMethod": "card"
   }
   ```
4. Backend:
   - Validates the member belongs to the club.
   - Inserts a row in `transactions`.
   - Calls `loyaltyService.creditPoints()` to award points.
   - Inserts a row in `points_history` (ledger). The DB trigger updates `points_balance`.
   - If the new lifetime total crosses a tier threshold, `membership_tier_id` is recalculated.
   - Emits an audit log entry.
5. UI shows ✅ with the amount earned: "+24 points (tier multiplier 1.0x)".

### Points formula

```
points = floor(amount × club.points_per_dollar × tier.points_multiplier)
```

Current state (May 2026):

- `club.points_per_dollar` is **1.00** by default (configurable per club via settings).
- `tier.points_multiplier` exists in DB (`membership_tiers.points_multiplier`, e.g. 1.00 / 1.50 / 2.00) **but is not yet applied** in `transactionsService.create`. Tracked in [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) as a Phase 4 gap.
- Visits do not yet award points; only transactions do.

---

## Drink specials / Promos activas

The right panel lists every drink special active right now (`startTime ≤ now ≤ endTime`, and today's weekday is in `daysOfWeek`). The bartender uses the special price manually when applicable. The transaction's `amount` should reflect the actual price charged.

---

## Redeem a reward / Canjear un reward

Used when a member wants to spend points on something (free drink, free entry, merchandise):

1. Open the customer profile from the bar page.
2. Tap **Redeem Reward** → list of catalog rewards from `GET /clubs/:clubId/rewards` filtered by `pointsRequired ≤ member.points_balance`.
3. Confirm a reward.
4. `POST /api/clubs/:clubId/rewards/:rewardId/redeem` body `{ memberId }`.
5. Backend:
   - Verifies the member has enough points.
   - Inserts a `redeemed_rewards` row.
   - Debits points via `loyaltyService.debitPoints` (ledger).
   - Decrements `quantity_available` if applicable.
6. UI shows the redemption code or instructions for the bartender (e.g. "Give one free cocktail").

---

## Event attendance / Asistencia a evento

Bartenders can mark a member as attending an event (rare but allowed):

- `POST /clubs/:clubId/events/:eventId/attendance/:memberId`.

---

## What bartenders cannot do / Lo que no pueden hacer

- Refund transactions (`POST /transactions/:id/refund`) — admin/manager only.
- Adjust points manually (`/points/credit`, `/points/debit`) — admin/manager only.
- See revenue analytics or member metrics.
- Manage events, VIP tables, drink specials, employees, club settings.
- Resolve incidents.

If a refund is needed, ask a manager. The refund will:

1. Insert a refund transaction (negative).
2. Reverse the points earned via `loyaltyService.debitPoints` (with `reason: "Refund of transaction #..."`).
3. Generate a `TRANSACTION_REFUNDED` audit log.

---

## Cheat sheet / Resumen rápido

| Action | UI button | Endpoint |
|---|---|---|
| Identify customer | Scan QR / Search | `GET /clubs/:clubId/members/by-qr/:qrCodeId` |
| Charge customer | Process Payment | `POST /clubs/:clubId/transactions` |
| Redeem reward | Redeem | `POST /clubs/:clubId/rewards/:rewardId/redeem` |
| See active specials | Right panel | `GET /clubs/:clubId/drink-specials/tonight` |
| Member event check-in | Event tab | `POST /clubs/:clubId/events/:eventId/attendance/:memberId` |
