# CLUB NOCTURNO APP - SaaS Web Platform
## Especificación Completa para Claude

---

## 🎯 VISIÓN DEL NEGOCIO

Plataforma SaaS completa para gestionar clubs nocturnos, bares y locales de entretenimiento. Los clientes se registran en una membresía (gratuita o de pago) que les da acceso a descuentos, notificaciones exclusivas, pases VIP, acumulación de puntos por compras, y un QR único para identificación al entrar y comprar.

La plataforma incluye:
- **App Web para Clientes**: Membresía, QR personal, puntos, descuentos, notificaciones
- **Admin Dashboard**: Gestión de memberships, eventos, promotions, análisis
- **Tablet/Mobile para Porteros**: Lector QR para registrar entradas
- **Tablet/Mobile para Barra**: Lector QR para procesar puntos en compras
- **Dashboard Analítico**: KPIs en tiempo real del club

---

## 💰 MODELO DE MONETIZACIÓN SaaS (Para ti)

### Plan Básico - $49/mes
- Hasta 500 miembros
- Eventos ilimitados
- Promociones básicas (3 activas simultáneamente)
- App web del cliente
- Lector QR (1 dispositivo)
- Reportes básicos
- Email support
- Sin comisión por transacciones

### Plan Pro - $149/mes
- Hasta 2,500 miembros
- Eventos ilimitados + calendar integrado
- Promociones avanzadas (10 activas)
- App web + Push notifications
- Lectores QR (5 dispositivos)
- Reportes avanzados + analytics dashboard
- Integración con POS (Toast, TouchBistro, Square)
- Email + Chat support
- Sin comisión por transacciones

### Plan Premium - $349/mes
- Hasta 10,000 miembros
- Eventos + integración con Stripe para venta de tickets
- Promociones ilimitadas
- App web + Push + SMS
- Lectores QR ilimitados
- Reportes avanzados + BI (Business Intelligence)
- Integraciones POS completas + CRM
- Gamificación personalizada (badges, leaderboards)
- Análisis de comportamiento de clientes
- Priority support + dedicated account manager
- Revenue share optional (si manejas transacciones de bebidas premium)

**Consideraciones de precios:**
- Cobro recurrente mensual vía Stripe
- Trial de 14 días gratis (sin tarjeta de crédito)
- Descuentos por pago anual (10-15%)
- Setup fee único: $99 (Plan Básico), $299 (Pro), $499 (Premium)

---

## 🏗️ STACK TECNOLÓGICO

**Frontend (Cliente + Admin + Portero/Barra)**
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Framer Motion (animaciones)
- Zod (validación)
- QR code library: `qrcode.react`
- Camera scanner: `react-qr-code-generator` o `jsQR`

**Backend**
- Node.js + Express.js
- Python FastAPI (opcional, para analytics pesadas)
- PostgreSQL (datos principales)
- Redis (caché, sesiones en tiempo real)
- Socket.io (notificaciones en vivo)

**Integraciones**
- Stripe (pagos de memberships, transacciones)
- SendGrid / Mailgun (email)
- Firebase Cloud Messaging (push notifications)
- Twilio (SMS para promociones)

**Infrastructure**
- Vercel (frontend)
- Railway o Heroku (backend)
- AWS S3 (almacenamiento de logos, fotos)
- Datadog / Sentry (monitoring)

---

## 📊 ESTRUCTURA DE BASE DE DATOS

```sql
-- ===== TABLA DE CLUBES (Multi-tenant) =====
CREATE TABLE clubs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  owner_id UUID REFERENCES users(id),
  logo_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  description TEXT,
  website VARCHAR(500),
  stripe_account_id VARCHAR(255), -- Connect account para payouts
  current_plan VARCHAR(50), -- basic, pro, premium
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  members_count INT DEFAULT 0,
  max_members INT, -- Según plan
  features JSONB, -- {notifications: true, pos_integration: true, ...}
  status VARCHAR(50), -- active, trialing, suspended
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE USUARIOS DEL CLUB (Staff) =====
CREATE TABLE club_users (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50), -- admin, manager, bartender, doorman, staff
  permissions JSONB, -- {can_scan: true, can_view_analytics: true, ...}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE MIEMBROS DEL CLUB =====
CREATE TABLE club_members (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  qr_code_id VARCHAR(255) UNIQUE, -- ID único del QR
  membership_type VARCHAR(50), -- free, bronze, silver, gold, vip, platinum
  membership_tier_id UUID REFERENCES membership_tiers(id),
  points_balance INT DEFAULT 0,
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_visit TIMESTAMP,
  profile_photo_url VARCHAR(500),
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE TIERS DE MEMBRESÍA =====
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  tier_name VARCHAR(100), -- Bronze, Silver, Gold, VIP, Platinum
  description TEXT,
  color_hex VARCHAR(7), -- #FF5733 para UI
  points_multiplier DECIMAL(2, 1), -- 1x, 1.5x, 2x, etc
  benefits JSONB, -- {discount_percentage: 15, free_entry: false, priority_entry: true, ...}
  entry_cost DECIMAL(10, 2), -- Si es de pago
  points_required_to_reach INT, -- Puntos para subir a este tier
  duration_months INT, -- Duración de la membresía en meses
  stripe_price_id VARCHAR(255), -- Para pagos
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE PROMOCIONES =====
CREATE TABLE promotions (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  promotion_name VARCHAR(255),
  description TEXT,
  promotion_type VARCHAR(50), -- percentage, fixed_amount, free_item, double_points, entry_discount
  discount_value DECIMAL(10, 2),
  discount_percentage INT,
  applicable_tiers JSONB, -- ["bronze", "silver", "gold"] o [] para todos
  applies_to VARCHAR(50), -- drinks, entry, all
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  max_uses INT,
  uses_count INT DEFAULT 0,
  code VARCHAR(50), -- Código promocional (SUMMER20, VIPNIGHT, etc)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE VISITAS/ENTRADAS =====
CREATE TABLE visits (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  member_id UUID REFERENCES club_members(id),
  qr_code_id VARCHAR(255),
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  entry_method VARCHAR(50), -- qr_scan, manual, list_entry
  scanned_by_user_id UUID REFERENCES club_users(id),
  entry_type VARCHAR(50), -- free_entry, paid_entry, vip_pass, promotional
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE TRANSACCIONES (COMPRAS) =====
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  member_id UUID REFERENCES club_members(id),
  qr_code_id VARCHAR(255),
  transaction_type VARCHAR(50), -- drink_sale, food_sale, entry_fee, table_service
  description VARCHAR(255),
  amount DECIMAL(10, 2),
  points_earned INT,
  discount_applied DECIMAL(10, 2) DEFAULT 0,
  promotion_id UUID REFERENCES promotions(id),
  processed_by_user_id UUID REFERENCES club_users(id),
  device_id VARCHAR(255), -- ID del tablet/dispositivo
  payment_method VARCHAR(50), -- cash, card, points, mixed
  stripe_charge_id VARCHAR(255),
  status VARCHAR(50), -- completed, pending, refunded
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE EVENTOS =====
CREATE TABLE events (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_name VARCHAR(255),
  description TEXT,
  event_date TIMESTAMP,
  start_time TIME,
  end_time TIME,
  event_type VARCHAR(100), -- ladies_night, dj_night, karaoke, special_event, tournament
  featured_image_url VARCHAR(500),
  capacity INT,
  registered_count INT DEFAULT 0,
  vip_discount DECIMAL(10, 2),
  special_promotions JSONB, -- {double_points: true, free_entry_for_vip: true}
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE REGISTROS A EVENTOS =====
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attended BOOLEAN DEFAULT FALSE,
  UNIQUE(event_id, member_id)
);

-- ===== TABLA DE NOTIFICACIONES =====
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  member_id UUID REFERENCES club_members(id),
  notification_type VARCHAR(50), -- promotion, event, birthday, reward_unlocked, welcome
  title VARCHAR(255),
  body TEXT,
  action_url VARCHAR(500),
  image_url VARCHAR(500),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  click_at TIMESTAMP,
  delivery_method VARCHAR(50), -- push, email, sms
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE PUNTOS Y RECOMPENSAS =====
CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  reward_name VARCHAR(255),
  description TEXT,
  points_required INT,
  reward_type VARCHAR(50), -- discount, free_item, free_entry, merchandise
  value DECIMAL(10, 2),
  image_url VARCHAR(500),
  quantity_available INT,
  quantity_redeemed INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE RECOMPENSAS REDIMIDAS =====
CREATE TABLE redeemed_rewards (
  id UUID PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  member_id UUID NOT NULL REFERENCES club_members(id),
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP,
  points_spent INT,
  used_by_user_id UUID REFERENCES club_users(id)
);

-- ===== TABLA DE BADGES/LOGROS =====
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  badge_name VARCHAR(100), -- "First Visit", "50 Points", "VIP Weekend", "Drink Connoisseur"
  description TEXT,
  icon_url VARCHAR(500),
  badge_type VARCHAR(50), -- achievement, milestone, seasonal
  trigger_condition JSONB, -- {event: "visit_count", value: 1} o {event: "points_earned", value: 50}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE BADGES GANADAS POR MIEMBROS =====
CREATE TABLE member_badges (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES club_members(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, badge_id)
);

-- ===== TABLA DE ANALYTICS/LOGS =====
CREATE TABLE analytics_logs (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  event_type VARCHAR(100), -- visit, purchase, promotion_used, member_registered
  member_id UUID REFERENCES club_members(id),
  value DECIMAL(12, 2),
  metadata JSONB, -- datos adicionales
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE SUSCRIPCIONES DEL CLUB =====
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_type VARCHAR(50),
  status VARCHAR(50),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE DISPOSITIVOS (Tablets Portero/Barra) =====
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  device_name VARCHAR(255), -- "Portero 1", "Barra Principal"
  device_type VARCHAR(50), -- door, bar, counter
  device_id VARCHAR(255) UNIQUE,
  location VARCHAR(255),
  api_key VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLA DE LEADERBOARDS =====
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  member_id UUID NOT NULL REFERENCES club_members(id),
  period VARCHAR(50), -- daily, weekly, monthly
  rank INT,
  points INT,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎮 FLUJOS PRINCIPALES

### 1. FLUJO DE REGISTRO DE CLIENTE

```
Cliente visita app web del club
    ↓
Elige tipo de membresía (Gratis/Pago)
    ↓
Completa form: email, teléfono, nombre
    ↓
Sistema genera QR único
    ↓
QR se guarda en perfil + imprimible
    ↓
Se envía email de bienvenida
    ↓
Se crea membership record en BD
    ↓
Cliente ya puede:
  - Ver descuentos del club
  - Recibir notificaciones
  - Acumular puntos
```

### 2. FLUJO DE ENTRADA AL CLUB (Portero)

```
Portero abre app del portero (tablet)
    ↓
Abre lector QR
    ↓
Cliente muestra QR en pantalla del móvil
    ↓
Portero escanea QR
    ↓
Sistema valida QR y busca miembro
    ↓
Muestra información:
  - Nombre
  - Membership tier (color)
  - Beneficios VIP (si aplica)
  - Historial de visitas
    ↓
Portero toca "ENTRADA CONFIRMADA"
    ↓
Se registra visita en BD
    ↓
Se envía push al cliente: "¡Bienvenido a Club X!"
    ↓
Se suma puntos si hay promoción activa
```

### 3. FLUJO DE COMPRA EN LA BARRA

```
Cliente pide bebida en la barra
    ↓
Bartender escribe en tablet: "Vodka Soda - $12"
    ↓
Bartender pide QR al cliente
    ↓
Escanea QR con tablet
    ↓
Sistema valida:
  - Membresía activa
  - Tier actual
  - Descuentos aplicables
  - Promociones activas
    ↓
Calcula:
  - Precio original: $12
  - Descuento (por ej. 20% VIP): -$2.40
  - Precio final: $9.60
    ↓
Muestra:
  - Descripción item
  - Puntos ganados (por ej. 10 puntos)
  - Resumen descuentos
    ↓
Bartender toca "COBRAR $9.60"
    ↓
Opciones de pago:
  - Efectivo (confirmar)
  - Tarjeta (QR para Stripe)
  - Puntos (si tiene suficientes)
    ↓
Se registra transacción
    ↓
Se actualizan puntos del cliente
    ↓
Se envía notificación: "¡+10 puntos! Total: 145 puntos"
    ↓
Si alcanzó recompensa: "¡Ganaste x1 Bebida Gratis!"
```

### 4. FLUJO DE ADMINISTRADOR

```
Admin accede a dashboard
    ↓
Ve KPIs principales:
  - Miembros activos hoy
  - Ingresos del día
  - Visitas
  - Puntos canjeados
  - Promociones activas
    ↓
Puede:
  1. Crear/editar memberships
  2. Crear eventos
  3. Crear/editar promociones
  4. Ver analytics (gráficos, reportes)
  5. Gestionar staff
  6. Ver leaderboards
  7. Enviar notificaciones push
  8. Gestionar recompensas
```

---

## 🎨 INTERFACES PRINCIPALES

### Cliente (Web + Mobile Responsive)
1. **Landing Page** - Descripción del club, beneficios de ser miembro
2. **Login/Registro** - Form intuitivo
3. **Dashboard** - QR, puntos, tier actual, próximos beneficios
4. **Eventos** - Calendario, registro, descuentos especiales
5. **Promociones** - Códigos, descuentos vigentes, historial
6. **Perfil** - Editar información, historial de visitas, transacciones
7. **Notificaciones** - Centro de notificaciones
8. **Leaderboard** - Top 10 miembros de la semana/mes (si gamification activa)

### Portero (Tablet Horizontal)
1. **QR Scanner** - Gran botón para abrir cámara
2. **Miembro Info** - Nombre, tier, foto, datos
3. **Quick Actions** - "Confirmar Entrada", "Problema con QR"
4. **Historial** - Últimas 10 entradas escaneadas

### Barra/Bartender (Tablet Horizontal)
1. **Menu de Items** - Botones por tipo (beers, cocktails, shots, food)
2. **QR Scanner** - Para escanear cliente
3. **Transacción** - Item, precio original, descuento, total, puntos
4. **Historial** - Últimas transacciones del turno

### Admin Dashboard
1. **Overview** - KPIs principales (cards grandes)
2. **Members** - Tabla de miembros, búsqueda, edición
3. **Events** - Crear, editar, ver asistencia
4. **Promotions** - Crear, activas, histórico
5. **Analytics** - Gráficos: visitas/día, ingresos, puntos, engagement
6. **Rewards** - Crear, editar, ver redenciones
7. **Staff** - Gestionar usuarios del club
8. **Settings** - Plan, facturas, configuración general

---

## 🔄 CARACTERÍSTICAS AVANZADAS

### Gamificación
- **Badges** - "Primera visita", "50 puntos ganados", "5 visitas en 1 mes", "Bebedor VIP"
- **Leaderboards** - Top 10 de la semana/mes (visible en app)
- **Streaks** - "7 días consecutivos" = bonus de puntos
- **Milestones** - Al alcanzar 100, 250, 500 puntos → mensaje especial

### Notificaciones Inteligentes
- Cuando hay promoción nueva relevante para su tier
- Recordatorios de eventos que se registró
- Birthday special: "¡Es tu cumpleaños! Entra GRATIS hoy"
- "Hace 7 días que no vienes... ¡Vuelve y gana 20 puntos!"

### Analytics para Admin
- **Tabla de KPIs**: visitas/día, avg spend, retention rate, NPS
- **Heatmap**: horas pico, días pico, tipo de cliente
- **Segmentación**: miembros por tier, edad, gasto promedio
- **Predicción**: usando histórico, predecir ocupación futura

### Integración con POS
- Si el club usa POS (Toast, Square, etc.), puede sincronizar:
  - Menú de bebidas (para que bartender vea qué cobrar)
  - Inventario
  - Histórico de transacciones

---

## 💳 SISTEMA DE PAGOS (Stripe)

### Nivel 1: Tu SaaS (Memberships de Clubes)
- Stripe Standard Setup
- Plan Básico/Pro/Premium cobrado mensualmente
- Webhook: `invoice.payment_succeeded` → activar features
- Webhook: `customer.subscription.deleted` → desactivar

### Nivel 2: Memberships Pagadas
- Si club tiene memberships pagas (Ej: $29/mes Gold tier)
- Stripe Connect (creadores pueden recibir dinero)
- Webhooks para renovación automática

### Nivel 3: Integraciones POS (Opcional)
- Si integramos con Toast/Square, las transacciones se registran automáticamente
- No hay cobro por transacción nuestra, solo comisión SaaS mensual

---

## 🔐 SEGURIDAD

- **JWT** para auth (expira en 7 días)
- **QR únicos** por miembro, imposibles de duplicar
- **Encriptación** de datos sensibles
- **Rate limiting** en endpoints
- **CORS** configurado
- **SSL/HTTPS** obligatorio
- **Validación Zod** en todos los inputs
- **Prepared statements** en BD para evitar SQL injection

---

## 📈 KPIs PARA DASHBOARDS

### Para Admin del Club
- **Ingresos del día/mes/año** (total vendido)
- **Visitas del día/mes/año**
- **Miembros activos** (visitaron en últimos 30 días)
- **Puntos canjeados** (presión de recompensas)
- **Promociones usadas** (efectividad)
- **Avg spend per member**
- **Retention rate** (% que volvió en 30 días)
- **Churn rate** (% que se fue)

### Para Nuestro SaaS
- **Clubes activos** (usando la plataforma)
- **Miembros totales** (todos los clubs)
- **Revenue MRR** (ingresos mensuales recurrentes)
- **Churn rate** (clubes que cancelaron)
- **Feature adoption** (% usando notificaciones, gamification, etc)

---

## 🚀 FUNCIONALIDADES FUTURAS (Post-MVP)

1. **WhatsApp Integration** - Promociones vía WhatsApp
2. **Facebook Ads Integration** - Retargeting a clientes inactivos
3. **Loyalty Card NFT** - Blockchain para verificación
4. **AR Experience** - Cliente apunta cámara a poster del club = descuento
5. **Birthday Month Automation** - Enviar automáticamente ofertas
6. **Referral Program** - Cliente invita amigo, gana puntos
7. **Group Deals** - "Traé 3 amigos y entra gratis"
8. **Live DJ Requests** - Cliente vota canciones = puntos
9. **Table Reservations** - Reservar VIP con pago
10. **Review System** - Clientes califican eventos

---

## 📝 ENDPOINTS API PRINCIPALES

```
=== AUTENTICACIÓN ===
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token

=== CLUB (Multi-tenant) ===
POST   /api/clubs/setup (crear club nuevo)
GET    /api/clubs/{clubId}
PUT    /api/clubs/{clubId}

=== MIEMBROS ===
POST   /api/clubs/{clubId}/members/register
GET    /api/clubs/{clubId}/members
GET    /api/clubs/{clubId}/members/{memberId}
PUT    /api/clubs/{clubId}/members/{memberId}
GET    /api/clubs/{clubId}/members/{memberId}/qr-code

=== ENTRADAS ===
POST   /api/clubs/{clubId}/visits (registrar entrada)
GET    /api/clubs/{clubId}/visits

=== COMPRAS ===
POST   /api/clubs/{clubId}/transactions (procesar compra)
GET    /api/clubs/{clubId}/transactions

=== PROMOCIONES ===
GET    /api/clubs/{clubId}/promotions
POST   /api/clubs/{clubId}/promotions
PUT    /api/clubs/{clubId}/promotions/{promotionId}
DELETE /api/clubs/{clubId}/promotions/{promotionId}

=== EVENTOS ===
GET    /api/clubs/{clubId}/events
POST   /api/clubs/{clubId}/events
PUT    /api/clubs/{clubId}/events/{eventId}
POST   /api/clubs/{clubId}/events/{eventId}/register

=== RECOMPENSAS ===
GET    /api/clubs/{clubId}/rewards
POST   /api/clubs/{clubId}/rewards
POST   /api/clubs/{clubId}/rewards/{rewardId}/redeem

=== LEADERBOARDS ===
GET    /api/clubs/{clubId}/leaderboards/weekly
GET    /api/clubs/{clubId}/leaderboards/monthly

=== NOTIFICACIONES ===
POST   /api/clubs/{clubId}/notifications/send
GET    /api/notifications (para cliente)
PUT    /api/notifications/{notificationId}/read

=== ANALYTICS ===
GET    /api/clubs/{clubId}/analytics/overview
GET    /api/clubs/{clubId}/analytics/visits
GET    /api/clubs/{clubId}/analytics/spending
GET    /api/clubs/{clubId}/analytics/retention

=== DISPOSITIVOS (Portero/Barra) ===
POST   /api/clubs/{clubId}/devices
GET    /api/clubs/{clubId}/devices
PUT    /api/clubs/{clubId}/devices/{deviceId}

=== PAGOS (Stripe) ===
POST   /api/stripe/create-subscription
POST   /api/stripe/create-checkout
POST   /api/webhooks/stripe
```

---

## 📦 DEPENDENCIAS (package.json)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "stripe": "^14.0.0",
    "socket.io": "^4.6.0",
    "qrcode.react": "^1.0.1",
    "jsqr": "^1.4.0",
    "zod": "^3.22.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "react-query": "^3.39.0",
    "tailwindcss": "^3.3.0",
    "framer-motion": "^10.16.0",
    "recharts": "^2.10.0"
  }
}
```

---

## 🎯 CASES DE USO REALES

### Club Nocturno Pequeño (500 miembros max)
- Plan: BÁSICO ($49/mes)
- 1 Portero con tablet
- 1 Barra con tablet
- Admin gestiona manualmente
- Usan para: Control de entrada + puntos por compra

### Bar Mediano (2,500 miembros)
- Plan: PRO ($149/mes)
- 2-3 Porteros
- 3-4 Tablets en barra
- Eventos semanales
- Promociones activas
- Análisis básico

### Club Premium Grande (10,000 miembros)
- Plan: PREMIUM ($349/mes)
- 5+ Porteros
- 8+ Tablets en barra
- Eventos diarios
- Gamificación completa
- Analytics avanzado
- Dedicated account manager

---

## 🔄 FLUJO DE REVENUE

1. Club se registra
2. Prueba gratis 14 días
3. Elige plan (Básico/Pro/Premium)
4. Paga primer mes vía Stripe
5. Cada mes se renueva automáticamente
6. Nosotros: 100% comisión (sin revenue share, solo SaaS)
7. Si club tiene memberships pagas: comisión opcional

**Proyección de ingresos:**
- 50 clubes activos × $149/mes = $7,450/mes = $89,400/año
- 100 clubes activos × $149/mes = $14,900/mes = $178,800/año
- 200 clubes activos × $149/mes = $29,800/mes = $357,600/año

---

## ⏱️ TIMELINE DE DESARROLLO

**MVP (4-6 semanas):**
- Autenticación básica
- Registro de miembros
- QR generation
- Portero: lector QR simple
- Barra: procesar compra con puntos
- Admin: dashboard básico
- Stripe integration

**Phase 2 (2-3 semanas):**
- Notificaciones push
- Eventos
- Leaderboards
- Gamification (badges)

**Phase 3 (3-4 semanas):**
- SMS
- Analytics avanzado
- Integraciones POS
- Mobile app nativa (si lo ves necesario)

---

## 💡 RECOMENDACIONES FINALES

1. **Comienza con Club Básico**: 1 club piloto en tu ciudad, refina UX
2. **Precios competitivos**: Averigua qué cobran Nyx ($$$), adapta al mercado local
3. **Integración WhatsApp**: Los propietarios de clubs van a pedir poder mandar promo por WhatsApp
4. **Offline Mode**: Portero debe poder escanear QR sin internet (sync después)
5. **Dark Mode**: Para tablets en ambiente de club nocturno
6. **Localization**: Textos en español desde el inicio (precios, puntos, etc.)

---

## 🎓 REFERENCIAS DE COMPETENCIA

Platforms similares estudiadas:
- **Nyx App** (Europa) - Club management completo
- **MemberJungle** - Membership cards
- **Toast POS** - Bar/Restaurant POS
- **Eventbrite** - Event management
- **Circle.so** - Community + gamification

Tu diferencial:
- Más barato que Nyx
- Específicamente diseñado para clubs nocturnos
- Gamification integrada desde el inicio
- Fácil de usar para staff sin training

---

**Documento completado. Listo para pasar a Claude con prompt personalizados.**
