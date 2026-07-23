---
name: review-rbac
description: Revisa permisos y roles de un endpoint o feature. Verifica que restrictTo está aplicado correctamente, que la matriz RBAC está actualizada, y que el frontend refleja los permisos del backend. Use al agregar endpoints o cambiar permisos.
---

# /review-rbac

## Cuándo usar

- Al agregar un endpoint nuevo
- Al cambiar permisos de un endpoint existente
- Al agregar/cambiar un rol
- Antes de mergear PR con cambios en `routes/*.ts` o `frontend/app/admin/layout.tsx` (RBAC redirects)

## Qué hace

Verifica para un endpoint o feature:

1. **`restrictTo(...roles)` aplicado** en la route (si el endpoint es sensible)
2. **Roles correctos** según matriz documentada en `docs/architecture/rbac-matrix.md`
3. **Tests de denial** existen en `backend/src/__tests__/rbac.test.ts`
4. **Frontend** oculta UI para roles sin permiso (sin confiar en eso para seguridad)
5. **Audit log** en cambios sensibles (ej: cambio de rol de empleado)

## Pasos

### 1. Pedir scope al usuario
Si invocado sin args, preguntar:
- "¿Qué endpoint o feature querés revisar?"

### 2. Identificar archivos relevantes
Para un endpoint `POST /api/clubs/:clubId/members`:
```bash
grep -rn "members" backend/src/routes/
grep -rn "members" backend/src/controllers/
grep -rn "members" backend/src/__tests__/
```

### 3. Validar checklist

- [ ] Route usa `protect`
- [ ] Route usa `ensureClubAccess` (si tiene `:clubId`)
- [ ] Route usa `restrictTo(...)` con roles apropiados
- [ ] Roles coinciden con matriz en `docs/architecture/rbac-matrix.md`
- [ ] Hay test que verifica que roles no permitidos reciben 403
- [ ] Si la acción es sensible: hay `auditService.logAction(...)` en el controller
- [ ] Frontend (si aplica) oculta el botón/menu para roles sin permiso

### 4. Validar matriz
Leé `docs/architecture/rbac-matrix.md` y verificá que el endpoint está listado. Si no: agregarlo (en el mismo PR).

### 5. Reportar

```markdown
## RBAC Review: [endpoint]

### Checklist
- ✅ `protect` middleware
- ✅ `ensureClubAccess` aplicado
- 🟡 `restrictTo` falta (debería ser admin/manager)
- ❌ No hay test de denial para bartender/doorman
- ✅ Audit log presente
- 🟡 Frontend muestra botón "Delete" para bartender

### Recommendations
1. Agregar `restrictTo('admin', 'manager')` en routes/xxx.ts:LINE
2. Crear test `it('denies bartender from deleting members', ...)`
3. Ocultar botón Delete en frontend para roles != admin/manager
4. Actualizar matriz en docs/architecture/rbac-matrix.md
```

## Roles del sistema

| Rol | Scope |
|---|---|
| `admin` | Full access dentro del club |
| `manager` | Casi todo excepto billing/settings críticos |
| `bartender` | Bar UI, scan QR, crear transacciones |
| `doorman` | Door UI, scan QR, crear visits |
| `security` | Security UI, incidents |
| `staff` | Solo lectura + acciones limitadas |
| `member` | Cliente — endpoints separados (`/auth/login-member`, `/api/members/me`, etc.) |

## Reglas (resumen)

Ver `.claude/rules/rbac.md` para detalle.

- Endpoints sensibles llevan `restrictTo`
- Backend es la fuente de verdad de permisos (frontend solo UX)
- Matriz documentada y actualizada
- Tests de denial obligatorios
- Cambios de rol generan audit log

## Referencias

- Rule: `.claude/rules/rbac.md`
- Matriz: `docs/architecture/rbac-matrix.md`
- Middleware: `backend/src/middleware/auth.ts` (`restrictTo`)
- Ejemplo: `backend/src/routes/members.ts`
