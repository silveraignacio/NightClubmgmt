import crypto from 'crypto';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { hashPassword } from './authService';
import { sendPasswordResetEmail } from './emailService';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RequestResult {
  // Always returned identically regardless of whether the email exists, to
  // avoid leaking account existence (enumeration).
  ok: true;
}

class PasswordResetService {
  /**
   * Look up an email across employees and members. If found, create a token
   * and email it. Always returns success either way — never reveals whether
   * the email exists.
   */
  async requestReset(email: string): Promise<RequestResult> {
    const userRes = await query(
      'SELECT id, club_id FROM club_users WHERE email = $1 AND is_active = true',
      [email]
    );

    let userId: string | null = null;
    let userType: 'employee' | 'member' | null = null;
    let clubId: string | null = null;

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      userType = 'employee';
      clubId = userRes.rows[0].club_id;
    } else {
      const memberRes = await query(
        'SELECT id, club_id FROM club_members WHERE email = $1',
        [email]
      );
      if (memberRes.rows.length > 0) {
        userId = memberRes.rows[0].id;
        userType = 'member';
        clubId = memberRes.rows[0].club_id;
      }
    }

    if (userId && userType) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await query(
        `INSERT INTO password_reset_tokens (user_id, user_type, club_id, token, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, userType, clubId, token, expiresAt]
      );

      await sendPasswordResetEmail(email, token);
    }

    return { ok: true };
  }

  /**
   * Validate token and update password for the appropriate table.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenRes = await query(
      `SELECT id, user_id, user_type, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const row = tokenRes.rows[0];
    if (row.used_at) {
      throw new AppError('Reset token already used', 400);
    }
    if (new Date(row.expires_at) < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    const passwordHash = await hashPassword(newPassword);

    if (row.user_type === 'employee') {
      await query(
        'UPDATE club_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, row.user_id]
      );
    } else {
      await query(
        'UPDATE club_members SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, row.user_id]
      );
    }

    await query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [row.id]
    );
  }
}

export const passwordResetService = new PasswordResetService();
