import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface CreateTableData {
  tableName: string;
  tableType?: string;
  capacity?: number;
  location?: string;
  minimumSpend?: number;
}

export type UpdateTableData = Partial<CreateTableData> & { isAvailable?: boolean };

export interface CreateReservationData {
  tableId: string;
  memberId?: string;
  reservationDate: string;
  guestName: string;
  guestPhone?: string;
  partySize?: number;
  specialRequests?: string;
}

function mapTable(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    tableName: row.table_name,
    tableType: row.table_type,
    capacity: row.capacity,
    location: row.location,
    minimumSpend: parseFloat(row.minimum_spend),
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReservation(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    tableId: row.table_id,
    tableName: row.table_name,
    memberId: row.member_id,
    reservationDate: row.reservation_date,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    partySize: row.party_size,
    status: row.status,
    specialRequests: row.special_requests,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TABLE_FIELD_MAP: Record<string, string> = {
  tableName: 'table_name',
  tableType: 'table_type',
  capacity: 'capacity',
  location: 'location',
  minimumSpend: 'minimum_spend',
  isAvailable: 'is_available',
};

class VipService {
  async getTables(clubId: string) {
    const result = await query(
      'SELECT * FROM vip_tables WHERE club_id = $1 ORDER BY table_name ASC',
      [clubId]
    );
    return result.rows.map(mapTable);
  }

  async createTable(clubId: string, data: CreateTableData) {
    const result = await query(
      `INSERT INTO vip_tables (club_id, table_name, table_type, capacity, location, minimum_spend)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        clubId,
        data.tableName,
        data.tableType || 'booth',
        data.capacity || 6,
        data.location || null,
        data.minimumSpend ?? 0,
      ]
    );
    return mapTable(result.rows[0]);
  }

  async updateTable(id: string, clubId: string, updates: UpdateTableData) {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, column] of Object.entries(TABLE_FIELD_MAP)) {
      const value = (updates as any)[key];
      if (value === undefined) continue;
      setClause.push(`${column} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (setClause.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    values.push(id, clubId);

    const result = await query(
      `UPDATE vip_tables SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND club_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Table not found', 404);
    }
    return mapTable(result.rows[0]);
  }

  async deleteTable(id: string, clubId: string) {
    const result = await query('DELETE FROM vip_tables WHERE id = $1 AND club_id = $2 RETURNING id', [
      id,
      clubId,
    ]);
    if (result.rows.length === 0) {
      throw new AppError('Table not found', 404);
    }
  }

  async getReservations(clubId: string, date?: string) {
    let whereClause = 'WHERE r.club_id = $1';
    const params: any[] = [clubId];
    if (date) {
      whereClause += ' AND r.reservation_date = $2';
      params.push(date);
    }

    const result = await query(
      `SELECT r.*, t.table_name
       FROM vip_reservations r
       JOIN vip_tables t ON r.table_id = t.id
       ${whereClause}
       ORDER BY r.reservation_date DESC, r.created_at DESC`,
      params
    );
    return result.rows.map(mapReservation);
  }

  async createReservation(clubId: string, userId: string, data: CreateReservationData) {
    const tableResult = await query('SELECT id FROM vip_tables WHERE id = $1 AND club_id = $2', [
      data.tableId,
      clubId,
    ]);
    if (tableResult.rows.length === 0) {
      throw new AppError('Table not found', 404);
    }

    if (data.memberId) {
      const memberResult = await query(
        'SELECT id FROM club_members WHERE id = $1 AND club_id = $2 AND deleted_at IS NULL',
        [data.memberId, clubId]
      );
      if (memberResult.rows.length === 0) {
        throw new AppError('Member not found', 404);
      }
    }

    const result = await query(
      `INSERT INTO vip_reservations (
        club_id, table_id, member_id, reservation_date, guest_name, guest_phone,
        party_size, special_requests, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        clubId,
        data.tableId,
        data.memberId || null,
        data.reservationDate,
        data.guestName,
        data.guestPhone || null,
        data.partySize ?? 2,
        data.specialRequests || null,
        userId,
      ]
    );
    return mapReservation(result.rows[0]);
  }

  async updateReservationStatus(id: string, clubId: string, status: string) {
    const result = await query(
      `UPDATE vip_reservations SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND club_id = $3
       RETURNING *`,
      [status, id, clubId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Reservation not found', 404);
    }
    return mapReservation(result.rows[0]);
  }

  async deleteReservation(id: string, clubId: string) {
    const result = await query(
      'DELETE FROM vip_reservations WHERE id = $1 AND club_id = $2 RETURNING id',
      [id, clubId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Reservation not found', 404);
    }
  }
}

export default new VipService();
