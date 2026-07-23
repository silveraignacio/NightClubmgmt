# Rule: Backend

> Express + TS. Patrón Routes → Controllers → Services. Sin ORM.

## Reglas no negociables

### R1. Patrón Routes → Controllers → Services (sin excepciones)

```
routes/      → solo definen endpoints + middlewares (sin lógica)
controllers/ → parse request, llaman service, formatean response
services/    → lógica de negocio + queries SQL, devuelven dominio mapeado
```

❌ **Incorrecto** (lógica en controller):
```ts
export const create = catchAsync(async (req, res) => {
  const { clubId } = req.params;
  const data = req.body;
  const exists = await pool.query('SELECT id FROM ...', [data.email]);
  if (exists.rows.length) throw new AppError('exists', 400);
  // ... más lógica
  res.json(...);
});
```

✅ **Correcto**:
```ts
// controller
export const create = catchAsync(async (req: AuthRequest, res) => {
  const clubId = req.clubId!;
  const result = await membersService.create(clubId, req.body);
  res.status(201).json({ status: 'success', data: result });
});

// service
async create(clubId: string, data: any) {
  const exists = await pool.query(...);
  if (exists.rows.length) throw new AppError('exists', 400);
  // ...
  return this.mapMember(result.rows[0]);
}
```

### R2. Controllers SIEMPRE usan `catchAsync`

```ts
import { catchAsync } from '../utils/errorHandler';

export const create = catchAsync(async (req: AuthRequest, res) => {
  // si throw, errorHandler global lo captura
});
```

NO usar try/catch dentro de controllers. El `catchAsync` lo hace por vos. Solo usar try/catch si necesitás transformar el error.

### R3. Tipo de request: `AuthRequest`

```ts
import { AuthRequest } from '../middleware/auth';

export const myController = catchAsync(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const clubId = req.clubId!;
  // ...
});
```

`AuthRequest` extiende `Request` con `user` y `clubId` poblados por middlewares.

### R4. Response format estándar

```ts
// Success
res.json({ status: 'success', data: result });

// Created
res.status(201).json({ status: 'success', data: result });

// Error (lanzado por AppError, manejado por errorHandler)
throw new AppError('Member not found', 404);
// errorHandler responde: { status: 'fail'|'error', message: 'Member not found' }
```

### R5. Errors via `AppError`, no `Error` plano

```ts
import { AppError } from '../utils/errorHandler';

throw new AppError('Email already in use', 400);
throw new AppError('Member not found', 404);
throw new AppError('Insufficient permissions', 403);
throw new AppError('Server error', 500);
```

`AppError` incluye statusCode → errorHandler responde con HTTP correcto.

### R6. Middleware chain estándar

```ts
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';

router.use(protect); // todas requieren JWT

router.post('/clubs/:clubId/members',
  ensureClubAccess,                     // tenant guard
  restrictTo('admin', 'manager'),       // RBAC
  validate(memberSchema),               // Zod input validation
  membersController.create              // handler
);
```

### R7. Validación Zod en endpoints mutantes (POST/PUT/PATCH/DELETE)

Schema en `backend/src/utils/validators.ts`:
```ts
export const memberRegistrationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
  })
});
```

Aplicar con `validate(schema)` en route.

**Estado actual**: solo 4/12 routes lo usan. Fase 0 cierra el gap.

### R8. Audit log en acciones sensibles

```ts
import { auditService, AuditActionType } from '../services/auditService';

await auditService.logAction(
  AuditActionType.MEMBER_CREATED,
  req.user.id,
  clubId,
  { memberId: result.id, email: result.email },
  req
);
```

Lista de acciones que requieren audit log: ver `.claude/rules/security.md#audit-log-obligatorio`.

### R9. Logs estructurados con Winston (no `console.log`)

```ts
import logger from '../utils/logger';

logger.info('User registered', { userId, clubId });
logger.warn('Rate limit exceeded', { ip, path });
logger.error('Failed to send email', { error: err, recipient });
```

NO `console.log` en producción.

NO loggear PII (emails, teléfonos, QR tokens). Ver `.claude/rules/security.md` R8.

### R10. Mapper snake→camel en services que devuelven datos

```ts
class MembersService {
  private mapMember(row: any) {
    return { id: row.id, clubId: row.club_id, fullName: row.full_name, ... };
  }
  async getById(...) {
    const result = await pool.query(...);
    return this.mapMember(result.rows[0]);
  }
}
```

Estado actual: 3/16 services lo tienen. Fase 1 generaliza con helper.

### R11. Transacciones para operaciones multi-tabla

Ver `.claude/rules/database.md` R9.

### R12. Health endpoint útil

`GET /health` debe checkear DB y Redis:
```ts
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', db: 'up', redis: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'down', error: err.message });
  }
});
```

Estado actual: existe pero no checkea dependencias. Fase 0 lo arregla.

### R13. Rate limiting según sensibilidad

- General: `apiLimiter` (100/min)
- Auth: `authLimiter` (5/15min en prod)
- Scan: `scanLimiter` (60/min) para endpoints de check-in
- Password reset (futuro): `passwordResetLimiter` (3/h)

Aplicar en routes con sensibilidad correspondiente.

## Estructura de service típico

```ts
// services/myService.ts
import pool from '../config/database';
import { AppError } from '../utils/errorHandler';

interface MyEntity {
  id: string;
  clubId: string;
  // ...
}

class MyService {
  private mapEntity(row: any): MyEntity | null {
    if (!row) return null;
    return {
      id: row.id,
      clubId: row.club_id,
      // ...
    };
  }

  async getAll(clubId: string, filters: any) {
    const result = await pool.query(
      'SELECT * FROM my_table WHERE club_id = $1 ORDER BY created_at DESC',
      [clubId]
    );
    return result.rows.map(r => this.mapEntity(r));
  }

  async getById(clubId: string, id: string) {
    const result = await pool.query(
      'SELECT * FROM my_table WHERE id = $1 AND club_id = $2',
      [id, clubId]
    );
    if (!result.rows[0]) throw new AppError('Not found', 404);
    return this.mapEntity(result.rows[0]);
  }

  async create(clubId: string, data: any) {
    // validate, INSERT, audit log, return mapped
  }

  async update(clubId: string, id: string, data: any) {
    // verify ownership, UPDATE with club_id in WHERE
  }

  async delete(clubId: string, id: string) {
    // soft-delete recomendado
  }
}

export default new MyService();
```

## Estructura de controller típico

```ts
// controllers/myController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/errorHandler';
import myService from '../services/myService';
import { auditService, AuditActionType } from '../services/auditService';

export const getAll = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const result = await myService.getAll(clubId, req.query);
  res.json({ status: 'success', data: result });
});

export const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const result = await myService.create(clubId, req.body);
  await auditService.logAction(
    AuditActionType.SOMETHING_CREATED,
    req.user.id,
    clubId,
    { entityId: result.id },
    req
  );
  res.status(201).json({ status: 'success', data: result });
});
```

## Estructura de route típica

```ts
// routes/my.ts
import express from 'express';
import * as myController from '../controllers/myController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { mySchema } from '../utils/validators';

const router = express.Router();
router.use(protect);

router.route('/clubs/:clubId/my-entities')
  .get(ensureClubAccess, myController.getAll)
  .post(ensureClubAccess, restrictTo('admin', 'manager'), validate(mySchema), myController.create);

router.route('/clubs/:clubId/my-entities/:id')
  .get(ensureClubAccess, myController.getById)
  .patch(ensureClubAccess, restrictTo('admin', 'manager'), myController.update)
  .delete(ensureClubAccess, restrictTo('admin'), myController.delete);

export default router;
```

Y registrar en `server.ts`:
```ts
import myRoutes from './routes/my';
app.use('/api', myRoutes);
```

## Referencias

- Server entry: `backend/src/server.ts`
- Middleware: `backend/src/middleware/{auth.ts, tenant.ts, validation.ts}`
- Error handler: `backend/src/utils/errorHandler.ts`
- Logger: `backend/src/utils/logger.ts`
- Validators: `backend/src/utils/validators.ts`
- Audit service: `backend/src/services/auditService.ts`
- Ejemplo completo: `backend/src/{routes,controllers,services}/members*`
