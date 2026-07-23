# Backlog — NightClubmgmt

Roadmap de producto post-MVP, priorizado. Este documento se actualiza a medida que se
cierran items. Ver `ANALISIS_PROYECTO.md` para el análisis técnico original y el hilo de
review de la sesión actual para el contexto de negocio (competencia, posicionamiento).

## Contexto de negocio (resumen)

Competidores principales: **SevenRooms** y **TablelistPro** (reservas VIP / bottle
service / floor plans, mercado premium, precio alto), **Ticket Fairy** (ticketing +
escaneo QR offline), **Patronscan / IDScan.net** (verificación de ID/edad + ban list),
**Bikubo** (tickets + tarjetas de socio, mercado hispano).

Posicionamiento propuesto: SaaS todo-en-uno **accesible** (mid-market), con
**afiliación/membresías + lealtad** como núcleo diferencial (los líderes premium no
enfatizan esto), apuntando a EE.UU. y mercado hispanohablante. Los diferenciadores de
mayor impacto que hoy faltan: mapa de mesas/reservas, escaneo QR offline, y
verificación de ID/ban list.

---

## P0 — Hacer que el MVP funcione (demo-ready) — COMPLETADO

- [x] Unificar clave de token de auth (frontend `lib/api.ts` vs `authStore`) — `api.ts`
      ahora lee el token desde el store en vez de una clave de localStorage distinta;
      se eliminó `lib/auth.ts` (capa de auth muerta y divergente, no usada por ninguna página)
- [x] Reconciliar contrato de API (envelope, snake_case↔camelCase, paginación) en
      `lib/members.ts`, `lib/visits.ts`, `lib/transactions.ts` — se agregaron mappers
      explícitos backend→frontend en cada lib
- [x] Alinear rutas/métodos/bodies del frontend con el backend real (paths, PATCH vs PUT,
      bodies de creación de visitas/transacciones acordes a los validators de Zod)
- [x] Escaneo QR real en puerta (`jsqr` + `<canvas>` + `requestAnimationFrame`) + endpoint
      backend nuevo `GET /clubs/:clubId/members/by-qr/:qrCodeId`
- [x] Endpoint nuevo `GET /clubs/:clubId/membership-tiers` (antes no existía ninguna forma
      de listar/asignar tiers reales desde el frontend — alta de socios ahora asigna un
      tier real en vez de un campo que el backend ignoraba)
- [x] Alinear vocabulario de roles frontend/backend (admin/manager/doorman/bartender/member)
      — `admin/layout.tsx` tenía roles inventados (`club_owner`, `security`, `staff`, `host`)
      que nunca calzaban con lo que el backend emite; doorman/bartender quedaban con sidebar vacío
- [x] Conectar dashboard admin a métricas reales (antes hardcodeado a 0) vía
      `GET /clubs/:clubId/metrics/members`; se quitaron tendencias (+12%, +8%) fabricadas
      sin datos reales detrás
- [x] Corregido bug de doble descuento en Bar/POS: el frontend enviaba el total
      ya descontado y el backend volvía a aplicar el descuento del tier sobre ese monto
- [x] Script de seed de datos demo (`backend/src/scripts/seedDemo.ts`, `npm run seed`) — club +
      admin/doorman/bartender + 4 tiers + 4 socios con QR y puntos/visitas de ejemplo
- [x] **2 bugs preexistentes en el backend descubiertos durante la verificación end-to-end**
      (no introducidos por este trabajo, pero bloqueaban el camino crítico igual):
      - `getAllMembers` ordenaba por `cm.created_at`, columna inexistente en `club_members`
        (la tabla tiene `registration_date`) → el listado de socios devolvía error 500 siempre.
      - `validateQRCode` partía el `qrCodeId` por `-` para extraer el `clubId`, pero los UUIDs
        mismos contienen guiones, así que la comparación nunca coincidía → **toda** creación de
        visitas y transacciones fallaba con "QR code does not belong to this club", en
        cualquier club.
- [x] Fuga de seguridad corregida: `members`/`by-qr` devolvían `password_hash` (bcrypt) al
      frontend porque las queries usaban `cm.*`; ahora seleccionan columnas explícitas
- [x] Verificado end-to-end contra Postgres/Redis reales vía llamadas API directas: login →
      listado de socios → tiers → lookup por QR → alta de visita → conteo del día → alta de
      transacción con descuento de tier aplicado correctamente → ingresos del día → métricas
      de socios. Build de producción limpio en frontend (`next build`) y backend (`tsc`).
      **Pendiente**: verificación visual en navegador — bloqueada en esta sesión por un
      mismatch de versión de binarios de Playwright en el entorno (no relacionado al código).

## P1 — Cerrar el SaaS (monetización y gestión)

- [ ] Conectar Stripe (billing de clubes): montar rutas/webhook para `stripeService.ts`
      (ya escrito, hoy huérfano); enforcement de `features`/`max_members` por plan
- [ ] API de escritura para `membership_tiers` (crear/editar niveles de afiliación) —
      ya existe un `GET` de solo lectura (P0), falta create/update/delete
- [ ] API de rewards/redemption real (hoy el portal usa mocks) + `redeemed_rewards`
- [ ] Pantallas de analítica que consuman `routes/metrics.ts` (hoy sin UI)
- [ ] Refresh tokens (frontend ya espera el campo, backend no lo emite)
- [ ] Exportación real de socios a CSV (hoy botón sin funcionalidad)

## P2 — Diferenciadores competitivos

- [ ] **Diseñador de mapas de mesas (floor plan) + reservas de mesa/bottle service**
      — feature nueva, no existe hoy ni en schema ni en backend/frontend. Núcleo de la
      propuesta de valor frente a SevenRooms/TablelistPro. Alcance sugerido:
      - Modelo de datos: `tables` (club_id, name/number, capacity, min_spend, x/y/shape
        en el canvas, zona), `table_reservations` (table_id, member_id o guest info,
        fecha/hora, party_size, status: pending/confirmed/seated/cancelled/no_show,
        deposit/min_spend_met)
      - Editor visual (admin): canvas drag-and-drop para diseñar el layout del salón
        (arrastrar mesas, formas, zonas VIP) — candidato: `react-flow`, `konva`/
        `react-konva`, o SVG+dnd propio
      - Vista operativa (noche del evento): estado de mesas en tiempo real (libre/
        reservada/ocupada), asignación rápida, timeline de reservas del día
      - Flujo de reserva: desde admin (host) y opcionalmente desde portal del socio
      - Notificar/confirmar con el socio (reusa `notificationService` cuando esté vivo)
- [ ] Modo offline en puerta (queue de escaneos + sync al reconectar, PWA/service worker)
- [ ] Verificación de ID/edad + ban list ("lista 86") en puerta, con registro de incidentes
- [ ] Eventos + guest lists (el schema tiene `events`/`event_registrations`, sin API)
- [ ] Promociones gestionables (tabla `promotions` sin API de creación)
- [ ] Notificaciones push reales (Firebase, hoy solo `// TODO` con insert en DB)

## P3 — Calidad y solidez

- [ ] Subir cobertura de tests (hoy 2/10: 4 unit tests + smoke E2E que no detectan
      bugs de integración) — priorizar tests de contrato API y del motor de puntos
- [ ] Enforcement de `permissions` JSONB en `club_users` (hoy definido, no usado)
- [ ] Revisar manejo de miembros desactivados (no bloqueados en `protect` para `member`)
- [ ] Seguir auditando código muerto/funciones de lib que llamen endpoints inexistentes
      a medida que se agreguen features (ya se limpió `frontend/lib/auth.ts` en P0)
- [ ] Multi-venue / múltiples salas por club (si el negocio lo requiere)

---

_Última actualización: ver historial de git de este archivo._
