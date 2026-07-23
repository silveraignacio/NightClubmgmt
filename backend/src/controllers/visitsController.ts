import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { catchAsync } from '../utils/errorHandler';
import { validateQRCode } from '../services/qrService';
import { sendNotification, notificationTemplates } from '../services/notificationService';
import { updateMemberPoints } from '../services/pointsService';
import { auditService, AuditActionType } from '../services/auditService';

export const createVisit = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const { qrCodeId, entryMethod = 'qr_scan', entryType = 'free_entry', notes } = req.body;

  // Validate QR code and get member info
  const member = await validateQRCode(qrCodeId, clubId);

  // Create visit record
  const result = await query(
    `INSERT INTO visits (club_id, member_id, qr_code_id, entry_method, entry_type, scanned_by_user_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [clubId, member.id, qrCodeId, entryMethod, entryType, userId, notes]
  );

  const visit = result.rows[0];

  // Update member stats
  await query(
    'UPDATE club_members SET total_visits = total_visits + 1, last_visit = CURRENT_TIMESTAMP WHERE id = $1 AND club_id = $2',
    [member.id, clubId]
  );

  // Check for entry bonus points (if promotion active)
  const promotionResult = await query(
    `SELECT * FROM promotions
     WHERE club_id = $1
     AND active = true
     AND applies_to = 'entry'
     AND start_date <= CURRENT_TIMESTAMP
     AND end_date >= CURRENT_TIMESTAMP
     LIMIT 1`,
    [clubId]
  );

  let pointsEarned = 0;
  if (promotionResult.rows.length > 0) {
    const promotion = promotionResult.rows[0];

    if (promotion.promotion_type === 'double_points') {
      pointsEarned = 20; // Example: 20 points for entry with promo
    } else {
      pointsEarned = 10; // Base points for entry
    }

    await updateMemberPoints({
      memberId: member.id,
      clubId,
      pointsChange: pointsEarned,
      reason: 'Entry visit',
      referenceId: visit.id,
      referenceType: 'visit',
      createdByUserId: userId,
    });

    await query('UPDATE visits SET points_earned = $1 WHERE id = $2 AND club_id = $3', [pointsEarned, visit.id, clubId]);
  }

  // Send notification to member
  const clubResult = await query('SELECT name FROM clubs WHERE id = $1', [clubId]);
  const clubName = clubResult.rows[0].name;

  const template = notificationTemplates.visitConfirmed(clubName, pointsEarned);
  await sendNotification({
    clubId,
    memberId: member.id,
    notificationType: 'visit',
    title: template.title,
    body: template.body,
  });

  // Audit log
  await auditService.logAction(
    AuditActionType.VISIT_LOGGED,
    userId,
    clubId,
    {
      visitId: visit.id,
      memberId: member.id,
      memberName: member.full_name,
      entryMethod,
      entryType,
      pointsEarned,
    },
    req
  );

  res.status(201).json({
    status: 'success',
    data: {
      visit,
      member: {
        id: member.id,
        fullName: member.full_name,
        membershipType: member.membership_type,
        tierName: member.tier_name,
        colorHex: member.color_hex,
        profilePhotoUrl: member.profile_photo_url,
        pointsBalance: member.points_balance + pointsEarned,
      },
      pointsEarned,
    },
  });
});

export const getAllVisits = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { startDate, endDate, limit = '50', offset = '0' } = req.query;

  let queryText = `
    SELECT
      v.*,
      cm.full_name as member_name,
      cm.membership_type,
      cu.full_name as scanned_by_name
    FROM visits v
    LEFT JOIN club_members cm ON v.member_id = cm.id
    LEFT JOIN club_users cu ON v.scanned_by_user_id = cu.id
    WHERE v.club_id = $1
  `;

  const params: any[] = [clubId];
  let paramIndex = 2;

  if (startDate) {
    queryText += ` AND v.entry_time >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    queryText += ` AND v.entry_time <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  queryText += ` ORDER BY v.entry_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  const result = await query(queryText, params);

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM visits WHERE club_id = $1',
    [clubId]
  );

  res.status(200).json({
    status: 'success',
    data: {
      visits: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
});

export const getVisitsByMember = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { memberId } = req.params;
  const { limit = '20' } = req.query;

  const result = await query(
    `SELECT v.*, cu.full_name as scanned_by_name
     FROM visits v
     LEFT JOIN club_users cu ON v.scanned_by_user_id = cu.id
     WHERE v.member_id = $1 AND v.club_id = $2
     ORDER BY v.entry_time DESC
     LIMIT $3`,
    [memberId, clubId, parseInt(limit as string)]
  );

  res.status(200).json({
    status: 'success',
    data: { visits: result.rows },
  });
});

export const getTodayVisitsCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;

  const result = await query(
    `SELECT COUNT(*) as count
     FROM visits
     WHERE club_id = $1
     AND DATE(entry_time) = CURRENT_DATE`,
    [clubId]
  );

  res.status(200).json({
    status: 'success',
    data: { count: parseInt(result.rows[0].count) },
  });
});
