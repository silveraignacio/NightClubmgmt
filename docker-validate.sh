#!/bin/bash

# Docker Deployment Validation Script
# Validates that all required files and configurations are in place

set -e

echo "🔍 Validating Docker deployment configuration..."
echo ""

ERRORS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "📋 Checking required files..."

# Docker files
check_file "docker-compose.yml"
check_file "backend/Dockerfile"
check_file "frontend/Dockerfile"
check_file "backend/.dockerignore"
check_file "frontend/.dockerignore"

# Environment files
if check_file ".env"; then
    echo "  Checking .env values..."

    # Check critical environment variables
    if ! grep -q "JWT_SECRET=CHANGE_ME" .env; then
        echo -e "  ${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "  ${YELLOW}⚠${NC} JWT_SECRET needs to be changed from default"
        ERRORS=$((ERRORS + 1))
    fi

    if ! grep -q "POSTGRES_PASSWORD=CHANGE_ME" .env; then
        echo -e "  ${GREEN}✓${NC} POSTGRES_PASSWORD is set"
    else
        echo -e "  ${YELLOW}⚠${NC} POSTGRES_PASSWORD needs to be changed from default"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "🏗️  Checking project structure..."

# Backend structure
check_dir "backend/src"
check_file "backend/package.json"
check_file "backend/tsconfig.json"
check_file "backend/src/server.ts"

# Frontend structure
check_dir "frontend/app"
check_dir "frontend/public"
check_file "frontend/package.json"
check_file "frontend/tsconfig.json"
check_file "frontend/next.config.js"
check_file "frontend/tailwind.config.ts"
check_file "frontend/postcss.config.js"

# Database schema
check_file "database/schema.sql"

echo ""
echo "🔧 Checking Docker availability..."

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed ($(docker --version))"

    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker daemon is running"
    else
        echo -e "${RED}✗${NC} Docker daemon is not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker is not installed"
    echo "  Install from: https://docs.docker.com/get-docker/"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is available"
else
    echo -e "${YELLOW}⚠${NC} Docker Compose is not available"
    echo "  Docker Compose v2 comes bundled with Docker Desktop"
fi

echo ""
echo "📊 Summary"
echo "=========="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can now build and run the Docker containers:"
    echo "  1. Review .env file and set production values"
    echo "  2. Run: docker-compose build"
    echo "  3. Run: docker-compose up -d"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before building Docker images."
    echo ""
    exit 1
fi
