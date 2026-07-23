# Rule: RBAC (Role-Based Access Control)

> Cada endpoint sensible debe declarar qué roles pueden acceder. Sin excepción.

## Roles definidos

### En tabla `club_users.role` (empleados de un club)

| Rol | Descripción | Permisos típicos |
|---|---|---|
| `admin` | Dueño/co-dueño del club | Full access dentro del club |
| `manager` | Manager operativo | Casi todo excepto billing y settings críticos |
| `bartender` | Empleado de barra | Solo bar UI + scan QR + crear transacciones |
| `doorman` | Empleado de puerta | Solo door UI + scan QR + crear visits + ver guest list |
| `security` | Seguridad | Solo security UI + crear/resolver incidents + ver capacidad |
| `staff` | Genérico (fallback) | Solo lectura + algunas acciones del manager |

### En tabla `club_members` (clientes del club)

| Rol | Descripción |
|---|---|
| `member` | Cliente registrado del club. Auth separado (otra tabla). |

### Futuro (Fase 5)

| Rol | Descripción |
|---|---|
| `promoter` | Empleado externo / PR. Ve solo su guest list y comisiones. |

### Fuera del alcance (no implementado, evaluar más adelante)

| Rol | Descripción |
|---|---|
| `super_admin` | Admin de la plataforma (NightClubmgmt). Por encima de los clubes. NO existe hoy. Si se necesita: tabla `platform_users` separada. |

## Reglas no negociables

### R1. Endpoints sensibles llevan `restrictTo(...roles)`

❌ **Incorrecto**:
```ts
router.delete('/clubs/:clubId/members/:id', ensureClubAccess, controller.delete);
// Cualquier rol autenticado puede borrar miembros
```

✅ **Correcto**:
```ts
router.delete('/clubs/:clubId/members/:id',
  ensureClubAccess,
  restrictTo('admin', 'manager'),  // solo admin y manager
  controller.delete
);
```

### R2. Backend SIEMPRE es la fuente de verdad de permisos

El frontend puede ocultar botones/menús según rol, pero el backend **debe** validar. Un atacante puede hacer la request directa con curl.

### R3. Matriz RBAC documentada y actualizada

`docs/architecture/rbac-matrix.md` (a crear) debe contener:

| Endpoint | admin | manager | bartender | doorman | security | staff |
|---|---|---|---|---|---|---|
| `POST /api/clubs/:id/members` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/clubs/:id/members` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/clubs/:id/members/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/clubs/:id/visits` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `POST /api/clubs/:id/transactions` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /api/clubs/:id/transactions/:id/refund` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/clubs/:id/incidents` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `POST /api/clubs/:id/points/credit` (Fase 3) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/clubs/:id/employees/invite` (Fase 2) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PUT /api/clubs/:id/settings` (Fase 2) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Mantener este doc al día. Cuando se agrega/cambia un endpoint, ACTUALIZAR la matriz.

### R4. Roles en minúscula consistentes

❌ **Inconsistente** (problema actual en frontend):
```ts
if (user.role === 'ADMIN' || user.role === 'admin') { ... }
```

✅ **Correcto**:
```ts
// Backend devuelve siempre lowercase
if (user.role === 'admin') { ... }
```

Backend: enum SQL `('admin','manager','bartender','doorman','staff','security')`.
Frontend: `User.role` tipo `'admin' | 'manager' | 'bartender' | 'doorman' | 'staff' | 'security' | 'member'`.

### R5. Tests RBAC obligatorios

Cada endpoint debe tener test de denial:

```ts
it('denies bartender from deleting members', async () => {
  const club = await createTestClub();
  const bartender = await createUser(club.id, 'bartender');
  const member = await createMember(club.id);
  const token = signJwt({ userId: bartender.id, clubId: club.id, role: 'bartender' });
  
  const res = await request(app)
    .delete(`/api/clubs/${club.id}/members/${member.id}`)
    .set('Authorization', `Bearer ${token}`);
  
  expect(res.status).toBe(403);
});
```

### R6. Frontend filtra UI pero NO confía en eso

```tsx
// frontend/components/Sidebar.tsx
const adminOnlyItems = user.role === 'admin' ? [...] : [];
// OK para UX, pero el backend SIEMPRE re-valida
```

### R7. Cambio de rol genera audit log

```ts
// Fase 2: endpoint PUT /clubs/:id/employees/:id/role
await auditService.logAction(
  AuditActionType.ROLE_CHANGED,
  req.user.id,
  clubId,
  { targetUserId: id, oldRole, newRole }
);
```

### R8. Doorman/security NO ven listas completas de miembros

`GET /api/clubs/:clubId/members` con role `doorman` o `security`:
- Devuelve solo lookup por QR (`GET /members/by-qr/:qrCodeId`) o búsqueda específica.
- No la lista paginada completa.

Decisión a confirmar caso-por-caso, pero **principio de menor privilegio aplica**.

## Patrón de uso

```ts
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';

router.use(protect); // todas las rutas autenticadas

router.post('/clubs/:clubId/members',
  ensureClubAccess,                    // 1. tenant
  restrictTo('admin', 'manager'),      // 2. RBAC
  validate(memberSchema),              // 3. input
  membersController.create             // 4. handler
);
```

## Cómo verificar cumplimiento

1. **Grep endpoints sin restrictTo**:
   ```bash
   grep -rn "router\.\(post\|put\|patch\|delete\)" backend/src/routes/ | grep -v "restrictTo"
   ```
   Resultado: lista de endpoints que pueden necesitar RBAC explícito.

2. **Tests**: `npm test -- rbac.test`

3. **Skill**: `/review-rbac` para auditar un endpoint o feature.

## Referencias

- Middleware: `backend/src/middleware/auth.ts` (`restrictTo`)
- Matriz: `docs/architecture/rbac-matrix.md` (a crear en Fase 1)
- Frontend role logic: `frontend/app/admin/layout.tsx` (redirects por rol)
