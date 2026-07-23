import { Resend } from 'resend';
import logger from '../utils/logger';

// PII rule (.claude/rules/security.md R8): never log the recipient's email
// address itself, only which kind of email was (attempted to be) sent.
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

async function send(to: string, subject: string, html: string, logContext: Record<string, unknown>) {
  const resend = getClient();

  if (!resend) {
    // No RESEND_API_KEY configured (e.g. local dev without a placeholder
    // filled in) — don't crash the request, just log that we would have sent
    // it. This mirrors how notificationService handles push notifications
    // without Firebase configured.
    logger.warn('RESEND_API_KEY not configured; email not sent', logContext);
    return { sent: false };
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    logger.info('Email sent', logContext);
    return { sent: true };
  } catch (error) {
    logger.error('Failed to send email', { ...logContext, error });
    // Best-effort: callers (registration, forgot-password) must not fail the
    // whole request just because the email provider hiccuped.
    return { sent: false };
  }
}

export const sendVerificationEmail = async (to: string, token: string, memberName: string) => {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    to,
    'Confirmá tu email',
    `<p>Hola ${escapeHtml(memberName)},</p>
     <p>Confirmá tu email para activar tu cuenta:</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>
     <p>Este enlace vence en 24 horas.</p>`,
    { emailType: 'email_verification' }
  );
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    to,
    'Restablecé tu contraseña',
    `<p>Recibimos un pedido para restablecer tu contraseña.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>Si no fuiste vos, ignorá este email — tu contraseña no va a cambiar.</p>
     <p>Este enlace vence en 1 hora.</p>`,
    { emailType: 'password_reset' }
  );
};

export const sendEmployeeInvitationEmail = async (
  to: string,
  token: string,
  clubName: string,
  role: string
) => {
  const acceptUrl = `${APP_URL}/accept-invite?token=${encodeURIComponent(token)}`;
  return send(
    to,
    `Te invitaron a unirte a ${escapeHtml(clubName)}`,
    `<p>Te invitaron a unirte a <strong>${escapeHtml(clubName)}</strong> como ${escapeHtml(role)}.</p>
     <p>Aceptá la invitación y creá tu cuenta:</p>
     <p><a href="${acceptUrl}">${acceptUrl}</a></p>
     <p>Este enlace vence en 48 horas.</p>`,
    { emailType: 'employee_invitation' }
  );
};

// Minimal HTML-escaping for the one piece of user-controlled data (full name)
// interpolated into an email body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
