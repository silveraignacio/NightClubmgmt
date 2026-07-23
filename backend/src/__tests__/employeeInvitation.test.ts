/**
 * Employee invitation service tests (DB + email mocked).
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

const mockSendEmployeeInvitationEmail = jest.fn().mockResolvedValue({ sent: true });
jest.mock('../services/emailService', () => ({
  __esModule: true,
  sendEmployeeInvitationEmail: (...args: any[]) => mockSendEmployeeInvitationEmail(...args),
  sendVerificationEmail: jest.fn().mockResolvedValue({ sent: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

import employeeInvitationService from '../services/employeeInvitationService';

describe('employeeInvitationService.createInvitation', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockSendEmployeeInvitationEmail.mockClear();
  });

  it('rejects an invalid role before touching the DB', async () => {
    await expect(
      employeeInvitationService.createInvitation('club-1', 'admin-1', 'new@club.com', 'super_admin')
    ).rejects.toThrow('Invalid role: super_admin');

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects when an active user with that email already exists in the club', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-1' }] });

    await expect(
      employeeInvitationService.createInvitation('club-1', 'admin-1', 'existing@club.com', 'bartender')
    ).rejects.toThrow('User with this email already exists in this club');

    expect(mockSendEmployeeInvitationEmail).not.toHaveBeenCalled();
  });

  it('creates the invitation scoped to club_id and emails it', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // existing active user check — none
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            club_id: 'club-1',
            email: 'new@club.com',
            role: 'bartender',
            token: 'abc123',
            invited_by: 'admin-1',
            accepted_at: null,
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
            created_at: new Date(),
          },
        ],
      }) // INSERT
      .mockResolvedValueOnce({ rows: [{ name: 'The Club' }] }); // club name lookup

    const invitation = await employeeInvitationService.createInvitation(
      'club-1',
      'admin-1',
      'new@club.com',
      'bartender'
    );

    expect(invitation.email).toBe('new@club.com');
    expect(invitation.clubId).toBe('club-1');

    // The INSERT must scope to club_id (not just email) — second call.
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO employee_invitations'),
      expect.arrayContaining(['club-1', 'new@club.com', 'bartender', 'admin-1'])
    );

    expect(mockSendEmployeeInvitationEmail).toHaveBeenCalledWith(
      'new@club.com',
      expect.any(String),
      'The Club',
      'bartender'
    );
  });
});

describe('employeeInvitationService.acceptInvitation', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('rejects an invalid, expired, or already-accepted token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      employeeInvitationService.acceptInvitation('bad-token', 'password123', 'Jane Doe')
    ).rejects.toThrow('Invalid or expired invitation token');
  });

  it('creates the club_users row scoped to the invitation club and marks it accepted', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            club_id: 'club-1',
            email: 'new@club.com',
            role: 'bartender',
            token: 'good-token',
            invited_by: 'admin-1',
            accepted_at: null,
            expires_at: new Date(Date.now() + 60_000),
            created_at: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // existing club_users check for email+club — none
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', email: 'new@club.com', role: 'bartender', club_id: 'club-1' }],
      }) // INSERT club_users
      .mockResolvedValueOnce({ rows: [] }); // UPDATE employee_invitations accepted_at

    const result = await employeeInvitationService.acceptInvitation('good-token', 'password123', 'Jane Doe');

    expect(result).toEqual({
      userId: 'user-1',
      clubId: 'club-1',
      email: 'new@club.com',
      role: 'bartender',
    });

    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO club_users'),
      expect.arrayContaining(['club-1', 'new@club.com'])
    );
  });
});
