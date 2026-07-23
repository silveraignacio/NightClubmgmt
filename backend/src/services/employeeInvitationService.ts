import crypto from 'crypto';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { hashPassword } from './authService';
import { sendEmployeeInvitationEmail } from './emailService';

const INVITATION_TTL_HOURS = 48;
const ALLOWED_ROLES = ['admin', 'manager', 'bartender', 'doorman', 'security', 'staff'];

export interface Invitation {
  id: string;
  clubId: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  acceptedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

function mapInvitation(row: any): Invitation | null {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedBy: row.invited_by,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

class EmployeeInvitationService {
  async createInvitation(
    clubId: string,
    invitedById: string,
    email: string,
    role: string
  ): Promise<Invitation> {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new AppError(`Invalid role: ${role}`, 400);
    }

    // Check email isn't already an active user of this club
    const existing = await query(
      'SELECT id FROM club_users WHERE email = $1 AND club_id = $2 AND is_active = true',
      [email, clubId]
    );
    if (existing.rows.length > 0) {
      throw new AppError('User with this email already exists in this club', 400);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITATION_TTL_HOURS);

    const result = await query(
      `INSERT INTO employee_invitations
        (club_id, email, role, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [clubId, email, role, token, invitedById, expiresAt]
    );

    const invitation = mapInvitation(result.rows[0])!;

    const clubResult = await query('SELECT name FROM clubs WHERE id = $1', [clubId]);
    const clubName = clubResult.rows[0]?.name || 'your club';

    // Best-effort: creating the invitation must succeed even if the email
    // provider hiccups — the admin can still see/copy the token from the API
    // response, and resend by revoking + re-inviting.
    await sendEmployeeInvitationEmail(email, token, clubName, role);

    return invitation;
  }

  async acceptInvitation(
    token: string,
    password: string,
    fullName: string
  ): Promise<{ userId: string; clubId: string; email: string; role: string }> {
    const result = await query(
      `SELECT * FROM employee_invitations
       WHERE token = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired invitation token', 400);
    }

    const inv = mapInvitation(result.rows[0])!;

    // Check user doesn't already exist for this club
    const existing = await query(
      'SELECT id FROM club_users WHERE email = $1 AND club_id = $2',
      [inv.email, inv.clubId]
    );
    if (existing.rows.length > 0) {
      throw new AppError('User already exists for this club', 400);
    }

    const passwordHash = await hashPassword(password);

    const userResult = await query(
      `INSERT INTO club_users (club_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, role, club_id`,
      [inv.clubId, inv.email, passwordHash, fullName, inv.role]
    );

    await query(
      'UPDATE employee_invitations SET accepted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [inv.id]
    );

    const user = userResult.rows[0];
    return {
      userId: user.id,
      clubId: user.club_id,
      email: user.email,
      role: user.role,
    };
  }

  async getInvitations(clubId: string): Promise<Invitation[]> {
    const result = await query(
      `SELECT * FROM employee_invitations
       WHERE club_id = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
      [clubId]
    );
    return result.rows.map(mapInvitation) as Invitation[];
  }

  async revokeInvitation(clubId: string, invitationId: string): Promise<void> {
    const result = await query(
      'DELETE FROM employee_invitations WHERE id = $1 AND club_id = $2',
      [invitationId, clubId]
    );
    if (result.rowCount === 0) {
      throw new AppError('Invitation not found', 404);
    }
  }

  async getEmployees(clubId: string): Promise<any[]> {
    const result = await query(
      `SELECT id, email, full_name, role, is_active, last_login, created_at
       FROM club_users
       WHERE club_id = $1
       ORDER BY created_at DESC`,
      [clubId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
    }));
  }

  async deactivateEmployee(clubId: string, userId: string): Promise<void> {
    const result = await query(
      `UPDATE club_users SET is_active = false
       WHERE id = $1 AND club_id = $2`,
      [userId, clubId]
    );
    if (result.rowCount === 0) {
      throw new AppError('Employee not found', 404);
    }
  }
}

export default new EmployeeInvitationService();
