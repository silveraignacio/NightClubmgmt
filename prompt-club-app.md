# PROMPT PARA CLAUDE - Club Nocturno App (SaaS Web)

## USAR ESTE PROMPT CON CLAUDE

Copia y pega en Claude.ai o en Claude con este archivo como referencia.

---

```
Quiero que generes el código COMPLETO para un SaaS web de "Club Nocturno App" - 
una plataforma para gestionar memberships, puntos, descuentos y entradas en clubs nocturnos y bares.

ESPECIFICACIÓN: Lee el archivo 'club-nocturno-saas.md' que incluyo. Contiene todo lo que necesitas.

RESUMEN:
- Club crea cuenta (membresía SaaS mensual: $49/$149/$349)
- Clientes se registran en membresía (gratis o pago) y obtienen QR único
- Portero usa tablet para escanear QR de clientes al entrar
- Bartender usa tablet para escanear QR de cliente al comprar (aplica descuentos automáticos, suma puntos)
- Admin ve dashboard con KPIs (visitas, ingresos, puntos canjeados, etc)
- Clientes ven app web: puntos, descuentos, eventos, notificaciones

REQUIERO:

A) FRONTEND - 5 APPS SEPARADAS (Next.js 14):

  1. APP CLIENTE (app.clubnightlife.com)
     - Landing page
     - Login/Registro (email, nombre, teléfono)
     - Dashboard: QR grande, puntos, tier membership, próximas recompensas
     - Eventos: calendario, registro, detalles
     - Promociones: lista, códigos, historial
     - Perfil: editar info, historial visitas
     - Notificaciones: centro de notifs
     - Leaderboard: top 10 de semana/mes

  2. ADMIN DASHBOARD (admin.clubnightlife.com)
     - Login para gerentes del club
     - Overview: 4-6 cards KPIs principales (visitas hoy, ingresos, miembros activos, etc)
     - Members: tabla con búsqueda, editar, ver detalles
     - Events: crear, editar, ver asistencia
     - Promotions: crear (% discount, free item, double points), activas, histórico
     - Rewards: crear recompensas (ej: free drink), ver redenciones
     - Transactions: historial completo de compras
     - Analytics: gráficos (visitas/día, spending, retention)
     - Staff: agregar porteros/bartenders
     - Settings: plan, facturas, configuración general

  3. PORTERO APP (door.clubnightlife.com) - TABLET HORIZONTAL
     - Login simple (email + password)
     - Botón grande "ESCANEAR QR"
     - Al escanear:
       * Muestra nombre, foto, tier membership (con color)
       * "ENTRADA CONFIRMADA" botón grande
       * Muestra últimas 10 entradas registradas
     - Desconexión

  4. BARRA APP (bar.clubnightlife.com) - TABLET HORIZONTAL
     - Login
     - Menu de items: categorías (beers, cocktails, shots, food, otros)
     - Cada item con precio
     - Botón "ESCANEAR CLIENTE"
     - Al escanear:
       * Muestra cliente (nombre, tier, foto)
       * Seleccionar item + cantidad
       * Muestra: precio original, descuento aplicado (por tier), precio final, puntos a ganar
       * Botón "COBRAR [cantidad]"
       * Opción pago: Efectivo / Tarjeta (Stripe QR) / Puntos
       * Confirmación
       * Notificación al cliente (push)
     - Historial de transacciones del turno

  5. PUBLLIC LANDING (clubnightlife.com)
     - Hero: "Membresía digital para tu club"
     - Features: QR, puntos, eventos, notificaciones
     - Pricing: Básico, Pro, Premium
     - FAQ
     - CTA: "Prueba gratis 14 días"

B) BACKEND (Node.js + Express):

  ESTRUCTURA:
  - src/
    * config/
      - database.ts
      - stripe.ts
      - jwt.ts
    * middleware/
      - auth.ts (JWT)
      - tenantMiddleware.ts (multi-tenant)
      - rateLimiter.ts
    * routes/
      - auth.ts
      - clubs.ts
      - members.ts
      - visits.ts
      - transactions.ts
      - promotions.ts
      - events.ts
      - rewards.ts
      - analytics.ts
      - devices.ts
      - notifications.ts
      - webhooks.ts (Stripe)
    * controllers/
      - authController.ts
      - membersController.ts
      - etc...
    * services/
      - memberService.ts
      - transactionService.ts
      - notificationService.ts
      - stripeService.ts
    * utils/
      - validators.ts (Zod)
      - errorHandler.ts
      - logger.ts

  ENDPOINTS CRÍTICOS (ver detalle en spec):
  - POST /api/auth/login
  - POST /api/auth/register
  - POST /api/clubs/{clubId}/members/register
  - GET /api/clubs/{clubId}/members/{memberId}/qr-code
  - POST /api/clubs/{clubId}/visits (registrar entrada)
  - POST /api/clubs/{clubId}/transactions (registrar compra)
  - POST /api/clubs/{clubId}/promotions
  - GET /api/clubs/{clubId}/analytics/overview
  - POST /api/webhooks/stripe (webhook)

  REGLAS:
  - Autenticación JWT en todos los endpoints
  - Validación Zod de inputs
  - Multi-tenant: cada club ve solo sus datos
  - Rate limiting: 100 requests por minuto
  - Error handling centralizado
  - Logging con winston

C) DATABASE (PostgreSQL):

  Todas las tablas del archivo spec (25+ tablas):
  - clubs, club_users, club_members
  - visits, transactions
  - promotions, events, event_registrations
  - membership_tiers, rewards, redeemed_rewards
  - badges, member_badges
  - notifications, leaderboards
  - devices, analytics_logs
  - club_subscriptions

  Incluir:
  - Índices en búsquedas frecuentes
  - Foreign keys con ON DELETE CASCADE
  - Constraints de integridad

D) INTEGRACIONES:

  1. STRIPE (Pagos del SaaS)
     - Crear checkout para memberships de club (plans $49, $149, $349)
     - Webhook: checkout.session.completed → crear subscription en BD
     - Webhook: invoice.payment_succeeded → renovar features
     - Webhook: customer.subscription.deleted → suspender club

  2. QR GENERATION
     - Usar librería: qrcode.react
     - QR contiene: {clubId}-{memberId}
     - QR es único por miembro
     - Escanear con jsQR

  3. PUSH NOTIFICATIONS
     - Firebase Cloud Messaging
     - Cuando: entrada confirmada, compra completada, nuevo evento, recompensa ganada
     - Dashboard para enviar notificaciones manuales

E) CONFIGURACIÓN:

  - .env.example con todas las variables
  - tsconfig.json
  - package.json completo con scripts (dev, build, start)
  - README.md con instrucciones de setup

F) SEGURIDAD:

  - JWT con expiración 7 días
  - Contraseñas hasheadas con bcryptjs
  - Validación de inputs con Zod
  - SQL injection prevención: prepared statements
  - CORS configurado
  - Rate limiting en login
  - QR code verificación: debe coincidir club + miembro

G) TESTS (Básicos):

  - 3-5 tests unitarios con Jest
  - Test de endpoints críticos
  - Test de autenticación
  - Test de validación

---

REQUERIMIENTOS TÉCNICOS:

- TypeScript estricto (strict: true)
- Next.js 14 App Router
- Componentes funcionales con hooks
- Validación con Zod (no "any" types)
- SQL con prepared statements
- Código modular y reutilizable
- Comments en funciones complejas
- Production-ready

---

FLUJOS ESPECÍFICOS A CODIFICAR:

1. REGISTRO CLIENTE:
   - Form con email, nombre, teléfono
   - Seleccionar membresía (gratis o pago)
   - Si pago: Stripe checkout
   - Generar QR
   - Enviar email bienvenida

2. ESCANEO PORTERO:
   - Abrir cámara
   - Escanear QR
   - Validar que QR es del club correcto
   - Guardar visita en BD
   - Mostrar feedback visual + sonido

3. COMPRA BARRA:
   - Seleccionar item
   - Escanear cliente
   - Validar membresía activa
   - Aplicar descuento automático según tier
   - Calcular puntos
   - Procesar pago
   - Guardar transacción
   - Enviar push al cliente

4. ADMIN KPIs:
   - Query: COUNT visitas del día
   - Query: SUM ingresos del día
   - Query: COUNT miembros activos (visited en últimos 30 días)
   - Query: SUM puntos canjeados hoy
   - Gráficos: visitas/día (últimos 7 días), top items vendidos

---

ORDEN DE PRIORIDAD:

MVP (entregar primero):
✅ Auth (login/registro)
✅ QR generation + scanning
✅ Miembro dashboard (ver QR, puntos)
✅ Portero: escanear entrada
✅ Barra: escanear + procesar compra
✅ Admin: KPIs básicos
✅ Stripe integration

Phase 2:
✅ Eventos
✅ Leaderboards
✅ Gamification (badges)
✅ Notificaciones push

---

IMPORTANTE:

- El código debe ser production-ready, no boilerplate genérico
- Cada componente/función debe tener propósito específico
- No duplicar código, usar utilidades reutilizables
- Estructura que escale (agregar nuevas features fácilmente)
- Documentación en README
- Manejo de errores completo (try-catch, error messages claros)

---

Genera el código COMPLETO. Incluye:
1. Carpeta src/ completa (backend)
2. app/ folder completo (frontend Next.js) - 5 apps
3. SQL schema
4. .env.example
5. package.json
6. README.md
7. Test ejemplos

Usa TypeScript stricktamente. Production-ready.
```

---

## 🎯 CÓMO USAR ESTE PROMPT

### Opción 1: Directamente en Claude
1. Copia el prompt arriba
2. Abre https://claude.ai
3. Pega el prompt
4. Adjunta el archivo `club-nocturno-saas.md` como referencia
5. Presiona "Enviar"
6. Claude generará código

### Opción 2: Con Claude en este repositorio
Si tienes acceso a Claude vía API o en tu IDE:
```bash
# En tu editor que tenga Claude
/claude generate-code-for-nightclub-app
# O manualmente: copia el prompt + adjunta archivo spec
```

---

## ⏱️ TIEMPO ESPERADO

- **Claude**: 10-15 minutos generando
- **Código generado**: ~3,000-4,000 líneas
- **Comprensión**: Lee el código que generó Claude
- **Setup**: 30 minutos (dependencias, DB, env vars)
- **Listo para dev local**: 45 minutos desde que recibas código

---

## ✅ VALIDAR CÓDIGO DE CLAUDE

Cuando Claude termine, verifica:

```typescript
// 1. TypeScript es estricto
"strict": true en tsconfig.json

// 2. Autenticación funciona
POST /api/auth/login → retorna JWT válido

// 3. QR se genera y escanea
Cliente registrado → obtiene QR único en su dashboard

// 4. Multi-tenant funciona
Club A solo ve sus datos (members, transactions, etc)
Club B solo ve sus datos (aislados)

// 5. Stripe webhooks verifican firma
// webhook handler valida stripe-signature

// 6. Validación Zod en todos lados
// inputs validados antes de procesar

// 7. Errors manejados correctamente
// try-catch, logging, mensajes claros

// 8. Endpoints necesarios existen
// todos los endpoints del spec implementados
```

---

## 🚀 SIGUIENTES PASOS DESPUÉS DE RECIBIR CÓDIGO

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Setup BD PostgreSQL**
   ```bash
   psql -U postgres -d clubnightlife < sql/schema.sql
   ```

3. **Variables de entorno**
   ```bash
   cp .env.example .env.local
   # Llenar: DATABASE_URL, STRIPE_KEY, JWT_SECRET, etc
   ```

4. **Correr dev servers**
   ```bash
   # Terminal 1: Backend
   npm run backend:dev
   
   # Terminal 2: Frontend cliente
   npm run frontend:client:dev
   
   # Terminal 3: Frontend admin
   npm run frontend:admin:dev
   ```

5. **Testear flujos**
   - Registrarse como cliente
   - Registrarse como club
   - Escanear QR
   - Procesar compra
   - Ver analytics

---

## 💡 CUSTOMIZACIONES DESPUÉS

Una vez que tengas código base funcionando:
- Cambiar colores/logos
- Agregar más items de menu barra
- Ajustar percentages de descuento
- Traducir textos (si están en inglés)
- Agregar logos/imágenes del club
- Personalizar emails

---

**Documento listo. Copia el prompt y úsalo con Claude.**
