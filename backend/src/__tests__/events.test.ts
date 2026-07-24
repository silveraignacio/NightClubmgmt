/**
 * Events service tests (DB mocked).
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

import eventsService from '../services/eventsService';

describe('eventsService', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('createEvent scopes the INSERT to club_id and created_by_user_id', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'event-1', club_id: 'club-1', event_name: 'Ladies Night', entry_price: '0', vip_discount: '0' }],
    });

    const event = await eventsService.createEvent('club-1', 'admin-1', {
      eventName: 'Ladies Night',
      eventDate: '2026-08-01',
      startTime: '22:00',
    });

    expect(event?.clubId).toBe('club-1');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO events'),
      expect.arrayContaining(['club-1', 'Ladies Night', '2026-08-01', '22:00', 'admin-1'])
    );
  });

  it('getEventById throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(eventsService.getEventById('event-1', 'club-2')).rejects.toThrow('Event not found');
  });

  it('updateEvent rejects an empty patch and scopes the UPDATE to id + club_id', async () => {
    await expect(eventsService.updateEvent('event-1', 'club-1', {})).rejects.toThrow(
      'No valid fields to update'
    );

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'event-1', club_id: 'club-1', event_name: 'Renamed', entry_price: '0', vip_discount: '0' }],
    });

    await eventsService.updateEvent('event-1', 'club-1', { eventName: 'Renamed' });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE events[\s\S]*WHERE id = \$2 AND club_id = \$3/),
      ['Renamed', 'event-1', 'club-1']
    );
  });

  it('deleteEvent soft-deletes (is_active = false) scoped to club_id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'event-1' }] });

    await eventsService.deleteEvent('event-1', 'club-1');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SET is_active = false'),
      ['event-1', 'club-1']
    );
  });

  it('deleteEvent throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(eventsService.deleteEvent('event-1', 'club-2')).rejects.toThrow('Event not found');
  });

  it('markAttendance 404s when the event does not belong to this club', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(eventsService.markAttendance('event-1', 'club-2', 'member-1', 'user-1')).rejects.toThrow(
      'Event not found'
    );
  });

  it('markAttendance 404s when the member does not belong to this club (or is deleted)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'event-1' }] }) // event lookup ok
      .mockResolvedValueOnce({ rows: [] }); // member lookup fails

    await expect(eventsService.markAttendance('event-1', 'club-1', 'member-1', 'user-1')).rejects.toThrow(
      'Member not found'
    );
  });

  it('markAttendance is idempotent and only bumps attendee_count on first mark', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'event-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'member-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'attendance-1' }] }) // first insert succeeds
      .mockResolvedValueOnce({ rows: [] }); // UPDATE attendee_count

    const first = await eventsService.markAttendance('event-1', 'club-1', 'member-1', 'user-1');
    expect(first.alreadyMarked).toBe(false);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE events SET attendee_count'),
      ['event-1']
    );

    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'event-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'member-1' }] })
      .mockResolvedValueOnce({ rows: [] }); // ON CONFLICT DO NOTHING -> no rows

    const second = await eventsService.markAttendance('event-1', 'club-1', 'member-1', 'user-1');
    expect(second.alreadyMarked).toBe(true);
  });
});
