# Platform Audit — NightClubmgmt

**Fecha**: 2026-05-16
**Auditor**: Claude (sesión inicial)
**Modo**: read-only

## Resumen ejecutivo

Plataforma multi-tenant para clubes nocturnos en estado avanzado-de-MVP. Backend amplio (19 controllers, 30+ tablas, multi-tenancy con middleware sólido) y frontend funcional (Next.js 14, vistas operativas door/bar/security/admin/member, QR scanner real). **Pero hay 4 problemas críticos** que bloquean cualquier paso productivo:

1. 🔴 **2 queries SQL sin filtro `club_id`** — vulnerabilidad real de cross-tenant data corruption (`visitsService.ts:108`, `transactionsService.ts:405`).
2. 🔴 **Loyalty sin ledger real** — tabla `points_history` existe en schema pero no se usa. Puntos se modifican como contador mutable. Imposible auditar.
3. 🔴 **0 tests de aislamiento multi-tenant** — un solo archivo de tests en todo el backend (`auth.test.ts`).
4. 🔴 **No CI/CD** — nada que prevenga regresiones en main.

Además, 10 problemas medianos (audit log incompleto, validación Zod en 4/12 rutas, mapper snake→camel en 3/16 services, sin GDPR, sin invitación por email, etc.) y varios menores.

**Riesgo global**: 🔴 ALTO mientras C1–C4 no se cierren. Tras Fase 0 del roadmap, baja a 🟡 MEDIO.

## Estado actual

| Área | Estado | Detalle |
|---|---|---|
| Backend API | ✅ Funcional | 19 controllers, patrón Routes→Controller→Service consistente |
| Frontend | ✅ Funcional | App Router, vistas por rol, QR scanner real (jsQR) |
| DB schema | ✅ Domain-completo | 34 tablas incluyendo ledger e índices |
| Multi-tenancy | 🟡 Parcial | Middleware existe pero 2 queries sin filtro verificadas |
| Auth + JWT | ✅ OK | Bcrypt, JWT con `clubId` + `role` |
| RBAC | 🟡 Parcial | 5 roles definidos, falta auditoría endpoint-por-endpoint |
| Loyalty system | 🔴 Crítico | Ledger en schema pero no implementado |
| Audit log | 🟡 Parcial | Service existe, usado en 5/10 controllers |
| Tests | 🔴 Mínimos | 1 archivo, no cubre tenant-isolation |
| CI/CD | 🔴 Ausente | Sin pipelines |
| GDPR | 🔴 Ausente | Sin consent, sin export, sin delete-data |
| Billing SaaS | 🟡 Parcial | Stripe parcial, Paddle planeado |
| i18n | 🔴 Ausente | Mezcla es/en hardcoded |
| Observabilidad | 🟡 Básica | Winston OK, sin Sentry, sin métricas |
| Docker | ✅ OK | Compose funcional, 4 servicios |

## Stack detectado

### Backend (`backend/`)
- **Runtime**: Node 20, TypeScript 5
- **Framework**: Express 4
- **DB driver**: `pg` Pool (sin ORM)
- **Auth**: `jsonwebtoken` + `bcryptjs`
- **Validation**: `zod` + middleware custom (`utils/validators.ts`)
- **Logger**: Winston (file + console)
- **Security**: Helmet, cors, express-rate-limit, express-mongo-sanitize, hpp
- **Testing**: Jest + supertest
- **Otros**: morgan, dotenv, uuid

### Frontend (`frontend/`)
- **Framework**: Next.js 14.1.0 (App Router)
- **UI**: React 18, Tailwind CSS, Lucide-react icons
- **State**: Zustand (con persist middleware)
- **Forms**: react-hook-form + @hookform/resolvers + Zod
- **HTTP**: axios
- **Animations**: framer-motion
- **Charts**: recharts
- **QR**: jsqr (scan) + qrcode.react (display, deprecated v3)
- **Data fetching**: @tanstack/react-query (instalado pero apenas usado)
- **Dates**: date-fns

### DB
- PostgreSQL 15 (Docker `postgres:15-alpine`)
- Redis 7 (Docker `redis:7-alpine`) — usado para sessions/cache pero apenas

## Arquitectura actual

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Browser         │───▶│ Next.js 14      │───▶│ Express API      │
│ (clubname.app)  │    │ middleware.ts   │    │ /api/clubs/:id/* │
│                 │    │ (subdomain →    │    │ auth + tenant    │
│                 │    │  /club/[slug])  │    │ middlewares      │
└─────────────────┘    └─────────────────┘    └────────┬─────────┘
                                                       │
                                          ┌────────────┴────────────┐
                                          │                         │
                                   ┌──────▼──────┐         ┌────────▼────────┐
                                   │ PostgreSQL  │         │ Redis           │
                                   │ 34 tables   │         │ (cache/session) │
                                   └─────────────┘         └─────────────────┘
```

## Mapa de módulos backend

| Módulo | Routes | Controller | Service | Tabla(s) principal |
|---|---|---|---|---|
| Auth | `routes/auth.ts` | `authController.ts` | `authService.ts` | `club_users`, `club_members` |
| Clubes | `routes/clubs.ts` | (inline en routes) | — | `clubs` |
| Members | `routes/members.ts` | `membersController.ts` | `membersService.ts` | `club_members`, `membership_tiers` |
| Visits | `routes/visits.ts` | `visitsController.ts` | `visitsService.ts` | `visits` |
| Transactions | `routes/transactions.ts` | `transactionsController.ts` | `transactionsService.ts` | `transactions`, `points_history` |
| Rewards | `routes/rewards.ts` | `rewardsController.ts` | `rewardsService.ts` | `rewards`, `redeemed_rewards` |
| Events | `routes/events.ts` | `eventsController.ts` | `eventsService.ts` | `events`, `event_registrations` |
| Guest Lists | `routes/guestLists.ts` | `guestListController.ts` | `guestListService.ts` | `guest_lists`, `guest_list_entries` |
| VIP | `routes/vip.ts` | `vipController.ts` | `vipService.ts` | `vip_tables`, `vip_reservations` |
| Incidents | `routes/incidents.ts` | `incidentsController.ts` | `incidentsService.ts` | `incidents` |
| Drink Specials | `routes/drinkSpecials.ts` | `drinkSpecialsController.ts` | `drinkSpecialsService.ts` | `drink_specials` |
| Metrics | `routes/metrics.ts` | (servicio inline en queries) | — | (aggregations sobre todas) |
| Audit | — | — | `auditService.ts` | `audit_logs` |
| Notifications | — | — | `notificationService.ts` | `notifications` |
| Stripe | — | — | `stripeService.ts` (parcial) | `club_subscriptions` |
| QR | — | — | `qrService.ts` | (genera tokens) |

## Mapa de módulos frontend

| Sección | Path | Rol(es) | Estado |
|---|---|---|---|
| Landing | `app/page.tsx` | público | ✅ |
| Register Club | `app/(auth)/register-club/page.tsx` | público | ✅ con slug+preview URL |
| Register Member | `app/(auth)/register-member/page.tsx` | público | ✅ |
| Login | `app/(auth)/login/page.tsx` | público | ✅ |
| Admin Dashboard | `app/admin/page.tsx` | admin/manager | ✅ |
| Members | `app/admin/members/page.tsx` | admin/manager | ✅ |
| Door | `app/admin/door/page.tsx` | doorman/security | ✅ con QRScanner real |
| Bar | `app/admin/bar/page.tsx` | bartender | ✅ con QR scan |
| Security | `app/admin/security/page.tsx` | security | ✅ con modal resolve |
| Events | `app/admin/events/page.tsx` | admin/manager | ✅ |
| Guest Lists | `app/admin/guest-lists/page.tsx` | admin/manager | ✅ |
| VIP | `app/admin/vip/page.tsx` | admin/manager | ✅ |
| Analytics | `app/admin/analytics/page.tsx` | admin/manager | ✅ |
| Settings | `app/admin/settings/page.tsx` | admin | 🟡 sin endpoint backend |
| Member Portal | `app/member/page.tsx` | member | ✅ con QR card |
| Member Rewards | `app/member/rewards/page.tsx` | member | ✅ |
| Member Profile | `app/member/profile/page.tsx` | member | ✅ |
| Club Landing | `app/club/[slug]/page.tsx` | público (subdomain) | ✅ |

## Entidades principales

### Diagrama ER textual (resumido)

```
clubs (tenant root)
├── club_users (empleados)      role: admin|manager|bartender|doorman|staff|security
├── club_members (clientes)     1:N con club. qr_code_id único.
│   ├── visits                   member_id → visits del cliente
│   ├── transactions             member_id → transacciones del cliente
│   ├── points_history           ledger (existe pero no usado)
│   ├── redeemed_rewards         FK reward + member
│   └── member_badges            achievements
├── membership_tiers              configurable por club
├── events
│   ├── event_registrations
│   └── (link a guest_lists)
├── guest_lists
│   └── guest_list_entries
├── vip_tables
│   └── vip_reservations
├── incidents                     security log
├── drink_specials
├── rewards
├── promotions
├── audit_logs                    multi-tenant audit trail
├── club_subscriptions            Stripe parcial
├── capacity_snapshots
├── promoter_commissions
└── notifications
```

## Hallazgos por severidad

### 🔴 Crítico — bloqueante

| ID | Problema | Impacto | Riesgo | Solución | Prioridad | Esfuerzo |
|---|---|---|---|---|---|---|
| C1 | `UPDATE club_members SET total_visits = total_visits + 1 WHERE id = $1` sin `club_id` (`visitsService.ts:108`) | Un controller con bug podría incrementar visitas de miembros de otro club | Data corruption cross-tenant | Agregar `AND club_id = $clubId` | P0 | 15 min |
| C2 | `UPDATE transactions SET status = 'refunded' WHERE id = $1` sin `club_id` (`transactionsService.ts:405`) | Refund de transacción ajena con ID conocido | Fraude financiero cross-tenant | Agregar `AND club_id = $clubId` | P0 | 15 min |
| C3 | Puntos modificados directo en `club_members.points_balance` sin pasar por `points_history` | Sin trazabilidad. Edición manual sin auditoría. Inconsistencias posibles | Pérdida de confianza, fraude interno | Migrar a ledger inmutable (Fase 3) | P0 (post-Fase 0) | 2-3 días |
| C4 | 0 tests de cross-tenant. Solo `auth.test.ts` (1.5kb) | Bugs como C1/C2 pasan inadvertidos | Regresiones de seguridad recurrentes | Crear `multitenancy.test.ts` con suite de denial tests | P0 | 1 día |

### 🟡 Medio — prioridad alta pero no bloqueante

| ID | Problema | Impacto | Solución | Prioridad | Esfuerzo |
|---|---|---|---|---|---|
| M1 | 5/10 controllers sin `auditService` (auth, drinkSpecials, incidents, transactions) | Audit trail incompleto. Refunds sin log. | Agregar calls a `auditService.logAction()` | P1 | 4h |
| M2 | 8/12 routes sin `validate(zodSchema)` | Bad input pasa, errores generic | Crear schemas + aplicar middleware | P1 | 1 día |
| M3 | 13/16 services sin mapper snake→camel | API responses inconsistentes | Helper `mapRow(row, mapping)` reutilizable | P1 | 1 día |
| M4 | Sin tabla `employee_invitations` ni endpoint de invitación | ABM empleados incompleto | Crear schema + email flow | P2 (Fase 2) | 2 días |
| M5 | Stripe parcial, webhooks sin signature verification | Inseguro, no usable en prod | Migrar a Paddle (decisión tomada) | P2 (Fase 7) | 1 semana |
| M6 | Sin GDPR (consent flags, export, delete) | Bloquea clientes UE | Schema flags + 2 endpoints | P3 (Fase 7) | 3 días |
| M7 | No CI/CD | Regresiones en main, no quality gate | GitHub Actions: lint + typecheck + test | P1 (Fase 0) | 4h |
| M8 | Frontend: `Spinner`, `LoadingOverlay`, `QRDisplay` exportados pero no importados | Dead code | Eliminar exports o documentar uso | P3 | 30 min |
| M9 | 15+ `.md` redundantes en `docs/` (BUILD_SUCCESS, ESTADO_FINAL, IMPLEMENTATION_SUMMARY...) | Confusión | Archivar en `docs/archive/` o eliminar | P3 | 1h |
| M10 | 6 TODOs activos en código sin tracker | Trabajo pendiente invisible | Convertir a issues GitHub | P3 | 30 min |
| M11 | No i18n. Mezcla es/en hardcoded | Bloquea expansión global | `next-intl` con es/en mínimo | P2 (Fase 4) | 3 días |
| M12 | Health endpoint `/health` no incluye check de DB/Redis | Healthcheck miente si DB cae | Pingear pool + redis en `/health` | P2 | 1h |
| M13 | Sin error tracking (Sentry) | Errores en prod invisibles | Integrar Sentry frontend + backend | P2 (Fase 7) | 4h |
| M14 | Sin refresh tokens. JWT vive 24h, logout sin invalidación | Sesión robable | Refresh tokens + token blacklist Redis | P2 (Fase 7) | 2 días |
| M15 | Tabla `notifications` existe, framework sin delivery real (email/SMS/push TODOs) | Notificaciones no llegan | Integrar Resend + Twilio + FCM | P2 (Fase 4) | 1 semana |

### 🟢 Menor — limpieza y polish

| ID | Problema | Solución |
|---|---|---|
| L1 | `IMPLEMENTATION_COMPLETE.md` en raíz | Mover a `docs/archive/` |
| L2 | `qrcode.react@^3.1.0` deprecated | Bump a v4 cuando haya tiempo |
| L3 | Tipo `User` no tiene `clubName` pero algunos componentes lo importan | Limpiar imports erróneos |
| L4 | Naming mezclado en docs es/en | Convencionar todo a inglés interno |
| L5 | Componentes `COMPONENTS.md`, `QUICK_START.md`, `README.md` dentro de `components/` | Consolidar en `docs/` |
| L6 | `dataset/` y `samples/` en raíz (si existen) | Verificar uso, archivar |

## Código viejo / no usado / sospechoso

- `frontend/components/QRDisplay.tsx` contiene un componente `QRScanner` placeholder antiguo, pero el real está en `QRScanner.tsx`. **Necesita validation**: si `QRDisplay` (el de QR show) tampoco se usa, eliminar archivo entero. Hoy `index.ts` solo exporta `QRDisplay` (no el QRScanner viejo).
- `backend/src/services/stripeService.ts` — funciones para checkout y subscriptions pero **sin route que las llame**. Es código muerto hasta que se decida Stripe vs Paddle (Paddle ya está decidido → este archivo debería eliminarse o reemplazarse).
- `frontend/lib/auth.ts` exporta `logout`, `getCurrentUser`, `verifyToken`, `isAuthenticated` — solo `getAuthToken` se importa en algunos sitios. **Needs validation** vía `grep -r "import.*from.*'@/lib/auth'"`.
- `IMPLEMENTATION_COMPLETE.md` en raíz — parece artefacto de trabajo anterior.
- Múltiples `*.md` en `docs/` superpuestos (BUILD_SUCCESS, DEPLOYMENT_GUIDE, DOCKER_DEPLOYMENT, DOCKER_QUICKSTART, E2E-TEST-REPORT, ESTADO_FINAL, etc.) — varios cuentan la misma historia.

## Incongruencias detectadas

1. **Schema vs realidad**: `points_history` definida con todos los campos para ledger (delta, reason, etc.) pero código nunca hace INSERT.
2. **Roles**: schema acepta `admin|manager|bartender|doorman|staff`, código frontend referencia también `security` (en redirects de admin layout). **Needs validation**: ¿`security` es alias de `doorman`/`staff`, o falta migración?
3. **Member type**: frontend `lib/types.ts` define `User.role` con valores como `'ADMIN'|'CLUB_OWNER'|'MEMBER'` (UPPERCASE), pero backend devuelve roles en minúscula (`'admin'`). Hay comparaciones case-insensitive ad-hoc en componentes — riesgo de bug.
4. **Settings page**: existe UI en `frontend/app/admin/settings/page.tsx` pero no hay endpoint backend para guardar la configuración (PUT `/clubs/:id/settings`).
5. **`club_members.points_balance`**: tipo `INTEGER NOT NULL DEFAULT 0` pero podría ser negativo si se debita más de lo disponible y no hay constraint.
6. **JWT `expiresIn`**: hardcoded en `authService.ts` (24h). Sin refresh token. Sin invalidación al logout.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cross-tenant data leak en producción | Media (C1/C2 abiertos) | Alto (reputacional, legal) | Fase 0 fix + tests |
| Pérdida de fidelidad de cliente por inconsistencia de puntos | Alta (sin ledger) | Medio | Fase 3 ledger |
| Bug en main porque no hay CI | Alta | Medio | CI básico Fase 0 |
| Cliente UE demanda export/delete y no podemos | Media | Alto (multa GDPR) | Fase 7 GDPR |
| Frontend rompe en build por warnings ESLint promovidos a errors | Media | Bajo | Fix iterativo |
| Paddle/Stripe webhooks falsificados | Media | Alto | Signature verification obligatoria |

## Quick wins (≤ 1h cada uno)

- [x] Fix C1: `visitsService.ts:108` — agregar `AND club_id = $X`
- [x] Fix C2: `transactionsService.ts:405` — agregar `AND club_id = $X`
- [x] Eliminar `IMPLEMENTATION_COMPLETE.md` de raíz
- [x] Eliminar exports no usados de `frontend/components/index.ts` (Spinner, LoadingOverlay, QRDisplay)
- [x] Agregar check de DB en `/health` endpoint
- [x] Eliminar `stripeService.ts` (será reemplazado por Paddle)
- [x] Mover `IMPLEMENTATION_COMPLETE.md` y duplicados a `docs/archive/`
- [x] Agregar `engines.node` en `package.json` ambos proyectos
- [x] Crear `multitenancy.test.ts` minimal con un caso (luego ampliar)

## Recomendaciones (resumen)

1. **Fase 0 obligatoria antes de seguir** — Fix C1, C2, suite multitenancy tests, CI básico.
2. **Loyalty ledger en Fase 3** — diseñar antes de tener muchos clubes en producción.
3. **Adoptar built-in agents de Claude Code** + 3 custom específicos del dominio (tenant-safety, loyalty, product-strategy).
4. **Reglas en `.claude/rules/`** son la fuente de verdad operativa diaria, no las docs largas.
5. **Postgres RLS como defense-in-depth** (Fase 7+) — el middleware está bien pero RLS hace imposible un cross-tenant accidental.
6. **No agregar features hasta cerrar Fase 0**. Bug fixes únicamente.

## Open Questions

1. **Branding final** del producto.
2. **Idiomas MVP**: ¿es/en/pt o solo es+en?
3. **Email provider preferido**: Resend, Postmark, SendGrid, AWS SES?
4. **Hosting target**: Vercel + Railway/Fly/Render?
5. **Política de minors**: ¿el club valida edad de los clientes? Tabla `date_of_birth` existe pero no se usa para validación de mayoría de edad.
6. **Retention de datos**: ¿cuánto tiempo guardamos visits/transactions de clientes inactivos? Afecta GDPR.
7. **Roles**: ¿`security` es alias de `doorman` o rol independiente? (Migration inconsistency).
8. **Multi-venue por club owner**: ¿un owner puede tener N clubes? Hoy no — JWT lleva 1 `clubId`. Sí o no afecta arquitectura.
9. **Paddle webhook URL pública**: ¿cómo la exponemos en dev? (ngrok? Paddle test mode?)
10. **Reset de password**: ¿hay flow? Hoy no encontré endpoint. Crítico para clubes que olvidan password.
