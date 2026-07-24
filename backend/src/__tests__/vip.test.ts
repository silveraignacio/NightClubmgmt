/**
 * VIP tables/reservations service tests (DB mocked).
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

import vipService from '../services/vipService';

describe('vipService tables', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('createTable scopes the INSERT to club_id', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'table-1', club_id: 'club-1', table_name: 'VIP 1', minimum_spend: '0' }],
    });

    const table = await vipService.createTable('club-1', { tableName: 'VIP 1' });

    expect(table?.clubId).toBe('club-1');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO vip_tables'),
      expect.arrayContaining(['club-1', 'VIP 1'])
    );
  });

  it('updateTable rejects an empty patch and scopes to id + club_id', async () => {
    await expect(vipService.updateTable('table-1', 'club-1', {})).rejects.toThrow(
      'No valid fields to update'
    );

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'table-1', club_id: 'club-1', table_name: 'Renamed', minimum_spend: '0' }],
    });

    await vipService.updateTable('table-1', 'club-1', { tableName: 'Renamed' });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE vip_tables[\s\S]*WHERE id = \$2 AND club_id = \$3/),
      ['Renamed', 'table-1', 'club-1']
    );
  });

  it('deleteTable throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(vipService.deleteTable('table-1', 'club-2')).rejects.toThrow('Table not found');
  });
});

describe('vipService reservations', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('createReservation 404s when the table does not belong to this club', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      vipService.createReservation('club-1', 'user-1', {
        tableId: 'table-1',
        reservationDate: '2026-08-01',
        guestName: 'Jane Doe',
      })
    ).rejects.toThrow('Table not found');
  });

  it('createReservation 404s when memberId does not belong to this club', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'table-1' }] }) // table ok
      .mockResolvedValueOnce({ rows: [] }); // member lookup fails

    await expect(
      vipService.createReservation('club-1', 'user-1', {
        tableId: 'table-1',
        memberId: 'member-1',
        reservationDate: '2026-08-01',
        guestName: 'Jane Doe',
      })
    ).rejects.toThrow('Member not found');
  });

  it('createReservation scopes the INSERT to club_id and created_by', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'table-1' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 'res-1', club_id: 'club-1', table_id: 'table-1', guest_name: 'Jane Doe' }],
      });

    const reservation = await vipService.createReservation('club-1', 'user-1', {
      tableId: 'table-1',
      reservationDate: '2026-08-01',
      guestName: 'Jane Doe',
    });

    expect(reservation?.clubId).toBe('club-1');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO vip_reservations'),
      expect.arrayContaining(['club-1', 'table-1', 'Jane Doe', 'user-1'])
    );
  });

  it('updateReservationStatus throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(vipService.updateReservationStatus('res-1', 'club-2', 'confirmed')).rejects.toThrow(
      'Reservation not found'
    );
  });

  it('deleteReservation throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(vipService.deleteReservation('res-1', 'club-2')).rejects.toThrow('Reservation not found');
  });
});
