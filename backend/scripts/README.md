# Monitoring Scripts

This directory contains utility scripts for setting up and testing the monitoring and security features.

## Scripts

### 1. setup-monitoring.sh

Sets up the monitoring and security features, including database migration and verification.

**Prerequisites:**
- PostgreSQL database
- Node.js and npm installed
- DATABASE_URL environment variable set

**Usage:**
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/club_nightlife"
./scripts/setup-monitoring.sh
```

**What it does:**
- ✅ Runs the audit_logs migration
- ✅ Verifies table creation and indexes
- ✅ Tests TypeScript compilation
- ✅ Checks all required files exist
- ✅ Validates environment variables

### 2. test-monitoring.sh

Tests all monitoring endpoints and features.

**Prerequisites:**
- Server running
- AUTH_TOKEN for authenticated endpoints (optional)
- CLUB_ID for metrics endpoints (optional)
- DATABASE_URL for audit log checks (optional)

**Usage:**

Basic health check only:
```bash
./scripts/test-monitoring.sh
```

Full test suite:
```bash
export BASE_URL="http://localhost:5000"
export AUTH_TOKEN="your_jwt_token"
export CLUB_ID="your_club_uuid"
export DATABASE_URL="postgresql://..."
./scripts/test-monitoring.sh
```

**What it tests:**
- ✅ Health check endpoint
- ✅ Request ID header
- ✅ Metrics overview endpoint
- ✅ Revenue metrics endpoint
- ✅ Member metrics endpoint
- ✅ Engagement metrics endpoint
- ✅ Audit logs in database
- ✅ Unauthorized access logging
- ✅ Rate limiting

## Environment Variables

### Required for setup-monitoring.sh
- `DATABASE_URL` - PostgreSQL connection string

### Optional for test-monitoring.sh
- `BASE_URL` - API base URL (default: http://localhost:5000)
- `AUTH_TOKEN` - JWT authentication token
- `CLUB_ID` - Club UUID for metrics testing
- `DATABASE_URL` - PostgreSQL connection for audit log verification

## Examples

### Complete Setup and Test

```bash
# 1. Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/club_nightlife"
export JWT_SECRET="your-secret-key"

# 2. Run setup
./scripts/setup-monitoring.sh

# 3. Start server
npm run dev

# 4. In another terminal, run tests
export AUTH_TOKEN="your_jwt_token"
export CLUB_ID="your_club_uuid"
./scripts/test-monitoring.sh
```

### Quick Health Check

```bash
# Just test if server is running
curl http://localhost:5000/health | jq
```

### Manual Metrics Test

```bash
# Get metrics overview
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/clubs/CLUB_ID/metrics/overview?days=30" | jq

# Export to CSV
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/clubs/CLUB_ID/metrics/export?days=30" \
  -o metrics.csv
```

## Troubleshooting

### Setup Script Fails

**Problem:** Migration fails with "relation already exists"
**Solution:** Table already created, safe to ignore or drop and recreate

**Problem:** TypeScript compilation fails
**Solution:** Run `npm install` first

### Test Script Fails

**Problem:** Connection refused
**Solution:** Ensure server is running on correct port

**Problem:** 401 Unauthorized on metrics endpoints
**Solution:** Set valid AUTH_TOKEN environment variable

**Problem:** 403 Forbidden
**Solution:** Ensure token user has admin or manager role

## Continuous Integration

These scripts can be integrated into CI/CD pipelines:

### GitHub Actions Example
```yaml
- name: Setup Monitoring
  run: ./backend/scripts/setup-monitoring.sh
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Test Monitoring
  run: ./backend/scripts/test-monitoring.sh
  env:
    BASE_URL: http://localhost:5000
```

### Docker Compose Example
```yaml
services:
  backend:
    build: ./backend
    command: |
      sh -c "
        ./scripts/setup-monitoring.sh &&
        npm run start
      "
    environment:
      - DATABASE_URL=postgresql://...
```

## Support

For issues or questions:
1. Check script output for specific errors
2. Review `/backend/MONITORING_AND_SECURITY.md`
3. Check application logs in `/logs` directory
4. Verify database connection and credentials
