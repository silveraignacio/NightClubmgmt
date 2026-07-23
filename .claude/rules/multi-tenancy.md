# Rule: Multi-Tenancy

> Toda la plataforma es multi-tenant. Un club no debe poder leer ni modificar data de otro club. **Bajo ninguna circunstancia**.

## Reglas no negociables

### R1. Toda query con tabla que tenga `club_id` debe filtrar por `club_id` en WHERE

❌ **Incorrecto** (bug real verificado en `visitsService.ts:108` antes de Fase 0):
```ts
await pool.query(
  `UPDATE club_members SET total_visits = total_visits + 1 WHERE id = $1`,
  [memberId]
);
```

✅ **Correcto**:
```ts
await pool.query(
  `UPDATE club_members SET total_visits = total_visits + 1
   WHERE id = $1 AND club_id = $2`,
  [memberId, clubId]
);
```

**Aplica a**: SELECT, UPDATE, DELETE, INSERT con subqueries. Sin excepciones.

### R2. El `clubId` viene del JWT, NUNCA del body o query del cliente

❌ **Incorrecto**:
```ts
const { clubId, memberId } = req.body;
await service.delete(clubId, memberId);
```

✅ **Correcto**:
```ts
const clubId = req.clubId!; // viene de middleware ensureClubAccess
const { memberId } = req.body;
await service.delete(clubId, memberId);
```

El frontend puede enviar `clubId` para conveniencia, pero el backend lo ignora y usa el del JWT.

### R3. Usar middleware `ensureClubAccess` en TODAS las rutas con `:clubId`

```ts
router.get('/clubs/:clubId/members', ensureClubAccess, controller.getAll);
```

Sin `ensureClubAccess`, un usuario con JWT del club A puede acceder a rutas del club B con URL manipulada.

Referencia: `backend/src/middleware/tenant.ts`.

### R4. En endpoints que tocan un recurso específico (members/:id), usar `verifyResourceOwnership`

```ts
router.delete('/clubs/:clubId/members/:memberId',
  ensureClubAccess,
  verifyResourceOwnership('member'),  // valida que member pertenece al club
  controller.delete
);
```

Sin esto, un atacante con club A podría intentar `DELETE /clubs/{clubA}/members/{memberDeClubB}` y si la query interna no filtra por club, se borra el del club B.

### R5. Endpoints públicos por subdomain deben validar slug → clubId

```ts
// frontend/middleware.ts ya extrae el slug del subdomain
// backend/src/routes/clubs.ts expone:
GET /api/clubs/by-slug/:slug → devuelve club info
```

Cualquier endpoint público que toma `:slug` NO confía en él como tenant key, lo resuelve a `clubId`.

### R6. Tests obligatorios de cross-tenant denial

Cada PR que toca un service o endpoint multi-tenant requiere test en `backend/src/__tests__/multitenancy.test.ts`:

```ts
it('rejects access to other club member', async () => {
  const clubA = await createTestClub();
  const clubB = await createTestClub();
  const memberB = await createMember(clubB.id);
  const tokenA = signJwt({ clubId: clubA.id, role: 'admin' });
  
  const res = await request(app)
    .get(`/api/clubs/${clubA.id}/members/${memberB.id}`)
    .set('Authorization', `Bearer ${tokenA}`);
  
  expect(res.status).toBe(404); // not 200, not 500
});
```

## Patrones útiles

### Helper recomendado (Fase 1): `tenantQuery`

```ts
// backend/src/utils/tenantQuery.ts (a crear en Fase 1)
export async function tenantQuery(clubId: string, sql: string, params: any[]) {
  if (!sql.match(/club_id\s*=/i) && !sql.match(/^\s*INSERT/i)) {
    throw new Error('Query without club_id filter on tenant-scoped table');
  }
  return pool.query(sql, params);
}
```

### Postgres RLS (Fase 7, defense-in-depth)

```sql
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON club_members
  USING (club_id = current_setting('app.club_id', true)::uuid);
```

Backend setea `SET LOCAL app.club_id = $clubId` al inicio de cada transacción.

## Cómo verificar cumplimiento

1. **Grep manual antes de PR**:
   ```bash
   grep -rn "pool.query.*UPDATE\|pool.query.*DELETE" backend/src/services/ | grep -v "club_id"
   ```
   Resultado esperado: solo INSERTs o queries con WHERE no-tenant (ej: tabla `audit_logs` se filtra distinto).

2. **Invocar agent**: `/review-tenant-safety` ejecuta `tenant-safety-auditor` agent que hace análisis completo.

3. **Tests**: `npm test -- multitenancy.test` corre toda la suite de denial.

## Excepciones permitidas (raras)

- **`audit_logs`**: se inserta desde múltiples contextos, el `club_id` puede ser `NULL` si la acción es global (login antes de conocer el club).
- **Tablas globales** (futuro): si alguna vez agregamos tablas sin `club_id` (ej: catálogos compartidos), documentarlo en este archivo.

## Referencias en el código

- Middleware: `backend/src/middleware/auth.ts:88` (`protect`), `backend/src/middleware/tenant.ts` (`ensureClubAccess`, `verifyResourceOwnership`)
- Ejemplo correcto: `backend/src/services/membersService.ts:122` — `WHERE cm.id = $1 AND cm.club_id = $2`
- Ejemplo correcto: `backend/src/services/visitsService.ts:71` — `WHERE qr_code_id = $1 AND club_id = $2`
