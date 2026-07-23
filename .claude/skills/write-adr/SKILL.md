---
name: write-adr
description: Crea un Architecture Decision Record (ADR) con número auto-incrementado. Use al tomar decisiones arquitectónicas significativas (multi-tenancy, choice de tech, trade-offs irreversibles) que vale la pena documentar para futuros devs.
---

# /write-adr

## Cuándo usar

- Al tomar una decisión arquitectónica que afecta el resto del sistema
- Cuando se descartan alternativas relevantes (vale documentar el "por qué")
- Cuando una decisión va a ser cuestionada en el futuro (mejor anticipar)
- NO usar para decisiones triviales o que se pueden revertir fácilmente

## Qué hace

Genera un archivo `docs/architecture/adr/ADR-XXX-[slug].md` con número auto-incrementado, siguiendo el template estándar.

## Pasos

### 1. Recopilar info del usuario
Pedir:
- **Título corto** (5-10 palabras, imperativo): "Use Postgres RLS for multi-tenancy"
- **Status inicial**: Proposed / Accepted (si ya decidido)
- **Context** (1-2 párrafos): qué problema enfrentamos
- **Decision**: qué se decide hacer
- **Alternativas consideradas**: 2-3 opciones evaluadas
- **Consecuencias**: positivas, negativas, riesgos

### 2. Determinar próximo número
```bash
ls docs/architecture/adr/ | grep -E "^ADR-[0-9]+" | sort -V | tail -1
```

Si el último es `ADR-006-no-orm.md`, el próximo es `ADR-007-xxx.md`.

### 3. Generar slug
Slugify el título: `Use Postgres RLS for multi-tenancy` → `postgres-rls-multi-tenancy`

### 4. Crear el archivo

`docs/architecture/adr/ADR-007-postgres-rls-multi-tenancy.md`:

```markdown
# ADR-007: Use Postgres RLS for multi-tenancy defense-in-depth

## Status

Proposed (YYYY-MM-DD)

## Context

[2-3 párrafos describiendo el problema, restricciones, lo que sabemos hoy]

Por ejemplo:
> El proyecto NightClubmgmt es multi-tenant con `club_id` en cada tabla. La estrategia actual depende del middleware `ensureClubAccess` y de que cada query filtra por `club_id` en WHERE. Sin embargo, ya se detectaron 2 queries sin este filtro (`visitsService.ts:108`, `transactionsService.ts:405`). Con el crecimiento del codebase, el riesgo de un nuevo bug crece. ¿Cómo agregamos una segunda capa de protección a nivel DB?

## Decision

[Decisión concreta en 1-2 párrafos. Qué se va a hacer.]

Por ejemplo:
> Habilitar **Postgres Row-Level Security (RLS)** en todas las tablas con `club_id`. Definir una policy `USING (club_id = current_setting('app.club_id', true)::uuid)`. El backend setea `SET LOCAL app.club_id = $clubId` al inicio de cada transacción, después de validar el JWT.

## Consequences

### Positive
- ✅ Imposible un cross-tenant leak por query mal escrita
- ✅ Defense-in-depth: middleware + RLS
- ✅ Auditable: política visible en schema

### Negative / Trade-offs
- ⚠️ Performance: overhead chico en cada query (típicamente <5%)
- ⚠️ Complejidad: dev debe setear `app.club_id` al inicio de cada conn/tx
- ⚠️ Migraciones requieren BYPASSRLS para correr (rol de migrations distinto)

### Risks
- 🔴 Si el backend olvida setear `app.club_id`, queries fallan (es estricto)
- 🔴 Tools de admin DB (psql) ven todo si el rol es BYPASSRLS

## Alternatives Considered

### Alternativa 1: Solo middleware (status quo)
- Pro: simple, ya funciona
- Contra: una sola línea de defensa, ya hubo bugs

### Alternativa 2: Schema-per-tenant
- Pro: aislamiento máximo
- Contra: inviable con miles de clubes (migrations × N schemas), backup complejo

### Alternativa 3: DB-per-tenant
- Pro: aislamiento absoluto
- Contra: costo prohibitivo, ops complejo

## Implementation Notes

[Opcional: pasos concretos, archivos a tocar, dependencies]

- Fase 7 del roadmap
- Migration: `database/migrations/0XX_enable_rls.sql`
- Pool wrapper: `backend/src/config/database.ts` debe wrapping `pool.connect()` con `SET LOCAL app.club_id`
- Test: verificar que sin `app.club_id` set, queries devuelven 0 rows

## References

- [Postgres RLS docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- `.claude/rules/multi-tenancy.md`
- Bugs históricos relacionados: `docs/audit/PLATFORM_AUDIT.md#problemas-críticos` (C1, C2)
```

### 5. Actualizar índice (opcional)
Si existe `docs/architecture/adr/README.md` como índice, agregar entrada:
```markdown
- [ADR-007: Use Postgres RLS for multi-tenancy defense-in-depth](./ADR-007-postgres-rls-multi-tenancy.md) — Proposed
```

### 6. Notificar al usuario
Confirmar:
- Path creado
- Status (Proposed por default)
- Recordar: si está "Accepted", actualizar `PROJECT_STATUS.md` con la decisión

## Reglas

### R1. Status válidos
- `Proposed`: en discusión, no decidido
- `Accepted`: aprobada y vigente
- `Deprecated`: ya no aplica (con razón)
- `Superseded by ADR-XXX`: reemplazada

### R2. Inmutabilidad
Una vez `Accepted`, el ADR no se reescribe. Si la decisión cambia, crear un nuevo ADR que supersede al anterior.

### R3. Conciso
ADR no es un libro. Apuntar a <500 líneas.

### R4. Evidencia, no opiniones
"Esto es mejor porque..." con razones técnicas, no "porque me gusta".

## ADRs ya identificados (a crear)

Ver `docs/architecture/ARCHITECTURE.md#adrs-architecture-decision-records-a-crear`:

- ADR-001: Multi-tenancy via row-level ownership (Accepted)
- ADR-002: Loyalty points como ledger inmutable (Proposed)
- ADR-003: Member↔Club 1:N (Accepted)
- ADR-004: Paddle como Merchant of Record (Accepted)
- ADR-005: Subdomain routing wildcard DNS (Accepted)
- ADR-006: No ORM (Accepted)
- ADR-007: Postgres RLS defense-in-depth (Proposed)
- ADR-008: Refresh tokens + Redis blacklist (Proposed)
- ADR-009: next-intl para i18n (Proposed)
- ADR-010: Sentry para error tracking (Proposed)

Tras aprobación, ir generándolos con esta skill.

## Referencias

- Template inspirado en: [Michael Nygard ADR template](https://github.com/joelparkerhenderson/architecture-decision-record)
- Convenciones de docs: `.claude/rules/documentation.md`
