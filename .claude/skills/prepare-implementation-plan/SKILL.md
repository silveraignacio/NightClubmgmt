---
name: prepare-implementation-plan
description: Convierte una recomendación, ADR aprobado, o feature design en un plan de implementación paso a paso. Use después de /design-feature o cuando un ADR pasa a Accepted y hay que ejecutarlo.
---

# /prepare-implementation-plan

## Cuándo usar

- Después de `/design-feature` cuando ya hay diseño aprobado
- Cuando un ADR pasa de `Proposed` a `Accepted` y hay que ejecutarlo
- Cuando una recomendación del audit pasa a "vamos a hacerla"
- Cuando se cierra una fase y hay que arrancar la siguiente

## Qué hace

Toma un diseño/decisión y produce:

- Lista de tasks atómicas en orden
- Dependencias entre tasks
- Criterios de aceptación por task
- Estimación por task
- Plan de testing
- Risk mitigation

## Pasos

### 1. Recibir input
El usuario puede pasarte:
- Path a un design doc (`docs/design/feature-xxx.md`)
- ADR (`docs/architecture/adr/ADR-XXX-yyy.md`)
- Recomendación del audit (`docs/audit/PLATFORM_AUDIT.md#problema-Z`)
- Descripción libre

### 2. Leer y entender el alcance
- ¿Qué archivos toca?
- ¿Qué dependencias tiene (otras fases, otros componentes)?
- ¿Hay decisiones pendientes? (si sí: bloquear, pedir clarificación)

### 3. Descomponer en tasks atómicas

Cada task debe ser:
- **Atómica**: ~1-4h de trabajo, completable en una sesión
- **Verificable**: tiene criterio de aceptación claro
- **Testeable**: idealmente un test prueba que funciona

Ejemplo (feature: ABM empleados con invitación email):

```markdown
## Tasks

### Backend

1. **Crear migration `00X_employee_invitations.sql`** (15 min)
   - Tabla con campos: id, club_id, email, role, token, invited_by, accepted_at, expires_at
   - Índices: token (unique), club_id
   - Acceptance: `docker-compose exec postgres psql -c '\d employee_invitations'` muestra la tabla

2. **Crear `invitationsService.ts`** (2h)
   - Métodos: `create`, `getByToken`, `markAccepted`, `expire`
   - Tenant-safe: todas las queries filtran por `club_id`
   - Acceptance: tests unitarios pasan

3. **Crear `invitationsController.ts`** (1h)
   - POST `/api/clubs/:clubId/employees/invite`
   - GET `/api/auth/invitations/:token` (público)
   - POST `/api/auth/accept-invitation`
   - Acceptance: postman test del flow completo

4. **Crear `routes/invitations.ts`** (30 min)
   - Middleware chain correcto
   - validate(schemas)
   - restrictTo('admin') para invite
   - Acceptance: smoke test con curl

5. **Email template + envío** (1.5h)
   - Resend integration en `notificationService.ts`
   - Template HTML/text
   - Acceptance: invite real recibido en inbox de test

6. **Tests** (2h)
   - Cross-tenant denial
   - RBAC denial (bartender no puede invitar)
   - Token expiration
   - Token reuse rejection
   - Acceptance: `npm test -- invitations` passes

### Frontend

7. **Página `/admin/employees`** (3h)
   - Lista de empleados activos + invitaciones pendientes
   - Botón "Invitar"
   - Modal con form (email + role)
   - Acceptance: manual smoke test

8. **Página `/accept-invite`** (2h)
   - Pública (no requiere auth)
   - Validar token via API
   - Form con password + confirm
   - Acceptance: completar invite genera login automático

### Docs

9. **Actualizar `rbac-matrix.md`** (15 min)
   - Agregar endpoints nuevos

10. **Actualizar `PROJECT_STATUS.md`** (15 min)
    - Marcar Fase 2 task como done
```

### 4. Identificar dependencias

```
[1] migration → [2] service → [3] controller → [4] route → [7,8] frontend
[5] email infra → [3] controller
[6] tests → [1,2,3,4,5]
[9,10] docs → todos cerrados
```

### 5. Calcular esfuerzo total

```
| Tasks | Total |
|---|---|
| Backend (1-6) | ~7.5h |
| Frontend (7-8) | ~5h |
| Docs (9-10) | ~30min |
| **Total** | **~13h (2 días de dev)** |
```

### 6. Plan de testing

```markdown
## Testing Plan

### Unit
- invitationsService methods isolated

### Integration
- POST /invite → verify DB row created
- POST /accept-invitation → verify user created + token marked

### E2E (manual smoke)
- Login admin → /admin/employees → invite doorman → check email → click link → set password → login as doorman → access /admin/door

### Security
- Cross-tenant: admin de club A no puede invitar para club B (403)
- RBAC: bartender no puede invitar (403)
- Token: usado dos veces falla (409)
- Token: expirado falla (410)
- Rate limit: 5 intentos de accept con token inválido bloqueado
```

### 7. Risk mitigation

```markdown
## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Email no llega (Resend down) | Media | Alta | Fallback: mostrar link en UI también |
| Token brute-forceable | Baja | Alta | Token UUID v4 + rate limit en accept-invitation |
| Invitación sin expirar | Media | Media | expires_at + job que las expira |
| Cross-tenant en token lookup | Baja | Crítico | Tests de cross-tenant obligatorios |
```

### 8. Output final

Crear documento `docs/implementation-plans/PLAN-NAME.md`:

```markdown
# Implementation Plan: [Feature/ADR Name]

**Created**: YYYY-MM-DD
**Based on**: [link to design doc or ADR]
**Estimated effort**: XX h

## Scope
[1 párrafo]

## Tasks
[lista numerada con esfuerzo + acceptance]

## Dependencies
[grafo o lista]

## Testing Plan
[tests]

## Risks
[matriz]

## Acceptance Criteria (whole feature)
- [ ] Tests pasan
- [ ] CI verde
- [ ] Manual smoke test exitoso
- [ ] Docs actualizados
- [ ] PROJECT_STATUS.md actualizado
- [ ] PR mergeado

## Next: empezar con task #1
```

### 9. Recordar al usuario

- Crear branch: `feat/[scope]`
- Trabajar en orden de tasks
- Marcar `TaskCreate/TaskUpdate` para tracking
- Después de cada task: commit + actualizar PROJECT_STATUS si aplica
- Al cerrar todo: PR + invocar `/review-tenant-safety` y `/review-rbac` antes de mergear

## Reglas

### R1. NO empezar a codear hasta tener este plan
Saltar planning = re-trabajo + bugs

### R2. Tasks granulares, no monolíticas
"Implementar feature X" → 1 task gigante = malo
Descomponer en 8-15 tasks de 1-4h c/u = bueno

### R3. Acceptance criteria observables
Cada task tiene un test o comando que verifica que está hecha

### R4. Reusar componentes/patrones existentes
Antes de crear algo nuevo, buscar si ya existe. Ver `.claude/rules/backend.md` para patrones.

### R5. Time estimates honestos
2x el primer estimate es típico. Documentar al cerrar la actual real vs estimada para calibrar futuro.

## Referencias

- Design feature: `/design-feature` skill
- Backend pattern: `.claude/rules/backend.md`
- Testing rule: `.claude/rules/testing.md`
- Pre-merge checks: `/review-tenant-safety`, `/review-rbac`
