# Rule: Testing

> Estado actual (Fase 0): solo 1 test file. **Es deuda crítica que se cierra en Fase 0/1**.

## Estrategia

### Pirámide objetivo

```
        E2E (Playwright)
           5%
       ┌───────────┐
      Integration tests
       (supertest + DB real)
              30%
   ┌────────────────────────┐
        Unit tests (Jest)
       (services + utils)
              65%
   ┌────────────────────────────┐
```

- **65% unit tests**: services con DB mockeada o pool real con DB de test
- **30% integration tests**: endpoints completos con supertest, DB real con setUp/tearDown
- **5% E2E**: flows críticos (registro club → login → check-in → loyalty)

### Tests obligatorios (Definition of Done)

Cualquier PR con cambios en backend services o controllers **DEBE incluir**:

1. **Cross-tenant denial test** (si toca tabla con `club_id`)
2. **RBAC denial test** (si es endpoint con `restrictTo`)
3. **Happy path test** del flow afectado
4. **Validation rejection test** (Zod schema valida correctamente)

Cualquier PR con cambios en `points_history` o `club_members.points_balance`:
5. **Ledger integrity test** (balance = SUM del ledger)

## Estructura de tests

```
backend/src/__tests__/
├── helpers/
│   ├── testDb.ts         # setUp/tearDown DB de test
│   ├── factories.ts      # createTestClub, createTestUser, createTestMember
│   └── auth.ts           # signTestJwt
├── auth.test.ts          # ya existe
├── multitenancy.test.ts  # CRÍTICO — crear en Fase 0
├── rbac.test.ts          # crear en Fase 1
├── loyalty.test.ts       # crear en Fase 3
└── services/
    ├── membersService.test.ts
    ├── visitsService.test.ts
    └── transactionsService.test.ts
```

## Patrones

### Setup con DB real (recomendado para integration tests)

```ts
import { setupTestDb, teardownTestDb } from './helpers/testDb';

beforeAll(async () => {
  await setupTestDb(); // crea DB de test, corre migrations
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await pool.query('TRUNCATE clubs CASCADE'); // limpia entre tests
});
```

### Factory pattern para datos de test

```ts
// helpers/factories.ts
export async function createTestClub(overrides = {}) {
  const result = await pool.query(
    `INSERT INTO clubs (name, slug, email) VALUES ($1, $2, $3) RETURNING *`,
    [overrides.name || 'Test Club', overrides.slug || `test-${uuid()}`, 'test@test.com']
  );
  return result.rows[0];
}

export async function createTestUser(clubId: string, role = 'admin') { ... }
export async function createTestMember(clubId: string) { ... }
```

### Cross-tenant denial pattern

```ts
import { createTestClub, createTestMember, signTestJwt } from './helpers';
import request from 'supertest';
import app from '../server';

describe('Multi-tenant isolation', () => {
  it('rejects cross-club member access', async () => {
    const clubA = await createTestClub();
    const clubB = await createTestClub();
    const memberB = await createTestMember(clubB.id);
    const tokenA = signTestJwt({ clubId: clubA.id, role: 'admin' });

    const res = await request(app)
      .get(`/api/clubs/${clubA.id}/members/${memberB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404); // no leak de info "exists"
  });

  it('rejects cross-club update visit', async () => {
    // Test C1 regression
  });

  it('rejects cross-club refund', async () => {
    // Test C2 regression
  });
});
```

### RBAC denial pattern

```ts
describe('RBAC: DELETE /members', () => {
  const denied = ['bartender', 'doorman', 'security', 'staff'];
  denied.forEach(role => {
    it(`denies ${role}`, async () => {
      const club = await createTestClub();
      const user = await createTestUser(club.id, role);
      const member = await createTestMember(club.id);
      const token = signTestJwt({ userId: user.id, clubId: club.id, role });

      const res = await request(app)
        .delete(`/api/clubs/${club.id}/members/${member.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
```

### Ledger integrity pattern (Fase 3+)

```ts
it('balance equals sum of ledger after credit + debit', async () => {
  const { clubId, memberId } = await setup();
  await loyaltyService.creditPoints(clubId, memberId, 100, 'test', actorId);
  await loyaltyService.creditPoints(clubId, memberId, 50, 'test', actorId);
  await loyaltyService.debitPoints(clubId, memberId, 30, 'test', actorId);

  const balance = await loyaltyService.getBalance(clubId, memberId);
  const sum = await pool.query(
    'SELECT SUM(delta)::int AS total FROM points_history WHERE member_id = $1',
    [memberId]
  );
  expect(balance).toBe(120);
  expect(sum.rows[0].total).toBe(120);
});
```

## Reglas no negociables

### R1. Tests NO comparten estado

Cada test crea sus propios datos. NO confiar en orden de ejecución ni en datos de tests previos.

### R2. Tests NO tocan APIs externas reales

Mockear Resend, Twilio, Paddle. Usar `jest.mock()` o `nock`.

### R3. Tests NO loggean PII

Si fallan, error messages NO incluyen emails, teléfonos, QR tokens reales. Usar UUIDs de test (`test-${uuid()}`).

### R4. Cobertura mínima por área (objetivo Fase 1)

| Área | Min coverage |
|---|---|
| `middleware/auth.ts`, `middleware/tenant.ts` | 90% |
| `services/auditService.ts` | 80% |
| `services/loyaltyService.ts` (Fase 3) | 90% |
| Otros services | 60% |
| Controllers | 50% (mayoría es delegate al service) |
| Utils | 70% |

### R5. CI corre tests en cada PR

`.github/workflows/ci.yml` con job `test`. Fail si tests fallan.

### R6. No `it.skip` ni `xit` en main

Si un test no funciona, fixearlo o eliminarlo, no skipearlo.

## Comandos

```bash
# Run all
cd backend && npm test

# Run specific file
npm test -- multitenancy.test

# Watch mode (dev)
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Frontend testing (futuro)

Hoy 0 tests en frontend. Estrategia futura:

- **Component tests** con React Testing Library
- **E2E con Playwright**: flows críticos (registro, check-in, points)

Empezar tras MVP estable (post-Fase 4).

## Referencias

- Test actual: `backend/src/__tests__/auth.test.ts`
- Jest config: `backend/package.json` (script `test`) o `jest.config.js`
- DB pool: `backend/src/config/database.ts`
