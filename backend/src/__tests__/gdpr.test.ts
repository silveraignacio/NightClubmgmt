/**
 * GDPR service tests (DB mocked).
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

import { gdprService } from '../services/gdprService';

describe('gdprService.exportMemberData', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('throws 404 when the member does not exist in this club', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await expect(gdprService.exportMemberData('member-1', 'club-1')).rejects.toThrow('Member not found');
  });

  it('scopes every query to club_id and bundles all sections', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'member-1', email: 'm@club.com' }] }) // profile
      .mockResolvedValueOnce({ rows: [{ id: 'visit-1' }] }) // visits
      .mockResolvedValueOnce({ rows: [{ id: 'tx-1' }] }) // transactions
      .mockResolvedValueOnce({ rows: [{ id: 'ph-1' }] }) // points_history
      .mockResolvedValueOnce({ rows: [{ id: 'rr-1' }] }); // redeemed_rewards

    const data = await gdprService.exportMemberData('member-1', 'club-1');

    expect(data.profile).toEqual({ id: 'member-1', email: 'm@club.com' });
    expect(data.visits).toEqual([{ id: 'visit-1' }]);
    expect(data.transactions).toEqual([{ id: 'tx-1' }]);
    expect(data.pointsHistory).toEqual([{ id: 'ph-1' }]);
    expect(data.redeemedRewards).toEqual([{ id: 'rr-1' }]);

    // Every one of the 5 queries must scope by club_id (2nd bind param for
    // profile/visits/transactions/points_history, or a club_id join for
    // redeemed_rewards) — not just member_id.
    for (const call of mockQuery.mock.calls) {
      expect(call[1]).toContain('club-1');
    }
  });
});

describe('gdprService.deleteAndAnonymize', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('throws 404 when the member does not exist or is already deleted', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(gdprService.deleteAndAnonymize('member-1', 'club-1')).rejects.toThrow(
      'Member not found or already deleted'
    );
  });

  it('scopes the anonymizing UPDATE to id + club_id + deleted_at IS NULL', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'member-1' }] });

    const result = await gdprService.deleteAndAnonymize('member-1', 'club-1');

    expect(result).toEqual({ id: 'member-1' });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE club_members[\s\S]*deleted_at IS NULL/),
      ['member-1', 'club-1']
    );
    expect(mockQuery.mock.calls[0][0]).toContain('password_hash = NULL');
  });
});
