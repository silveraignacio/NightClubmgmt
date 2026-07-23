import QRCode from 'qrcode';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export const generateQRCode = async (qrCodeId: string): Promise<string> => {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new AppError('Failed to generate QR code', 500);
  }
};

// club_members.qr_code_id is generated as `${clubId}-${uuidv4()}` (see
// membersController.createMember). A UUID is always 36 characters, and since
// UUIDs themselves contain hyphens, splitting on '-' would only grab the
// first 8-character segment instead of the full club ID.
const UUID_LENGTH = 36;

export const validateQRCode = async (qrCodeId: string, clubId: string) => {
  // This is only a friendly early error for staff scanning a QR from the
  // wrong club — it is NOT the tenant-isolation boundary. That's enforced by
  // `AND cm.club_id = $2` in the query below (and by ensureClubAccess
  // upstream), so this check can't be bypassed by a differently-shaped ID.
  if (qrCodeId.length > UUID_LENGTH && qrCodeId[UUID_LENGTH] === '-') {
    const qrClubId = qrCodeId.substring(0, UUID_LENGTH);

    if (qrClubId !== clubId) {
      throw new AppError('QR code does not belong to this club', 403);
    }
  }

  // Find member with this QR code
  const result = await query(
    `SELECT
      cm.id,
      cm.full_name,
      cm.email,
      cm.phone,
      cm.profile_photo_url,
      cm.membership_type,
      cm.points_balance,
      cm.total_visits,
      cm.total_spent,
      cm.last_visit,
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage,
      mt.benefits
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    WHERE cm.qr_code_id = $1 AND cm.club_id = $2`,
    [qrCodeId, clubId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid QR code or member not found', 404);
  }

  return result.rows[0];
};
