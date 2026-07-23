/**
 * Seeds a fully-populated demo club so the app can be demoed end-to-end
 * without manually registering everything through the UI first.
 *
 * Usage: npm run seed  (from backend/)
 *
 * Re-running this script is safe: it deletes any previous demo club with the
 * same slug (cascades to its users/members/tiers via ON DELETE CASCADE) and
 * recreates it fresh.
 */
import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import pool, { query } from '../config/database';
import { hashPassword } from '../services/authService';

const DEMO_SLUG = 'demo-nightclub';
const DEMO_PASSWORD = 'Demo1234!';

interface TierSeed {
  tierName: string;
  colorHex: string;
  pointsMultiplier: number;
  discountPercentage: number;
  sortOrder: number;
}

const TIERS: TierSeed[] = [
  { tierName: 'Bronze', colorHex: '#B45309', pointsMultiplier: 1.0, discountPercentage: 5, sortOrder: 0 },
  { tierName: 'Silver', colorHex: '#6B7280', pointsMultiplier: 1.25, discountPercentage: 10, sortOrder: 1 },
  { tierName: 'Gold', colorHex: '#D97706', pointsMultiplier: 1.5, discountPercentage: 15, sortOrder: 2 },
  { tierName: 'Platinum', colorHex: '#7C3AED', pointsMultiplier: 2.0, discountPercentage: 20, sortOrder: 3 },
];

interface MemberSeed {
  fullName: string;
  email: string;
  phone: string;
  tierName: string;
  pointsBalance: number;
  totalVisits: number;
  totalSpent: number;
}

const MEMBERS: MemberSeed[] = [
  { fullName: 'Alice Johnson', email: 'alice@demo.club', phone: '5551230001', tierName: 'Gold', pointsBalance: 420, totalVisits: 12, totalSpent: 860.5 },
  { fullName: 'Bob Martinez', email: 'bob@demo.club', phone: '5551230002', tierName: 'Silver', pointsBalance: 180, totalVisits: 6, totalSpent: 310.0 },
  { fullName: 'Carol Davis', email: 'carol@demo.club', phone: '5551230003', tierName: 'Platinum', pointsBalance: 950, totalVisits: 24, totalSpent: 2140.75 },
  { fullName: 'Dave Wilson', email: 'dave@demo.club', phone: '5551230004', tierName: 'Bronze', pointsBalance: 40, totalVisits: 2, totalSpent: 75.0 },
];

async function seed() {
  console.log(`\nSeeding demo club "${DEMO_SLUG}"...\n`);

  // Wipe any previous run of this demo club (cascades to users/members/etc.)
  await query('DELETE FROM clubs WHERE slug = $1', [DEMO_SLUG]);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const clubResult = await query(
    `INSERT INTO clubs (name, slug, email, status, trial_ends_at, current_plan, max_members)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    ['Demo Nightclub', DEMO_SLUG, 'admin@demo.club', 'active', trialEndsAt, 'pro', 500]
  );
  const clubId = clubResult.rows[0].id;
  console.log(`Created club ${clubId}`);

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Staff users: admin, doorman, bartender (all share the same demo password)
  const staff: Array<{ email: string; fullName: string; role: string }> = [
    { email: 'admin@demo.club', fullName: 'Ana Admin', role: 'admin' },
    { email: 'doorman@demo.club', fullName: 'Danny Doorman', role: 'doorman' },
    { email: 'bartender@demo.club', fullName: 'Beth Bartender', role: 'bartender' },
  ];

  let ownerId: string | null = null;
  for (const s of staff) {
    const result = await query(
      `INSERT INTO club_users (club_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [clubId, s.email, passwordHash, s.fullName, s.role]
    );
    if (s.role === 'admin') ownerId = result.rows[0].id;
    console.log(`Created staff user ${s.email} (${s.role})`);
  }

  await query('UPDATE clubs SET owner_id = $1 WHERE id = $2', [ownerId, clubId]);

  // Membership tiers
  const tierIdByName: Record<string, string> = {};
  for (const t of TIERS) {
    const result = await query(
      `INSERT INTO membership_tiers (club_id, tier_name, color_hex, points_multiplier, discount_percentage, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [clubId, t.tierName, t.colorHex, t.pointsMultiplier, t.discountPercentage, t.sortOrder]
    );
    tierIdByName[t.tierName] = result.rows[0].id;
    console.log(`Created membership tier ${t.tierName}`);
  }

  // Members (with QR codes generated the same way membersController does)
  for (const m of MEMBERS) {
    const qrCodeId = `${clubId}-${uuidv4()}`;
    await query(
      `INSERT INTO club_members
        (club_id, email, phone, full_name, password_hash, qr_code_id, membership_tier_id,
         points_balance, total_visits, total_spent, last_visit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
      [
        clubId,
        m.email,
        m.phone,
        m.fullName,
        passwordHash,
        qrCodeId,
        tierIdByName[m.tierName],
        m.pointsBalance,
        m.totalVisits,
        m.totalSpent,
      ]
    );
    console.log(`Created member ${m.fullName} (${m.tierName}) — QR: ${qrCodeId}`);
  }

  await query('UPDATE clubs SET members_count = $1 WHERE id = $2', [MEMBERS.length, clubId]);

  console.log('\nDone. Demo login credentials (password for all: ' + DEMO_PASSWORD + '):');
  console.log('  Admin:     admin@demo.club');
  console.log('  Doorman:   doorman@demo.club');
  console.log('  Bartender: bartender@demo.club');
  console.log('  Members:   alice@demo.club, bob@demo.club, carol@demo.club, dave@demo.club\n');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
