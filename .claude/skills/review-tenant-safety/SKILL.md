---
name: review-tenant-safety
description: Audita tenant-safety multi-tenant en este codebase. Use when modificando services, controllers, queries SQL, o antes de mergear PRs que tocan datos por-club. Detecta queries sin filtro club_id, endpoints sin ensureClubAccess, y otros riesgos de cross-tenant leak.
---

# /review-tenant-safety

## Cuándo usar

- **Antes de mergear cualquier PR** que toque:
  - `backend/src/services/*.ts`
  - `backend/src/controllers/*.ts`
  - `backend/src/routes/*.ts`
  - `database/migrations/*.sql`
- Cuando modifiques una query SQL (especialmente UPDATE/DELETE)
- Cuando agregues un endpoint nuevo
- Periódicamente (al menos 1x por semana en desarrollo activo)

## Qué hace

Lanza el agent `tenant-safety-auditor` que:

1. Lista los archivos modificados (PR) o todos los services (full audit)
2. Busca queries SELECT/UPDATE/DELETE sin `club_id` en WHERE
3. Valida uso de middleware `ensureClubAccess` y `verifyResourceOwnership`
4. Verifica que el `clubId` viene de `req.clubId` (JWT) y no del body/query
5. Produce reporte con findings críticos / medios / safe

## Cómo invocar

Si el usuario escribe `/review-tenant-safety`:

1. **Determinar scope**:
   - Si menciona "PR" o "branch": revisar diff vs main
   - Si menciona archivo(s) específico(s): revisar esos
   - Si no especifica: revisar todos los services con changes recientes (`git status` + `git diff HEAD~5..HEAD`)

2. **Llamar el agent** `tenant-safety-auditor` con prompt:
   ```
   Auditá tenant-safety en [scope]. Buscá:
   - Queries SQL sin filtro club_id
   - Endpoints sin ensureClubAccess
   - clubId leído de body/query en vez de req.clubId
   Reportá findings críticos con file:line y fix sugerido.
   ```

3. **Mostrar el reporte** al usuario y recomendar acción.

## Pasos

1. **Scope detection** (opcional): si el usuario no especificó, preguntale o asumí "todos los services recientemente modificados"
2. **Invocar agent** `tenant-safety-auditor` con scope
3. **Esperar reporte**
4. **Resumir al usuario**:
   - Si críticos > 0: 🔴 No mergear, fixear primero
   - Si solo medios: 🟡 Revisar y decidir
   - Si todo OK: ✅ Approved for merge

## Output esperado

Reporte estructurado con:
- Critical findings (file:line + fix)
- Medium findings
- Safe items (resumen)
- Recommendation (block / warn / approve)

## Reglas clave (resumen)

Ver `.claude/rules/multi-tenancy.md` para detalle completo.

- Toda query con tabla que tiene `club_id` filtra por `club_id` en WHERE
- `clubId` siempre del JWT (`req.clubId`), nunca del body/query
- Endpoints con `:clubId` usan `ensureClubAccess`
- Recursos específicos validan ownership

## Referencias

- Agent: `.claude/agents/tenant-safety-auditor.md`
- Rule: `.claude/rules/multi-tenancy.md`
- Middleware: `backend/src/middleware/tenant.ts`
