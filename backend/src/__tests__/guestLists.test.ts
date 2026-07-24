/**
 * Guest list service tests (DB mocked).
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

import guestListService from '../services/guestListService';

describe('guestListService lists', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('createGuestList scopes the INSERT to club_id and created_by', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'list-1', club_id: 'club-1', list_name: 'Friday VIP', entry_type: 'free_entry' }],
    });

    const list = await guestListService.createGuestList('club-1', 'user-1', {
      listName: 'Friday VIP',
      eventDate: '2026-08-01',
    });

    expect(list?.clubId).toBe('club-1');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO guest_lists'),
      expect.arrayContaining(['club-1', 'Friday VIP', '2026-08-01', 'user-1'])
    );
  });

  it('getGuestListById throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(guestListService.getGuestListById('list-1', 'club-2')).rejects.toThrow(
      'Guest list not found'
    );
  });

  it('deleteGuestList soft-deletes scoped to club_id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'list-1' }] });

    await guestListService.deleteGuestList('list-1', 'club-1');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SET is_active = false'),
      ['list-1', 'club-1']
    );
  });
});

describe('guestListService entries', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('addEntry 404s when the guest list does not belong to this club', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      guestListService.addEntry('list-1', 'club-2', { guestName: 'Jane Doe' })
    ).rejects.toThrow('Guest list not found');
  });

  it('addEntry 404s when memberId does not belong to this club', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'list-1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      guestListService.addEntry('list-1', 'club-1', { guestName: 'Jane Doe', memberId: 'member-1' })
    ).rejects.toThrow('Member not found');
  });

  it('removeEntry throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(guestListService.removeEntry('entry-1', 'club-2')).rejects.toThrow(
      'Guest list entry not found'
    );
  });

  it('checkInEntry is single-use: second check-in attempt fails distinctly from 404', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'entry-1', guest_list_id: 'list-1', club_id: 'club-1', checked_in: true }],
    });

    const entry = await guestListService.checkInEntry('entry-1', 'club-1', 'user-1');
    expect(entry?.checkedIn).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('AND checked_in = false'),
      ['user-1', 'entry-1', 'club-1']
    );

    mockQuery.mockReset();
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // conditional UPDATE affects 0 rows
      .mockResolvedValueOnce({ rows: [{ checked_in: true }] }); // exists, already checked in

    await expect(guestListService.checkInEntry('entry-1', 'club-1', 'user-1')).rejects.toThrow(
      'Guest already checked in'
    );
  });

  it('checkInEntry throws 404 for a cross-tenant/nonexistent id', async () => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

    await expect(guestListService.checkInEntry('entry-1', 'club-2', 'user-1')).rejects.toThrow(
      'Guest list entry not found'
    );
  });
});
