# Doorman Guide / Guía del Doorman

> Audience: door staff (`doorman`) and security staff (`security`) working the entrance. UI is mobile-first.

## Scope / Alcance

| Capability | doorman | security |
|---|---|---|
| Open `/admin/door` page | ✅ | ✅ |
| Scan member QR and create visit | ✅ | ❌ (security can only view) |
| Scan guest-list QR and check-in | ✅ | ✅ |
| Create / update incidents | ❌ | ✅ |
| See VIP reservations tonight | ✅ | ✅ |

For the full matrix see [`../architecture/rbac-matrix.md`](../architecture/rbac-matrix.md).

---

## The door page / La página de puerta

URL: `/admin/door`

Designed for a phone or tablet held vertically. Three core blocks:

1. **Live occupancy** at the top: `current_occupancy / max_capacity`, color-coded (green < 60 %, yellow 60–90 %, red > 90 %).
2. **QR scanner**: tap **Start Camera**. Uses `jsQR` in the browser; no native app needed.
3. **Manual entry / search** fallback: type or paste a QR code, or search a member by name.

Right side / lower panel:

- Tonight's events and capacity.
- Tonight's VIP reservations (`GET /clubs/:clubId/vip/reservations/tonight`) so the doorman can recognize "this group has table 7 reserved".
- Active guest lists for tonight.

---

## Member check-in flow / Check-in de miembro

1. The member arrives and shows their QR (printed card, or from the `/member` portal on their phone).
2. Doorman taps **Start Camera**, points at the QR.
3. `jsQR` decodes a string in the format `${clubId}-${uuid}`.
4. The page calls `GET /api/clubs/:clubId/members/by-qr/:qrCodeId`.
5. The member panel shows:
   - Full name, profile photo (if set), tier badge with color, current points balance, last visit date, total visits.
   - Banned or inactive members are flagged in red.
6. Doorman taps **Confirm Entry**.
7. `POST /api/clubs/:clubId/visits` body `{ qrCodeId, entryMethod: 'qr_scan', entryType: 'free_entry'|'paid_entry'|'vip_pass'|'promotional', guestCount: 1 }`.
8. Backend:
   - Verifies the member exists and belongs to the club (multi-tenant guard).
   - Inserts a row in `visits`.
   - Increments `clubs.current_occupancy` (uses `SELECT FOR UPDATE` to avoid race conditions when multiple doormen scan at once).
   - Updates `club_members.total_visits` and `last_visit_at`.
9. UI confirms ✅ and the occupancy counter ticks up.

> Performance target: under 5 seconds per check-in including the scan animation.

### Capacity warnings / Aforo

If `current_occupancy >= max_capacity` the **Confirm Entry** button shows a warning. A manager can still allow the entry; the action is recorded in the audit log.

---

## Manual check-in / Check-in manual

If the QR can't be read (dirty card, broken camera):

1. Tap **Search Member** in the sidebar.
2. Type name, phone, or email.
3. `GET /api/clubs/:clubId/members?q=...`.
4. Tap the right member.
5. Tap **Confirm Entry** → same `POST /visits` with `entryMethod: 'manual'`.

Or paste the QR code into the textbox and submit; backend lookup is identical.

---

## Guest list check-in / Check-in de guest list

Guest QR tokens are different from member QR codes. They are 32-char hex strings stored in `guest_list_entries.qr_token`.

1. Doorman scans the guest's QR.
2. The scanner detects it is NOT a member ID (no `${clubId}-` prefix); it is a hex token.
3. Page calls `GET /api/clubs/:clubId/guest-lists/by-qr/:qrToken`.
4. UI shows: guest name, the list, plus-ones, whether already checked in.
5. Doorman taps **Check In**.
6. `POST /api/clubs/:clubId/guest-lists/:listId/entries/:entryId/check-in`.
7. Backend marks `checked_in = true`, stores `checked_in_at`, and writes an audit row.
8. If `plusOnes > 0`, the doorman counts them as additional entries (separate occupancy +N).

Roles allowed for this check-in: `admin`, `manager`, `doorman`, `security`.

---

## Incident reporting / Reporte de incidentes (security only)

Doormen are usually not in `security` role, but security personnel often work the door alongside them. They can:

1. Tap **Report Incident** in the side panel.
2. Pick severity (`low` / `medium` / `high` / `critical`), type (`fight`, `medical`, `theft`, `harassment`, `other`), description, optional location and involved members.
3. `POST /api/clubs/:clubId/incidents`.
4. The incident is flagged in real time on the admin / manager dashboard.

`critical` incidents will (Phase 4+) trigger an immediate notification to the manager and owner.

---

## Live numbers / Datos en vivo

The door page polls (or uses the eventually-added websocket):

| Number | Endpoint |
|---|---|
| Visits tonight | `GET /clubs/:clubId/visits/stats/today` |
| Current occupancy | `GET /clubs/:clubId` → `current_occupancy` |
| Tonight's incidents | `GET /clubs/:clubId/incidents/tonight` |
| Tonight's reservations | `GET /clubs/:clubId/vip/reservations/tonight` |

---

## Common errors / Errores frecuentes

| Symptom | Cause | Action |
|---|---|---|
| "Member not found" | QR belongs to another club, or member soft-deleted | Verify the customer is at the correct venue; ask manager. |
| "QR expired / invalid" | Guest list QR for a different event date | Confirm event date; do not check in. |
| "Rate limit exceeded" | Scanner triggered too many `POST /visits` (over 60/min) | Wait 30 s; do not retry rapidly. |
| Camera does not start | Browser permission denied | Open browser settings, allow camera for the site; fallback to manual search. |

---

## Mobile UX tips / Tips de UX móvil

- Button minimum height 44 px — designed for thumb tap with gloves.
- Avoid pinch-zoom — disabled via viewport meta tag.
- High contrast colors for low-light environments.
- The page works fine with phone in airplane mode briefly: queued check-ins (planned) will sync when reconnected. Today, the page requires connectivity.
