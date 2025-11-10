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

export const validateQRCode = async (qrCodeId: string, clubId: string) => {
  // Parse QR code ID (format: clubId-memberId or just qrCodeId)
  const parts = qrCodeId.split('-');
  let qrClubId: string | undefined;

  if (parts.length >= 2) {
    qrClubId = parts[0];
  }

  // If QR code has club ID embedded, verify it matches
  if (qrClubId && qrClubId !== clubId) {
    throw new AppError('QR code does not belong to this club', 403);
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

export const getMemberByQR = async (qrCodeId: string) => {
  const result = await query(
    `SELECT
      cm.*,
      mt.tier_name,
      mt.color_hex,
      mt.discount_percentage,
      mt.benefits,
      c.name as club_name
    FROM club_members cm
    LEFT JOIN membership_tiers mt ON cm.membership_tier_id = mt.id
    LEFT JOIN clubs c ON cm.club_id = c.id
    WHERE cm.qr_code_id = $1`,
    [qrCodeId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Member not found with this QR code', 404);
  }

  return result.rows[0];
};
