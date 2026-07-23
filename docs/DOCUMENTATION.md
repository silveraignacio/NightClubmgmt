# Club Nightlife — Platform Documentation

> **The complete guide** for everyone who uses, operates, or integrates with Club Nightlife.
> Last updated: 2026-05-18

---

## What is Club Nightlife?

Club Nightlife is a **multi-tenant SaaS platform** that gives nightclubs everything they need to run a night — from the door to the bar, from the guest list to the VIP section — while building a loyalty relationship with every customer.

Each club gets its own subdomain (`clubname.app.com`), its own member database, its own QR-based loyalty card program, and a full operations suite for staff. The platform does **not** process payments for the club (it's not a POS) — it's a CRM and operations tool built specifically for the nightlife industry.

---

## Quick navigation

| I am a... | Go to |
|---|---|
| 🏠 Club owner / Admin | [Admin & Manager Guide](user-guides/ADMIN_AND_MANAGER.md) |
| 👔 Manager | [Admin & Manager Guide](user-guides/ADMIN_AND_MANAGER.md) |
| 🚪 Doorman / Security | [Doorman Guide](user-guides/DOORMAN.md) |
| 🍸 Bartender | [Bartender Guide](user-guides/BARTENDER.md) |
| 📣 Promoter | [Promoter Guide](user-guides/PROMOTER.md) |
| 🎉 Club member (customer) | [Member Guide](user-guides/MEMBER_CLIENT.md) |
| ⚙️ Developer / Integrator | [API Reference](architecture/API_REFERENCE.md) |
| 🚀 DevOps / Deploying | [Deployment Guide](DEPLOYMENT.md) |

---

## Platform overview

### The six roles

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLUB NIGHTLIFE                          │
├──────────────────────────┬──────────────────────────────────────┤
│     STAFF (back-office)  │     CUSTOMERS (front-facing)         │
├──────────────────────────┼──────────────────────────────────────┤
│  admin   → full control  │  member → loyalty card portal        │
│  manager → operations    │                                       │
│  doorman → entry/door    │                                       │
│  bartender → bar / POS   │                                       │
│  security → incidents    │                                       │
│  promoter → guest lists  │                                       │
└──────────────────────────┴──────────────────────────────────────┘
```

Each role sees a **completely different interface** on the same platform. A doorman who logs in only sees the door scanner. A promoter only sees their guest lists. An admin sees everything.

### Core modules

| Module | Used by | What it does |
|---|---|---|
| **Dashboard** | admin, manager | KPIs, quick actions, activity feed |
| **Members** | admin, manager | Full CRM — search, profile, points, tier |
| **Loyalty points** | admin, manager, bartender | Ledger-based points system with tier progression |
| **Events** | admin, manager | Create events with capacity, pricing, registrations |
| **Guest lists** | admin, manager, doorman, promoter | Per-event lists, QR check-in, CSV export |
| **VIP tables** | admin, manager | Floor view, reservations, status tracking |
| **Door control** | admin, manager, doorman, security | QR scanner, occupancy counter, member + guest check-in |
| **Bar & POS** | admin, manager, bartender | Identify customer, register sale, auto-credit points |
| **Security** | admin, manager, security | Incident log with severity, location, resolution |
| **Drink specials** | admin, manager | Happy hours, daily specials, tier-based discounts |
| **Analytics** | admin, manager | Revenue, traffic heatmap, member stats, retention |
| **Employees** | admin | Invite, manage roles, revoke access |
| **Settings** | admin | Points rate, capacity, club info, webhooks |

---

## Screenshots — what it actually looks like

### Login

![Login](screenshots/01_login.png)

All roles use the same login page. After login each user is automatically redirected to their role-specific interface. Club owners register at `/register-club`; customers join at `clubname.app.com`.

---

### Club landing page (public)

![Club landing](screenshots/02_club_landing.png)

Every club gets a public landing page. Customers **join** (self-registration) or **log in** from here. The page is served at the club's unique slug URL.

---

### Admin dashboard

![Admin dashboard](screenshots/03_admin_dashboard.png)

Four live KPIs: visits today, revenue today, active members, points redeemed. Below: quick actions, recent visits feed, and tonight's activity log.

---

### Members

![Members list](screenshots/04_admin_members.png)

Full CRM table. Search by name, email, or phone. Each row shows tier, status, points balance, total spent, and join date. Click any row to open the member's full profile.

---

### Door control

![Door control](screenshots/09_admin_door.png)

Mobile-first. Two scan modes: **Member QR** (registered member check-in) and **Guest List** (guest QR token check-in). Live occupancy counter in the top right. Manual lookup for when the camera isn't available.

---

### VIP & Tables

![VIP tables](screenshots/08_admin_vip.png)

Three tabs: Tonight's reservations, all reservations with filters, and table inventory. Color-coded status: green (available), yellow (reserved), red (occupied/seated).

---

### Analytics

![Analytics](screenshots/12_admin_analytics.png)

Revenue trends over selectable periods (7/14/30/90 days), member growth metrics (new, churned, retention rate), top spenders, and traffic heatmap showing busiest hours by day of week.

---

### Employees

![Employees](screenshots/13_admin_employees.png)

Admin-only. Shows active staff with their roles, pending invitations with activation tokens, and controls to revoke or deactivate.

---

### Settings

![Settings](screenshots/14_admin_settings.png)

Configure the club's points rate (points per dollar), max capacity, and club information. Changes apply immediately to all new transactions.

---

## Key workflows

### 1. Customer check-in at the door

```
Member shows QR card on their phone
        │
        ▼
Doorman taps "Start Camera" on /admin/door
        │
        ▼
Camera reads QR code (jsQR library)
  Format: ${clubId}-${uuid}
        │
        ▼
GET /api/clubs/:clubId/members/by-qr/:qrCodeId
        │
        ▼
UI shows: name, tier badge, points balance, last visit
        │
        ▼
Doorman taps "Confirm Entry"
        │
        ▼
POST /api/clubs/:clubId/visits
  { qrCodeId, entryMethod: 'qr_scan', entryType }
        │
        ├── INSERT into visits (audit trail)
        ├── UPDATE clubs SET current_occupancy + 1
        └── UPDATE club_members SET total_visits + 1
        │
        ▼
✅ Screen confirms entry · occupancy counter ticks up
```

> **Fallback:** If camera fails, doorman types the QR string or member name manually.

---

### 2. Bar transaction with automatic points

```
Customer at bar → shows QR
        │
        ▼
Bartender scans QR → member identified
        │
   ┌────┴───────────────────────┐
   │  Carlos Rodríguez          │
   │  GOLD tier · 1,240 pts     │
   └────────────────────────────┘
        │
Bartender enters: $45 · Cocktails · Cash
        │
        ▼
POST /api/clubs/:clubId/transactions
        │
        ▼
Points calculation:
  floor($45 × 1.5 pts/$ × 2.0 Gold) = 135 pts
        │
        ├── INSERT into transactions
        ├── INSERT into points_history  ← immutable ledger
        ├── DB trigger: UPDATE points_balance = SUM(ledger)
        └── Check tier threshold → upgrade if reached
        │
        ▼
✅ "135 points earned" shown on screen
```

**Points formula:** `floor(amount × club.points_per_dollar × tier.points_multiplier)`

---

### 3. Guest list check-in

```
(Before the event)
Admin → /admin/guest-lists → New List
  └── Add guests: name, email, plus_ones
  └── Each guest gets a unique qr_token (32-char hex)
  └── Admin can export CSV or print QR codes

(Night of the event)
Guest shows their QR token at door
        │
        ▼
Doorman switches to "Guest List" mode
        │
        ▼
GET /api/clubs/:clubId/guest-lists/by-qr/:token
        │
   ┌────┴───────────────────────────────┐
   │  María García · Lista VIP          │
   │  +2 acompañantes · not checked in  │
   └─────────────────────────────────────┘
        │
Doorman taps "Check In"
        │
        ▼
POST /entries/:entryId/check-in
  checked_in = true · checked_in_at = NOW()
```

---

### 4. Inviting a new employee

```
Admin → /admin/employees → "Invite Employee"
  │
  ├── Email: juan@club.com
  └── Role: doorman
  │
  ▼
System generates activation link (48h token)
Link shown on screen → admin copies & sends via WhatsApp/email

Employee opens: /accept-invite?token=abc123...
  │
  ├── Enters full name + password
  │
  ▼
Account created → employee logs in
  └── Redirected to /admin/door (doorman role)
```

---

### 5. Member self-registration journey

```
Customer finds club at: clubname.app.com
        │
        ▼
Clicks "Join the Club" → registration form appears
  │
  ├── Name, email, password
  └── Turnstile CAPTCHA (invisible, no checkbox)
        │
        ▼
Account created + QR code generated
Verification email sent (24h link)
        │
        ▼
Customer clicks email link → /verify-email?token=...
Email verified ✅
        │
        ▼
Portal unlocked: /member
  ├── QR card (show at door or bar)
  ├── Points balance
  ├── Tier + progress bar to next tier
  ├── Rewards catalog
  └── Transaction + points history
```

---

## The loyalty system

### How points work

> Every point change is recorded in an **immutable ledger** (`points_history` table). The balance is always derived from `SUM(delta)` — never set directly. This means full auditability: if a customer disputes their balance, you have a timestamped record of every credit and debit.

**Earning points:**

| Event | Formula |
|---|---|
| Bar/POS purchase | `floor(amount × club_rate × tier_multiplier)` |
| Manual bonus (admin) | Any delta with a required reason |
| Refund | Deducts the exact points earned on that transaction |

**Tier progression:**

```
Lifetime points earned:

    0 ──────── 500 ──────────── 1,500 ──────────────── 5,000
    │           │                 │                      │
  BRONZE      SILVER            GOLD                PLATINUM
  (1.0×)     (1.5×)            (2.0×)               (2.5×)
              ↑                  ↑                     ↑
           auto-upgrade       auto-upgrade          auto-upgrade
```

Thresholds are set by each club admin in the Membership Tiers settings. Upgrades happen automatically the moment a transaction pushes lifetime points over the threshold.

---

## Architecture at a glance

```
Browser (Next.js 14 App Router)
    │  JWT in Authorization header
    ▼
Express 4 + TypeScript API
    │  pool.query (no ORM — direct SQL)
    ├──► PostgreSQL 15
    │      ├── Multi-tenant: every table filtered by club_id
    │      ├── Points ledger with DB trigger
    │      └── 34+ tables, 12 migrations
    └──► Redis 7
           ├── Refresh tokens (7-day TTL)
           └── Token blacklist on logout

Docker Compose:
  postgres:5432 · redis:6379 · backend:5000 · frontend:3000

Migrations: node-pg-migrate — run automatically on startup
```

---

## All documentation

| Document | Who it's for |
|---|---|
| [Admin & Manager Guide](user-guides/ADMIN_AND_MANAGER.md) | Club owners and managers — full feature walkthrough |
| [Doorman Guide](user-guides/DOORMAN.md) | Door staff — scanning, check-in, occupancy |
| [Bartender Guide](user-guides/BARTENDER.md) | Bar staff — transactions, point earning |
| [Promoter Guide](user-guides/PROMOTER.md) | Promoters — guest lists, commissions |
| [Member Guide](user-guides/MEMBER_CLIENT.md) | Customers — registration, QR, points, GDPR |
| [Key Workflows](workflows/KEY_WORKFLOWS.md) | Everyone — detailed flow diagrams |
| [API Reference](architecture/API_REFERENCE.md) | Developers — all endpoints, auth, schemas |
| [Deployment Guide](DEPLOYMENT.md) | DevOps — Docker, env vars, production checklist |
