# Deployment Guide

> Step-by-step guide to deploy NightClubmgmt locally with Docker Compose, and the checklist for taking it to production.

For env-var details see [`ENV_SETUP.md`](./ENV_SETUP.md). For Docker-specific tweaks see [`DOCKER_DEPLOYMENT.md`](./DOCKER_DEPLOYMENT.md).

---

## 1. Prerequisites

- **Docker** ≥ 24 and **docker-compose** v2.
- **Node.js 20+** and **npm** (only if you want to run backend/frontend outside Docker for dev).
- **Git**.
- A POSIX shell (Linux, macOS, or WSL2 on Windows).

Optional but recommended:

- **Cloudflare account** to obtain Turnstile keys (CAPTCHA on member registration).
- An email provider account: **Resend** (recommended), Postmark, or SendGrid.

---

## 2. Clone the repository

```bash
git clone https://github.com/<org>/NightClubmgmt.git
cd NightClubmgmt
```

---

## 3. Configure environment variables

Copy the example file and edit:

```bash
cp .env.example .env
```

Minimum variables to set:

| Variable | Description | Example (dev) |
|---|---|---|
| `POSTGRES_USER` | DB user (used by Postgres container) | `postgres` |
| `POSTGRES_PASSWORD` | DB password — **change for production** | `dev_password_123` |
| `POSTGRES_DB` | DB name — **must be** `clubnightlife` | `clubnightlife` |
| `DATABASE_URL` | Backend connection string (uses service name `postgres`) | `postgresql://postgres:dev_password_123@postgres:5432/clubnightlife` |
| `REDIS_URL` | Redis connection | `redis://redis:6379` |
| `JWT_SECRET` | HMAC secret, **min 32 chars** | random string |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `BCRYPT_ROUNDS` | bcrypt cost factor | `10` |
| `PORT` | Backend internal port | `5000` |
| `BACKEND_PORT` | Host-side port mapping | `5001` |
| `NEXT_PUBLIC_API_URL` | URL the browser uses to reach the API | `http://localhost:5001` |
| `FRONTEND_PORT` | Host-side port for Next.js | `3000` |
| `ROOT_DOMAIN` | Apex domain for subdomain routing | `localhost` or `app.example.com` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret (server side) | optional in dev |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key (browser) | optional in dev |
| `EMAIL_PROVIDER` | `resend` / `postmark` / `sendgrid` | TBD |
| `EMAIL_FROM` | Default sender address | `noreply@your-domain.com` |
| `SENTRY_DSN` | Sentry endpoint (Phase 7) | optional in dev |

> See [`ENV_SETUP.md`](./ENV_SETUP.md) for the full annotated list. The DB name is `clubnightlife` (single word), not `club_nightlife`.

---

## 4. Start the stack

```bash
docker-compose up -d --build
```

What this does:

1. Builds the **backend** image (Node 20 + TypeScript compiled at build time).
2. Builds the **frontend** image (Next.js 14 standalone build).
3. Starts **postgres** (15) and **redis** (7) containers with volumes.
4. On backend startup, runs `npm run migrate` (uses `node-pg-migrate`) to apply all SQL migrations idempotently. Then `node dist/server.js` boots Express on port 5000 inside the container, mapped to `BACKEND_PORT` outside.
5. The frontend boots on container port 3000, mapped to `FRONTEND_PORT`.

Check logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

Tear down:

```bash
docker-compose down            # keep volumes
docker-compose down -v         # wipe DB + Redis data
```

---

## 5. Verify

1. **Health endpoint** — backend liveness + DB + Redis:
   ```bash
   curl http://localhost:5001/health
   ```
   Expected:
   ```json
   { "status": "ok", "db": "up", "redis": "up" }
   ```
2. **Frontend** — open <http://localhost:3000> in a browser. You should see the SaaS landing page.
3. **Database** — connect to Postgres to confirm tables:
   ```bash
   docker-compose exec postgres psql -U postgres -d clubnightlife -c "\dt"
   ```
   You should see 30+ tables.

---

## 6. First-time setup

1. Go to <http://localhost:3000/register-club>.
2. Fill in club name, owner email + password, etc.
3. The backend creates the club row, generates the slug, and creates the `admin` user. You are redirected to `/admin`.
4. Test the admin UI by creating a test member at `/admin/members/new`. Copy the activation link shown and open it in a private window to set the member password and log in to the `/member` portal.
5. From `/admin/employees`, invite a `doorman` and an `bartender`. Copy each activation link and accept in a private window.

You now have one admin, one doorman, one bartender and one member — enough to test all the workflows in [`workflows/KEY_WORKFLOWS.md`](./workflows/KEY_WORKFLOWS.md).

---

## 7. Subdomain routing (optional)

The frontend resolves club landing pages via subdomains, e.g. `the-midnight-lounge.app.com`. In development you can:

- Edit `/etc/hosts`:
  ```
  127.0.0.1 the-midnight-lounge.localhost
  ```
- Set `ROOT_DOMAIN=localhost`.
- Access <http://the-midnight-lounge.localhost:3000>.

The Next.js middleware (`frontend/middleware.ts`) detects the subdomain and rewrites to `/club/<slug>`.

---

## 8. Production checklist

Before going to production, verify:

- [ ] `JWT_SECRET` is at least 32 random characters. Rotate quarterly.
- [ ] `BCRYPT_ROUNDS=12` (raise from 10 for production).
- [ ] All DB and Redis passwords changed from defaults.
- [ ] `NODE_ENV=production`. Rate limiters become strict (no skip).
- [ ] `ROOT_DOMAIN` matches the actual apex (e.g. `app.com`).
- [ ] HTTPS is terminated by a reverse proxy (nginx, Cloudflare, Vercel). Set `app.set('trust proxy', 1)` is already on.
- [ ] `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set with production Cloudflare keys.
- [ ] Email provider configured (`EMAIL_PROVIDER`, provider-specific API key). Without this, employee invitations and email verification cannot be sent.
- [ ] `SENTRY_DSN` set on both backend and frontend (Phase 7).
- [ ] Database backups: `pg_dump` daily, push to S3, test a restore in staging monthly.
- [ ] CORS `ALLOWED_ORIGINS` set to the actual production frontend URL(s), not `localhost`.
- [ ] CDN or object storage for `logo_url`, `cover_image_url`, profile photos (don't accept arbitrary user uploads to the backend yet).
- [ ] Monitoring: uptime check on `/health`, alert if `db` or `redis` is `down`.
- [ ] Logging: ship Winston logs to a central system (Datadog, Logtail, Better Stack).
- [ ] Postgres RLS enabled (Phase 7 task) for defense in depth on `club_id`.
- [ ] `.env` is in `.gitignore` and never committed.
- [ ] CI pipeline (`.github/workflows/ci.yml`) green on `main`.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend crashes on startup with "relation does not exist" | Migrations didn't run | Check `docker-compose logs backend`. Run `docker-compose exec backend npm run migrate` manually. |
| 500 on every `/admin/*` page | DB column drift (e.g. `is_active` vs `status`) | Re-run migrations. See `PROJECT_STATUS.md` recent fixes. |
| Frontend cannot reach API in browser | `NEXT_PUBLIC_API_URL` points to a container hostname, not `localhost` | Set to `http://localhost:<BACKEND_PORT>` for local dev. |
| "Cannot connect to redis" | Redis container not started or wrong host | `docker-compose ps redis`. `REDIS_URL=redis://redis:6379` for inside Docker. |
| Member registration succeeds but no email sent | No email provider configured | Set `EMAIL_PROVIDER` and corresponding API key. Until then the token is in the backend logs. |
| `npm test` fails locally with "DB not available" | Tests need a running Postgres | `docker-compose up -d postgres redis`; or use the `setupTestDb` helper. |

---

## 10. Useful commands

```bash
# Backend (host)
cd backend && npm run dev          # nodemon
cd backend && npx tsc --noEmit     # typecheck
cd backend && npm test             # jest
cd backend && npm run migrate      # apply pending migrations
cd backend && npm run migrate:down # roll back the latest migration
cd backend && npm run migrate:status

# Frontend (host)
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npx tsc --noEmit

# Database access inside Docker
docker-compose exec postgres psql -U postgres -d clubnightlife
docker-compose exec redis redis-cli
```

---

## 11. Where to go next

- For role-based usage, read the [user guides](./user-guides/).
- For each cross-module flow, see [`workflows/KEY_WORKFLOWS.md`](./workflows/KEY_WORKFLOWS.md).
- For API contracts, see [`architecture/API_REFERENCE.md`](./architecture/API_REFERENCE.md).
- For the current state of the project, see the live [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) at the repo root.
