# 🔧 Configuración de Variables de Entorno

Este archivo contiene todas las variables de entorno necesarias para ejecutar el proyecto con Docker Compose.

## 📋 Crear archivo .env

**IMPORTANTE:** El proyecto espera un archivo `.env.docker` como plantilla. Si no existe, crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# ============================================
# CLUB NIGHTLIFE SAAS - ENVIRONMENT VARIABLES
# ============================================

# ===== DOCKER COMPOSE CONFIGURATION =====
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password_in_production
POSTGRES_DB=clubnightlife
POSTGRES_PORT=5432

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PORT=6379

# ===== BACKEND CONFIGURATION =====
NODE_ENV=development
PORT=5000
BACKEND_PORT=5001

# Database Connection (for Docker, use service name 'postgres')
DATABASE_URL=postgresql://postgres:change_this_password_in_production@postgres:5432/clubnightlife
DATABASE_SSL=false

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-32-char-string-in-production
JWT_EXPIRES_IN=7d

# ===== STRIPE CONFIGURATION =====
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (create products in Stripe dashboard)
STRIPE_BASIC_PRICE_ID=price_your_basic_price_id
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id

# ===== EMAIL CONFIGURATION (SendGrid) =====
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@clubnightlife.com

# ===== FIREBASE (Push Notifications) =====
# Optional - for push notifications
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# ===== SMS CONFIGURATION (Twilio) =====
# Optional - for SMS notifications
TWILIO_ACCOUNT_SID=ACyour_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ===== SECURITY SETTINGS =====
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
TRIAL_DAYS=14

# ===== FRONTEND CONFIGURATION =====
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
FRONTEND_PORT=3001

# ===== CORS CONFIGURATION =====
# For production, set these to your actual domains
NEXT_PUBLIC_CLIENT_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

## 🚀 Inicio Rápido

1. **Crea el archivo .env:**
   ```bash
   cp ENV_SETUP.md .env
   # Luego edita .env y cambia los valores necesarios
   ```

2. **Cambia al menos estos valores obligatorios:**
   - `POSTGRES_PASSWORD` - Una contraseña segura para PostgreSQL
   - `JWT_SECRET` - Una cadena aleatoria de al menos 32 caracteres
   - `STRIPE_SECRET_KEY` - Tu clave secreta de Stripe (puede ser de prueba)
   - `STRIPE_PUBLISHABLE_KEY` - Tu clave pública de Stripe (puede ser de prueba)

3. **Para desarrollo local, puedes usar valores de prueba:**
   ```bash
   POSTGRES_PASSWORD=dev_password_123
   JWT_SECRET=dev_jwt_secret_key_change_in_production_12345
   STRIPE_SECRET_KEY=sk_test_51...
   STRIPE_PUBLISHABLE_KEY=pk_test_51...
   ```

## 📝 Notas Importantes

- **DATABASE_URL**: En Docker, usa `postgres` como hostname (nombre del servicio)
- **REDIS_URL**: En Docker, usa `redis` como hostname (nombre del servicio)
- **NEXT_PUBLIC_API_URL**: Desde el navegador, usa `http://localhost:5001` (puerto mapeado)
- **Nunca commitees el archivo .env** a git

## ✅ Validación

Después de crear el .env, valida la configuración:

```bash
# Verifica que Docker puede leer las variables
docker-compose config

# Inicia los servicios
docker-compose up -d

# Verifica que todo está funcionando
docker-compose ps
```

