# Rule: Database

> Postgres 15. Sin ORM. Queries SQL directas. Tipos mapeados manualmente.

## Reglas no negociables

### R1. Naming: snake_case en DB, camelCase en TS

| DB column | TS property |
|---|---|
| `club_id` | `clubId` |
| `qr_code_id` | `qrCodeId` |
| `full_name` | `fullName` |
| `points_balance` | `pointsBalance` |
| `registration_date` | `registrationDate` |
| `is_active` | `isActive` |

### R2. Mapper en cada service que devuelve datos al cliente

```ts
class MembersService {
  private mapMember(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      clubId: row.club_id,
      fullName: row.full_name,
      qrCodeId: row.qr_code_id,
      // ...
    };
  }

  async getById(clubId: string, memberId: string) {
    const result = await pool.query(...);
    return this.mapMember(result.rows[0]);
  }
}
```

Patrón actual: `backend/src/services/membersService.ts:18`, `visitsService.ts`, `transactionsService.ts`.

**Pendiente Fase 1**: helper `mapRow(row, mapping)` reutilizable para los 13 services que no lo tienen.

### R3. `pool.query(sql, params)` SIEMPRE con parámetros

❌ **Prohibido** (SQL injection):
```ts
pool.query(`SELECT * FROM members WHERE email = '${email}'`)
```

✅ **Correcto**:
```ts
pool.query('SELECT * FROM members WHERE email = $1', [email])
```

### R4. Migrations son inmutables una vez en main

- Las migrations en `database/migrations/` son SQL.
- Una migration mergeada en main **NO se modifica**. Si hay un error, crear una nueva migration que lo corrija.
- Naming: `00X_descriptive_name.sql` con número secuencial.

**Pendiente Fase 7**: adoptar `node-pg-migrate` para tracking automático.

### R5. Toda tabla con datos por-club tiene `club_id UUID NOT NULL REFERENCES clubs(id)`

```sql
CREATE TABLE my_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  -- ...
);
CREATE INDEX idx_my_new_table_club ON my_new_table(club_id);
```

### R6. Foreign keys con `ON DELETE` explícito

| Caso | ON DELETE |
|---|---|
| Tabla owned by club (visits, transactions, etc.) | `CASCADE` |
| Tabla con referencia opcional (notas, comentarios) | `SET NULL` |
| Tabla crítica (audit_logs) | `RESTRICT` |

### R7. Índices en columnas filtradas frecuentemente

Toda columna usada en `WHERE`, `ORDER BY`, `JOIN` debe tener índice. Especialmente:

- `club_id` (siempre)
- `qr_code_id` (lookups en door/bar)
- `email`, `phone` (búsqueda de miembros)
- `created_at`, `entry_time`, `transaction_date` (orden temporal)

Schema actual tiene 56 índices. Mantener al agregar tablas.

### R8. Constraints útiles

```sql
-- Enum check
role VARCHAR(50) NOT NULL CHECK (role IN ('admin','manager','bartender','doorman','staff','security'))

-- Unique compuesto
UNIQUE (club_id, email)  -- email único por club, no globalmente

-- Saldo no-negativo (opcional pero recomendable)
points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0)
```

### R9. Transacciones para operaciones multi-tabla

Si una operación modifica >1 tabla, usar transacción:

```ts
import { getClient } from '../config/database';

async createWithLedger(...) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const tx = await client.query('INSERT INTO transactions ... RETURNING *');
    await client.query('INSERT INTO points_history ...');
    await client.query('COMMIT');
    return this.mapTransaction(tx.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### R10. NO usar `SELECT *` en producción

Listar columnas explícitamente. Razones:
- Performance (no traer JSONB innecesario)
- Robustez (no fallar si se agrega columna nueva)
- Security (no exponer columnas internas)

Excepción aceptable: queries internas/admin donde explícitamente necesitamos todo.

### R11. Soft-delete > hard-delete para entidades operativas

Miembros, transacciones, visitas: usar `deleted_at TIMESTAMP NULL`. NO `DELETE FROM`.

```sql
ALTER TABLE club_members ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_club_members_active ON club_members(club_id) WHERE deleted_at IS NULL;
```

Excepción: `notifications` antiguas, `capacity_snapshots` viejos pueden hard-delete por TTL.

### R12. Audit_logs es append-only

Nunca `UPDATE audit_logs` ni `DELETE FROM audit_logs`. Solo `INSERT`. Es la verdad histórica.

## Schema overview

Tablas principales (resumido):

```
clubs (tenant root)
  slug UNIQUE NOT NULL
  is_active BOOLEAN
  features JSONB (para feature flags por plan)
  max_capacity INT
  current_occupancy INT

club_users (empleados)
  club_id FK
  role (enum)
  email, password_hash, full_name
  is_active

club_members (clientes)
  club_id FK
  qr_code_id UNIQUE  -- formato: ${clubId}-${uuid}
  email, phone, full_name, date_of_birth
  membership_tier_id FK
  points_balance INT
  total_visits, total_spent
  registration_date  -- NO created_at!

points_history (ledger, infrautilizado hoy)
  club_id FK
  member_id FK
  delta INT
  reason TEXT
  actor_user_id FK
  tx_id FK (nullable)
  created_at

audit_logs (append-only)
  club_id (nullable para acciones globales)
  user_id (nullable para acciones del sistema)
  action ENUM
  metadata JSONB
  ip_address, user_agent, request_id
```

Schema completo: `database/schema.sql` + `database/migrations/001_audit_and_nightclub_features.sql`.

## Cómo verificar cumplimiento

1. **Grep `SELECT *`**: `grep -rn "SELECT \*" backend/src/services/` debe ser mínimo.
2. **Grep raw queries**: `grep -rn "pool.query(.*\${" backend/src/` debe devolver 0 (template strings = SQL injection risk).
3. **Schema review**: nuevas tablas deben tener PR review con database-architect agent (built-in).

## Referencias

- Schema: `database/schema.sql`
- Migrations: `database/migrations/`
- Pool config: `backend/src/config/database.ts`
- Ejemplo mapper: `backend/src/services/membersService.ts:18`
