# Rule: Loyalty & Points

> Los puntos son la moneda de fidelidad. **Cero tolerancia** a cambios sin trazabilidad.

## Reglas no negociables

### R1. NUNCA modificar `club_members.points_balance` directamente

❌ **Prohibido** (anti-pattern):
```ts
await pool.query(
  `UPDATE club_members SET points_balance = points_balance + $1 WHERE id = $2`,
  [delta, memberId]
);
```

✅ **Correcto** (vía ledger):
```ts
await loyaltyService.creditPoints(clubId, memberId, delta, reason, actorUserId, txId?);
// Internamente:
// 1. INSERT INTO points_history (...)
// 2. (trigger DB) UPDATE club_members.points_balance = SUM(points_history.delta)
// 3. auditService.logAction('points_credited', ...)
```

### R2. Cada cambio de puntos requiere `reason` + `actor_user_id`

```ts
await loyaltyService.creditPoints(
  clubId,
  memberId,
  100,                          // delta
  'Purchase #12345',            // reason (texto humano, obligatorio)
  req.user.id,                  // actor_user_id (quien autoriza)
  transactionId                 // tx_id (link a transacciones si aplica)
);
```

### R3. Débitos validan saldo suficiente

```ts
async debitPoints(clubId, memberId, delta, reason, actorUserId) {
  const balance = await this.getBalance(clubId, memberId);
  if (balance < delta) {
    throw new AppError('Insufficient points balance', 400);
  }
  // ... INSERT en ledger con delta negativo
}
```

### R4. `points_history` es ledger inmutable — NO UPDATE ni DELETE

Si hay que corregir un error, INSERT un row compensatorio con `reason='Correction of entry #X'`. La historia se preserva.

```ts
// Si crédito original fue +100 pero debió ser +50:
await loyaltyService.creditPoints(clubId, memberId, -50, 'Correction of entry #abc-123', actorId);
```

### R5. El balance es DERIVADO del ledger

Idealmente: `club_members.points_balance` se calcula con `SUM(delta) FROM points_history WHERE member_id = X`. Cacheado en columna mantenida por trigger DB.

Test de integridad recurrente (Fase 3):
```ts
it('balance matches sum of ledger for every member', async () => {
  const members = await pool.query('SELECT id, points_balance FROM club_members');
  for (const m of members.rows) {
    const sum = await pool.query(
      'SELECT COALESCE(SUM(delta), 0) AS total FROM points_history WHERE member_id = $1',
      [m.id]
    );
    expect(m.points_balance).toBe(sum.rows[0].total);
  }
});
```

### R6. Audit log obligatorio en cada cambio manual

Cambios automáticos (1 punto por $1 gastado en una transacción): logueados como `points_auto_credit`.

Cambios manuales (admin ajusta puntos): logueados como `points_manual_adjustment` con `reason` visible.

### R7. Cambios manuales requieren rol `admin` o `manager`

```ts
router.post('/clubs/:clubId/members/:memberId/points/credit',
  ensureClubAccess,
  restrictTo('admin', 'manager'),  // ← obligatorio
  validate(creditPointsSchema),
  controller.creditPoints
);
```

### R8. Tier auto-calculado, no editable directo

El `membership_tier_id` se actualiza por trigger DB cuando el `points_balance_lifetime` cruza umbrales configurados por club. NO se puede asignar tier manualmente sin pasar por la lógica del club.

### R9. Expiración de puntos (futuro): también via ledger

Si en el futuro los puntos expiran:
- Job nocturno hace INSERT en `points_history` con `delta` negativo y `reason='Expiration of points earned before YYYY-MM-DD'`.
- NO modifica directo el balance.

## Estado actual (pre-Fase 3)

🔴 **El código NO cumple estas reglas todavía**. Los puntos se modifican directo en `club_members.points_balance` desde `transactionsService.ts` y `rewardsService.ts`. La tabla `points_history` está prácticamente vacía.

**Migración planeada** (Fase 3 del roadmap):
1. Crear `loyaltyService.ts` con métodos `creditPoints`, `debitPoints`, `getBalance`, `getHistory`.
2. Refactorizar `transactionsService.create()` para llamar `loyaltyService.creditPoints()` en lugar de `UPDATE club_members.points_balance`.
3. Migration: backfill `points_history` con un INSERT por miembro (`initial_balance`) que iguale al `points_balance` actual.
4. Trigger DB que mantiene `points_balance = SUM(delta)` automático.

## Cómo verificar cumplimiento

1. **Grep**: `grep -rn "UPDATE club_members.*points_balance" backend/src/` debe devolver 0 resultados (después de Fase 3).
2. **Invocar agent**: `/review-loyalty-ledger` ejecuta `loyalty-ledger-reviewer` agent.
3. **Test de integridad**: `npm test -- loyalty.integrity.test`.

## Referencias

- Schema: `database/schema.sql` (tabla `points_history`)
- Service objetivo (a crear): `backend/src/services/loyaltyService.ts`
- Trigger DB objetivo (Fase 3): `database/migrations/00X_loyalty_ledger_trigger.sql`
- ADR-002: `docs/architecture/adr/ADR-002-loyalty-ledger.md`
