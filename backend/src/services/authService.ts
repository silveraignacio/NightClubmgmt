import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from './emailService';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

// Same 4 tiers backend/src/scripts/seedDemo.ts creates for the demo club —
// kept in sync so a real new signup and the demo club start from the same shape.
const DEFAULT_MEMBERSHIP_TIERS = [
  { tierName: 'Bronze', colorHex: '#B45309', pointsMultiplier: 1.0, discountPercentage: 5, sortOrder: 0 },
  { tierName: 'Silver', colorHex: '#6B7280', pointsMultiplier: 1.25, discountPercentage: 10, sortOrder: 1 },
  { tierName: 'Gold', colorHex: '#D97706', pointsMultiplier: 1.5, discountPercentage: 15, sortOrder: 2 },
  { tierName: 'Platinum', colorHex: '#7C3AED', pointsMultiplier: 2.0, discountPercentage: 20, sortOrder: 3 },
];

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  clubName?: string;
  role?: 'admin' | 'member';
  clubId?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const signToken = (id: string, email: string, role: string, clubId?: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    // The server refuses to boot without JWT_SECRET (see server.ts), so this
    // is unreachable in normal operation — it only guards against this module
    // being imported directly (e.g. a script) outside that bootstrap. No
    // fallback secret: signing with a well-known default is a real risk, and
    // it just defers the failure to the next authenticated request instead of
    // failing here where it's obvious.
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return jwt.sign(
    { id, email, role, clubId },
    jwtSecret,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return await bcrypt.hash(password, rounds);
};

export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const registerClubOwner = async (data: RegisterData) => {
  const { email, password, fullName, clubName } = data;

  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM club_users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('Email already in use', 400);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate slug for club
  const slug = clubName
    ? clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : `club-${uuidv4().substring(0, 8)}`;

  // Create club first
  const trialDays = parseInt(process.env.TRIAL_DAYS || '14');
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  const clubResult = await query(
    `INSERT INTO clubs (name, slug, email, status, trial_ends_at, current_plan, max_members)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, slug, status, trial_ends_at`,
    [clubName || 'My Club', slug, email, 'trialing', trialEndsAt, 'basic', 500]
  );

  const club = clubResult.rows[0];

  // Create admin user
  const userResult = await query(
    `INSERT INTO club_users (club_id, email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, full_name, role, club_id`,
    [club.id, email, passwordHash, fullName, 'admin', true]
  );

  const user = userResult.rows[0];

  // Update club owner
  await query('UPDATE clubs SET owner_id = $1 WHERE id = $2', [user.id, club.id]);

  // Seed default membership tiers so the club isn't unusable out of the box
  // (bar discounts, member registration, etc. all depend on tiers existing —
  // see BACKLOG.md). Mirrors backend/src/scripts/seedDemo.ts.
  await Promise.all(
    DEFAULT_MEMBERSHIP_TIERS.map((tier) =>
      query(
        `INSERT INTO membership_tiers (club_id, tier_name, color_hex, points_multiplier, discount_percentage, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [club.id, tier.tierName, tier.colorHex, tier.pointsMultiplier, tier.discountPercentage, tier.sortOrder]
      )
    )
  );

  // Generate token
  const token = signToken(user.id, user.email, user.role, club.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      clubId: club.id,
    },
    club: {
      id: club.id,
      name: club.name,
      slug: club.slug,
      status: club.status,
      trialEndsAt: club.trial_ends_at,
    },
  };
};

export const registerMember = async (data: RegisterData) => {
  const { email, password, fullName, clubId } = data;

  if (!clubId) {
    throw new AppError('Club ID is required for member registration', 400);
  }

  // Check if club exists
  const clubResult = await query('SELECT id, status FROM clubs WHERE id = $1', [clubId]);

  if (clubResult.rows.length === 0) {
    throw new AppError('Club not found', 404);
  }

  if (clubResult.rows[0].status !== 'active' && clubResult.rows[0].status !== 'trialing') {
    throw new AppError('Club is not active', 400);
  }

  // Check if email already exists in this club
  const existingMember = await query(
    'SELECT id FROM club_members WHERE email = $1 AND club_id = $2',
    [email, clubId]
  );

  if (existingMember.rows.length > 0) {
    throw new AppError('Email already registered in this club', 400);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate unique QR code ID
  const qrCodeId = `${clubId}-${uuidv4()}`;

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  // Create member
  const memberResult = await query(
    `INSERT INTO club_members (
       club_id, email, password_hash, full_name, qr_code_id, membership_type,
       email_verification_token, email_verification_expires_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, email, full_name, club_id, qr_code_id, membership_type, points_balance`,
    [clubId, email, passwordHash, fullName, qrCodeId, 'free', verificationToken, verificationExpiresAt]
  );

  const member = memberResult.rows[0];

  // Update club members count
  await query(
    'UPDATE clubs SET members_count = members_count + 1 WHERE id = $1',
    [clubId]
  );

  // Best-effort: registration must succeed even if the email provider hiccups.
  await sendVerificationEmail(member.email, verificationToken, member.full_name);

  // Generate token
  const token = signToken(member.id, member.email, 'member', clubId);

  return {
    token,
    member: {
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      clubId: member.club_id,
      qrCodeId: member.qr_code_id,
      membershipType: member.membership_type,
      pointsBalance: member.points_balance,
    },
  };
};

export const login = async (data: LoginData) => {
  const { email, password } = data;

  // Try to find user in club_users
  let userResult = await query(
    'SELECT id, email, password_hash, full_name, role, club_id, is_active FROM club_users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new AppError('Your account has been deactivated', 401);
    }

    const isPasswordCorrect = await comparePasswords(password, user.password_hash);

    if (!isPasswordCorrect) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Update last login
    await query('UPDATE club_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = signToken(user.id, user.email, user.role, user.club_id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        clubId: user.club_id,
      },
    };
  }

  // Try to find member in club_members. Excludes deleted/anonymized members —
  // their password_hash is NULLed out by gdprService.deleteAndAnonymize, so
  // comparePasswords would throw rather than just fail cleanly if we didn't.
  userResult = await query(
    `SELECT id, email, password_hash, full_name, club_id, qr_code_id, membership_type, points_balance
     FROM club_members WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('Incorrect email or password', 401);
  }

  const member = userResult.rows[0];

  const isPasswordCorrect = await comparePasswords(password, member.password_hash);

  if (!isPasswordCorrect) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(member.id, member.email, 'member', member.club_id);

  return {
    token,
    user: {
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: 'member',
      clubId: member.club_id,
      qrCodeId: member.qr_code_id,
      membershipType: member.membership_type,
      pointsBalance: member.points_balance,
    },
  };
};

/**
 * Change the current user's own password. Works for both staff (club_users)
 * and members (club_members) — the caller is looked up by id in whichever
 * table their role implies, mirroring how `protect` resolves the JWT.
 */
export const changePassword = async (
  userId: string,
  role: string,
  currentPassword: string,
  newPassword: string
) => {
  const table = role === 'member' ? 'club_members' : 'club_users';

  const result = await query(
    `SELECT id, password_hash FROM ${table} WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const isCurrentPasswordCorrect = await comparePasswords(
    currentPassword,
    result.rows[0].password_hash
  );

  if (!isCurrentPasswordCorrect) {
    // 400, not 401: the caller IS authenticated (protect already passed), they
    // just mistyped their current password. The frontend's response
    // interceptor treats any 401 as "session invalid" and force-logs-out —
    // that would be the wrong UX for a simple form validation error here.
    throw new AppError('Current password is incorrect', 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  await query(`UPDATE ${table} SET password_hash = $1 WHERE id = $2`, [
    newPasswordHash,
    userId,
  ]);
};

/**
 * Verify a member's email via the token sent at registration (or resend).
 * Returns the member's id/clubId so the caller can audit-log it.
 */
export const verifyMemberEmail = async (token: string) => {
  const result = await query(
    `SELECT id, club_id, email_verification_expires_at
     FROM club_members
     WHERE email_verification_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  const member = result.rows[0];

  if (
    member.email_verification_expires_at &&
    new Date(member.email_verification_expires_at) < new Date()
  ) {
    throw new AppError('Verification link has expired', 400);
  }

  await query(
    `UPDATE club_members
     SET email_verified = true, email_verification_token = NULL, email_verification_expires_at = NULL
     WHERE id = $1`,
    [member.id]
  );

  return { id: member.id, clubId: member.club_id };
};

/**
 * Issue a new verification token for a member and email it. Silently no-ops
 * if the member is already verified (no error — resending an unnecessary
 * link isn't worth surfacing as a failure to the caller).
 */
export const resendMemberVerification = async (memberId: string, clubId: string) => {
  const result = await query(
    'SELECT email, full_name, email_verified FROM club_members WHERE id = $1 AND club_id = $2',
    [memberId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  const member = result.rows[0];
  if (member.email_verified) {
    return;
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await query(
    `UPDATE club_members
     SET email_verification_token = $1, email_verification_expires_at = $2
     WHERE id = $3`,
    [verificationToken, verificationExpiresAt, memberId]
  );

  await sendVerificationEmail(member.email, verificationToken, member.full_name);
};
