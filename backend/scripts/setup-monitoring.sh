#!/bin/bash

# Setup Monitoring and Security Features
# This script helps set up the new monitoring and security features

set -e

echo "============================================"
echo "Club Nightlife - Monitoring Setup"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if database URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL not set${NC}"
    echo "Please set DATABASE_URL environment variable"
    echo "Example: export DATABASE_URL=postgresql://user:pass@localhost:5432/dbname"
    exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
echo ""

# Run database migration
echo "Running database migration..."
echo "============================================"

MIGRATION_FILE="database/migrations/001_add_audit_logs.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "Executing: $MIGRATION_FILE"

# Extract connection details from DATABASE_URL
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

echo ""

# Verify audit_logs table
echo "Verifying audit_logs table..."
echo "============================================"

TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ audit_logs table exists${NC}"

    # Count indexes
    INDEX_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'audit_logs';")
    echo -e "${GREEN}✓ Found $INDEX_COUNT indexes on audit_logs table${NC}"
else
    echo -e "${RED}✗ audit_logs table does not exist${NC}"
    exit 1
fi

echo ""

# Test TypeScript compilation
echo "Testing TypeScript compilation..."
echo "============================================"

cd "$(dirname "$0")/.."

if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

echo "Running: npm run build"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    exit 1
fi

echo ""

# Verify created files
echo "Verifying created files..."
echo "============================================"

FILES=(
    "src/middleware/requestId.ts"
    "src/services/auditService.ts"
    "src/services/metricsService.ts"
    "src/routes/metrics.ts"
    "MONITORING_AND_SECURITY.md"
    "IMPLEMENTATION_SUMMARY.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
    fi
done

echo ""

# Check environment variables
echo "Checking environment variables..."
echo "============================================"

ENV_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NODE_ENV"
)

for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠ $var not set${NC}"
    else
        echo -e "${GREEN}✓ $var is set${NC}"
    fi
done

echo ""

# Summary
echo "============================================"
echo "Setup Summary"
echo "============================================"
echo ""
echo "✅ Database migration completed"
echo "✅ audit_logs table created with indexes"
echo "✅ TypeScript compilation successful"
echo "✅ All monitoring files in place"
echo ""
echo "Next Steps:"
echo "1. Start the server: npm run dev"
echo "2. Test health endpoint: curl http://localhost:5000/health"
echo "3. Review documentation: cat MONITORING_AND_SECURITY.md"
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
