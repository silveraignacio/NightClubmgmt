---
name: design-feature
description: Workflow guiado para diseñar una feature nueva. Recopila requisitos, propone schema, endpoints, UI, tests, riesgos y estimación. Use cuando se quiera agregar una feature nueva al producto antes de empezar a codear.
---

# /design-feature

## Cuándo usar

- Antes de empezar a codear una feature nueva (Fase 2+)
- Cuando el owner del proyecto plantea una request ("quiero que el club pueda hacer X")
- Antes de crear un PR con scope significativo

## Qué hace

Convierte una idea en un plan ejecutable: requisitos → modelo de datos → endpoints → UI → tests → riesgos.

## Pasos

### 1. Recopilar requisitos
Pedir al usuario:
- **Problema que resuelve**: ¿qué dolor del usuario aborda?
- **Persona afectada**: ¿qué rol(es) la usan?
- **Caso de uso típico**: ¿cómo se usa paso a paso?
- **Out-of-scope**: ¿qué NO incluye esta feature?

### 2. Validar con `nightclub-product-strategist` agent
Antes de profundizar técnico, validar:
- ¿Está alineada con el MVP scope o es out-of-MVP?
- ¿Competidores la tienen? ¿cómo?
- ¿Encaja en una fase existente del roadmap?

Si sale "post-MVP" o "no construir": parar acá y discutir.

### 3. Diseñar modelo de datos

- **Tablas nuevas?** Documentar schema con SQL:
  ```sql
  CREATE TABLE my_new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    -- ...
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX idx_my_new_table_club ON my_new_table(club_id);
  ```
- **Modificaciones a tablas existentes?** ALTER TABLE statements
- **Relaciones**: FKs, indexes, constraints
- **Aislamiento multi-tenant**: ¿tiene `club_id`? Sí siempre que aplique.

### 4. Diseñar API endpoints

Tabla:
| Método | Path | Auth | Roles | Body | Response |
|---|---|---|---|---|---|
| POST | `/api/clubs/:clubId/my-feature` | JWT | admin/manager | `{...}` | `{id, ...}` |
| GET | `/api/clubs/:clubId/my-feature` | JWT | all | — | `[...]` |

Para cada endpoint:
- Middleware chain (protect + ensureClubAccess + restrictTo + validate)
- Zod schema
- Audit log si aplica

### 5. Diseñar UI

- **Páginas nuevas o modificadas**: rutas en `frontend/app/...`
- **Componentes nuevos**: ubicación en `@/components`
- **Estados**: loading, error, empty, success
- **Mobile-first?** Si la usa staff operativo (door/bar/security) → sí, obligatorio

### 6. Definir tests

Mínimo:
- Cross-tenant denial test
- RBAC denial test
- Happy path test
- Validation rejection test
- (Si toca puntos) Integrity test

### 7. Identificar riesgos

- **Multi-tenancy**: ¿hay riesgo de cross-tenant leak?
- **Race conditions**: ¿operaciones concurrentes pueden corromper data?
- **Performance**: ¿queries lentas con N=10000?
- **Costos**: ¿depende de API paga (Twilio, etc.)?
- **GDPR**: ¿toca PII?

### 8. Estimar esfuerzo

| Componente | Esfuerzo |
|---|---|
| Schema migration | XX min |
| Backend (services + controllers + routes) | XX h |
| Frontend (página + componentes) | XX h |
| Tests | XX h |
| Docs | XX min |
| **Total** | **XX h** |

### 9. Output final

Crear documento con:

```markdown
# Feature Design: [Nombre]

## Problem & Users
[descripción]

## Scope
### In scope
- ...
### Out of scope
- ...

## Data Model
[SQL + ER diagram textual]

## API Endpoints
[tabla]

## UI
[páginas + components]

## Tests
[lista]

## Risks
[matriz]

## Effort Estimate
[breakdown]

## Open Questions
[a resolver antes de codear]
```

Sugerir guardarlo en `docs/design/feature-NAME.md` para referencia futura.

## Reglas clave

- NO empezar a codear hasta que esta etapa esté completa y aprobada
- NO inventar arquitectura nueva si no es necesaria — reusar patrones existentes
- Validar con `nightclub-product-strategist` ANTES de invertir tiempo en diseño técnico
- Considerar siempre multi-tenancy desde el diseño

## Referencias

- Roadmap: `docs/roadmap/ROADMAP.md`
- Product foundation: `docs/product/PRODUCT_FOUNDATION.md`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- Backend pattern: `.claude/rules/backend.md`
- Database conventions: `.claude/rules/database.md`
