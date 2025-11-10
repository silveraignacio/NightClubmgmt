import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { catchAsync, AppError } from '../utils/errorHandler';
import { validateQRCode } from '../services/qrService';
import { updateMemberPoints, calculatePointsEarned } from '../services/pointsService';
import { sendNotification, notificationTemplates } from '../services/notificationService';

export const createTransaction = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const {
    qrCodeId,
    transactionType,
    description,
    amount,
    paymentMethod,
    menuItemId,
    deviceId,
  } = req.body;

  // Validate QR code and get member info
  const member = await validateQRCode(qrCodeId, clubId);

  let discountApplied = 0;
  let finalAmount = amount;
  let promotionId = null;

  // Calculate discount based on membership tier
  if (member.discount_percentage && member.discount_percentage > 0) {
    discountApplied = (amount * member.discount_percentage) / 100;
    finalAmount = amount - discountApplied;
  }

  // Check for active promotions
  const promotionResult = await query(
    `SELECT * FROM promotions
     WHERE club_id = $1
     AND active = true
     AND (applies_to = $2 OR applies_to = 'all')
     AND start_date <= CURRENT_TIMESTAMP
     AND end_date >= CURRENT_TIMESTAMP
     AND (max_uses IS NULL OR uses_count < max_uses)
     ORDER BY discount_percentage DESC
     LIMIT 1`,
    [clubId, transactionType]
  );

  let pointsMultiplier = member.points_multiplier || 1;

  if (promotionResult.rows.length > 0) {
    const promotion = promotionResult.rows[0];
    promotionId = promotion.id;

    // Check if promotion applies to this member's tier
    const applicableTiers = promotion.applicable_tiers || [];
    if (applicableTiers.length === 0 || applicableTiers.includes(member.membership_type)) {
      if (promotion.promotion_type === 'percentage' && promotion.discount_percentage) {
        const promoDiscount = (amount * promotion.discount_percentage) / 100;
        if (promoDiscount > discountApplied) {
          discountApplied = promoDiscount;
          finalAmount = amount - discountApplied;
        }
      } else if (promotion.promotion_type === 'fixed_amount' && promotion.discount_value) {
        discountApplied = Math.max(discountApplied, promotion.discount_value);
        finalAmount = Math.max(0, amount - discountApplied);
      } else if (promotion.promotion_type === 'double_points') {
        pointsMultiplier *= 2;
      }

      // Update promotion usage
      await query('UPDATE promotions SET uses_count = uses_count + 1 WHERE id = $1', [promotionId]);
    }
  }

  // Calculate points earned
  const pointsEarned = calculatePointsEarned(finalAmount, pointsMultiplier);

  // Create transaction
  const transactionResult = await query(
    `INSERT INTO transactions (
      club_id, member_id, qr_code_id, transaction_type, description,
      amount, original_amount, discount_applied, points_earned, promotion_id,
      processed_by_user_id, device_id, payment_method, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      clubId, member.id, qrCodeId, transactionType, description,
      finalAmount, amount, discountApplied, pointsEarned, promotionId,
      userId, deviceId, paymentMethod, 'completed',
    ]
  );

  const transaction = transactionResult.rows[0];

  // Update member points and total spent
  await updateMemberPoints({
    memberId: member.id,
    clubId,
    pointsChange: pointsEarned,
    reason: `Purchase: ${description}`,
    referenceId: transaction.id,
    referenceType: 'transaction',
    createdByUserId: userId,
  });

  await query(
    'UPDATE club_members SET total_spent = total_spent + $1 WHERE id = $2',
    [finalAmount, member.id]
  );

  // Send notification
  const newBalance = member.points_balance + pointsEarned;
  const template = notificationTemplates.purchaseCompleted(finalAmount, pointsEarned, newBalance);
  await sendNotification({
    clubId,
    memberId: member.id,
    notificationType: 'purchase',
    title: template.title,
    body: template.body,
  });

  res.status(201).json({
    status: 'success',
    data: {
      transaction,
      member: {
        id: member.id,
        fullName: member.full_name,
        pointsBalance: newBalance,
      },
      pricing: {
        originalAmount: amount,
        discountApplied,
        finalAmount,
        pointsEarned,
      },
    },
  });
});

export const getAllTransactions = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { startDate, endDate, memberId, status, limit = '50', offset = '0' } = req.query;

  let queryText = `
    SELECT
      t.*,
      cm.full_name as member_name,
      cm.membership_type,
      cu.full_name as processed_by_name
    FROM transactions t
    LEFT JOIN club_members cm ON t.member_id = cm.id
    LEFT JOIN club_users cu ON t.processed_by_user_id = cu.id
    WHERE t.club_id = $1
  `;

  const params: any[] = [clubId];
  let paramIndex = 2;

  if (startDate) {
    queryText += ` AND t.transaction_date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    queryText += ` AND t.transaction_date <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  if (memberId) {
    queryText += ` AND t.member_id = $${paramIndex}`;
    params.push(memberId);
    paramIndex++;
  }

  if (status) {
    queryText += ` AND t.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  queryText += ` ORDER BY t.transaction_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  const result = await query(queryText, params);

  // Get total amount
  const sumResult = await query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE club_id = $1 AND status = $2',
    [clubId, 'completed']
  );

  res.status(200).json({
    status: 'success',
    data: {
      transactions: result.rows,
      totalAmount: parseFloat(sumResult.rows[0].total),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
});

export const getTransactionById = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { transactionId } = req.params;

  const result = await query(
    `SELECT
      t.*,
      cm.full_name as member_name,
      cm.email as member_email,
      cu.full_name as processed_by_name
    FROM transactions t
    LEFT JOIN club_members cm ON t.member_id = cm.id
    LEFT JOIN club_users cu ON t.processed_by_user_id = cu.id
    WHERE t.id = $1 AND t.club_id = $2`,
    [transactionId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Transaction not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { transaction: result.rows[0] },
  });
});

export const getTodayRevenue = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;

  const result = await query(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE club_id = $1
     AND DATE(transaction_date) = CURRENT_DATE
     AND status = 'completed'`,
    [clubId]
  );

  res.status(200).json({
    status: 'success',
    data: { revenue: parseFloat(result.rows[0].total) },
  });
});
