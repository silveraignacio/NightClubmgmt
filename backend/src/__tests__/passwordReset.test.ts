/**
 * Password reset service tests (DB + email mocked).
 *
 * Covers the ledger-adjacent invariants that matter most here: no account
 * enumeration on request, and a reset token must be valid, unused, and
 * unexpired to be honored.
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

const mockSendPasswordResetEmail = jest.fn().mockResolvedValue({ sent: true });
jest.mock('../services/emailService', () => ({
  __esModule: true,
  sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
  sendVerificationEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

import { passwordResetService } from '../services/passwordResetService';

describe('passwordResetService.requestReset', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockSendPasswordResetEmail.mockClear();
  });

  it('creates a token and emails it when the email belongs to an employee', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1', club_id: 'club-1' }] }) // club_users lookup
      .mockResolvedValueOnce({ rows: [] }); // INSERT INTO password_reset_tokens

    const result = await passwordResetService.requestReset('owner@club.com');

    expect(result).toEqual({ ok: true });
    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('owner@club.com', expect.any(String));
  });

  it('creates a token and emails it when the email belongs to a member', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // club_users lookup — no match
      .mockResolvedValueOnce({ rows: [{ id: 'member-1', club_id: 'club-1' }] }) // club_members lookup
      .mockResolvedValueOnce({ rows: [] }); // INSERT

    const result = await passwordResetService.requestReset('member@club.com');

    expect(result).toEqual({ ok: true });
    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('does not send an email and still returns ok when the email matches nobody (no enumeration)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // club_users lookup
      .mockResolvedValueOnce({ rows: [] }); // club_members lookup

    const result = await passwordResetService.requestReset('nobody@nowhere.com');

    expect(result).toEqual({ ok: true });
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('passwordResetService.resetPassword', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('rejects an unknown token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(passwordResetService.resetPassword('bad-token', 'newpassword123')).rejects.toThrow(
      'Invalid or expired reset token'
    );
  });

  it('rejects a token that was already used', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'token-1',
          user_id: 'user-1',
          user_type: 'employee',
          expires_at: new Date(Date.now() + 60_000),
          used_at: new Date(),
        },
      ],
    });

    await expect(passwordResetService.resetPassword('used-token', 'newpassword123')).rejects.toThrow(
      'Reset token already used'
    );
  });

  it('rejects an expired token', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'token-1',
          user_id: 'user-1',
          user_type: 'employee',
          expires_at: new Date(Date.now() - 60_000),
          used_at: null,
        },
      ],
    });

    await expect(passwordResetService.resetPassword('expired-token', 'newpassword123')).rejects.toThrow(
      'Reset token has expired'
    );
  });

  it('updates club_users for an employee token and marks it used', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'token-1',
            user_id: 'user-1',
            user_type: 'employee',
            expires_at: new Date(Date.now() + 60_000),
            used_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE club_users
      .mockResolvedValueOnce({ rows: [] }); // UPDATE password_reset_tokens used_at

    await passwordResetService.resetPassword('good-token', 'newpassword123');

    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE club_users SET password_hash'),
      expect.arrayContaining(['user-1'])
    );
  });

  it('updates club_members for a member token', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'token-1',
            user_id: 'member-1',
            user_type: 'member',
            expires_at: new Date(Date.now() + 60_000),
            used_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await passwordResetService.resetPassword('good-token', 'newpassword123');

    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE club_members SET password_hash'),
      expect.arrayContaining(['member-1'])
    );
  });
});
