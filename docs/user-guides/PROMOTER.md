# Promoter Guide / Guía del Promoter

> Audience: external public-relations / promoter staff (`promoter`). Phase 5 feature, partially scaffolded today. Promoter UI lives at `/admin/promoter`.

## What a promoter is / Qué es un promoter

A promoter (PR) is an external contractor who brings customers to the club, typically for a percentage commission per attendee they bring on their guest list. They are NOT regular employees: their access is intentionally scoped to **only their own data**.

| Capability | Allowed? |
|---|---|
| Open `/admin/promoter` | ✅ |
| Create a guest list (for an event) | ✅ |
| Add guests to **own** lists | ✅ |
| View own commissions | ✅ |
| Check-in guests | ❌ (door / security do this) |
| See other promoters' lists or commissions | ❌ |
| See full member list | ❌ |
| See revenue, analytics, VIP, settings | ❌ |

For the canonical permissions, see [`../architecture/rbac-matrix.md`](../architecture/rbac-matrix.md).

---

## Promoter portal / Portal del promoter

URL: `/admin/promoter`

The portal shows:

1. **My guest lists** — only lists where the promoter is `created_by`.
2. **My commissions** — `GET /clubs/:clubId/promoter/commissions` (filtered server-side).
3. **Upcoming events** — `GET /clubs/:clubId/events/upcoming` (read-only).
4. Personal **invite link** for their guest list (Phase 5 will wire this to a public landing).

---

## Create a guest list / Crear lista de invitados

1. From the portal click **New List**.
2. Pick the event (`eventId`), give the list a name, optional `maxCapacity`.
3. `POST /api/clubs/:clubId/guest-lists` body:
   ```json
   {
     "listName": "DJ XYZ - Friday",
     "eventId": "uuid-of-event",
     "maxCapacity": 50
   }
   ```
4. Backend stores `created_by = promoter.userId`.
5. The new list appears in **My Lists**.

---

## Add guests / Agregar invitados

1. Open the list → **Add Guest**.
2. Fields: `guestName` (required), `guestEmail`, `guestPhone`, `plusOnes`, `notes`.
3. `POST /api/clubs/:clubId/guest-lists/:listId/entries`.
4. Each guest entry generates a unique `qr_token`. Share it via WhatsApp / email so the guest can show it at the door.

> Promoters can edit and remove entries on their own lists. They cannot edit other promoters' lists.

### Bulk add (planned)

CSV upload is on the roadmap. Today, add guests one by one.

---

## Commissions / Comisiones

`GET /api/clubs/:clubId/promoter/commissions` returns rows from `promoter_commissions`:

| Field | Meaning |
|---|---|
| `event_id` | Event the commission applies to |
| `guest_list_id` | The list that brought the guests |
| `guests_brought` | Total entries checked in |
| `commission_amount` | Calculated payout (see formula below) |
| `status` | `pending` / `approved` / `paid` |
| `paid_at` | Timestamp when admin marked it paid |

Commission formula (configurable by club, Phase 5):

```
commission = guests_checked_in × commission_per_guest
           + cover_revenue × commission_percentage
```

Until Phase 5 is closed, commission_amount may be calculated manually by the manager.

---

## Workflow / Flujo típico de noche de evento

```
Promoter creates list (Mon)
    │
    ├─> Adds 50 guests with QRs (Mon–Fri)
    │
    ├─> Sends each QR to their guests (Fri afternoon)
    │
Friday night:
    │
    ├─> Doorman scans each guest QR → check-in
    │   POST /guest-lists/:listId/entries/:entryId/check-in
    │
    └─> Promoter portal updates commissions counter
        (commissions row is created/updated by trigger)

After event:
    │
    ├─> Admin reviews commissions (`status='pending'`)
    │
    ├─> Approves: status='approved'
    │
    └─> Pays externally → marks status='paid'
```

---

## What a promoter cannot see / Qué no puede ver

- Members list (no PII leakage across promoter's network).
- Revenue or analytics dashboards.
- Other promoters' guest lists.
- Drink specials management, VIP, incidents.
- Employees, settings, webhooks.

If a promoter needs information that is not in the portal, they must ask the manager.

---

## Cheat sheet / Atajos

| Action | Endpoint |
|---|---|
| List my guest lists | `GET /clubs/:clubId/guest-lists` (server filters to own) |
| Create a list | `POST /clubs/:clubId/guest-lists` |
| Add a guest | `POST /clubs/:clubId/guest-lists/:listId/entries` |
| Remove a guest | `DELETE /clubs/:clubId/guest-lists/:listId/entries/:entryId` |
| View my commissions | `GET /clubs/:clubId/promoter/commissions` |
| View upcoming events | `GET /clubs/:clubId/events/upcoming` |
