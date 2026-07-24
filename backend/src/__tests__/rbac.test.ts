/**
 * RBAC tests.
 *
 * Verifies that `restrictTo` / `restrictToSelfOrRoles` correctly allow/deny
 * each role for every sensitive endpoint currently wired up in routes/.
 * Tests are data-driven and mirror the actual middleware calls in each
 * routes/*.ts file — when a route's allowed roles change, this spec must be
 * updated to match (see docs/architecture/rbac-matrix.md).
 *
 * These test the middleware in isolation (no HTTP layer, no DB).
 */

// Mock DB before any imports
jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }), connect: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  getClient: jest.fn(),
}));

jest.mock('../services/auditService', () => ({
  __esModule: true,
  auditService: { logAction: jest.fn().mockResolvedValue(undefined) },
  AuditActionType: new Proxy({}, { get: () => 'mock.action' }),
}));

import { restrictTo, restrictToSelfOrRoles, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const ALL_ROLES = ['admin', 'manager', 'bartender', 'doorman', 'security', 'staff', 'member'] as const;
const STAFF_ROLES = ['admin', 'manager', 'doorman', 'bartender'];

function buildReq(role: string, opts: { id?: string; memberId?: string; clubId?: string } = {}): AuthRequest {
  return {
    user: { id: opts.id ?? 'user-1', email: 't@t.com', role, clubId: opts.clubId ?? 'club-A' },
    clubId: opts.clubId ?? 'club-A',
    params: { memberId: opts.memberId },
    headers: {},
    originalUrl: '/test',
    url: '/test',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as any;
}

function runMiddleware(middleware: any, req: any): Promise<any> {
  return new Promise((resolve) => {
    const res = {} as Response;
    const next: NextFunction = (err?: any) => resolve(err);
    Promise.resolve(middleware(req, res, next));
  });
}

interface EndpointSpec {
  name: string;
  allowed: string[];
}

function denied(allowed: string[]): string[] {
  return ALL_ROLES.filter((r) => !allowed.includes(r));
}

// Endpoints that use plain restrictTo(...). Mirrors routes/members.ts,
// routes/transactions.ts, routes/visits.ts, routes/rewards.ts, routes/clubs.ts.
const endpoints: EndpointSpec[] = [
  // ── Members ──────────────────────────────────────────────────────────────
  { name: 'GET /members', allowed: STAFF_ROLES },
  { name: 'POST /members', allowed: ['admin', 'manager'] },
  { name: 'GET /members/export', allowed: ['admin', 'manager'] },
  { name: 'DELETE /members/:id', allowed: ['admin', 'manager'] },
  { name: 'GET /members/by-qr/:qrCodeId', allowed: STAFF_ROLES },

  // ── Transactions ─────────────────────────────────────────────────────────
  { name: 'POST /transactions', allowed: ['admin', 'manager', 'bartender'] },

  // ── Visits ───────────────────────────────────────────────────────────────
  { name: 'GET /visits', allowed: ['admin', 'manager', 'doorman'] },
  { name: 'POST /visits', allowed: ['admin', 'manager', 'doorman'] },

  // ── Rewards ──────────────────────────────────────────────────────────────
  { name: 'POST /rewards/:id/redeem', allowed: ['member'] },
  { name: 'GET /members/me/redeemed-rewards', allowed: ['member'] },

  // ── Clubs ────────────────────────────────────────────────────────────────
  { name: 'GET /clubs/:id', allowed: ['admin', 'manager'] },
  { name: 'PATCH /clubs/:id (settings)', allowed: ['admin'] },

  // ── Employees ────────────────────────────────────────────────────────────
  { name: 'GET /employees', allowed: ['admin'] },
  { name: 'POST /employees/invite', allowed: ['admin'] },
  { name: 'GET /employees/invitations', allowed: ['admin'] },
  { name: 'DELETE /employees/invitations/:id', allowed: ['admin'] },
  { name: 'DELETE /employees/:userId', allowed: ['admin'] },

  // ── Incidents ────────────────────────────────────────────────────────────
  { name: 'GET /incidents', allowed: ['admin', 'manager', 'security'] },
  { name: 'GET /incidents/tonight', allowed: ['admin', 'manager', 'security'] },
  { name: 'GET /incidents/:id', allowed: ['admin', 'manager', 'security'] },
  { name: 'GET /incidents/stats', allowed: ['admin', 'manager'] },
  { name: 'POST /incidents', allowed: ['admin', 'manager', 'security'] },
  { name: 'PUT /incidents/:id', allowed: ['admin', 'manager', 'security'] },
  { name: 'POST /incidents/:id/resolve', allowed: ['admin', 'manager'] },

  // ── Events ───────────────────────────────────────────────────────────────
  // GET /events and GET /events/:id have no restrictTo (open to any
  // authenticated club user, per rbac-matrix.md) — not represented here.
  { name: 'POST /events', allowed: ['admin', 'manager'] },
  { name: 'PUT /events/:id', allowed: ['admin', 'manager'] },
  { name: 'DELETE /events/:id', allowed: ['admin', 'manager'] },
  { name: 'POST /events/:id/attendance/:memberId', allowed: ['admin', 'manager', 'bartender'] },
];

describe('RBAC: restrictTo middleware', () => {
  endpoints.forEach((spec) => {
    describe(spec.name, () => {
      const deniedRoles = denied(spec.allowed);

      spec.allowed.forEach((role) => {
        it(`allows ${role}`, async () => {
          const mw = restrictTo(...spec.allowed);
          const err = await runMiddleware(mw, buildReq(role));
          expect(err).toBeUndefined();
        });
      });

      deniedRoles.forEach((role) => {
        it(`denies ${role} with 403`, async () => {
          const mw = restrictTo(...spec.allowed);
          const err = await runMiddleware(mw, buildReq(role));
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
        });
      });
    });
  });

  describe('edge cases', () => {
    it('denies request when req.user is missing', async () => {
      const mw = restrictTo('admin');
      const err = await runMiddleware(mw, { headers: {}, ip: '127.0.0.1', socket: {} });
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(403);
    });

    it('denies unknown role not in allowed list', async () => {
      const mw = restrictTo('admin', 'manager');
      const err = await runMiddleware(mw, buildReq('super_admin'));
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(403);
    });

    it('allows all roles in a fully permissive list', async () => {
      const mw = restrictTo(...ALL_ROLES);
      const errors = await Promise.all(ALL_ROLES.map((r) => runMiddleware(mw, buildReq(r))));
      errors.forEach((err) => expect(err).toBeUndefined());
    });
  });
});

// Endpoints that use restrictToSelfOrRoles(...) — mirrors GET/PATCH
// /members/:memberId, /members/:memberId/qr-code, /members/:memberId/stats
// in routes/members.ts. STAFF_ROLES are allowed regardless of whose record it
// is; a `member` role is only allowed when req.user.id === req.params.memberId.
describe('RBAC: restrictToSelfOrRoles middleware', () => {
  const selfOrRolesEndpoints: EndpointSpec[] = [
    { name: 'GET /members/:memberId', allowed: STAFF_ROLES },
    { name: 'GET /members/:memberId/qr-code', allowed: STAFF_ROLES },
    { name: 'GET /members/:memberId/stats', allowed: STAFF_ROLES },
  ];

  selfOrRolesEndpoints.forEach((spec) => {
    describe(spec.name, () => {
      spec.allowed.forEach((role) => {
        it(`allows ${role} accessing another member's record`, async () => {
          const mw = restrictToSelfOrRoles(...spec.allowed);
          const req = buildReq(role, { id: 'staff-1', memberId: 'member-2' });
          const err = await runMiddleware(mw, req);
          expect(err).toBeUndefined();
        });
      });

      denied(spec.allowed).forEach((role) => {
        it(`denies ${role} accessing another member's record`, async () => {
          const mw = restrictToSelfOrRoles(...spec.allowed);
          const req = buildReq(role, { id: 'someone-else', memberId: 'member-2' });
          const err = await runMiddleware(mw, req);
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
        });
      });
    });
  });

  it('allows a member accessing their own record even with no role match', async () => {
    const mw = restrictToSelfOrRoles(...STAFF_ROLES);
    const req = buildReq('member', { id: 'member-2', memberId: 'member-2' });
    const err = await runMiddleware(mw, req);
    expect(err).toBeUndefined();
  });

  it('denies a member accessing someone else\'s record', async () => {
    const mw = restrictToSelfOrRoles(...STAFF_ROLES);
    const req = buildReq('member', { id: 'member-2', memberId: 'member-3' });
    const err = await runMiddleware(mw, req);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });
});
