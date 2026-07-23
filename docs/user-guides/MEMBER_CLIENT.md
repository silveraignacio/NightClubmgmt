# Member / Customer Guide / Guía del Cliente

> Audience: customers of a club. They have their own auth (separate from employees), separate tables (`club_members` vs `club_users`), and a dedicated portal at `/member/*`.

## Becoming a member / Cómo registrarse

Members are created in one of two ways:

### Self-registration on the club landing
1. Visit the club's public landing at `https://<club-slug>.app.com/` (subdomain) or `https://app.com/club/<slug>`.
2. Click **Register / Únete**.
3. Fill: full name, email, password, optional phone and date of birth.
4. Complete the Cloudflare Turnstile CAPTCHA.
5. `POST /api/auth/register/member` body:
   ```json
   { "email": "...", "password": "...", "fullName": "...", "clubName": "club-slug", "turnstileToken": "..." }
   ```
6. Backend creates the row in `club_members` and an `email_verification_token` (24 h).
7. Screen shows **Check your email** instead of redirecting.
8. The verification email contains a link to `https://app.com/verify-email?token=...`.

### Admin-created flow
1. The club admin creates the member from `/admin/members/new`.
2. Backend generates an `activation_token` valid for 7 days.
3. Admin copies the activation link and forwards it (WhatsApp, email).
4. Member opens `/activate-member?token=...` and sets their own password.
5. `POST /api/auth/activate-member` body `{ token, password }` — account is active and login works immediately.

---

## Email verification / Verificación de email

1. The verification email points to `/verify-email?token=...`.
2. The page calls `POST /api/auth/verify-email` body `{ token }`.
3. On success, `email_verified_at` is stamped on the row and a green banner is shown.
4. If the link is expired, the user can click **Resend** which calls `POST /api/auth/resend-verification` (protected — must be logged in).
5. Until verified, a banner reminds the user in `/member`. They can still navigate the portal, but some features may be restricted in the future.

---

## Login & subdomain / Entrar al portal

- Public landing: `https://<club-slug>.app.com/` → **Login**.
- Login form: `POST /api/auth/login` body `{ email, password }`.
- The JWT includes `role: 'member'` and the `clubId`.
- After login, the user is redirected to `/member`.

---

## Member dashboard / Portal del miembro

URL: `/member`

The top of the dashboard shows:

1. **Welcome name + tier badge** — current `membership_tier` (Bronze / Silver / Gold / Platinum, each with its color).
2. **Points balance** — `points_balance` from `club_members`. Authoritatively the sum of `points_history.delta`.
3. **QR code card** — large, scannable. Generated client-side from `qr_code_id`.
4. **Tier progress bar** — `currentTier`, `pointsToNextTier`, `lifetime_points`. Source: `GET /api/clubs/:clubId/members/:memberId/tier-progress`.
5. **Recent activity** — last visits and transactions.

If email is not yet verified, a yellow banner appears with a **Resend verification email** button.

---

## QR code / Tarjeta QR

URL: `/member` (top card) or `/member/profile` (full screen).

- The QR encodes the string `${clubId}-${uuid}` (the value of `club_members.qr_code_id`).
- It is unique and immutable per member. Treat it like a credit card.
- It is regenerable visually on every page load — the underlying value never changes unless the admin issues a new one.
- Showing the QR is enough for both door check-in and bar transactions; the staff scans it.

> The QR is intentionally not signed — backend always re-validates via `GET /members/by-qr/:qrCodeId` against the JWT-bound `clubId`. So even if the QR is stolen, it only works at the right club, and only registers the visit/transaction; it cannot be used to log in.

---

## Points / Puntos

### How they are earned
- **Purchases**: 1 point per $1 spent by default. The club may change this (`points_per_dollar`). Tier multiplier exists in DB but is not yet applied.
- **Manual credits**: an admin may credit points with a reason (e.g. compensation).
- **Visits**: today do **not** award points. Planned: configurable per club.

### How they are spent
- **Reward redemptions**: `/member/rewards` → choose a reward → confirm. Backend debits points via the ledger.
- **Manual debits**: an admin can debit points with a reason (rare; for example, fixing an entry).

### Ledger principle
Every point change is a row in `points_history` with `delta`, `reason`, `actor_user_id`, `timestamp`, and optional `tx_id`. The balance is derived from the ledger via a DB trigger. The customer can see the complete ledger.

URL: `/member/points`

- `GET /api/clubs/:clubId/members/:memberId/points/history?page=1&limit=50` — paginated.
- Each row shows: date, +delta or -delta, reason, the originating transaction (if any).

---

## Rewards / Rewards canjeables

URL: `/member/rewards`

- `GET /api/clubs/:clubId/rewards` lists the catalog. Each item has `rewardName`, `description`, `pointsRequired`, `rewardType` (`discount`, `free_item`, `free_entry`, `merchandise`), `value`, `imageUrl`, optional `quantityAvailable`, `validUntil`.
- Items the user cannot afford are shown but disabled.
- Click **Redeem**.
- `POST /api/clubs/:clubId/rewards/:rewardId/redeem` (in practice this is initiated by a bartender at the bar — see [Bartender guide](./BARTENDER.md#redeem-a-reward--canjear-un-reward)).
- A redemption code or instructions are returned.

---

## Tier progression / Progresión de tier

- Tiers are configured per club in `membership_tiers`: name, color, `points_required`, `points_multiplier`, `discount_percentage`, `duration_months`.
- Tier is calculated from **lifetime points** (`points_balance_lifetime`), not the current balance — so spending points on rewards does **not** demote the member.
- A DB trigger updates `membership_tier_id` on every points event.
- The dashboard shows: current tier badge, progress bar to next tier, "X points to Gold".

---

## Profile / Perfil

URL: `/member/profile`

Editable fields:

| Field | Endpoint |
|---|---|
| Full name, email, phone | `PATCH /api/clubs/:clubId/members/:memberId` |
| Profile photo URL | same |
| Notifications enabled (email / SMS) | same — `notificationsEnabled`, `smsEnabled` |
| Marketing consent (GDPR) | `consentMarketing: boolean` — same endpoint or `POST /api/auth/update-consent` (Phase 7) |
| Password | `POST /api/auth/forgot-password` to start the flow |

### Forgot password / Recuperar contraseña
1. From login page click **Forgot password**.
2. Enter email → `POST /api/auth/forgot-password`.
3. An email arrives with a one-time link to `/reset-password?token=...`.
4. Submit a new password → `POST /api/auth/reset-password`.

### Logout / Salir
- `POST /api/auth/logout` — backend blacklists the refresh token in Redis so it cannot be reused.

---

## GDPR rights / Derechos GDPR

The member portal exposes (Phase 7, partially scaffolded):

- **Export my data** — `GET /api/auth/export-my-data` returns a JSON / ZIP archive of profile, visits, transactions, points history, rewards redeemed.
- **Delete my account** — `POST /api/auth/delete-my-account` body `{ reason?: string }`. Performs a soft-delete and schedules anonymization after the retention period.
- **Marketing consent toggle** — controls whether the club may use the email / phone in campaigns.
- **Cookies / privacy** — `/cookies`, `/privacy`, `/terms` pages.

---

## Workflow recap / Resumen de uso

```
Register on landing → verify email → log in to /member
   ↓
Show QR at the door  → doorman scans → entry confirmed
   ↓
Show QR at the bar   → bartender scans → buy drinks → earn points
   ↓
/member/points       → see ledger of every credit and debit
   ↓
/member/rewards      → redeem points for a reward
   ↓
Tier auto-upgrades  when lifetime points pass next threshold
```

For step-by-step diagrams that involve staff as well, see [`../workflows/KEY_WORKFLOWS.md`](../workflows/KEY_WORKFLOWS.md).

---

## Cheat sheet / Atajos

| Action | URL | Endpoint |
|---|---|---|
| Register | `/club/<slug>` (or subdomain) | `POST /auth/register/member` |
| Verify email | `/verify-email?token=...` | `POST /auth/verify-email` |
| Activate (admin-created) | `/activate-member?token=...` | `POST /auth/activate-member` |
| Login | `/login` | `POST /auth/login` |
| Forgot password | `/forgot-password` | `POST /auth/forgot-password` |
| Dashboard + QR | `/member` | — |
| Points history | `/member/points` | `GET /clubs/:clubId/members/:memberId/points/history` |
| Rewards | `/member/rewards` | `GET /clubs/:clubId/rewards` |
| Profile / settings | `/member/profile` | `PATCH /clubs/:clubId/members/:memberId` |
| Export data | `/member/profile` | `GET /auth/export-my-data` |
| Delete account | `/member/profile` | `POST /auth/delete-my-account` |
