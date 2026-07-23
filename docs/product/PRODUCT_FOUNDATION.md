# Product Foundation — NightClubmgmt

## Visión

SaaS multi-tenant que unifica las operaciones diarias de un club nocturno en una sola plataforma: registro de clientes con tarjeta de fidelidad y QR, check-in en puerta, gestión de empleados con RBAC, eventos, guest list, mesas VIP, incidentes de seguridad y métricas operativas. Cada club se registra, obtiene su propio espacio con slug único y subdominio (`clubname.app.com`), y paga una suscripción mensual.

**Modelo de negocio**: SaaS B2B con 3 planes (Starter / Pro / Business). El club paga a NightClubmgmt; **la plataforma NO procesa las ventas del club** (no es POS, no procesa pagos de barra/puerta).

## Personas

| Persona | Rol primario | Objetivo principal |
|---|---|---|
| Club Owner | Dueño del club, paga la suscripción | Ver métricas globales, gestionar empleados, configurar el club |
| Club Manager | Mano derecha del owner | Día a día operativo, ABM clientes, eventos |
| Bartender | Empleado de barra | Identificar cliente con QR, sumar puntos por consumo |
| Doorman | Empleado de puerta | Check-in rápido con QR, controlar aforo |
| Security | Empleado de seguridad | Registrar incidentes, ver guest list, controlar capacidad |
| Promoter (futuro Fase 5) | Relaciones públicas externas | Gestionar su guest list, ver comisiones |
| Customer / Member | Cliente del club | Acumular puntos, ver beneficios, presentar QR |

## Tipos de club objetivo

1. **Discoteca grande** (>500 cap.): foco en aforo, guest list, VIP, promotores.
2. **Bar/club mediano** (100-500 cap.): foco en fidelidad, eventos puntuales.
3. **Club de membresía** (cap. limitada): foco en CRM de clientes recurrentes.

**NO objetivo**: restaurantes (foco en reservas de mesa para comer), discotecas masivas con ticketing puro (ej: Tomorrowland).

## Casos de uso principales

### CU-01 — Onboarding de club
Owner registra → genera slug → confirma email → elige plan → configura datos básicos → invita empleados → empleados activan cuenta.

### CU-02 — Registro y fidelidad de cliente
Cliente se registra en el club (presencial o online) → recibe QR único → cada visita y consumo suma puntos → puntos canjean beneficios.

### CU-03 — Noche de operación
Doorman escanea QR de cliente → sistema verifica activo → registra visita → aforo +1.
Bartender escanea QR + cobra consumo (externo) → registra transacción → puntos sumados.
Security registra incidente si pasa algo.

### CU-04 — Evento con guest list
Manager crea evento → genera guest list → promoter (o el propio club) invita N personas → cada invitado recibe email con QR → noche del evento: check-in con QR.

### CU-05 — Reserva VIP
Cliente reserva mesa VIP → paga deposit → noche del evento: doorman confirma reserva.

### CU-06 — Análisis y campaña
Owner ve métricas (revenue, retention, capacity) → identifica segmento (ej: "miembros gold con 5+ visitas") → envía campaña email/SMS → mide conversión.

## Módulos core

| Módulo | Descripción | Fase |
|---|---|---|
| Auth + RBAC | Login, register, JWT, refresh, roles, restrictTo | 1 |
| Clubes | Tenant root, slug, branding, configuración | 0-2 |
| Empleados (`club_users`) | ABM, invitación email, activación, soft-delete | 2 |
| Clientes (`club_members`) | ABM, búsqueda, perfil, QR único | 0-2 |
| Tiers de membresía | Bronze/Silver/Gold/Platinum configurables | 3 |
| Loyalty + Points Ledger | Crédito/débito auditable, balance derivado | 3 |
| Visits | Check-in/out, entry method (QR/manual/guest_list) | 0 |
| Transactions | Compras del cliente, conecta con loyalty | 0 |
| Eventos | Crear, configurar, capacidad, ticket virtual | 4 |
| Guest list | Listas por evento o por promoter, QR por invitado | 4 |
| VIP tables | Mapa de mesas, reservas con deposit | 5 |
| Incidents | Log de incidentes de seguridad por gravedad | 0 |
| Drink specials | Promociones por día/hora/tier | 0 |
| Rewards | Catálogo de beneficios canjeables por puntos | 4 |
| Promoters | Rol + tracking comisiones | 5 |
| Metrics / Analytics | Dashboards y reportes | 4-6 |
| Notifications | Email + SMS + push (FCM) | 4 |
| Campaigns | Builder de segmentos + envío masivo | 6 |
| Audit log | Trail inmutable de acciones sensibles | 0-1 |
| Billing SaaS | Paddle, planes, feature gates | 7 |
| GDPR | Consent, export, delete | 7 |

## Flujos principales

### Flujo Onboarding Club
```
Landing público → /register-club → form (clubName, slug, email, password)
  → POST /api/auth/register/club
  → Backend crea club + admin user
  → JWT devuelto, redirect a /admin
  → (Fase 2+) wizard: plan, branding, primer empleado
  → (Fase 7) integra Paddle subscription
```

### Flujo Check-in en puerta
```
Doorman en /admin/door (logueado con role=doorman)
  → Click "Start Camera" → QRScanner activo
  → Apunta a QR del cliente → jsQR decodifica → POST /api/clubs/:clubId/members/by-qr/:qrCodeId
  → Recibe member info → muestra nombre + tier + puntos
  → Click "Confirm Entry" → POST /api/clubs/:clubId/visits
  → Backend: registra visita, incrementa club.current_occupancy
  → UI muestra ✅ + actualiza aforo en vivo
```

### Flujo Loyalty (Fase 3)
```
Bartender en /admin/bar
  → Escanea QR del cliente → muestra perfil
  → Selecciona items del menú → calcula total
  → Click "Process Payment" → POST /api/clubs/:clubId/transactions
  → Backend:
      1. INSERT INTO transactions (...)
      2. (loyaltyService.credit) INSERT INTO points_history (delta=+N, reason='Purchase #...')
      3. UPDATE club_members.points_balance (= SUM del ledger, mantenido por trigger)
      4. auditService.logAction('points_credited', ...)
  → Cliente ve nuevos puntos en su /member
```

## Entidades de negocio (modelo conceptual)

```
Club (tenant)
 ├── tiene → Empleados (ClubUser) con Rol
 ├── tiene → Clientes (ClubMember) con QR único + Tier
 │           ├── acumula → Puntos (vía PointsLedger)
 │           ├── visita → Visit (entry_method, timestamp)
 │           ├── compra → Transaction (amount, payment_method)
 │           ├── canjea → Reward → RedeemedReward
 │           └── gana → Badge → MemberBadge
 ├── organiza → Event (date, capacity)
 │           ├── tiene → GuestList → GuestListEntry (con QR)
 │           ├── tiene → EventRegistration
 │           └── tiene → VipReservation → VipTable
 ├── registra → Incident (severity, type)
 ├── ofrece → DrinkSpecial (day_of_week, time, discount)
 ├── paga → ClubSubscription (plan, status, next_billing)
 └── genera → AuditLog (action, actor, metadata)
```

## Glosario

| Término | Definición |
|---|---|
| **Club / Tenant** | Unidad de aislamiento. Cada club tiene un `club_id` único. Toda data se filtra por `club_id`. |
| **Slug** | Identificador URL-friendly del club, único globalmente. Ej: `the-midnight-lounge`. Resuelve a un `clubId` via `/api/clubs/by-slug/:slug`. |
| **Member** | Cliente del club. Tabla `club_members`. Tiene `qr_code_id` único de formato `${clubId}-${uuid}`. |
| **Tier** | Nivel de membresía (Bronze, Silver, Gold, Platinum). Configurable por club en tabla `membership_tiers`. |
| **Point** | Unidad de fidelidad. 1 punto típicamente = $1 gastado (configurable). Se acumula en ledger. |
| **Points Ledger** | Tabla `points_history` que registra cada cambio de puntos (delta + reason + actor). El balance es derivado. |
| **Visit** | Registro de un check-in. Tabla `visits`. Tiene `entry_method` (QR_CODE, MANUAL, ID_CARD). |
| **Entry method** | Cómo se hizo el check-in: QR_CODE, MANUAL, ID_CARD. |
| **Guest List** | Lista de invitados para un evento. Tabla `guest_lists` + `guest_list_entries`. Cada invitado tiene su propio QR. |
| **VIP Table** | Mesa reservable. Tabla `vip_tables` + `vip_reservations` con deposit. |
| **Promoter** | Empleado externo (relaciones públicas) que trae clientes. Rol `promoter`. Recibe comisión via `promoter_commissions`. |
| **Cover charge** | Cargo de entrada al club o evento. Tabla `cover_charges`. |
| **Capacity snapshot** | Foto del aforo en un momento dado. Tabla `capacity_snapshots`. |
| **Audit log** | Trail inmutable de acciones sensibles. Tabla `audit_logs`. Insertado por `auditService`. |
| **RBAC** | Role-Based Access Control. Roles definidos: admin, manager, bartender, doorman, staff, security. |
| **Tenant-safety** | Garantía de que un club no puede leer/modificar data de otro club. Enforced via middleware + filtros en queries. |

## Reglas de negocio iniciales

> Reescritas tras decisión de **Member↔Club 1:N** (cliente pertenece a UN solo club).

1. La plataforma es **multi-tenant desde la base**. Cada club es un tenant aislado.
2. Cada club tiene un **slug único globalmente**, generado al registro (puede personalizarse).
3. El slug **resuelve a un `clubId`**; el slug no es la fuente de seguridad. El `clubId` viene del JWT en cada request.
4. Un empleado (`club_users.role`) pertenece a **un solo club**. Si trabaja en 2 clubes, tiene 2 cuentas.
5. Los permisos son **siempre por club**, validados por `clubId` del JWT vs `clubId` de la URL.
6. Un cliente (`club_members`) pertenece a **un solo club**. Si frecuenta 2 clubes, se registra dos veces con el mismo email pero distintos `club_id`. Los puntos y tier son por club.
7. Los puntos de fidelidad se modifican **exclusivamente** vía el ledger (`points_history`). El `points_balance` es derivado.
8. Cualquier cambio manual de puntos requiere **motivo (texto), actor (user_id), fecha** y queda en audit log.
9. Acciones sensibles (login, register, refund, points change, member CRUD, employee invite, role change, club settings change) generan row en `audit_logs`.
10. No debe existir **acceso cruzado** entre clubes. Tests automatizados validan esto.
11. Check-in debe ser **<5 segundos** por cliente (UX optimizada para uso real con dispositivo móvil).
12. El sistema soporta crecimiento hacia eventos, guest list, VIP, promotores y campañas — pero MVP es el mínimo vendible.
13. **PII de clientes es prioridad**: no se loggea, no se expone en errores, se respeta GDPR (Fase 7).
14. **MVP simple pero arquitectura escalable**: ninguna decisión hipoteca el futuro.

## MVP scope

### MVP Core (Fase 0-3 del roadmap)
- ✅ Registro/login (existe)
- ✅ Creación de club con slug único (existe)
- ✅ Subdomain routing (existe)
- ✅ Dashboard básico (existe)
- 🟡 ABM empleados con invitación por email (Fase 2)
- ✅ Roles MVP: admin, manager, doorman, bartender, security (existen, falta auditoría)
- ✅ ABM clientes (existe)
- ✅ Tarjeta de fidelidad con QR único (existe)
- 🔴 **Puntos via ledger** (Fase 3)
- 🔴 **Historial auditable** (Fase 3)
- ✅ Búsqueda de clientes (existe)
- 🟡 Audit log completo (Fase 0)
- 🟡 Configuración básica del club (Fase 2)
- ✅ QR scanner real (existe, jsQR)
- 🔴 Smoke test cross-tenant (Fase 0)

### MVP+ (Fase 4)
- ✅ Eventos (existe, refinar)
- ✅ Guest list (existe, agregar export CSV + QR)
- ✅ Check-in QR (existe)
- 🟡 Segmentación básica (Fase 6)
- 🟡 Beneficios/cupones (Fase 4)
- ✅ Métricas básicas (existe)
- 🟡 Email/SMS notifications (Fase 4)
- 🟡 i18n (Fase 4)

### Out of MVP (post-MVP+)
- VIP tables con mapa visual (Fase 5)
- Ticketing
- POS integration
- Pagos en barra (queda explícitamente fuera del scope del producto)
- Promotores con comisiones (Fase 5)
- Campañas email/SMS/WhatsApp masivas (Fase 6)
- Mobile app nativa
- Analytics avanzadas
- Multi-venue por owner
- Multi-currency
- White-label completo

## Decisiones de producto tomadas

| # | Decisión | Razón | Fecha |
|---|---|---|---|
| 1 | Member↔Club 1:N (no N:M) | MVP simple, sin riesgo cross-tenant, fidelidad clara por club | 2026-05-16 |
| 2 | Paddle como Merchant of Record | Sin fricción de tax/VAT global, ideal para multi-país | 2026-05-16 |
| 3 | La app NO procesa ventas del club | Foco en CRM/loyalty/operación, no en POS | 2026-05-16 |
| 4 | Subdominio (no path-based) | Más profesional, mejor branding | 2026-05-16 |
| 5 | Sin ORM (queries SQL directas) | Control total, menos magia, menor learning curve | (heredado) |
| 6 | Multi-idioma desde Fase 4 | Mercado global desde temprano | 2026-05-16 |
| 7 | Ledger inmutable para puntos | Auditabilidad obligatoria | 2026-05-16 |
| 8 | Built-in agents Claude + 3 custom | Optimizar tokens, no duplicar lo existente | 2026-05-16 |

## Riesgos de producto

- **Mercado saturado** en US (SevenRooms, Toast, Lightspeed). Mitigación: foco en mid-market + LATAM/global + multi-idioma + sub-$100 tier.
- **Adopción**: clubes nocturnos son industria conservadora con margen ajustado. Necesitan demo en vivo + integración con su flujo actual.
- **Costo de SMS/email**: en campañas masivas puede explotar margen. Quotas por plan.
- **Compliance** (GDPR, datos de menores): Fase 7 critical antes de UE.
