# Rule: Product Domain

> Términos, entidades y reglas de negocio. Si Claude duda sobre cómo nombrar algo o cómo modelar un caso, esta es la fuente de verdad.

## Glosario

| Término | Significado |
|---|---|
| **Club / Tenant** | Unidad de aislamiento. Cada club es un nightclub real. Tabla `clubs`. |
| **Slug** | Identificador URL-friendly del club. Único globalmente. Ej: `the-midnight-lounge`. Genera el subdomain `clubname.app.com`. |
| **Owner** | Dueño del club. `club_users.role = 'admin'`. Paga la suscripción SaaS. |
| **Manager** | Mano derecha del owner. `club_users.role = 'manager'`. |
| **Bartender** | Empleado de barra. `club_users.role = 'bartender'`. Identifica clientes con QR, suma puntos. |
| **Doorman** | Empleado de puerta. `club_users.role = 'doorman'`. Check-in con QR, controla aforo. |
| **Security** | Empleado de seguridad. `club_users.role = 'security'`. Registra incidentes. |
| **Member / Customer** | Cliente del club. Tabla `club_members`. NO tabla `club_users`. Auth distinto. |
| **QR Code ID** | Identificador único del miembro. Formato: `${clubId}-${uuid}`. Se imprime/muestra como QR. |
| **Tier** | Nivel del miembro (Bronze/Silver/Gold/Platinum). Tabla `membership_tiers` configurable por club. |
| **Point** | Unidad de fidelidad. 1 point = $1 gastado típicamente (configurable). Acumulado en ledger. |
| **Points Ledger** | Tabla `points_history`. Inmutable. Cada cambio de puntos es un INSERT. |
| **Visit** | Check-in de un miembro al club. Tabla `visits`. Entry methods: `QR_CODE`, `MANUAL`, `ID_CARD`. |
| **Transaction** | Compra del cliente (registrada en la app, NO procesada). Tabla `transactions`. |
| **Event** | Evento del club (fiesta especial, DJ, etc.). Tabla `events`. |
| **Guest List** | Lista de invitados para un evento. Tabla `guest_lists` + `guest_list_entries`. |
| **VIP Table** | Mesa reservable. Tabla `vip_tables`. Reservas en `vip_reservations` con deposit. |
| **Promoter / PR** | (Fase 5) Empleado externo que trae clientes. Rol `promoter`. Recibe comisión. |
| **Cover charge** | Cargo de entrada al club o evento. Tabla `cover_charges`. |
| **Capacity / Aforo** | Cantidad de personas dentro del club. `clubs.current_occupancy` vs `clubs.max_capacity`. |
| **Capacity snapshot** | Foto del aforo en un momento dado. Tabla `capacity_snapshots`. |
| **Incident** | Incidente de seguridad. Tabla `incidents`. Severity: low/medium/high/critical. |
| **Drink Special** | Promoción de bebida (happy hour, etc.). Tabla `drink_specials`. |
| **Reward** | Beneficio canjeable por puntos. Tabla `rewards`. |
| **Badge** | Achievement del miembro. Tabla `badges` + `member_badges`. |
| **Audit log** | Trail inmutable de acciones sensibles. Tabla `audit_logs`. |
| **Subscription** | Suscripción SaaS del club a la plataforma. Tabla `club_subscriptions`. |

## Reglas de negocio

### RN-01: Multi-tenancy estricto
Un club no puede ver ni modificar datos de otro club. **Ver `.claude/rules/multi-tenancy.md`**.

### RN-02: Member ↔ Club 1:N
Un cliente pertenece a un solo club. Si frecuenta 2 clubes, se registra dos veces (mismo email pero `club_id` distinto).

Por qué no N:M: simplicidad MVP, sin riesgo cross-tenant.

### RN-03: Empleado ↔ Club 1:N
Un empleado trabaja en un solo club. Si trabaja en 2 clubes, tiene 2 cuentas.

### RN-04: QR único por miembro
`club_members.qr_code_id` es `UNIQUE NOT NULL`. Formato: `${clubId}-${uuid()}` para evitar colisiones globales.

### RN-05: Slug único globalmente
`clubs.slug` es `UNIQUE NOT NULL`. Si se intenta registrar con slug tomado, backend agrega sufijo random.

### RN-06: Puntos via ledger
Cualquier cambio de puntos genera INSERT en `points_history`. NUNCA UPDATE directo en `points_balance`. **Ver `.claude/rules/loyalty.md`**.

### RN-07: Audit log en acciones sensibles
Login, register, refund, points change, member CRUD, employee invite, role change, club settings change. **Ver `.claude/rules/security.md`**.

### RN-08: Tier auto-calculado
El `membership_tier_id` del miembro se actualiza según puntos acumulados (umbrales configurables por club). NO asignación manual.

### RN-09: Aforo con bloqueo optimista
Al incrementar `clubs.current_occupancy`, usar `SELECT FOR UPDATE` o transacción serializable para evitar race conditions cuando 2 doormans escanean simultáneamente.

### RN-10: Soft-delete preferido
Miembros, eventos, transacciones: `deleted_at TIMESTAMP NULL`. Visits y transactions del histórico NO se borran (auditoría).

### RN-11: Plan SaaS limita features
Tabla `clubs.features` (JSONB) lista features habilitadas según plan. Middleware `requireFeature('vip_tables')` valida antes de procesar.

### RN-12: Capacidad máxima ≠ vendido
`max_capacity` es el límite físico. Si se llena: rechazar nuevos check-ins (alerta al doorman, no error duro — manager puede override con audit log).

### RN-13: Promoter ve solo su data (Fase 5)
Promoter con role `promoter` ve solo:
- Sus propias guest lists
- Sus comisiones
- Lista de eventos en los que participa
NO ve listas de otros promoters ni listado completo de miembros.

### RN-14: GDPR / Right to be forgotten (Fase 7)
Cliente puede pedir export de su data (ZIP con JSON). Puede pedir delete (soft-delete + anonimización después de retention period). Implementado en Fase 7.

### RN-15: Edad mínima (TBD)
Si el club valida edad mínima (típicamente 18+): el `date_of_birth` del miembro se valida al registrarse. Bloqueo si menor. **Política a confirmar con el owner del proyecto**.

### RN-16: Onboarding del club
Club nuevo: registro → email verify → elige plan (trial 14 días) → configura datos básicos → invita empleados → empieza a usar. Trial expira: solo lectura hasta que pague.

### RN-17: Refund de transacción
Solo `admin` y `manager`. Genera audit log con motivo obligatorio. Si la transacción había sumado puntos, se restan automáticamente (INSERT en ledger con delta negativo).

### RN-18: Incident severity dispara acciones
- `low` / `medium`: solo log.
- `high`: notificación al manager.
- `critical`: notificación inmediata al owner + al manager. Auto-checkout de visitas si aplica.

(Notificaciones reales en Fase 4. Hoy solo log.)

### RN-19: Capacity snapshot periódico
Cron job cada 15 min toma snapshot de `clubs.current_occupancy` en `capacity_snapshots`. Sirve para analytics de cuándo el club está más lleno.

### RN-20: Login member vs login empleado
Endpoints distintos (`/auth/login` para empleados, `/auth/login-member` o flag en mismo endpoint para clientes). Tablas distintas (`club_users` vs `club_members`). JWT incluye `role: 'member'` para clientes.

## Decisiones de producto tomadas

Ver `docs/product/PRODUCT_FOUNDATION.md#decisiones-de-producto-tomadas` para tabla completa.

## Referencias

- Product foundation: `docs/product/PRODUCT_FOUNDATION.md`
- Schema: `database/schema.sql`
- ADRs: `docs/architecture/adr/`
