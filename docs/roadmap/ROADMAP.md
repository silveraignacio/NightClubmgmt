# Roadmap — NightClubmgmt

> Plan de evolución por fases. Cada fase tiene objetivo, tareas, dependencias, entregables, riesgos y criterios de aceptación. Las fases se ejecutan en orden — no saltarse pasos.

---

## Fase 0 — Estabilización y seguridad base (1 semana)

**Objetivo**: dejar el codebase seguro y auditable antes de seguir construyendo features.

### Tareas

1. **Fix tenant-safety bugs verificados**:
   - `backend/src/services/visitsService.ts:108` — agregar `AND club_id = $X` en UPDATE
   - `backend/src/services/transactionsService.ts:405` — agregar `AND club_id = $X` en UPDATE
2. **Suite de tests multi-tenant** (`backend/src/__tests__/multitenancy.test.ts`):
   - Crear 2 clubes en setup
   - Generar JWT con `clubId` del Club A
   - Intentar leer/escribir recursos del Club B en cada endpoint relevante (members, visits, transactions, events, vip, incidents, guest lists, drink specials)
   - Esperar 403/404 en todos
3. **Aplicar `validate(zodSchema)` middleware en routes faltantes**:
   - `routes/clubs.ts`, `drinkSpecials.ts`, `events.ts`, `guestLists.ts`, `incidents.ts`, `metrics.ts`, `rewards.ts`, `vip.ts`
   - Crear schemas en `utils/validators.ts` siguiendo patrón existente
4. **Agregar `auditService.logAction()` en controllers faltantes**:
   - `authController.ts` (login, register, logout)
   - `drinkSpecialsController.ts` (create, update, delete)
   - `incidentsController.ts` (create, resolve)
   - `transactionsController.ts` (refund — CRÍTICO)
5. **CI básico** (`.github/workflows/ci.yml`):
   - Trigger: push + PR a main
   - Jobs: backend (typecheck + test + build), frontend (lint + typecheck + build)
   - Fail si alguno falla
6. **Limpieza docs**:
   - Mover `BUILD_SUCCESS.md`, `IMPLEMENTATION_COMPLETE.md`, `IMPLEMENTATION_SUMMARY.md`, `ESTADO_FINAL.md`, `E2E-TEST-REPORT.md` a `docs/archive/`
   - Consolidar `DEPLOYMENT_GUIDE.md` + `DOCKER_DEPLOYMENT.md` + `DOCKER_QUICKSTART.md` en un solo `docs/DEPLOYMENT.md`
7. **Eliminar dead code**:
   - `frontend/components/QRDisplay.tsx` (el `QRScanner` placeholder) — el real está en `QRScanner.tsx`
   - `backend/src/services/stripeService.ts` — será reemplazado por Paddle
   - Exports no usados en `frontend/components/index.ts`
8. **Health endpoint robusto**: agregar check de DB y Redis a `GET /health`

### Dependencias
Ninguna. Es el punto de partida.

### Entregables
- 0 vulnerabilidades verificadas de cross-tenant
- `multitenancy.test.ts` con suite completa pasando
- CI badge verde en README
- Validación Zod en 100% de routes
- Audit log en 100% de controllers
- Documentación consolidada

### Riesgos
- **Refactor amplio** en services para aplicar tenant-safety puede romper tests existentes → mitigar con commits chicos por service.
- **Falsos positivos en multitenancy tests** si el setup compartido es incorrecto → cada test crea sus propios clubes.

### Criterios de aceptación
- [ ] `npm test` corre verde en backend incluyendo `multitenancy.test.ts`
- [ ] `grep -rn "pool.query.*UPDATE\|pool.query.*DELETE" backend/src/services/` solo muestra queries con `club_id` en WHERE
- [ ] CI corre en cada PR y bloquea merge si falla
- [ ] `docs/archive/` contiene los .md viejos, raíz solo tiene `README.md`, `CLAUDE.md`, `PROJECT_STATUS.md`
- [ ] `GET /health` devuelve `{status:"ok", db:"up", redis:"up"}` o `503` si algo está down

---

## Fase 1 — Multi-tenancy + Auth + RBAC reforzados (1-2 semanas)

**Objetivo**: que sea imposible introducir un cross-tenant data leak incluso con bugs futuros.

### Tareas

1. **Crear agent `tenant-safety-auditor`** (`.claude/agents/tenant-safety-auditor.md`) — ya viene del setup inicial.
2. **Helper `mapRow(row, mapping)` reutilizable** en `backend/src/utils/dbMapper.ts`. Aplicar en 13 services restantes.
3. **Helper `tenantQuery(clubId, sql, params)`** que falla en runtime si el SQL no contiene `club_id` en WHERE (regex check). Aplicar gradualmente.
4. **Matriz RBAC documentada** en `docs/architecture/rbac-matrix.md`. Tabla `Endpoint × Rol` con permitido/denegado.
5. **Tests RBAC** (`backend/src/__tests__/rbac.test.ts`): cada rol intentando acceder a endpoint denegado → 403.
6. **Auditoría JWT**: validar que `clubId` viene del token y nunca del body/query en endpoints multi-tenant.
7. **Refresh tokens** (`POST /api/auth/refresh`): JWT acceso 15min + refresh 7 días. Logout invalida refresh en Redis blacklist.

### Dependencias
Fase 0 completada.

### Entregables
- `dbMapper.ts` + `tenantQuery.ts` en backend utils
- `rbac-matrix.md` doc
- Tests `multitenancy.test.ts` y `rbac.test.ts` cubren todos los endpoints
- Refresh token flow funcional

### Riesgos
- Refactor en todos los services puede tardar más de lo previsto → priorizar services con más tráfico (members, visits, transactions).

### Criterios de aceptación
- [ ] 16/16 services usan `mapRow` helper
- [ ] `rbac-matrix.md` cubre 100% de endpoints
- [ ] Tests RBAC denegan correctamente para cada rol
- [ ] Refresh token + logout invalidation funcionando

---

## Fase 2 — ABM clubes, empleados, clientes completo (2 semanas)

**Objetivo**: que un club owner pueda gestionar el equipo y los clientes end-to-end.

### Tareas

1. **Onboarding wizard de club** (`frontend/app/onboarding/`):
   - Paso 1: datos del club (ya cubierto en register-club)
   - Paso 2: selección de plan (mock por ahora, conecta con Paddle en Fase 7)
   - Paso 3: verificación de email (requiere email provider — adelantar de Fase 4 si necesario)
   - Paso 4: configuración inicial (logo, horario, capacidad)
2. **Tabla `employee_invitations`**:
   ```sql
   CREATE TABLE employee_invitations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     club_id UUID NOT NULL REFERENCES clubs(id),
     email VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL,
     token VARCHAR(255) NOT NULL UNIQUE,
     invited_by UUID NOT NULL REFERENCES club_users(id),
     accepted_at TIMESTAMP,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
3. **Endpoint `POST /api/clubs/:clubId/employees/invite`**:
   - Body: `{email, role}`
   - RBAC: admin/manager only
   - Crea row en `employee_invitations`, envía email con link `{frontend_url}/accept-invite?token=xxx`
4. **Endpoint `POST /api/auth/accept-invitation`**:
   - Body: `{token, password, fullName}`
   - Verifica token válido y no expirado
   - Crea row en `club_users` con `role` de la invitación
   - Marca invitación como `accepted_at`
5. **Frontend: página `/accept-invite`** con form de password
6. **Frontend: página `/admin/employees`** (ABM completo con lista + form invitación)
7. **Endpoint `GET /api/clubs/:clubId/members/search?q=...`** mejorado (full-text search en nombre/email/teléfono)
8. **Endpoint `DELETE /api/clubs/:clubId/members/:id`** con soft-delete (campo `deleted_at`)

### Dependencias
Fase 0, Fase 1. Email provider (puede ser Resend en sandbox).

### Entregables
- Onboarding wizard funcional
- Invitación de empleados por email
- Búsqueda y soft-delete de miembros

### Riesgos
- Sin email provider real, el token de invitación tiene que mostrarse en logs (dev mode) → documentar claramente.
- Aceptar invitación es endpoint público — rate-limitar agresivamente.

### Criterios de aceptación
- [ ] Club owner crea club → ve dashboard → invita doorman → doorman recibe email → activa cuenta → puede login
- [ ] Búsqueda de miembros responde <200ms con 10k+ miembros
- [ ] Soft-delete oculta miembro pero preserva visits/transactions históricos

---

## Fase 3 — Loyalty card + Points Ledger inmutable (1-2 semanas)

**Objetivo**: sistema de puntos auditable y a prueba de fraude.

### Tareas

1. **Migrar a ledger**:
   - `points_history` ya existe; agregar campos si faltan: `delta INTEGER NOT NULL`, `reason TEXT NOT NULL`, `actor_user_id UUID`, `tx_id UUID NULL` (link a `transactions` si aplica)
   - Trigger DB que mantiene `club_members.points_balance` sincronizado con suma del ledger (defense-in-depth)
2. **Service `loyaltyService.ts`**:
   - `creditPoints(clubId, memberId, delta, reason, actorUserId, txId?)` — INSERT en ledger + UPDATE balance
   - `debitPoints(clubId, memberId, delta, reason, actorUserId)` — validación de saldo suficiente
   - `getBalance(clubId, memberId)` — SUM del ledger (autoritativo)
   - `getHistory(clubId, memberId, pagination)` — lista del ledger
3. **Endpoints**:
   - `POST /api/clubs/:clubId/members/:id/points/credit` — RBAC: admin/manager
   - `POST /api/clubs/:clubId/members/:id/points/debit` — RBAC: admin/manager (manual)
   - `GET /api/clubs/:clubId/members/:id/points/history`
4. **Integración con `transactionsController`**: al crear una transacción exitosa, llama `creditPoints` automáticamente (1 punto por $1 base, ajustable por tier).
5. **Tier auto-calculado**: trigger que actualiza `membership_tier_id` cuando `points_balance_lifetime` cruza un umbral configurable por club.
6. **Audit log** en cada credit/debit con motivo y autor.
7. **Frontend `/admin/members/[id]`**: panel de "Ajustar puntos" (admin) con motivo obligatorio.
8. **Frontend `/member`**: historial de puntos visible para el cliente.

### Dependencias
Fase 0 (audit log), Fase 1 (multi-tenancy reforzado).

### Entregables
- Loyalty service + ledger funcional
- Audit completo de cada cambio
- Tier auto-calculado
- Tests integridad ledger ↔ balance

### Riesgos
- **Migración de datos existentes**: si ya hay clubes en prod con `points_balance` no derivado del ledger, generar un "initial credit" en el ledger por cada miembro para alinear. Migration script obligatorio.
- **Race conditions**: usar `SELECT FOR UPDATE` o transacciones serializables al modificar puntos.

### Criterios de aceptación
- [ ] Imposible modificar `points_balance` sin INSERT en `points_history` (test verifica ausencia de `UPDATE club_members SET points_balance` directo en código)
- [ ] `SUM(points_history.delta WHERE member_id = X) === club_members.points_balance` para todos los miembros (test de integridad periódico)
- [ ] Tier sube automático al cruzar umbral
- [ ] Cliente ve su historial completo

---

## Fase 4 — Eventos + Guest list + Check-in + Notificaciones (2-3 semanas)

**Objetivo**: operación de noche completa con notificaciones.

### Tareas

1. **Refinar UX de eventos**: ya hay base, agregar duplicación de evento, plantillas.
2. **Guest list mejorada**:
   - Export CSV
   - QR único por invitado (`guest_list_entries.qr_token`)
   - Check-in con scan de QR en door page
3. **Check-in bulk**: doorman puede marcar múltiples invitados llegados juntos
4. **Email provider integrado** (Resend recomendado):
   - Confirmación de reserva de evento
   - QR de invitado por email
5. **SMS provider integrado** (Twilio):
   - Notificaciones de eventos (opt-in)
6. **i18n** con `next-intl`:
   - `messages/es.json`, `en.json`, `pt.json`
   - Detección por `Accept-Language` + selector manual

### Dependencias
Fase 2 (email provider ya configurado).

### Entregables
- Guest list con QR + export
- Email/SMS funcionales
- i18n 3 idiomas

### Riesgos
- Costos email/SMS pueden explotar — implementar quotas por plan SaaS.

### Criterios de aceptación
- [ ] Club crea evento → genera guest list → invita 50 personas → cada uno recibe email con QR → llegan y check-in es <5s por persona
- [ ] UI funcional en es/en/pt

---

## Fase 5 — Reservas + VIP tables + Promotores (2-3 semanas)

**Objetivo**: monetización adicional vía mesas VIP y red de promotores.

### Tareas

1. **VIP tables UI**: mapa visual de mesas (puede ser grid simple en MVP, drag&drop después)
2. **Reservas con deposit**: integración con Paddle (o Stripe Checkout) para deposit no-reembolsable
3. **Rol `promoter`**: nuevo rol en enum + permisos limitados (solo ve su guest list)
4. **Tracking de comisiones**: tabla `promoter_commissions` ya existe, conectar lógica de cálculo
5. **Promoter portal**: vista limitada del admin (`/admin/promoter`) con su lista, ganancias, link de invitación

### Dependencias
Fase 2 (RBAC reforzado), Fase 4 (notificaciones).

### Entregables
- Sistema VIP funcional con reservas pagadas
- Promotores con su propio espacio
- Comisiones automáticas

### Riesgos
- Calcular comisiones es lógica de negocio sensible (errores = problemas con promoters) — tests exhaustivos.

### Criterios de aceptación
- [ ] Cliente reserva mesa VIP → paga deposit → mesa marcada como reservada → noche del evento, doorman ve reserva
- [ ] Promoter ve su comisión correctamente calculada después de check-ins

---

## Fase 6 — Analytics + Campañas + Integraciones (2-3 semanas)

**Objetivo**: insights y herramientas de marketing para el club.

### Tareas

1. **Dashboard analytics ampliado**:
   - RevPASH (revenue per available seat hour)
   - Customer lifetime value (CLV)
   - Cohort retention
   - Heatmap de capacidad por hora/día
2. **Segmentación de clientes**: builder de segmentos (ej: "miembros gold con 5+ visitas en último mes")
3. **Campañas email/SMS**:
   - Crear campaña → seleccionar segmento → preview → enviar
   - Tracking de open/click/conversion
4. **Webhooks salientes** (`POST /api/clubs/:clubId/webhooks`): para integraciones con sistemas externos (ej: POS del club)

### Dependencias
Fase 4 (email/SMS).

### Entregables
- Analytics avanzado
- Campaign builder
- Webhooks API

### Riesgos
- Performance de queries de analytics: pueden requerir índices, materialized views, o ETL a tabla agregada.

### Criterios de aceptación
- [ ] Dashboard analytics carga <2s con 100k visitas
- [ ] Campaign envía a 5k destinatarios en <5min con tracking funcional
- [ ] Webhook a URL externa con retry y signature

---

## Fase 7 — Hardening + Billing SaaS + Escalabilidad (3 semanas)

**Objetivo**: production-ready con monetización propia.

### Tareas

1. **Paddle integration**:
   - 3 planes en dashboard de Paddle (Starter $49, Pro $149, Business $349/mes)
   - `paddleService.ts` reemplaza el `stripeService.ts` ya eliminado
   - Webhook endpoint `POST /api/webhooks/paddle` con verificación HMAC signature
   - Tabla `subscription_plans` (renombrar/ajustar `club_subscriptions`)
   - Middleware `requireFeature('vip_tables')` que lee `clubs.features` JSONB
2. **GDPR**:
   - Campo `consent_marketing BOOLEAN` en `club_members`
   - Endpoint `POST /api/auth/export-my-data` (devuelve ZIP con JSON de toda la data del cliente)
   - Endpoint `POST /api/auth/delete-my-account` (soft-delete + anonimización después de retention period)
   - Cookie banner en frontend
3. **Postgres RLS** (defense-in-depth):
   - Habilitar RLS en todas las tablas con `club_id`
   - Policy: `USING (club_id = current_setting('app.club_id')::uuid)`
   - Backend setea `SET LOCAL app.club_id = $clubId` al inicio de cada transaction
4. **Sentry / error tracking**:
   - Frontend: `@sentry/nextjs`
   - Backend: `@sentry/node`
   - Source maps en releases
5. **Backups + recovery**:
   - Backup diario de Postgres a S3 (pg_dump)
   - Test de restore en staging mensual
6. **Migration tooling**: adoptar `node-pg-migrate` para tracking de migrations (hoy son SQL manual)

### Dependencias
Todas las fases anteriores.

### Entregables
- Billing funcional (clubes pagan, planes con feature gates)
- GDPR-compliant (export, delete, consent)
- RLS activa
- Sentry capturando errores
- Backups verificados

### Riesgos
- RLS puede romper queries que no setean `app.club_id` correctamente → testing exhaustivo en staging.
- Paddle test mode requiere URLs públicas para webhooks → usar ngrok en dev.

### Criterios de aceptación
- [ ] Club nuevo elige plan → Paddle Checkout → suscribe → features del plan disponibles
- [ ] Cliente pide export → recibe ZIP en <24h
- [ ] Sentry recibe error simulado y notifica al equipo
- [ ] Restore de backup funciona en staging

---

## Cronograma sugerido (best-case)

| Fase | Semanas | Inicio (relativo) | Fin (relativo) |
|---|---|---|---|
| 0 | 1 | semana 1 | semana 1 |
| 1 | 2 | semana 2 | semana 3 |
| 2 | 2 | semana 4 | semana 5 |
| 3 | 2 | semana 6 | semana 7 |
| 4 | 3 | semana 8 | semana 10 |
| 5 | 3 | semana 11 | semana 13 |
| 6 | 3 | semana 14 | semana 16 |
| 7 | 3 | semana 17 | semana 19 |
| **Total** | **19 semanas** | | ~5 meses |

**MVP vendible**: al final de Fase 3 (~7 semanas).
**MVP+**: al final de Fase 4 (~10 semanas).
**Production-ready full**: al final de Fase 7 (~5 meses).

## Cómo navegar este roadmap

- Cada fase tiene su sección en este doc. NO empezar una fase sin terminar las dependencias.
- Al cerrar una fase: actualizar `PROJECT_STATUS.md` con la fecha, criterios de aceptación cumplidos, y abrir la siguiente.
- Si surge una feature urgente fuera del roadmap: discutir si entra como "Fase X.5" o si se prioriza para una próxima fase. No agregar features ad-hoc.
