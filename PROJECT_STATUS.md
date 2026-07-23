# Project Status — NightClubmgmt

> Archivo vivo. Claude actualiza este archivo al cerrar fases, tomar decisiones arquitectónicas, o tras cada sesión significativa de trabajo. Usar skill `/update-project-status`.

**Last updated**: 2026-05-20
**Last updated by**: Claude (sesión seguridad + refinamiento: /simplify + /review-tenant-safety + security-review + /review-rbac)

---

## Current Phase

**Fase 4 — Eventos + Guest list + Notificaciones + i18n**

**Progress**: 15% — Seguridad del registro de clientes implementada (Turnstile + verificación email). Pendiente: email provider real, guest list QR, i18n.

---

## Recently Analyzed / Modified

### 2026-05-17 — Sesión Fases 0–3: cierre completo
*(Ver detalle en historial al final)*

### 2026-05-20 — Sesión: /simplify + auditorías completas de seguridad, tenant-safety y RBAC

**Analizado:**
- Todos los services y controllers del branch actual (diff HEAD)
- Todas las routes para auditoría RBAC
- `middleware/auth.ts`, `middleware/validation.ts`
- `authService.ts` — login flows, JWT config
- `eventsService.ts`, `vipService.ts`, `rewardsService.ts`, `pointsService.ts`

**Fixes de calidad (/simplify):**
- `validation.ts` — eliminado `body: req.body` del logger (contraseñas en plaintext)
- `authController.ts` — eliminado token de verificación de logs; eliminado email de metadata de audit log (PII)
- `membersController.ts` — `getMemberStats` pasó de `Request` a `AuthRequest` + `req.clubId!`; badges query ahora filtra por `club_id`; activationToken removido de respuesta API; import movido al top; comentarios "What" eliminados; PII (email, qrCodeId) removidos del audit log de createMember
- `transactionsController.ts` — todos los 7 handlers ahora usan `req.clubId!` (antes usaban `req.params.clubId`)
- Frontend: `formatTime`, `getTierColor` centralizados en `lib/utils.ts`; 5 páginas admin actualizadas para importar desde utils
- `guestListController.ts` — `getPromoterCommissions` con SQL crudo movido a `guestListService`
- `admin/layout.tsx` — roles fantasma (`club_owner`, `club_manager`, `super_admin`, `host`) reemplazados por roles canónicos (`admin`, `manager`, `bartender`)

**Fixes críticos de tenant-safety (/review-tenant-safety → 4 críticos):**
- `rewardsService.ts:221` — `UPDATE club_members` sin `club_id` → agregado `AND club_id = $3`
- `eventsService.ts:303` — `UPDATE events` (registerForEvent) sin `club_id` → agregado `AND club_id = $2` con `event.club_id`
- `eventsService.ts:346` — `UPDATE events` (unregisterFromEvent) sin `club_id` → threaded `clubId` en función + agregado `AND club_id`; DELETE también verifica ownership via subquery
- `pointsService.ts:87` — `SELECT club_members` en `checkBadgeAchievements` sin `club_id` → agregado `AND club_id = $2`

**Fixes críticos de seguridad (security-review → 4 HIGH + 4 MEDIUM):**
- `authService.ts` — JWT_EXPIRES_IN default: `7d` → `15m` (correcto; refresh tokens manejan sesión)
- `authService.ts` — login de miembros: agregado `AND deleted_at IS NULL AND is_activated = true`
- `middleware/auth.ts` — protect para members: agregado `AND deleted_at IS NULL`
- `membersController.ts` — activationToken ya no se devuelve por API (solo se envía por email)

**Fixes RBAC (/review-rbac → 7 críticos + 8 warnings):**
- `routes/members.ts` — `PATCH /:memberId` ahora `restrictTo('admin', 'manager')`
- `routes/events.ts` — `POST /register` ahora `restrictTo('admin', 'manager')`; attendance: `bartender` → `doorman`
- `routes/vip.ts` — `POST /reservations`, `DELETE /:id`, `PATCH /:id/status` todos con `restrictTo` correcto
- `routes/transactions.ts` — `GET /` y revenue endpoints ahora `restrictTo('admin', 'manager')`; `GET /:id` ahora `restrictTo('admin', 'manager', 'bartender')`
- `routes/incidents.ts` — create/update ahora incluyen `doorman` (conforme a matriz RBAC)

**TypeCheck:** ✅ 0 errores backend y frontend tras todos los cambios

### 2026-05-17 — Sesión: cliente, seguridad registro, migrations, bugs producción

**Creado (flujo de cliente completo):**
- `database/migrations/004_member_activation.sql` — tokens de activación para miembros creados por admin
- `database/migrations/005_email_verification.sql` — verificación de email post-registro
- `backend/src/services/authService.ts` — `verifyMemberEmail`, `resendMemberVerification`, `generateSecureToken`, `TOKEN_TTL`, `refreshAccessToken`
- `frontend/app/register-member/page.tsx` — buscador de club por slug (punto de entrada para nuevos miembros)
- `frontend/app/activate-member/page.tsx` — activación de cuenta por token (para miembros creados por admin)
- `frontend/app/verify-email/page.tsx` — verificación de email con Suspense boundary
- `frontend/app/member/points/page.tsx` — historial del ledger de puntos para el cliente
- `backend/migrations/` — 6 archivos JS para node-pg-migrate (base schema + migraciones 001–005)

**Modificado (seguridad del auto-registro):**
- `frontend/app/club/[slug]/page.tsx` — Cloudflare Turnstile CAPTCHA en form de registro; tras registro muestra "check your email" en vez de redirigir
- `backend/src/services/authService.ts` — verifica token Turnstile antes de crear cuenta; genera `email_verification_token`; paraleliza checks club+email con `Promise.all`
- `backend/src/utils/turnstile.ts` — helper para verificar tokens Turnstile contra Cloudflare API
- `backend/src/routes/auth.ts` — `POST /auth/activate-member`, `POST /auth/verify-email`, `POST /auth/resend-verification`
- `backend/src/controllers/authController.ts` — `activateMemberAccount`, `verifyEmail`, `resendVerificationEmail`
- `frontend/app/member/page.tsx` — banner "Verify your email" cuando `email_verified_at` es null

**Modificado (membersService — flujo admin crea miembro):**
- `membersService.create()` — genera `activation_token` + `activation_expires_at` (7 días), devuelve token al caller
- `membersService.activateAccount()` — valida token, hashea password (via `authService.hashPassword`), activa cuenta
- `membersService.resendActivation()` — genera nuevo token para reenviar
- `frontend/app/admin/members/new/page.tsx` — muestra link de activación copiable tras crear miembro

**Modificado (migration runner — automático):**
- `backend/Dockerfile` — `CMD` ahora ejecuta `npm run migrate && node dist/server.js`
- `backend/package.json` — scripts `migrate`, `migrate:down`, `migrate:status`
- Eliminado `backend/src/utils/migrationRunner.ts` (era custom — reemplazado por node-pg-migrate)

**Bugfixes críticos de producción:**
- `backend/src/routes/clubs.ts` — `is_active` → `status IN ('active','trialing')` (columna no existía, causaba 500 en TODOS los admin pages)
- `frontend/components/Sidebar.tsx` — `<a href>` → `<Link>` de Next.js (hard navigation → SPA navigation; era la causa del redirect loop al navegar entre secciones)
- `frontend/lib/store/authStore.ts` — añadido `_hasHydrated: boolean`; se setea en `onRehydrateStorage`
- `frontend/app/admin/layout.tsx` — espera `_hasHydrated` antes de redirect; elimina flash de login en F5
- `frontend/app/member/layout.tsx` — ídem
- `frontend/app/(auth)/layout.tsx` — ídem

**Code quality (simplify):**
- `authService.ts` — `generateSecureToken` helper, `TOKEN_TTL` constants; `refreshAccessToken` movido a service; lógica `verifyEmail`/`resendVerification` movida a service
- `authController.ts` — eliminados dynamic `import('../config/database')` y `import('crypto')` en hot paths; simplificado `refresh` a 3 líneas usando `authService.refreshAccessToken`
- `membersService.ts` — usa `hashPassword` de authService (respeta `BCRYPT_ROUNDS`); usa `generateSecureToken`; fix multi-tenancy en `resendActivation` (faltaba `AND club_id` en UPDATE)
- `loyaltyService.getHistory` — 3 queries → 1 con window function `COUNT(*) OVER()`
- `turnstile.ts` — dynamic import → static
- `login/page.tsx` — eliminado `generalError` redundante, dead useEffect, comentarios innecesarios
- `activate-member/page.tsx` — usa `checkAuth()` del store en vez de flujo manual

---

## Decisions Made

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-05-16 | Member↔Club 1:N (no N:M) | MVP simple, sin riesgo cross-tenant, fidelidad clara por club |
| 2026-05-16 | Paddle como Merchant of Record para SaaS billing | Sin fricción de tax/VAT global |
| 2026-05-16 | La plataforma NO procesa ventas del club | Foco en CRM/loyalty, no en POS |
| 2026-05-16 | Subdominio (no path-based) para tenant routing | Mejor branding/UX |
| 2026-05-16 | Tenant-safety bugs C1+C2 son Fase 0 obligatoria | Vulnerabilidades reales de cross-tenant |
| 2026-05-17 | Refresh tokens opacos en Redis (no JWT refresh) | Permite invalidación inmediata en logout |
| 2026-05-17 | Roles del club: admin/manager/bartender/doorman/security/staff | Alineado schema DB; eliminados roles ficticios |
| 2026-05-17 | Soft-delete para miembros (deleted_at) | Preserva historial; GDPR-compatible |
| 2026-05-17 | Ledger `points_history` mantenido por trigger DB | Defense-in-depth: balance nunca desincronizado |
| 2026-05-17 | node-pg-migrate como herramienta de migrations | Estándar de industria; elimina runner casero; auto en startup |
| 2026-05-17 | Cloudflare Turnstile para CAPTCHA (no reCAPTCHA) | Gratis, sin Google tracking, sin checkbox molesto |
| 2026-05-17 | Email verification con token 24h, lazy send | Listo para conectar con email provider; hoy se logea el token |
| 2026-05-17 | Admin crea miembro → activation token 7 días | Cliente activa cuenta con password propio; sin password temporal visible |
| 2026-05-17 | `_hasHydrated` en authStore para evitar FOUC | Elimina flash de login en F5 sin bloquear renders |
| 2026-05-20 | JWT access token default: 15m (no 7d) | Tokens de acceso deben ser short-lived; refresh tokens (Redis) manejan persistencia de sesión |
| 2026-05-20 | Login de miembros requiere `is_activated = true` | Sin activación no debe poder autenticarse; alineado con flujo admin-crea-miembro |
| 2026-05-20 | RBAC explícito en todos los endpoints de escritura | Auditoría encontró 7 rutas con writes/deletes sin `restrictTo`; el principio de menor privilegio debe ser explícito |
| 2026-05-20 | Roles canónicos frontend: admin/manager/bartender/doorman/security/staff | Los roles `club_owner`, `club_manager`, `super_admin` nunca existieron en el JWT; layouts tenían código muerto |

---

## Estado real del sistema de puntos

**Cómo se ganan puntos HOY:**

| Evento | Puntos | Configuración |
|---|---|---|
| **Compra (transacción)** | 1 punto por $1 gastado (floor) | Hardcoded. El tier multiplier existe en `pointsService.calculatePointsEarned` pero NO se aplica todavía en `transactionsService` — usa siempre x1 |
| **Check-in (visita)** | 0 — NO se otorgan puntos por visita | La columna `visits.points_earned` existe pero nunca se escribe |
| **Ajuste manual admin** | N puntos (any delta) | `POST /clubs/:id/members/:id/points/credit` — RBAC admin/manager |
| **Refund** | Se restan los puntos ganados en la transacción | Automático via `loyaltyService.debitPoints` |

**Gaps del sistema de puntos (pendientes reales):**
1. **Tier multiplier no se aplica en compras** — `membership_tiers.points_multiplier` (1.00x, 1.50x, 2.00x) existe en DB pero `transactionsService` usa siempre x1. Hay que leer el tier del miembro al procesar la transacción.
2. **Puntos por visita no implementados** — decidir si el club quiere otorgar puntos por check-in (ej: 10 pts por visita). Hoy `visits.points_earned` siempre es 0.
3. **Puntos por eventos/registros** — no implementado.
4. **Tasa configurable por club** — hoy es hardcoded 1 pt/$1. El roadmap dice que debería ser configurable.

---

## Pending

### Fase 0 — CERRADA ✅
*(todos los items cerrados — ver historial)*

### Fase 1 — CERRADA ✅
*(todos los items cerrados — ver historial)*

### Fase 2 — CERRADA ✅
*(todos los items cerrados — ver historial)*

### Fase 3 — CERRADA ✅
*(todos los items cerrados — ver historial)*

### Fase 4 — EN PROGRESO (15%)

**Hecho en Fase 4:**
- [x] Cloudflare Turnstile CAPTCHA en registro de miembros
- [x] Email verification flow (token 24h, página /verify-email, banner en portal)
- [x] Admin crea miembro → activation link con token 7 días
- [x] `/register-member` page (buscador de club)
- [x] `/member/points` page (historial del ledger)
- [x] node-pg-migrate auto en startup Docker

**Pendiente Fase 4:**
- [ ] Email provider real (Resend recomendado) — **requiere decisión del owner**
- [ ] Conectar token de invitación empleado al email (hoy solo visible en UI)
- [ ] Conectar verificación email al email (hoy solo logueado)
- [ ] Guest list: QR único por invitado (`guest_list_entries.qr_token`)
- [ ] Guest list: export CSV
- [ ] Guest list: check-in por scan de QR desde `/admin/door`
- [ ] i18n con `next-intl` — `es.json`, `en.json` mínimo
- [ ] Onboarding wizard (Paso 1-4) — requiere email provider para verificación

**Pendiente (gaps del sistema de puntos — críticos para el negocio):**
- [ ] Aplicar tier multiplier en `transactionsService.create()` al calcular puntos
- [ ] Decidir y configurar puntos por visita (hoy siempre 0)
- [ ] Hacer configurable la tasa base (pts por $1) a nivel de club

### Fase 5 (futuro)
- [ ] VIP tables: mapa visual (grid simple)
- [ ] Reservas con deposit (requiere Paddle/Stripe Checkout)
- [ ] Rol `promoter` — enum + permisos + portal

### Fase 6 (futuro)
- [ ] Dashboard analytics: RevPASH, CLV, cohort retention, heatmap capacidad
- [ ] Segmentación de clientes (segment builder)
- [ ] Campaign builder email/SMS con tracking
- [ ] Webhooks salientes con retry + signature

### Fase 7 (futuro)
- [ ] Paddle integration completa (3 planes, webhooks, feature gates)
- [ ] GDPR: export data, delete account, cookie banner, consent_marketing
- [ ] Postgres RLS en tablas con club_id
- [ ] Sentry (frontend + backend)
- [ ] Backup diario Postgres a S3

### Pendientes técnicos (P3)
- [ ] Aplicar `mapRow` helper a los 13 services que aún usan mappers propios
- [ ] `qrcode.react` bump a v4
- [ ] Reset password flow (endpoint no existe)
- [ ] Settings endpoint `PUT /api/clubs/:clubId/settings`
- [ ] Multi-venue por owner (hoy 1 club por JWT — evaluar Fase 6)
- [x] ~~Verificar `rewardsService.ts` por UPDATE directo en `points_balance`~~ — FIXEADO (2026-05-20): agregado `AND club_id` en WHERE; la migración completa al ledger sigue siendo Fase 3 pendiente
- [ ] Tests de denial RBAC — `backend/src/__tests__/rbac.test.ts` existe pero está vacío; llenarlo con los patrones del `.claude/rules/testing.md`
- [ ] Tests cross-tenant — `backend/src/__tests__/multitenancy.test.ts` existe pero está vacío
- [ ] Validación UUID en `memberId` del body de `registerForEvent` (actualmente cualquier string)
- [ ] `GET /clubs/:clubId/members` — evaluar si doorman/security deben ver lista completa o solo lookup por QR (R8 de rbac.md)

---

## Blockers

**Fase 4 bloqueada en email**: invitaciones de empleados, verificación de email y QR de guest list requieren email provider. **Requiere decisión del owner: Resend vs Postmark vs SendGrid.**

Resto de Fase 4 (QR guest list, export CSV, i18n, tier multiplier) puede empezarse sin email.

---

## Open Questions

1. **Email provider**: Resend (dev-friendly, recomendado), Postmark, SendGrid?
2. **Puntos por visita**: ¿el club quiere otorgar puntos por check-in además de por compra?
3. **Tasa de puntos configurable**: ¿por club (tabla `clubs.settings JSONB`) o hardcoded 1pt/$1?
4. **Tier multiplier**: ¿se aplica desde ya o se deja para Fase 5?
5. **Branding comercial final**: nombre del producto para marketing.
6. **Idiomas MVP**: ¿solo es+en o también pt?
7. **Hosting target**: Vercel + Railway? Vercel + Fly?
8. **Política de minors**: ¿el club valida edad mínima?
9. **Multi-venue por owner**: ¿un owner puede tener N clubes?
10. **Reset password**: ¿hay flow planeado?

---

## Next Recommended Actions

1. **Llenar tests de RBAC y multi-tenancy** — `rbac.test.ts` y `multitenancy.test.ts` existen y están vacíos. Los patrones están documentados en `.claude/rules/testing.md`. Sin tests, los fixes de seguridad de esta sesión no tienen red de seguridad para regresiones.
2. **Decidir email provider** — Resend (recomendado). Desbloquea: activaciones de miembro, verificación de email, invitaciones de empleados y notificaciones de incidentes críticos.
3. **Implementar tier multiplier en transacciones** — 1 query extra en `transactionsService.create()` para leer `membership_tiers.points_multiplier`. ~30 min. El dato ya está en DB.
4. **Guest list QR** — añadir `qr_token` en `guest_list_entries`, generar al añadir invitado, check-in escaneando desde `/admin/door`. No requiere email.
5. **Rebuild Docker** para que entren todos los cambios de esta sesión: `docker-compose up -d --build`.

---

## Historial de fases cerradas

### Fase 0 (objetivo: 1 semana)
- [x] Cerrado el: 2026-05-17
- [x] Tests verde: SÍ — 92/92 passing
- [x] CI activo: SÍ — `.github/workflows/ci.yml`
- Notas: Descubiertos bugs adicionales C5/C7. Roles `club_owner`/`club_manager` en routes eran bug silencioso — nadie podía crear drink specials e incidents.

### Fase 1 (objetivo: 2 semanas)
- [x] Cerrado el: 2026-05-17
- [x] Tests verde: SÍ
- Notas: `mapRow`/`tenantQuery` creados pero no aplicados a todos los services (P3). Refresh tokens opacos en Redis en vez de JWT refresh.

### Fase 2 (objetivo: 2 semanas)
- [x] Cerrado el: 2026-05-17
- [x] Tests verde: SÍ
- Notas: Onboarding wizard diferido a Fase 4 (requiere email provider). Invitación empleados muestra token en UI para dev.

### Fase 3 (objetivo: 2 semanas)
- [x] Cerrado el: 2026-05-17
- [x] Tests verde: SÍ
- Notas: Ledger usa `points_change` (existente en schema). Trigger DB garantiza consistencia. Tier multiplier en DB pero no conectado en transacciones — pendiente Fase 4.

### Fase 4 (objetivo: 3 semanas)
- [ ] Cerrado el: ____
- [ ] Notas: ____

### Fase 5–7
- [ ] Pendientes
