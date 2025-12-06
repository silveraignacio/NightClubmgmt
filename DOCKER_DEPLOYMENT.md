# 🐳 Club Nightlife SaaS - Docker Deployment Guide

## 📋 Overview

This guide covers deploying the Club Nightlife SaaS platform using Docker and Docker Compose. All services run in optimized, self-contained containers.

## 🏗️ Architecture

The platform consists of 4 services:

1. **PostgreSQL** - Database (port 5432)
2. **Redis** - Caching layer (port 6379)
3. **Backend** - Node.js API (port 5000)
4. **Frontend** - Next.js web app (port 3000)

All services communicate through an internal Docker network.

## ✅ Prerequisites

1. **Docker** 20.10+ installed
2. **Docker Compose** 2.0+ installed
3. **4GB+ RAM** available for containers
4. **10GB+ disk space** for images and volumes

### Verify Installation

```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start (5 Minutes)

### 1. Configure Environment

```bash
# Copy environment template
cp .env.docker .env

# Edit .env with your values
nano .env
```

**REQUIRED: Set these values in .env:**
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET` - Random 32+ character secret
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard

### 2. Build Images

```bash
# Build all images (first time ~5-10 minutes)
docker-compose build

# Build with no cache (clean build)
docker-compose build --no-cache
```

### 3. Start Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Verify Deployment

```bash
# Check service health
docker-compose ps

# Should show all services as "healthy"
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 🔧 Development Workflow

### Making Code Changes

After modifying code, rebuild and restart the affected service:

```bash
# Backend changes
docker-compose build backend
docker-compose up -d backend

# Frontend changes
docker-compose build frontend
docker-compose up -d frontend

# Both changed
docker-compose build
docker-compose up -d
```

### Database Operations

**View database logs:**
```bash
docker-compose logs postgres
```

**Connect to database:**
```bash
docker-compose exec postgres psql -U postgres -d clubnightlife
```

**Run SQL queries:**
```bash
docker-compose exec postgres psql -U postgres -d clubnightlife -c "SELECT * FROM clubs;"
```

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U postgres clubnightlife > backup_$(date +%Y%m%d).sql
```

**Restore database:**
```bash
cat backup_20240101.sql | docker-compose exec -T postgres psql -U postgres -d clubnightlife
```

### Redis Operations

**Connect to Redis CLI:**
```bash
docker-compose exec redis redis-cli
```

**Check cache stats:**
```bash
docker-compose exec redis redis-cli INFO stats
```

**Clear cache:**
```bash
docker-compose exec redis redis-cli FLUSHALL
```

## 📊 Monitoring & Debugging

### View All Logs

```bash
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00
```

### Check Container Resource Usage

```bash
docker stats
```

### Inspect Container

```bash
# Get container details
docker inspect clubnightlife-backend

# Check environment variables
docker inspect clubnightlife-backend | grep -A 20 "Env"
```

### Execute Commands in Container

```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh

# Run node command
docker-compose exec backend node -v
```

## 🛑 Stopping & Cleaning

### Stop Services

```bash
# Stop all services (keeps volumes)
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove all stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Nuclear option: remove everything
docker system prune -a --volumes
```

## 🔒 Security Best Practices

### 1. Environment Variables

**Never commit .env to git!**

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

### 2. Strong Passwords

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Generate strong database password
openssl rand -base64 24
```

### 3. Non-Root Users

Both frontend and backend containers run as non-root users (`nodejs` and `nextjs`).

### 4. Network Isolation

Services communicate only through internal Docker network. External access only via exposed ports.

## 📦 Image Optimization

Our Docker images are optimized for production:

### Backend Image Features
- Multi-stage build (separate build & runtime)
- Alpine Linux base (~50MB vs ~1GB)
- Only production dependencies
- npm cache cleaned
- TypeScript compiled to JavaScript
- Non-root user execution

### Frontend Image Features
- Multi-stage build (deps → build → runtime)
- Next.js standalone output (~100MB vs ~500MB)
- Static assets optimized
- Alpine Linux base
- Non-root user execution
- Telemetry disabled

### Check Image Sizes

```bash
docker images | grep clubnightlife
```

Expected sizes:
- `backend`: ~150-200MB
- `frontend`: ~150-250MB
- `postgres:15-alpine`: ~230MB
- `redis:7-alpine`: ~30MB

## 🌐 Production Deployment

### Option 1: VPS Deployment (DigitalOcean, AWS EC2, etc.)

**1. Provision server:**
```bash
# Minimum requirements
- 2 vCPUs
- 4GB RAM
- 25GB SSD
- Ubuntu 22.04 LTS
```

**2. Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

**3. Clone repository:**
```bash
git clone https://github.com/yourusername/clubnightlife.git
cd clubnightlife
```

**4. Configure environment:**
```bash
cp .env.docker .env
nano .env

# Update:
# - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# - Production Stripe keys
# - Strong secrets
```

**5. Deploy:**
```bash
docker-compose build
docker-compose up -d
```

**6. Setup SSL with Nginx reverse proxy:**
```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configure proxy
sudo nano /etc/nginx/sites-available/clubnightlife
```

**Nginx config example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**7. Get SSL certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Option 2: Docker Swarm (Multiple Servers)

```bash
# Initialize swarm on manager node
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml clubnightlife

# Scale services
docker service scale clubnightlife_backend=3
```

### Option 3: Kubernetes

See `k8s/` directory for Kubernetes manifests (coming soon).

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build images
        run: docker-compose build

      - name: Push to registry
        run: |
          docker tag clubnightlife-backend:latest registry.yourdomain.com/backend:latest
          docker push registry.yourdomain.com/backend:latest

      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## ⚠️ Troubleshooting

### Issue: Cannot connect to database

**Check database is running:**
```bash
docker-compose ps postgres
```

**Check database logs:**
```bash
docker-compose logs postgres
```

**Verify connection string in .env:**
```bash
DATABASE_URL=postgresql://postgres:password@postgres:5432/clubnightlife
```

### Issue: Port already in use

**Find process using port:**
```bash
sudo lsof -i :3000
sudo lsof -i :5000
```

**Kill process or change port in .env:**
```bash
FRONTEND_PORT=3001
BACKEND_PORT=5001
```

### Issue: Out of disk space

**Check disk usage:**
```bash
docker system df
```

**Clean up:**
```bash
docker system prune -a
```

### Issue: Container keeps restarting

**Check logs:**
```bash
docker-compose logs --tail=50 backend
```

**Check health:**
```bash
docker inspect clubnightlife-backend | grep -A 10 Health
```

## 📚 Additional Commands

### Update to Latest Code

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d
```

### View Container Details

```bash
# List all containers
docker-compose ps

# View resource usage
docker stats clubnightlife-backend

# Inspect container
docker inspect clubnightlife-backend
```

### Database Migrations

```bash
# Run migration script
docker-compose exec backend npm run migrate

# Or manually
docker-compose exec postgres psql -U postgres -d clubnightlife -f /path/to/migration.sql
```

## 🎯 Performance Optimization

### 1. Enable HTTP/2 and compression in Nginx

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
http2 on;
```

### 2. Increase PostgreSQL max_connections

```bash
# Edit postgres config in docker-compose.yml
command: postgres -c max_connections=200
```

### 3. Configure Redis maxmemory

```bash
# Edit redis config in docker-compose.yml
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## ✅ Deployment Checklist

Before going to production:

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Configure production Stripe keys
- [ ] Set correct `NEXT_PUBLIC_API_URL`
- [ ] Configure email service (SendGrid)
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Test all critical flows
- [ ] Load test API endpoints
- [ ] Review security headers
- [ ] Set up log rotation

---

**🎉 Your Club Nightlife SaaS is now running in Docker!**

For issues or questions, check logs or contact support.
