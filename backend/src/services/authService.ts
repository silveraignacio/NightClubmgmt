import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
  return jwt.sign({ id, email, role, clubId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
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

  // Create member
  const memberResult = await query(
    `INSERT INTO club_members (club_id, email, password_hash, full_name, qr_code_id, membership_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, full_name, club_id, qr_code_id, membership_type, points_balance`,
    [clubId, email, passwordHash, fullName, qrCodeId, 'free']
  );

  const member = memberResult.rows[0];

  // Update club members count
  await query(
    'UPDATE clubs SET members_count = members_count + 1 WHERE id = $1',
    [clubId]
  );

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

  // Try to find member in club_members
  userResult = await query(
    'SELECT id, email, password_hash, full_name, club_id, qr_code_id, membership_type, points_balance FROM club_members WHERE email = $1',
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
