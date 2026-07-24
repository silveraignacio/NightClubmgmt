/**
 * Incidents service tests (DB mocked).
 */

const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: (...args: any[]) => mockQuery(...args), connect: jest.fn() },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn(),
}));

import incidentsService from '../services/incidentsService';

describe('incidentsService', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('createIncident scopes the INSERT to club_id and reported_by', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'inc-1',
          club_id: 'club-1',
          incident_type: 'altercation',
          severity: 'high',
          description: 'Fight near the bar',
          reported_by: 'user-1',
          resolved: false,
        },
      ],
    });

    const incident = await incidentsService.createIncident('club-1', 'user-1', {
      incidentType: 'altercation',
      severity: 'high',
      description: 'Fight near the bar',
    });

    expect(incident?.clubId).toBe('club-1');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO incidents'),
      expect.arrayContaining(['club-1', 'altercation', 'high', 'Fight near the bar', null, 'user-1'])
    );
  });

  it('getIncidentById throws 404 when not found in this club', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(incidentsService.getIncidentById('inc-1', 'club-1')).rejects.toThrow('Incident not found');
  });

  it('updateIncident scopes the UPDATE to id + club_id and rejects empty updates', async () => {
    await expect(incidentsService.updateIncident('inc-1', 'club-1', {})).rejects.toThrow(
      'No valid fields to update'
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'inc-1', club_id: 'club-1', severity: 'critical' }] });

    await incidentsService.updateIncident('inc-1', 'club-1', { severity: 'critical' });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE incidents[\s\S]*WHERE id = \$2 AND club_id = \$3/),
      ['critical', 'inc-1', 'club-1']
    );
  });

  it('resolveIncident scopes to id + club_id and sets resolved_by', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'inc-1', club_id: 'club-1', resolved: true, resolved_by: 'manager-1' }],
    });

    const incident = await incidentsService.resolveIncident('inc-1', 'club-1', 'manager-1', 'Handled by staff');

    expect(incident?.resolved).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $3 AND club_id = $4'),
      ['manager-1', 'Handled by staff', 'inc-1', 'club-1']
    );
  });

  it('resolveIncident throws 404 for a cross-tenant id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(incidentsService.resolveIncident('inc-1', 'club-2', 'manager-1')).rejects.toThrow(
      'Incident not found'
    );
  });
});
