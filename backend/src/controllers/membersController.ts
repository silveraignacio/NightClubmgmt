import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { catchAsync, AppError } from '../utils/errorHandler';
import { generateQRCode } from '../services/qrService';
import { v4 as uuidv4 } from 'uuid';
import { auditService, AuditActionType } from '../services/auditService';

// Never select cm.password_hash out to API responses.
const MEMBER_COLUMNS = `
  cm.id, cm.club_id, cm.email, cm.phone, cm.full_name, cm.qr_code_id,
  cm.membership_type, cm.membership_tier_id, cm.points_balance, cm.total_visits,
  cm.total_spent, cm.last_visit, cm.profile_photo_url, cm.date_of_birth,
  cm.phone_verified, cm.email_verified, cm.notifications_enabled, cm.sms_enabled,
  cm.registration_date, cm.updated_at
`;

export const getAllMembers = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;
  const { search, membershipType, tier, limit = '50', offset = '0' } = req.query;

  // Built once and reused for both the page and the total count, so the
  // reported total always matches what the filters actually returned.
  let whereClause = 'WHERE cm.club_id = $1';
  const params: any[] = [clubId];
  let paramIndex = 2;

  if (search) {
    whereClause += ` AND (cm.full_name ILIKE $${paramIndex} OR cm.email ILIKE $${paramIndex} OR cm.phone ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (membershipType) {
    whereClause += ` AND cm.membership_type = $${paramIndex}`;
    params.push(membershipType);
    paramIndex++;
  }

  if (tier) {
    whereClause += ` AND mt.tier_name ILIKE $${paramIndex}`;
    params.push(tier);
    paramIndex++;
  }

  const listParams = [...params, parseInt(limit as string), parseInt(offset as string)];

  const result = await query(
    `SELECT
      ${MEMBER_COLUMNS},
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage,
      mt.points_multiplier
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    ${whereClause}
    ORDER BY cm.registration_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    listParams
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM club_members cm
     LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
     ${whereClause}`,
    params
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
      ${MEMBER_COLUMNS},
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage,
      mt.points_multiplier,
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

  const newMember = result.rows[0];

  // Update club members count
  await query('UPDATE clubs SET members_count = members_count + 1 WHERE id = $1', [clubId]);

  // Audit log
  await auditService.logAction(
    AuditActionType.MEMBER_CREATED,
    req.user?.id,
    clubId,
    {
      memberId: newMember.id,
      memberName: fullName,
      email,
      qrCodeId,
    },
    req
  );

  res.status(201).json({
    status: 'success',
    data: { member: newMember },
  });
});

export const updateMember = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;
  const updates = req.body;

  const allowedFields = ['email', 'phone', 'full_name', 'date_of_birth', 'profile_photo_url', 'notifications_enabled', 'sms_enabled'];
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

  const updatedMember = result.rows[0];

  // Audit log
  await auditService.logAction(
    AuditActionType.MEMBER_UPDATED,
    req.user?.id,
    clubId,
    {
      memberId,
      memberName: updatedMember.full_name,
      updatedFields: Object.keys(updates),
    },
    req
  );

  res.status(200).json({
    status: 'success',
    data: { member: updatedMember },
  });
});

export const deleteMember = catchAsync(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const clubId = req.clubId;

  // Get member info before deletion
  const memberInfo = await query(
    'SELECT full_name, email FROM club_members WHERE id = $1 AND club_id = $2',
    [memberId, clubId]
  );

  if (memberInfo.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  await query(
    'DELETE FROM club_members WHERE id = $1 AND club_id = $2 RETURNING id',
    [memberId, clubId]
  );

  // Update club members count
  await query('UPDATE clubs SET members_count = members_count - 1 WHERE id = $1', [clubId]);

  // Audit log
  await auditService.logAction(
    AuditActionType.MEMBER_DELETED,
    req.user?.id,
    clubId,
    {
      memberId,
      memberName: memberInfo.rows[0].full_name,
      email: memberInfo.rows[0].email,
    },
    req
  );

  res.status(204).send();
});

// Escape a value for a CSV cell: neutralize formula injection (a member name
// like `=HYPERLINK(...)` would execute when opened in Excel/Sheets), then
// wrap in quotes and double up any internal quotes.
const csvCell = (value: unknown): string => {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export const exportMembers = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;

  const result = await query(
    `SELECT
      cm.full_name, cm.email, cm.phone, cm.membership_type, cm.points_balance,
      cm.total_visits, cm.total_spent, cm.registration_date, mt.tier_name
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    WHERE cm.club_id = $1
    ORDER BY cm.registration_date DESC`,
    [clubId]
  );

  const header = ['Name', 'Email', 'Phone', 'Membership Type', 'Tier', 'Points', 'Total Visits', 'Total Spent', 'Joined'];
  const rows = result.rows.map((m) =>
    [
      csvCell(m.full_name),
      csvCell(m.email),
      csvCell(m.phone),
      csvCell(m.membership_type),
      csvCell(m.tier_name),
      csvCell(m.points_balance),
      csvCell(m.total_visits),
      csvCell(m.total_spent),
      csvCell(m.registration_date),
    ].join(',')
  );

  const csvContent = [header.map(csvCell).join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="members-${clubId}-${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.status(200).send(csvContent);
});

export const getMemberByQrCode = catchAsync(async (req: AuthRequest, res: Response) => {
  const { qrCodeId } = req.params;
  const clubId = req.clubId;

  const result = await query(
    `SELECT
      ${MEMBER_COLUMNS},
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage,
      mt.points_multiplier
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    WHERE cm.qr_code_id = $1 AND cm.club_id = $2`,
    [qrCodeId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { member: result.rows[0] },
  });
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
