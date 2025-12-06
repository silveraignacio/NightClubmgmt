# Monitoring and Security Features

This document describes the production-ready monitoring and security features implemented in the Club Nightlife backend.

## Table of Contents

1. [Request ID Tracking](#request-id-tracking)
2. [Audit Logging](#audit-logging)
3. [Business Metrics](#business-metrics)
4. [Graceful Shutdown](#graceful-shutdown)
5. [Enhanced Health Check](#enhanced-health-check)

---

## Request ID Tracking

### Overview
Every request is assigned a unique UUID that can be tracked across the entire application lifecycle, including logs, audit trails, and error reports.

### Implementation
- **Middleware**: `/backend/src/middleware/requestId.ts`
- **Location in Stack**: First middleware (before any other middleware)

### Features
- Generates UUID v4 for each request
- Adds `X-Request-ID` response header
- Attaches `req.id` to Request object
- Logs request start and completion with timing
- Accepts existing `X-Request-ID` from client if provided

### Usage
```typescript
import { getRequestId } from '../middleware/requestId';

// In any controller or middleware
const requestId = getRequestId(req);
logger.info('Processing request', { requestId });
```

### Example Log Output
```json
{
  "level": "info",
  "message": "Incoming request",
  "requestId": "a3c4e7f9-123a-4b5c-678d-9e0f1a2b3c4d",
  "method": "POST",
  "url": "/api/members",
  "ip": "192.168.1.1",
  "timestamp": "2025-11-11T10:30:45.123Z"
}
```

---

## Audit Logging

### Overview
Comprehensive audit trail for all critical operations, security events, and data modifications.

### Implementation
- **Service**: `/backend/src/services/auditService.ts`
- **Database Table**: `audit_logs`
- **Migration**: `/database/migrations/001_add_audit_logs.sql`

### Action Types
#### Member Actions
- `member.created` - New member registered
- `member.updated` - Member information updated
- `member.deleted` - Member removed from system
- `member.login` - Member login event
- `member.logout` - Member logout event

#### Visit Actions
- `visit.logged` - Entry scan recorded
- `visit.updated` - Visit information modified

#### Transaction Actions
- `transaction.processed` - Payment/purchase completed
- `transaction.refunded` - Transaction refunded
- `transaction.cancelled` - Transaction cancelled

#### User Actions
- `user.created` - Staff user created
- `user.updated` - Staff user updated
- `user.deleted` - Staff user removed
- `user.login` - Staff login event
- `user.logout` - Staff logout event

#### Security Actions
- `security.unauthorized_access` - Unauthorized access attempt
- `security.invalid_token` - Invalid/expired token used
- `security.rate_limit_exceeded` - Rate limit exceeded
- `security.suspicious_activity` - Suspicious behavior detected

#### Points Actions
- `points.awarded` - Points given to member
- `points.redeemed` - Points spent by member
- `points.adjusted` - Manual point adjustment

### Usage

#### Logging an Action
```typescript
import { auditService, AuditActionType } from '../services/auditService';

await auditService.logAction(
  AuditActionType.MEMBER_CREATED,
  req.user?.id,
  clubId,
  {
    memberId: newMember.id,
    memberName: fullName,
    email,
    qrCodeId,
  },
  req
);
```

#### Retrieving Audit Logs
```typescript
const logs = await auditService.getAuditLogs(clubId, {
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30'),
  action: 'transaction.processed',
  userId: 'user-uuid',
  limit: 100,
  offset: 0,
});
```

#### Getting Security Events
```typescript
const securityEvents = await auditService.getSecurityEvents(clubId, 50);
```

#### Audit Log Statistics
```typescript
const stats = await auditService.getAuditStats(clubId, 30); // Last 30 days
```

### Database Schema
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  user_id UUID,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexed Fields
- `club_id`
- `user_id`
- `action`
- `created_at`
- `request_id`
- Composite index: `(club_id, action, created_at DESC)`

### Data Retention
Audit logs can be automatically cleaned up using the provided function:
```sql
SELECT cleanup_old_audit_logs(); -- Removes logs older than 365 days
```

---

## Business Metrics

### Overview
Comprehensive business intelligence service for tracking revenue, members, and engagement metrics.

### Implementation
- **Service**: `/backend/src/services/metricsService.ts`
- **Routes**: `/backend/src/routes/metrics.ts`

### Available Metrics

#### Revenue Metrics
- **Daily Revenue**: Total revenue for a specific date
- **Monthly Revenue**: Total, count, and average for a month
- **Average Transaction Value**: Mean transaction amount
- **Revenue Trends**: Daily breakdown over period

#### Member Metrics
- **Total Members**: Count of all registered members
- **Active Members**: Members who visited in last N days
- **New Members**: Members registered in last N days
- **Churn Rate**: Percentage of inactive members (60+ days)
- **Retention Rate**: Percentage of returning members
- **Top Members by Spending**: Highest revenue generators
- **Top Members by Visits**: Most frequent visitors

#### Engagement Metrics
- **Daily Visits**: Total visits for specific date
- **Average Visits per Member**: Mean visits across all members
- **Repeat Visit Rate**: Percentage with 2+ visits
- **Visit Trends**: Daily breakdown over period

### API Endpoints

#### 1. Metrics Overview
```
GET /api/clubs/:clubId/metrics/overview?days=30
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "metrics": {
      "revenue": {
        "totalRevenue": 15420.50,
        "transactionCount": 325,
        "averageTransaction": 47.45
      },
      "members": {
        "totalMembers": 842,
        "activeMembers": 312,
        "newMembers": 45,
        "churnRate": 12.35,
        "retentionRate": 78.50
      },
      "engagement": {
        "dailyVisits": 127,
        "avgVisitsPerMember": 3.8,
        "repeatVisitRate": 65.20,
        "avgTransactionValue": 47.45
      },
      "timestamp": "2025-11-11T10:30:00.000Z"
    },
    "period": "30 days"
  }
}
```

#### 2. Revenue Metrics
```
GET /api/clubs/:clubId/metrics/revenue?days=30
```

#### 3. Member Metrics
```
GET /api/clubs/:clubId/metrics/members?days=30
```

#### 4. Engagement Metrics
```
GET /api/clubs/:clubId/metrics/engagement?days=30
```

#### 5. Daily Metrics
```
GET /api/clubs/:clubId/metrics/daily/2025-11-11
```

#### 6. Export Metrics (CSV)
```
GET /api/clubs/:clubId/metrics/export?days=30
```

### Usage Examples

#### TypeScript Client
```typescript
// Get overview metrics
const response = await fetch(
  `/api/clubs/${clubId}/metrics/overview?days=30`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const { data } = await response.json();

// Export to CSV
window.location.href = `/api/clubs/${clubId}/metrics/export?days=30`;
```

#### Service Usage
```typescript
import { metricsService } from '../services/metricsService';

// Track all business metrics
const metrics = await metricsService.trackBusinessMetrics(clubId, 30);

// Get specific metric
const activeMembers = await metricsService.getActiveMembers(clubId, 30);
const dailyRevenue = await metricsService.getDailyRevenue(clubId, new Date());
```

### Authorization
All metrics endpoints require:
- Valid authentication token
- Role: `admin` or `manager`
- User must belong to the club being queried

---

## Graceful Shutdown

### Overview
Proper shutdown handling ensures all connections are closed cleanly and in-flight requests complete before process termination.

### Signals Handled
- `SIGTERM` - Graceful shutdown request
- `SIGINT` - Interrupt signal (Ctrl+C)
- `SIGKILL` - Force kill (cannot be caught, but other signals prevent it)
- `uncaughtException` - Unhandled errors
- `unhandledRejection` - Unhandled promise rejections

### Shutdown Process
1. Stop accepting new connections
2. Complete in-flight requests (30s timeout)
3. Close database connection pool
4. Close Redis connections
5. Log shutdown completion
6. Exit process

### Implementation
```typescript
// In server.ts
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await pool.end();
        logger.info('Database connections closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Benefits
- No data loss from abrupt termination
- Proper cleanup of resources
- Prevents connection leaks
- Better container orchestration (Kubernetes, Docker)
- Cleaner logs for debugging

---

## Enhanced Health Check

### Overview
Improved health check endpoint that verifies all critical services.

### Endpoint
```
GET /health
```

### Response (Healthy)
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Response (Unhealthy)
```json
{
  "status": "error",
  "message": "Service unavailable",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "services": {
    "database": "disconnected"
  }
}
```

### Usage
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Monitoring systems (Datadog, New Relic, etc.)
- Status page integrations

### Kubernetes Configuration
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## Security Best Practices

### Implemented Security Measures

1. **Request Tracking**
   - Every request has unique ID
   - Full audit trail with IP and user agent
   - Correlation across distributed systems

2. **Audit Logging**
   - All sensitive operations logged
   - Security events tracked
   - Compliance-ready (GDPR, SOC2)

3. **Rate Limiting with Alerts**
   - API rate limiting with audit logs
   - Authentication attempt tracking
   - Suspicious activity detection

4. **Error Handling**
   - Uncaught exceptions logged
   - Unhandled rejections caught
   - Graceful degradation

5. **Access Control Logging**
   - Unauthorized access attempts logged
   - Permission violations tracked
   - Token validation events recorded

### Monitoring Recommendations

1. **Set Up Alerts**
   - Rate limit exceeded > 10 times/hour
   - Unauthorized access attempts > 5/hour
   - Invalid token usage > 20/hour
   - Security events clustering

2. **Regular Reviews**
   - Review audit logs weekly
   - Check security events daily
   - Monitor metrics trends

3. **Data Retention**
   - Keep audit logs for 1 year (configurable)
   - Archive old logs to cold storage
   - Comply with data retention policies

---

## Migration Guide

### Database Setup
1. Run the audit_logs migration:
```bash
psql -d your_database < database/migrations/001_add_audit_logs.sql
```

2. Verify table creation:
```sql
SELECT COUNT(*) FROM audit_logs;
```

### Environment Variables
No new environment variables required. Existing variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Testing
```bash
# Test health check
curl http://localhost:5000/health

# Test metrics (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/clubs/CLUB_ID/metrics/overview

# Check audit logs in database
psql -d your_database -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## Troubleshooting

### Issue: Audit logs not being created
**Solution**: Check database connection and verify audit_logs table exists

### Issue: Metrics returning empty data
**Solution**: Ensure transactions and visits tables have data, check date ranges

### Issue: Rate limiting too aggressive
**Solution**: Adjust `RATE_LIMIT_MAX_REQUESTS` environment variable

### Issue: Graceful shutdown not working
**Solution**: Check process signal handling, ensure no process managers override signals

---

## Performance Considerations

1. **Audit Logging**
   - Async operation, doesn't block main flow
   - Failed audit logs don't break application
   - Indexed for fast queries

2. **Metrics Calculation**
   - Database-level aggregations
   - Indexed queries for performance
   - Caching recommended for high traffic

3. **Request ID Tracking**
   - Minimal overhead (UUID generation)
   - String comparison only when needed

---

## Future Enhancements

1. **Metrics Dashboard**
   - Real-time metrics visualization
   - Historical trend analysis
   - Custom date range selection

2. **Advanced Alerting**
   - Webhook integration
   - Email notifications
   - Slack/Discord integration

3. **Metrics Export**
   - Multiple format support (JSON, Excel)
   - Scheduled reports
   - Data warehouse integration

4. **Enhanced Audit Logs**
   - Search and filter UI
   - Audit log replay
   - Compliance reports

---

## Support

For issues or questions about monitoring and security features:
1. Check this documentation
2. Review audit logs for error patterns
3. Check application logs in `/logs` directory
4. Contact development team with request ID for faster debugging
