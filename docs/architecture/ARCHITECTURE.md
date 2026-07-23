# Architecture — NightClubmgmt

## Arquitectura actual

### High-level

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser (cliente: empleado o miembro)                              │
│ URL: clubname.app.com (subdomain) o app.com (main)                 │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│ Next.js 14 (Frontend, port 3000)                                   │
│ - middleware.ts: subdomain → /club/[slug] rewrite                  │
│ - App Router con layouts por rol (admin, member, club/[slug])      │
│ - Zustand authStore (persisted en localStorage)                    │
│ - QRScanner real con jsQR                                          │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ axios (NEXT_PUBLIC_API_URL)
                              │ JWT en Authorization header
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│ Express API (Backend, port 5000)                                   │
│ Middleware chain:                                                  │
│   requestId → helmet → cors → bodyParser → morgan                  │
│   → apiLimiter → routes                                            │
│ Per-route middleware:                                              │
│   → protect (JWT) → ensureClubAccess → validate(zod) →             │
│     restrictTo(roles) → controller (catchAsync) → service          │
└──────────┬────────────────────────────────────────┬────────────────┘
           │                                        │
           ▼                                        ▼
┌──────────────────────────┐         ┌────────────────────────────┐
│ PostgreSQL 15            │         │ Redis 7                    │
│ - 34 tables              │         │ - (sessions/cache TBD)     │
│ - club_id en cada tabla  │         │                            │
│ - 56 índices             │         │                            │
└──────────────────────────┘         └────────────────────────────┘
```

### Monorepo

```
NightClubmgmt/
├── backend/       # Express + TS
├── frontend/      # Next.js 14
├── database/      # SQL schema + migrations
├── docs/          # documentation
├── .claude/       # rules + agents + skills
└── docker-compose.yml
```

### Stack details

- **Backend runtime**: Node 20 LTS, TS 5
- **Frontend runtime**: Node 20 (build), Next.js standalone output (deploy)
- **DB**: PostgreSQL 15 alpine
- **Cache**: Redis 7 alpine (poco usado hoy)
- **Container orchestration**: Docker Compose (dev), TBD para prod (recomendado: Railway/Fly/Render para backend, Vercel para frontend)

## Arquitectura objetivo (post Fase 7)

```
                       ┌─────────────────────────┐
                       │ Wildcard DNS            │
                       │ *.nightclubmgmt.app     │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │ Vercel (Next.js)        │
                       │ Edge: middleware.ts     │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │ Express API             │◄──── Sentry
                       │ Railway/Fly/Render      │
                       └─────┬─────────┬─────────┘
                             │         │
                       ┌─────▼─────┐  ┌▼──────────┐
                       │ Postgres  │  │ Redis     │
                       │ (managed) │  │ (managed) │
                       │ + RLS     │  │           │
                       └───────────┘  └───────────┘
                             │
                       ┌─────▼─────┐  ┌───────────┐  ┌───────────┐
                       │ Paddle    │  │ Resend    │  │ Twilio    │
                       │ webhooks  │  │ (email)   │  │ (SMS)     │
                       └───────────┘  └───────────┘  └───────────┘
```

Cambios respecto al actual:
- **Hosting separado**: Vercel para Next.js, managed Postgres y Redis, contenedor backend en plataforma serverless-friendly.
- **RLS Postgres** como defense-in-depth para multi-tenancy.
- **Sentry** para error tracking.
- **Paddle** para billing SaaS.
- **Resend + Twilio** para notificaciones reales.

## Decisiones arquitectónicas clave

> Documentadas en detalle en ADRs individuales en `docs/architecture/adr/`.

### Multi-tenancy: row-level ownership + RLS

- **Estrategia**: cada tabla relevante tiene columna `club_id UUID NOT NULL` con FK a `clubs(id)`.
- **Enforcement actual** (Fase 0-1): middleware `ensureClubAccess` + filtros explícitos en cada query.
- **Defense-in-depth** (Fase 7): Postgres Row-Level Security. Policy `USING (club_id = current_setting('app.club_id')::uuid)`. Backend setea `SET LOCAL app.club_id` al inicio de cada transacción.
- **Por qué no schema-per-tenant**: cientos/miles de clubes haría inviable mantener tantos schemas. Migrations complejas. Performance comparable a row-level con índices buenos.
- **Por qué no DB-per-tenant**: solo justificable para enterprise tier con datos extremadamente sensibles. Hoy no aplica.
- **ADR**: `docs/architecture/adr/ADR-001-multi-tenancy.md` (a crear)

### Auth: JWT con clubId + refresh tokens

- **Access token**: 15 min, contiene `{userId, email, role, clubId}`. Stateless.
- **Refresh token**: 7 días, persistido en Redis. Logout invalida.
- **Login flow**: `POST /auth/login` → access + refresh. Frontend almacena ambos en httpOnly cookies (objetivo Fase 7; hoy localStorage).
- **Bcrypt** para password hashing.
- **JWT secret**: env var `JWT_SECRET`, rotable.

### Loyalty: ledger inmutable

- **Tabla `points_history`**: cada cambio de puntos es un INSERT. Campos: `id, club_id, member_id, delta, reason, actor_user_id, tx_id (nullable), created_at`.
- **Balance**: derivado por `SUM(delta) WHERE member_id = X`. Cacheado en `club_members.points_balance` mantenido por trigger.
- **No UPDATE permitido** a `points_history` (es ledger inmutable). Si se necesita corregir, INSERT compensatorio.
- **Audit log** en cada operación.
- **ADR**: `docs/architecture/adr/ADR-002-loyalty-ledger.md` (a crear)

### Member↔Club: 1:N

- **Decisión**: un cliente pertenece a un solo club. Si va a 2 clubes, se registra dos veces (con mismo email pero distinto `club_id`).
- **Por qué**: simplicidad MVP, sin riesgo cross-tenant, fidelidad clara por club.
- **Trade-off**: identidad no portable; podría migrarse a N:M en el futuro pero sería refactor mayor.
- **ADR**: `docs/architecture/adr/ADR-003-member-club-1n.md` (a crear)

### Billing SaaS: Paddle (Merchant of Record)

- **Por qué Paddle vs Stripe**: Paddle es MoR — se encarga de tax/VAT por país, ideal para SaaS global sin armar entidad legal en cada país.
- **Webhooks**: `POST /api/webhooks/paddle` con HMAC signature verification.
- **Feature gates**: middleware `requireFeature('vip_tables')` lee `clubs.features` (JSONB).
- **ADR**: `docs/architecture/adr/ADR-004-paddle-mor.md` (a crear)

### Subdomain routing: wildcard DNS

- **DNS**: `*.nightclubmgmt.app` → CNAME → hosting.
- **TLS**: certificado wildcard (Let's Encrypt + DNS challenge, o Cloudflare).
- **Frontend middleware**: extrae subdomain del host, valida que no sea reservado (www, api, admin), reescribe a `/club/[slug]`.
- **Backend**: endpoint público `GET /api/clubs/by-slug/:slug` para resolver clubId.
- **ADR**: `docs/architecture/adr/ADR-005-subdomain-routing.md` (a crear)

### No ORM

- **Decisión**: `pool.query(sql, params)` directo. Sin Prisma, TypeORM, Sequelize, Knex.
- **Por qué**: control total sobre queries, sin magia, sin schema drift, dev de bajo nivel familiar.
- **Trade-off**: cada service implementa su mapper snake→camel manualmente. Mitigado con helper `mapRow`.
- **ADR**: `docs/architecture/adr/ADR-006-no-orm.md` (a crear)

## Modelo de datos recomendado

### Cambios sobre el schema actual

#### Fase 0
- No cambios estructurales. Solo bugfixes (C1, C2).

#### Fase 2
```sql
CREATE TABLE employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin','manager','bartender','doorman','staff','security')),
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES club_users(id),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invitations_token ON employee_invitations(token);
CREATE INDEX idx_invitations_club ON employee_invitations(club_id);
```

#### Fase 3
```sql
-- points_history ya existe, solo asegurar columnas:
ALTER TABLE points_history
  ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES club_users(id),
  ADD COLUMN IF NOT EXISTS tx_id UUID REFERENCES transactions(id);

CREATE INDEX IF NOT EXISTS idx_points_history_member ON points_history(member_id, created_at DESC);

-- Trigger para mantener points_balance sincronizado
CREATE OR REPLACE FUNCTION sync_points_balance() RETURNS TRIGGER AS $$
BEGIN
  UPDATE club_members
    SET points_balance = (
      SELECT COALESCE(SUM(delta), 0) FROM points_history WHERE member_id = NEW.member_id
    )
    WHERE id = NEW.member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_points_balance
  AFTER INSERT ON points_history
  FOR EACH ROW EXECUTE FUNCTION sync_points_balance();
```

#### Fase 7
```sql
-- GDPR
ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- RLS
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON club_members
  USING (club_id = current_setting('app.club_id', true)::uuid);
-- Repetir para todas las tablas con club_id
```

## Flujo de requests (detalle)

### Request autenticado típico

```
1. Browser: GET clubname.app.com/admin/members
   Header: Cookie con auth-token

2. Next.js middleware.ts:
   - Extrae subdomain "clubname"
   - Valida no reservado
   - Rewrites a /club/clubname/admin/members
   - Headers: x-club-slug: clubname

3. Next.js App Router resuelve /admin/layout.tsx + /admin/members/page.tsx
   - layout llama useAuth() → consulta authStore (Zustand)
   - Si !isAuthenticated → redirect /login
   - page.tsx mounta useEffect → llama loadMembers()

4. Frontend axios:
   GET /api/clubs/{clubId}/members
   Header: Authorization: Bearer {jwt}

5. Express middleware chain:
   - requestIdMiddleware: genera req.id
   - helmet: security headers
   - cors: valida origin
   - bodyParser
   - morgan: log
   - apiLimiter: rate check
   - Match route /api/clubs/:clubId/members
   - protect: valida JWT, set req.user
   - ensureClubAccess: valida JWT.clubId === req.params.clubId
   - validate(membersQuerySchema): valida req.query con Zod
   - membersController.getAllMembers (catchAsync)

6. Controller:
   const clubId = req.clubId!;
   const result = await membersService.getAll(clubId, req.query);
   res.json({ status: 'success', data: result });

7. Service:
   const result = await pool.query(
     `SELECT cm.*, mt.tier_name FROM club_members cm
      LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
      WHERE cm.club_id = $1 ORDER BY cm.registration_date DESC
      LIMIT $2 OFFSET $3`,
     [clubId, limit, offset]
   );
   return result.rows.map(this.mapMember);

8. Response → Express → Frontend → setState → render
```

### Request sensible con audit log

```
... mismos pasos 1-5 ...

6. Controller:
   const member = await membersService.create(clubId, req.body);
   await auditService.logAction(
     'member_created',
     req.user.id,
     clubId,
     { memberId: member.id, email: member.email },
     req
   );
   res.status(201).json(...);

7. auditService:
   INSERT INTO audit_logs (action, user_id, club_id, metadata, ip_address, user_agent, request_id)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
```

## Separación de módulos

- **routes/**: SOLO define endpoints HTTP y aplica middlewares. No lógica.
- **controllers/**: parse request, llama service, formatea response. Usa `catchAsync` para errores.
- **services/**: lógica de negocio + queries SQL. Devuelve dominio mapeado (camelCase).
- **middleware/**: auth, tenant, validation, rate limiting, error handling.
- **utils/**: errorHandler, validators (Zod schemas), logger, qrService.

Convención de naming:
- Route: `members.ts`
- Controller: `membersController.ts`
- Service: `membersService.ts`

## Riesgos técnicos

| Riesgo | Mitigación |
|---|---|
| Cross-tenant data leak por query sin `club_id` | Tests automatizados + RLS (Fase 7) |
| Inconsistencia balance ↔ ledger en loyalty | Trigger DB que mantiene sync + test de integridad |
| JWT robado puede acceder hasta expirar | Refresh tokens cortos (15min) + blacklist Redis (Fase 1) |
| Webhook Paddle falsificado | Signature HMAC obligatoria |
| Race condition en aforo | Transacción `SELECT FOR UPDATE` al incrementar `current_occupancy` |
| Migraciones rompen prod sin rollback | Migration tooling (`node-pg-migrate`) en Fase 7 |
| Costos email/SMS explotan | Quotas por plan, alerting cuando se acerque al límite |
| Postgres se queda sin conexiones | Connection pooling correcto (`pg` Pool con max=20), monitoring |

## ADRs (Architecture Decision Records) a crear

Cada uno como archivo separado en `docs/architecture/adr/`. Usar skill `/write-adr` para crearlos.

| # | Título | Status | Notas |
|---|---|---|---|
| ADR-001 | Multi-tenancy via row-level ownership | Accepted | Hoy implementado, RLS futuro |
| ADR-002 | Loyalty points como ledger inmutable | Proposed | Fase 3 |
| ADR-003 | Member↔Club relationship 1:N (no N:M) | Accepted | Decidido 2026-05-16 |
| ADR-004 | Paddle como Merchant of Record para SaaS billing | Accepted | Decidido 2026-05-16 |
| ADR-005 | Subdomain routing con wildcard DNS | Accepted | Hoy implementado en middleware.ts |
| ADR-006 | No ORM — queries SQL directas con `pool.query` | Accepted | Heredado |
| ADR-007 | i18n con next-intl (es/en/pt) | Proposed | Fase 4 |
| ADR-008 | Refresh tokens con Redis blacklist | Proposed | Fase 1 |
| ADR-009 | Postgres RLS como defense-in-depth | Proposed | Fase 7 |
| ADR-010 | Sentry para error tracking | Proposed | Fase 7 |
