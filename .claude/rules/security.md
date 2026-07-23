# Rule: Security

> Las decisiones de seguridad están por encima de la conveniencia. Cuando hay duda, restringir.

## Reglas no negociables

### R1. Secrets nunca en código ni commits

❌ Nunca:
- Hardcodear `JWT_SECRET`, claves de DB, tokens de Paddle/Stripe en código
- Commitear `.env` (debe estar en `.gitignore`)
- Pegar secrets en mensajes de commit, PR descriptions o issues

✅ Sí:
- `process.env.JWT_SECRET` en código
- `.env.example` con placeholders y comentarios
- Validar al startup que las vars requeridas existen y abortar si no

### R2. Bcrypt para passwords, JWT para sesiones

- Passwords: `bcrypt.hash(password, 10)` (saltRounds=10 mínimo)
- JWT con `HS256` y `JWT_SECRET` de mínimo 256 bits
- Access token: 15 min (Fase 1+)
- Refresh token: 7 días, en Redis con blacklist

### R3. Helmet activo siempre

```ts
app.use(helmet());
```
En `backend/src/server.ts:38`. NO desactivar para "fácil debugging".

### R4. CORS estricto en producción

```ts
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  // localhost solo en dev
];
```
Validar `origin` contra whitelist. Permitir todos los subdomains de `ROOT_DOMAIN` para subdomain routing.

Ver `backend/src/server.ts:40-71`.

### R5. Rate limiters obligatorios

| Endpoint | Limiter | Window | Max |
|---|---|---|---|
| `/api/*` general | `apiLimiter` | 1 min | 100 |
| `/api/auth/login`, `/api/auth/register/*` | `authLimiter` | 15 min | 5 (prod) / 1000 (dev) |
| `/api/clubs/:id/visits` (scan) | `scanLimiter` | 1 min | 60 |
| `/api/auth/password-reset` (futuro) | `passwordResetLimiter` | 1h | 3 |

En desarrollo (`NODE_ENV=development`) los limiters se saltean (`skip: () => isDev`).

### R6. Validación de input con Zod en TODOS los endpoints mutantes

❌ Sin validación:
```ts
router.post('/clubs/:clubId/members', controller.create);
```

✅ Con validación:
```ts
router.post('/clubs/:clubId/members',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(memberRegistrationSchema),
  controller.create
);
```

Schemas en `backend/src/utils/validators.ts`. Middleware en `backend/src/middleware/validation.ts`.

### R7. Sanitización contra NoSQL/SQL injection

- `express-mongo-sanitize` activo (aunque usamos Postgres, defensa extra)
- `hpp` contra HTTP parameter pollution
- `pool.query(sql, params)` SIEMPRE con parámetros, NUNCA concatenación de strings

❌ **Prohibido**:
```ts
pool.query(`SELECT * FROM members WHERE email = '${email}'`)
```

✅ **Correcto**:
```ts
pool.query('SELECT * FROM members WHERE email = $1', [email])
```

### R8. No loggear PII en producción

❌ **Prohibido**:
```ts
logger.info(`User logged in: ${email}, phone: ${phone}, QR: ${qrCodeId}`);
```

✅ **Correcto**:
```ts
logger.info('User logged in', { userId: user.id }); // solo IDs
```

PII = email, teléfono, full_name, dirección, date_of_birth, QR tokens.

### R9. Errores genéricos para usuarios, detalle solo en logs

❌ **Prohibido**:
```ts
res.status(500).json({ error: err.stack });
```

✅ **Correcto**:
```ts
logger.error('Failed to process payment', { error: err, userId: req.user.id });
res.status(500).json({ status: 'error', message: 'An error occurred. Please try again.' });
```

Ver `backend/src/utils/errorHandler.ts`.

### R10. Webhooks externos requieren signature verification

Cualquier endpoint `/api/webhooks/*` (Paddle, Stripe, etc.):
1. Lee header de signature (ej: `Paddle-Signature`)
2. Verifica HMAC con secret compartido
3. Si falla: 401 + audit log de "suspicious webhook attempt"

```ts
const signature = req.headers['paddle-signature'];
const expected = crypto.createHmac('sha256', PADDLE_WEBHOOK_SECRET)
  .update(rawBody).digest('hex');
if (signature !== expected) {
  await auditService.logAction(AuditActionType.SUSPICIOUS_ACTIVITY, ...);
  return res.status(401).end();
}
```

### R11. JWT validation completa

`middleware/auth.ts:protect` valida:
1. Token presente en `Authorization: Bearer ...`
2. Firma válida con `JWT_SECRET`
3. No expirado
4. `userId` existe en DB y está activo
5. Si JWT tiene `clubId`, el club existe y está activo

Si falla cualquiera: 401 + audit log.

### R12. HTTPS obligatorio en producción

- Frontend: Vercel/Cloudflare termina TLS
- Backend: detrás de reverse proxy con TLS
- Cookies con `Secure` flag
- `app.set('trust proxy', 1)` para Express

## Audit log obligatorio

Las siguientes acciones DEBEN generar row en `audit_logs`:

| Acción | Quién la dispara | Severity |
|---|---|---|
| `LOGIN_SUCCESS` | authController | info |
| `LOGIN_FAILED` | authController | warning |
| `REGISTRATION` | authController | info |
| `LOGOUT` | authController | info |
| `MEMBER_CREATED/UPDATED/DELETED` | membersController | info |
| `EMPLOYEE_INVITED` | (Fase 2) | info |
| `EMPLOYEE_ACTIVATED` | (Fase 2) | info |
| `ROLE_CHANGED` | (Fase 2) | warning |
| `POINTS_MANUAL_ADJUSTMENT` | (Fase 3) | warning |
| `TRANSACTION_REFUNDED` | transactionsController | warning |
| `CLUB_SETTINGS_CHANGED` | (Fase 2) | info |
| `UNAUTHORIZED_ACCESS_ATTEMPT` | tenant middleware | warning |
| `RATE_LIMIT_EXCEEDED` | rateLimiter handler | warning |
| `SUSPICIOUS_ACTIVITY` | webhook handlers | critical |

Usar `auditService.logAction(action, userId, clubId, metadata, req)`.

## Cómo verificar cumplimiento

1. **Grep secrets**: `git secrets --scan` antes de cada push
2. **Lint**: `eslint` con plugins de seguridad
3. **Tests**: `backend/src/__tests__/security.test.ts` (a crear) con casos como SQL injection attempts, JWT tampering, etc.
4. **Audit log usage**: invocar `/review-rbac` o `tenant-safety-auditor` que también revisa audit logging.

## Referencias

- Middleware: `backend/src/middleware/{auth.ts, validation.ts, rateLimiter.ts}`
- Audit service: `backend/src/services/auditService.ts`
- Error handler: `backend/src/utils/errorHandler.ts`
- Logger: `backend/src/utils/logger.ts`
