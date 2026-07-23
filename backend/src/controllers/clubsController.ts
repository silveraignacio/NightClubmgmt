import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { catchAsync, AppError } from '../utils/errorHandler';
import { auditService, AuditActionType } from '../services/auditService';

// Columns exposed for the club's own settings page. Never select
// stripe_* / owner_id / internal columns out to API responses.
const CLUB_COLUMNS = `
  id, name, email, phone, address, city, country, description, website,
  logo_url, cover_image_url, current_plan, status, trial_ends_at,
  members_count, max_members, created_at, updated_at
`;

export const getClub = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;

  const result = await query(
    `SELECT ${CLUB_COLUMNS} FROM clubs WHERE id = $1`,
    [clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Club not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { club: result.rows[0] },
  });
});

export const updateClub = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;
  const updates = req.body;

  const allowedFields = [
    'name',
    'email',
    'phone',
    'address',
    'city',
    'country',
    'description',
    'website',
    'logo_url',
    'cover_image_url',
  ];
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

  values.push(clubId);

  const result = await query(
    `UPDATE clubs
     SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING ${CLUB_COLUMNS}`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Club not found', 404);
  }

  const updatedClub = result.rows[0];

  // Audit log
  await auditService.logAction(
    AuditActionType.CLUB_UPDATED,
    req.user?.id,
    clubId,
    {
      clubName: updatedClub.name,
      updatedFields: Object.keys(updates),
    },
    req
  );

  res.status(200).json({
    status: 'success',
    data: { club: updatedClub },
  });
});
