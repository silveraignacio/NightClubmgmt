# 🚀 Docker Quick Start Guide

## Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- 4GB+ RAM available

## Setup in 3 Steps

### 1️⃣ Configure Environment

```bash
# Copy template
cp .env.docker .env

# Edit with your values
nano .env
```

**REQUIRED changes in .env:**
- `POSTGRES_PASSWORD` → Strong password
- `JWT_SECRET` → Random 32+ char string
- `STRIPE_SECRET_KEY` → From Stripe dashboard
- `STRIPE_PUBLISHABLE_KEY` → From Stripe dashboard

### 2️⃣ Build Images

```bash
# Build all services (takes 5-10 minutes first time)
docker-compose build

# Or build individually
docker-compose build backend
docker-compose build frontend
```

### 3️⃣ Start Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
docker-compose ps
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/health
- Database: localhost:5432
- Redis: localhost:6379

## Common Commands

```bash
# Stop services (keeps data)
docker-compose down

# Stop and remove data
docker-compose down -v

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend sh

# Rebuild after code changes
docker-compose build backend
docker-compose up -d backend
```

## Validation

Before building, validate your setup:

```bash
./docker-validate.sh
```

## Troubleshooting

**Port already in use:**
```bash
# Change ports in .env
FRONTEND_PORT=3001
BACKEND_PORT=5001
```

**Out of memory:**
```bash
# Increase Docker memory limit to 4GB+
# Docker Desktop: Settings → Resources → Memory
```

**Database connection failed:**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify DATABASE_URL in .env matches:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@postgres:5432/clubnightlife
```

## Production Deployment

For production deployment on VPS/Cloud, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

## File Structure

```
.
├── backend/
│   ├── Dockerfile              # Backend container config
│   ├── .dockerignore           # Files to exclude from image
│   └── src/                    # Application code
├── frontend/
│   ├── Dockerfile              # Frontend container config
│   ├── .dockerignore           # Files to exclude from image
│   └── app/                    # Next.js application
├── database/
│   └── schema.sql              # PostgreSQL schema (auto-loaded)
├── docker-compose.yml          # Services orchestration
├── .env.docker                 # Environment template
├── .env                        # Your config (DO NOT COMMIT)
├── docker-validate.sh          # Pre-flight validation
├── DOCKER_QUICKSTART.md        # This file
└── DOCKER_DEPLOYMENT.md        # Full deployment guide
```

## Next Steps

1. **Test Registration:**
   - Go to http://localhost:3000
   - Click "Start Free Trial"
   - Register a club owner account

2. **Test Member Flow:**
   - Register a member account
   - View QR code in member portal

3. **Configure Stripe:**
   - Add real products/prices in Stripe dashboard
   - Update price IDs in .env
   - Test subscription flow

4. **Production Deployment:**
   - Follow [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
   - Set up SSL with Nginx
   - Configure domain names
   - Set production environment variables

---

**Need help?** Check [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed information.
