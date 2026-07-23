# NightClubmgmt — Working Guide for Claude

> Para entender el producto a fondo: `docs/product/PRODUCT_FOUNDATION.md`
> Para entender el estado real del código: `docs/audit/PLATFORM_AUDIT.md`
> Para entender hacia dónde vamos: `docs/roadmap/ROADMAP.md`

## Producto

SaaS **multi-tenant** para clubes nocturnos. Cada club se registra, obtiene un slug único y un subdominio (`clubname.app.com`), gestiona empleados con RBAC, clientes con tarjeta de fidelidad + QR + puntos, eventos, guest list, VIP, incidentes y métricas. Modelo de negocio: suscripción mensual del club a la plataforma (Paddle como MoR). **La app NO procesa ventas del club** (no es POS).

## Stack

- **Backend**: Node 20 + Express 4 + TypeScript. `pool` de PostgreSQL (sin ORM). JWT. Winston. Helmet. Rate limiters.
- **Frontend**: Next.js 14 App Router + React 18 + Zustand + axios + react-hook-form + Zod + Tailwind + jsQR.
- **DB**: PostgreSQL 15 + Redis 7.
- **Infra**: Docker Compose (postgres, redis, backend:5000, frontend:3000).

## Comandos habituales

```bash
# Stack completo
docker-compose up -d --build
docker-compose logs -f backend
docker-compose down

# Backend (dev local)
cd backend && npm run dev          # nodemon
cd backend && npm run build        # tsc
cd backend && npm test             # jest
cd backend && npx tsc --noEmit     # typecheck only

# Frontend (dev local)
cd frontend && npm run dev         # next dev
cd frontend && npm run build       # next build
cd frontend && npm run lint        # eslint
cd frontend && npx tsc --noEmit    # typecheck only

# DB
docker-compose exec postgres psql -U postgres -d clubnightlife
```

> **DB name** es `clubnightlife` (NO `club_nightlife`).

## Reglas no negociables

Detalle completo en `.claude/rules/`. Resumen ejecutivo:

1. **Multi-tenancy**: TODA query `SELECT/UPDATE/DELETE` que toca una tabla con columna `club_id` DEBE filtrar por `club_id` en `WHERE`. Sin excepciones. → `.claude/rules/multi-tenancy.md`
2. **Loyalty / puntos**: NUNCA `UPDATE club_members SET points_balance` directo. Pasar por ledger: `INSERT INTO points_history (...)`. → `.claude/rules/loyalty.md`
3. **Audit log**: acciones sensibles (login, register, refund, points credit/debit, member CRUD, employee invite, rol change, club settings change) generan row en `audit_logs` via `auditService`. → `.claude/rules/security.md`
4. **Input validation**: endpoints públicos y mutaciones requieren `validate(zodSchema)` middleware. → `.claude/rules/backend.md`
5. **Tenant secret**: el `clubId` viene del JWT, NO del body o query. El frontend puede sugerir pero el backend usa el del token. → `.claude/rules/multi-tenancy.md`
6. **RBAC**: endpoints sensibles llevan `restrictTo(...roles)`. Matriz en `docs/architecture/rbac-matrix.md`. → `.claude/rules/rbac.md`
7. **PII**: no loggear emails, teléfonos, ni QR tokens en logs de producción. → `.claude/rules/security.md`
8. **Tests obligatorios** en flows tenant-críticos (cross-tenant isolation, RBAC denial, points ledger integrity). → `.claude/rules/testing.md`

## Convenciones de naming

- **DB**: `snake_case` (`club_id`, `qr_code_id`, `full_name`, `points_balance`).
- **TypeScript**: `camelCase` (`clubId`, `qrCodeId`, `fullName`, `pointsBalance`).
- **Mapper obligatorio**: cada service exporta un `private mapXxx(row)` que convierte snake → camel. Ver `visitsService.ts` / `membersService.ts` como referencia. → `.claude/rules/database.md`
- **Slugs**: lowercase ASCII + guiones (`my-club-name`). Generados con `toSlug(value)`.
- **Archivos**: `kebab-case` para componentes (`qr-scanner.tsx` ❌ — usamos `QRScanner.tsx` por convención React). Routes: `kebab-case`.
- **Idioma del código**: inglés. Comentarios: inglés. Docs/product: español + términos técnicos en inglés.

## Estructura del proyecto

```
NightClubmgmt/
├── backend/                  # Express + TS API
│   ├── src/
│   │   ├── server.ts         # entry point
│   │   ├── config/           # database, redis
│   │   ├── middleware/       # auth, tenant, validation, rateLimiter, errorHandler
│   │   ├── routes/           # route definitions
│   │   ├── controllers/      # catchAsync + AuthRequest
│   │   ├── services/         # pool.query, business logic
│   │   ├── utils/            # errorHandler, validators (zod), logger
│   │   └── __tests__/        # jest
│   └── package.json
├── frontend/                 # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx        # AuthInitializer (singleton checkAuth)
│   │   ├── (auth)/           # login, register-club, register-member
│   │   ├── admin/            # dashboard + door, bar, security, members, events, vip, etc.
│   │   ├── member/           # cliente self-service
│   │   └── club/[slug]/      # landing pública por club
│   ├── components/           # Button, Card, Modal, QRScanner, etc.
│   ├── lib/                  # api (axios), auth, store, hooks, types
│   ├── middleware.ts         # subdomain → /club/[slug] rewrite
│   └── package.json
├── database/
│   ├── schema.sql            # 24 tablas iniciales
│   └── migrations/           # 001_audit_and_nightclub_features.sql (+10 tablas)
├── docs/                     # documentación (audit, product, architecture, roadmap)
├── .claude/                  # rules + agents + skills para Claude Code
├── docker-compose.yml
├── CLAUDE.md                 # este archivo
└── PROJECT_STATUS.md         # estado vivo, actualizar cada fase
```

## Definition of Done

Un cambio está hecho cuando:

- [x] **Typecheck pasa**: `npx tsc --noEmit` en backend y frontend
- [x] **Tests pasan**: `npm test` (mínimo: smoke test del flow afectado + cross-tenant si aplica)
- [x] **Lint pasa**: `npm run lint` (frontend) / `eslint` (backend si configurado)
- [x] **Build pasa**: `npm run build` en frontend y backend
- [x] **Manual smoke test** del flow con docker-compose corriendo
- [x] **Audit log** si la acción es sensible (ver lista arriba)
- [x] **Reglas de `.claude/rules/`** respetadas (especialmente multi-tenancy y loyalty si aplica)
- [x] **`PROJECT_STATUS.md` actualizado** si la tarea cierra una fase o decisión arquitectónica

## Cómo trabajar en este repo

1. **Antes de tocar código que mueve datos**, leé `.claude/rules/multi-tenancy.md`.
2. **Antes de tocar puntos**, leé `.claude/rules/loyalty.md` (o invocá `/review-tenant-safety`).
3. **Para diseñar una feature nueva**, usá la skill `/design-feature`.
4. **Para escribir un ADR**, usá la skill `/write-adr`.
5. **Para auditar tenant-safety en una rama**, usá `/review-tenant-safety` (gatilla el agent `tenant-safety-auditor`).
6. **Branches**: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`. PRs a `main`.
7. **Commits**: mensajes en inglés, imperativo (`add invitation flow`, not `added invitation flow`).
8. **No agregar features fuera del roadmap actual** sin discutir primero. Ver `docs/roadmap/ROADMAP.md`.

## Cosas que NO se hacen acá

- ❌ ORM (Prisma, TypeORM). Usamos `pool.query` directo.
- ❌ Cambiar el contador `points_balance` sin un INSERT previo en `points_history`.
- ❌ Confiar en `clubId` del body/query del cliente.
- ❌ `useEffect([user])` en frontend (causa loops; usar `[user?.clubId]`).
- ❌ Commits con secrets, .env, o claves.
- ❌ Push --force a `main`.
- ❌ Crear documentación nueva en la raíz del repo. Va en `docs/`.

## Open questions para discutir con el dueño del proyecto

1. Nombre comercial final del producto.
2. Idiomas MVP (es/en/pt o solo es+en).
3. Email provider (Resend, Postmark, etc.).
4. Hosting target (Vercel + Railway/Fly/Render).
5. Política de validación de edad de clientes.
6. Política de retención de datos.

Más en `docs/audit/PLATFORM_AUDIT.md#open-questions`.
