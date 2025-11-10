import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { catchAsync, AppError } from '../utils/errorHandler';
import { generateQRCode } from '../services/qrService';
import { v4 as uuidv4 } from 'uuid';

export const getAllMembers = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;
  const { search, membershipType, limit = '50', offset = '0' } = req.query;

  let queryText = `
    SELECT
      cm.*,
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    WHERE cm.club_id = $1
  `;

  const params: any[] = [clubId];
  let paramIndex = 2;

  if (search) {
    queryText += ` AND (cm.full_name ILIKE $${paramIndex} OR cm.email ILIKE $${paramIndex} OR cm.phone ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (membershipType) {
    queryText += ` AND cm.membership_type = $${paramIndex}`;
    params.push(membershipType);
    paramIndex++;
  }

  queryText += ` ORDER BY cm.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  const result = await query(queryText, params);

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM club_members WHERE club_id = $1',
    [clubId]
  );

  res.status(200).json({
    status: 'success',
    data: {
      members: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
});

export const getMemberById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;

  const result = await query(
    `SELECT
      cm.*,
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage,
      mt.benefits
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    WHERE cm.id = $1 AND cm.club_id = $2`,
    [memberId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { member: result.rows[0] },
  });
});

export const createMember = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { email, phone, fullName, dateOfBirth, membershipTierId } = req.body;

  // Generate unique QR code ID
  const qrCodeId = `${clubId}-${uuidv4()}`;

  const result = await query(
    `INSERT INTO club_members (club_id, email, phone, full_name, date_of_birth, qr_code_id, membership_tier_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [clubId, email, phone, fullName, dateOfBirth, qrCodeId, membershipTierId]
  );

  // Update club members count
  await query('UPDATE clubs SET members_count = members_count + 1 WHERE id = $1', [clubId]);

  res.status(201).json({
    status: 'success',
    data: { member: result.rows[0] },
  });
});

export const updateMember = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;
  const updates = req.body;

  const allowedFields = ['email', 'phone', 'full_name', 'profile_photo_url', 'notifications_enabled', 'sms_enabled'];
  const setClause: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.keys(updates).forEach((key) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (allowedFields.includes(snakeKey)) {
      setClause.push(`${snakeKey} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    }
  });

  if (setClause.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  values.push(memberId, clubId);

  const result = await query(
    `UPDATE club_members
     SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex} AND club_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { member: result.rows[0] },
  });
});

export const deleteMember = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;

  const result = await query(
    'DELETE FROM club_members WHERE id = $1 AND club_id = $2 RETURNING id',
    [memberId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  // Update club members count
  await query('UPDATE clubs SET members_count = members_count - 1 WHERE id = $1', [clubId]);

  res.status(204).send();
});

export const getMemberQRCode = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;

  const result = await query(
    'SELECT qr_code_id, full_name FROM club_members WHERE id = $1 AND club_id = $2',
    [memberId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  const { qr_code_id, full_name } = result.rows[0];
  const qrCodeDataUrl = await generateQRCode(qr_code_id);

  res.status(200).json({
    status: 'success',
    data: {
      qrCodeId: qr_code_id,
      qrCodeDataUrl,
      memberName: full_name,
    },
  });
});

export const getMemberStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;

  const result = await query(
    `SELECT
      points_balance,
      total_visits,
      total_spent,
      last_visit,
      membership_type
    FROM club_members
    WHERE id = $1 AND club_id = $2`,
    [memberId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  // Get badges
  const badgesResult = await query(
    `SELECT b.badge_name, b.description, b.icon_url, mb.earned_at
     FROM member_badges mb
     JOIN badges b ON mb.badge_id = b.id
     WHERE mb.member_id = $1
     ORDER BY mb.earned_at DESC`,
    [memberId]
  );

  // Get recent transactions
  const transactionsResult = await query(
    `SELECT description, amount, points_earned, transaction_date
     FROM transactions
     WHERE member_id = $1 AND club_id = $2
     ORDER BY transaction_date DESC
     LIMIT 10`,
    [memberId, clubId]
  );

  res.status(200).json({
    status: 'success',
    data: {
      stats: result.rows[0],
      badges: badgesResult.rows,
      recentTransactions: transactionsResult.rows,
    },
  });
});
