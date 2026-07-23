---
name: update-project-status
description: Actualiza PROJECT_STATUS.md con la fecha actual, fase actual, decisiones tomadas, blockers y próximos pasos. Use al cerrar una fase, tomar una decisión arquitectónica significativa, o tras sesión de trabajo importante.
---

# /update-project-status

## Cuándo usar

- **Al cerrar una fase del roadmap** (obligatorio)
- Al tomar una decisión arquitectónica significativa
- Al fin de una sesión de trabajo extensa
- Cuando aparece un blocker importante
- Mínimo: 1x por semana en desarrollo activo

## Qué hace

Edita `PROJECT_STATUS.md` para reflejar el estado actual del proyecto. Es el "diario vivo" que cualquier dev nuevo lee primero.

## Pasos

### 1. Leer el estado actual
```bash
cat PROJECT_STATUS.md
```

### 2. Recopilar info de la sesión actual (preguntar al usuario)

- **Fase actual**: ¿seguimos en la misma o cerramos una?
- **Qué se analizó/modificó esta sesión**: lista de archivos o áreas
- **Decisiones tomadas**: nuevas decisiones con razón
- **Pendientes que se cerraron**: tachar de la lista
- **Pendientes nuevos**: agregar
- **Blockers**: ¿hay algo bloqueando?
- **Próximos pasos**: qué viene

### 3. Actualizar las secciones

#### `Last updated` (siempre)
```markdown
**Last updated**: YYYY-MM-DD
**Last updated by**: Claude (sesión X)
```

#### `Current Phase` (si cambió)
```markdown
## Current Phase
**Fase X — [nombre]**
**Progress**: XX%
```

#### `Recently Analyzed / Modified` (agregar entrada)
```markdown
### YYYY-MM-DD — [Título de la sesión]

**Analizado:**
- archivo1.ts
- ...

**Modificado:**
- archivo2.ts (qué cambió)
- ...

**Creado:**
- ...
```

#### `Decisions Made` (agregar filas)
```markdown
| 2026-MM-DD | [decisión] | [razón breve] |
```

#### `Pending` (tachar cerrados + agregar nuevos)
- Marcar con `[x]` los que se cerraron
- Agregar nuevos en la categoría correcta (Críticos / Altos / Medios / Bajos)

#### `Blockers` (actualizar)
Listar bloqueos activos. Si no hay: "Ninguno actualmente."

#### `Next Recommended Actions` (reescribir)
Lista 3-5 acciones concretas. NO genérico.

#### `Tras cerrar fase` (si se cerró fase)
Completar el checkbox de la fase correspondiente:
```markdown
### Fase X (objetivo: Y semanas)
- [x] Cerrado el: 2026-MM-DD
- [x] Tests verde: SÍ
- ...
- Notas: [resumen 1-2 líneas]
```

### 4. Validar el archivo

- Markdown bien formado
- Fechas consistentes (formato YYYY-MM-DD)
- Links internos siguen funcionando
- No duplicación con CLAUDE.md o docs/

### 5. Commit (opcional)
Si el usuario lo pide:
```bash
git add PROJECT_STATUS.md
git commit -m "chore: update project status — [resumen]"
```

## Reglas

### R1. Una entrada por sesión significativa
NO actualizar después de cada commit menor. Sí después de cada PR mergeado o cierre de fase.

### R2. Decisiones siempre con fecha y razón
```markdown
| 2026-05-16 | Member↔Club 1:N | MVP simple, sin riesgo cross-tenant |
```

### R3. Pendientes específicos, no vagos
❌ "Mejorar performance"
✅ "Optimizar query getMembers con índice en (club_id, registration_date)"

### R4. Próximos pasos accionables
❌ "Continuar con Fase 2"
✅ "1. Crear migration employee_invitations. 2. Endpoint POST /employees/invite. 3. Email template."

### R5. NO duplicar info de otros docs
PROJECT_STATUS.md es estado + decisiones + próximos pasos. NO replica CLAUDE.md, ROADMAP.md, ARCHITECTURE.md.

## Output esperado

Al final, mostrar al usuario un resumen:
```
✅ PROJECT_STATUS.md actualizado:
- Last updated: 2026-MM-DD
- Fase X (Y%)
- Z decisiones agregadas
- N items cerrados, M agregados
- [Próximos pasos resumidos]
```

## Referencias

- Archivo: `PROJECT_STATUS.md` (raíz del repo)
- Template original: ya en PROJECT_STATUS.md
- Rule: `.claude/rules/documentation.md`
