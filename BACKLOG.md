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

## P0.5 — Review con Opus 4.8 como advisor (post-merge del fix de contrato) — COMPLETADO

Review crítico del estado actual del código tras el merge del PR #2. Ver hilo de la sesión
para el detalle completo de cada hallazgo. Un segundo pase con el subagente `code-reviewer`
sobre los cambios de este P0.5 encontró y se corrigieron 2 items adicionales: el mensaje de
error de "cambiar contraseña" mostraba el genérico de axios en vez del mensaje real del
backend (ej. "Current password is incorrect"), y la exportación de socios a CSV no
neutralizaba fórmulas (`=HYPERLINK(...)` en un nombre ejecutaría al abrir en Excel/Sheets).

### Crítico (seguridad)
- [x] **C1. Control de acceso roto en socios** — `backend/src/routes/members.ts`: solo
      `createMember`/`deleteMember` tienen `restrictTo`. `GET members`, `GET by-qr`,
      `PATCH members/:id`, `qr-code`, `stats` no tienen restricción de rol → cualquier
      socio logueado puede listar/editar datos de **todos** los demás socios de su club
      (nombre, email, teléfono, fecha de nacimiento, gastos). Horizontal-privilege gap real.
- [x] **C2. `qrService.getMemberByQR` filtra `password_hash`** — código muerto (sin uso hoy)
      que hace `SELECT cm.*`; bomba de tiempo para el próximo que lo conecte. Borrar o
      acotar columnas.

### Advertencias
- [x] **W1.** `/forbidden` no existe — `lib/api.ts` redirige ahí en 403, termina en 404 de Next.
- [x] **W2.** Enlaces muertos en la nav: `/admin/analytics/visits`, `/admin/analytics/revenue`
      (backend ya tiene los datos, falta pantalla), `/admin/settings`, `/profile`
      (navbar `onProfileClick`, debería ir a `/member/profile`), `/admin/members/[id]`,
      `/admin/members/[id]/edit`.
- [x] **W3.** Filtro de Tier/Status en socios es solo client-side sobre la página ya traída
      (el backend no acepta esos params) → paginación/total quedan inconsistentes con el
      filtro aplicado. Status ni está conectado (todos "ACTIVE" hardcodeado).
- [x] **W4.** Botones/acciones que fingen funcionar: cambio de contraseña (portal socio,
      no hay endpoint), canje de recompensas (100% mock), toggles de notificaciones
      (solo local, el backend sí acepta `notifications_enabled`/`sms_enabled`), edición de
      fecha de nacimiento (se pierde silenciosamente al guardar perfil), exportar socios
      a CSV (`console.log`), borrar socio (`console.log`, el endpoint backend ya existe).
- [x] **W5.** Bar POS calcula descuento/puntos con una tabla de tiers hardcodeada en el
      frontend en vez de usar la data real de `membership_tiers` (`getMembershipTiers` ya
      existe) — se desincroniza con cualquier tier custom o distinto a los 4 nombres literales.
- [x] **W6.** JWT secret inconsistente: `authService.ts` firma con fallback hardcodeado
      (`'your-secret-key'`) si falta `JWT_SECRET`, pero `middleware/auth.ts` rechaza verificar
      sin la env var → login "funciona" pero todo pedido posterior tira 500. Sacar el fallback,
      fallar rápido al arrancar si falta la env var.

### Sugerencias (menores)
- [x] **S1.** Comentario aclaratorio en `qrService.ts`: el parseo de `clubId` por longitud de
      UUID es solo un atajo de error amigable, el aislamiento real lo da el `WHERE club_id = $2`.
- [x] **S2.** `middleware/auth.ts`: `optionalAuth` confía en el JWT sin verificar existencia
      del usuario (a diferencia de `protect`). Sin uso hoy — borrar o alinear antes de conectarlo.
- [x] **S3.** Paginación de transacciones es una aproximación (`transactions.ts`) porque el
      backend no devuelve conteo total, solo `totalAmount` — agregar `COUNT(*)` al endpoint.
- [x] **S4.** `server.ts` loguea con `console.log` detalles de `DATABASE_URL`/health en cada
      request — pasar a `logger.debug`.
- [x] **S5.** Bar POS etiqueta cualquier canasta mixta bebida+comida como `drink_sale`
      (`every(...=== 'Food')`) — sesga la analítica por categoría a futuro.

### Agregar a continuación (barato, alto impacto, sin Stripe)
- [x] Conectar lo ya construido antes de sumar features nuevas: borrar socio, ver/editar
      socio, pantallas de analítica, persistencia de preferencias de notificación.
- [x] Endpoint real de canje de puntos (`rewards`/`redeemed_rewards` ya están en el schema,
      falta API) — cierra el loop del diferenciador de lealtad.
- [x] Auto-seedear tiers Bronze/Silver/Gold/Platinum al registrar un club nuevo — hoy un
      club recién creado queda vacío y varias pantallas se ven rotas hasta cargar datos a mano.
- [x] Filtros de socios server-side (tier/status/búsqueda) — prerequisito real para que el
      filtro de W3 y la exportación a CSV tengan sentido.
- [x] DX: script único de bootstrap (migrar + seed + levantar ambos servidores) documentado
      en el README, con las credenciales de `seedDemo.ts`.

## P1 — Cerrar el SaaS (monetización y gestión)

- [ ] **[ALTA PRIORIDAD] Emails transaccionales con Resend: verificación de email +
      reset de contraseña.** Hoy no existe ninguno de los dos flujos — un club/socio que
      se registra con un email inválido o que olvida la contraseña no tiene salida.
      Proveedor: **Resend** (decisión tomada). Alcance sugerido:
      - `RESEND_API_KEY` en `.env`/`.env.example`, cliente Resend en un
        `emailService.ts` nuevo (o adaptar `notificationService.ts`, hoy sin envío real)
      - Verificación de email: token firmado o UUID con expiración, columna
        `email_verified_at` (o similar) en `club_users`/`club_members`, endpoint
        `POST /auth/verify-email` + `POST /auth/resend-verification`, email disparado
        al registrar (club owner y member)
      - Reset de contraseña: `POST /auth/forgot-password` (rate-limited,
        `passwordResetLimiter` ya contemplado en `.claude/rules/security.md`) +
        `POST /auth/reset-password`, token de un solo uso con expiración corta
      - Ya hay una implementación de referencia (email verification + forgot/reset
        password, incluyendo `passwordResetService.ts`) en la branch
        `backup/local-work-pre-origin-main` — evaluar adaptarla en vez de escribir
        de cero, pero cambiando el proveedor de email a Resend
      - Auditar ambos flujos (`REGISTRATION`/login-related events) por
        `.claude/rules/security.md` — audit log obligatorio
- [ ] Conectar Stripe (billing de clubes): montar rutas/webhook para `stripeService.ts`
      (ya escrito, hoy huérfano); enforcement de `features`/`max_members` por plan — **no
      prioritario ahora mismo** (decisión explícita del owner del producto)
- [ ] API de escritura para `membership_tiers` (crear/editar niveles de afiliación) —
      ya existe un `GET` de solo lectura (P0), falta create/update/delete
- [ ] Refresh tokens (frontend ya espera el campo, backend no lo emite)
- [ ] (rewards/redemption, pantallas de analítica y export CSV — ver P0.5, ya en curso)

## P0.7 — Review de advisor (Opus 4.8), 2026-07-23: "conectar lo que ya existe"

Segunda ronda de review externo (mismo patrón que P0.5), enfocada en gaps de
funcionalidad/UX más allá de lo que ya estaba anotado en el roadmap. Hallazgo
de método: varios controllers/services (`events`, `guestList`, `vip`,
`incidents`, `drinkSpecials`) que una sesión de research anterior daba por
"existentes pero no montados" en realidad **no existían en el código fuente
de `main`** — solo en artifacts de build viejos (`backend/dist`, `backend/
coverage`, ya borrados) y en la branch de respaldo `backup/local-work-pre-
origin-main`. Se están construyendo de cero, adaptados a la arquitectura de
`main`, uno por uno.

- [x] **Incidents (seguridad)** — antes: rol `security` se logueaba y veía un
      sidebar vacío, sin backend ni frontend. Ahora: tabla `incidents`,
      `incidentsService`/`incidentsController`, rutas montadas
      (`GET/POST /clubs/:clubId/incidents`, `/tonight`, `/stats`,
      `PUT /:id`, `POST /:id/resolve` — RBAC admin/manager/security según
      `docs/architecture/rbac-matrix.md`), página `/admin/security` (reportar
      +listar+resolver), nav item para admin/manager/security. `UserRole` del
      frontend no tenía `security`/`staff` — corregido.
- [ ] **Embudo de alta de socios roto de punta a punta** (CRÍTICO) —
      `createMember` (alta por admin) inserta el socio sin `password_hash`:
      nunca puede loguearse al portal. Auto-registro (`POST /auth/register/
      member`) necesita `clubId` pero no hay landing pública del club
      (`club/[slug]`) ni página `register-member` desde donde llegar. Todo el
      portal member (QR, puntos, rewards) está construido pero inalcanzable
      para un cliente real.
- [ ] **El admin no puede gestionar lo que el socio consume** — sin UI para
      cargar el catálogo de rewards, sin endpoint/UI de ajuste manual de
      puntos (cortesías, correcciones) — viola `.claude/rules/loyalty.md` R7,
      que exige ese endpoint auditado.
- [ ] **Portal member con datos mockeados hardcodeados** (`member/page.tsx`):
      "Next Reward: Free Drink $12" fijo, mes hardcodeado, progreso de tier
      con metas inventadas en vez de leer `membership_tiers` real.
- [ ] **Landing con riesgo reputacional/legal** (`app/page.tsx`): stats
      inventados (500+ clubs, 100K+ members), botones "Watch Demo"/"Schedule
      Demo" apuntan a un Rickroll de YouTube, dice "Stripe" cuando la
      decisión de producto es Paddle, nombres de plan que no coinciden con
      pricing real, claims de features inexistentes ("offline", "fraud
      detection"), links de footer rotos (`/about`, `/blog`).
- [ ] **Rol `staff` sin destino** — igual que `security` antes del fix de
      arriba: se loguea y no tiene nav items ni endpoints propios más allá de
      lectura genérica.
- [ ] **Sin onboarding tras crear el club** — dashboard vacío en el minuto 1
      del trial, sin wizard guiado (logo, capacidad, invitar primer doorman,
      dar de alta primer socio).
- [ ] **Fricciones de sesión/logs** — `console.log` con emojis que imprimen
      email/fragmentos de token/user completo (viola `security.md` R8 PII y
      R9), sin refresh token real (JWT de 7 días, expira y patea a `/login`
      en medio de la operación), CORS `*` en dev, health check no chequea
      Redis de verdad pese a reportarlo `connected`.

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
- [ ] Verificación de ID/edad + ban list ("lista 86") en puerta — el registro de
      incidentes en sí ya existe (ver P0.7), falta la verificación de ID/ban list
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
