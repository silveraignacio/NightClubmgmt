import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface IncidentFilters {
  incidentType?: string;
  severity?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateIncidentData {
  incidentType: string;
  severity?: string;
  description: string;
  location?: string;
  involvedMembers?: string[];
  involvedStaff?: string[];
  actionTaken?: string;
  policeCalled?: boolean;
  ambulanceCalled?: boolean;
}

export interface UpdateIncidentData {
  incidentType?: string;
  severity?: string;
  description?: string;
  location?: string;
  involvedMembers?: string[];
  involvedStaff?: string[];
  actionTaken?: string;
  policeCalled?: boolean;
  ambulanceCalled?: boolean;
}

function mapIncident(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    incidentType: row.incident_type,
    severity: row.severity,
    description: row.description,
    location: row.location,
    involvedMembers: row.involved_members,
    involvedStaff: row.involved_staff,
    actionTaken: row.action_taken,
    policeCalled: row.police_called,
    ambulanceCalled: row.ambulance_called,
    reportedBy: row.reported_by,
    reporterName: row.reporter_name,
    resolved: row.resolved,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolverName: row.resolver_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class IncidentsService {
  async getIncidents(clubId: string, filters: IncidentFilters = {}) {
    const { incidentType, severity, resolved, limit = 50, offset = 0 } = filters;

    let whereClause = 'WHERE i.club_id = $1';
    const params: any[] = [clubId];
    let paramIndex = 2;

    if (incidentType) {
      whereClause += ` AND i.incident_type = $${paramIndex}`;
      params.push(incidentType);
      paramIndex++;
    }
    if (severity) {
      whereClause += ` AND i.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    if (resolved !== undefined) {
      whereClause += ` AND i.resolved = $${paramIndex}`;
      params.push(resolved);
      paramIndex++;
    }

    const listParams = [...params, limit, offset];

    const [result, countResult] = await Promise.all([
      query(
        `SELECT i.*, cu.full_name as reporter_name
         FROM incidents i
         LEFT JOIN club_users cu ON i.reported_by = cu.id
         ${whereClause}
         ORDER BY i.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        listParams
      ),
      query(`SELECT COUNT(*) FROM incidents i ${whereClause}`, params),
    ]);

    return {
      incidents: result.rows.map(mapIncident),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async getTonightIncidents(clubId: string) {
    const result = await query(
      `SELECT i.*, cu.full_name as reporter_name
       FROM incidents i
       LEFT JOIN club_users cu ON i.reported_by = cu.id
       WHERE i.club_id = $1 AND DATE(i.created_at) = CURRENT_DATE
       ORDER BY i.created_at DESC`,
      [clubId]
    );
    return result.rows.map(mapIncident);
  }

  async getIncidentStats(clubId: string, days = 30) {
    const result = await query(
      `SELECT
        incident_type,
        severity,
        COUNT(*)::int as count,
        SUM(CASE WHEN resolved THEN 1 ELSE 0 END)::int as resolved_count,
        SUM(CASE WHEN police_called THEN 1 ELSE 0 END)::int as police_called_count
       FROM incidents
       WHERE club_id = $1 AND created_at >= CURRENT_TIMESTAMP - ($2 || ' days')::interval
       GROUP BY incident_type, severity
       ORDER BY count DESC`,
      [clubId, days]
    );
    return result.rows;
  }

  async getIncidentById(id: string, clubId: string) {
    const result = await query(
      `SELECT i.*, cu.full_name as reporter_name, cu2.full_name as resolver_name
       FROM incidents i
       LEFT JOIN club_users cu ON i.reported_by = cu.id
       LEFT JOIN club_users cu2 ON i.resolved_by = cu2.id
       WHERE i.id = $1 AND i.club_id = $2`,
      [id, clubId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Incident not found', 404);
    }
    return mapIncident(result.rows[0]);
  }

  async createIncident(clubId: string, userId: string, data: CreateIncidentData) {
    const result = await query(
      `INSERT INTO incidents (
        club_id, incident_type, severity, description, location,
        involved_members, involved_staff, action_taken, police_called,
        ambulance_called, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        clubId,
        data.incidentType,
        data.severity || 'low',
        data.description,
        data.location || null,
        JSON.stringify(data.involvedMembers || []),
        JSON.stringify(data.involvedStaff || []),
        data.actionTaken || null,
        data.policeCalled || false,
        data.ambulanceCalled || false,
        userId,
      ]
    );
    return mapIncident(result.rows[0]);
  }

  async updateIncident(id: string, clubId: string, updates: UpdateIncidentData) {
    const fieldMap: Record<string, string> = {
      incidentType: 'incident_type',
      severity: 'severity',
      description: 'description',
      location: 'location',
      actionTaken: 'action_taken',
      policeCalled: 'police_called',
      ambulanceCalled: 'ambulance_called',
      involvedMembers: 'involved_members',
      involvedStaff: 'involved_staff',
    };
    const jsonFields = new Set(['involvedMembers', 'involvedStaff']);

    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof UpdateIncidentData] === undefined) continue;
      const value = jsonFields.has(key)
        ? JSON.stringify(updates[key as keyof UpdateIncidentData])
        : updates[key as keyof UpdateIncidentData];
      setClause.push(`${column} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (setClause.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    values.push(id, clubId);

    const result = await query(
      `UPDATE incidents
       SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND club_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Incident not found', 404);
    }
    return mapIncident(result.rows[0]);
  }

  async resolveIncident(id: string, clubId: string, userId: string, notes?: string) {
    const result = await query(
      `UPDATE incidents
       SET resolved = true,
           resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $1,
           action_taken = CASE WHEN $2::text IS NOT NULL
             THEN COALESCE(action_taken, '') || E'\n[Resolution] ' || $2::text
             ELSE action_taken
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND club_id = $4
       RETURNING *`,
      [userId, notes || null, id, clubId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Incident not found', 404);
    }
    return mapIncident(result.rows[0]);
  }
}

export default new IncidentsService();
