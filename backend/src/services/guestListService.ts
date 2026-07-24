import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface CreateGuestListData {
  listName: string;
  eventDate: string;
  eventId?: string;
  entryType?: string;
  maxGuests?: number;
}

export type UpdateGuestListData = Partial<CreateGuestListData> & { isActive?: boolean };

export interface AddEntryData {
  guestName: string;
  guestPhone?: string;
  plusOnes?: number;
  memberId?: string;
}

function mapList(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    eventId: row.event_id,
    listName: row.list_name,
    eventDate: row.event_date,
    entryType: row.entry_type,
    maxGuests: row.max_guests,
    isActive: row.is_active,
    entryCount: row.entry_count !== undefined ? parseInt(row.entry_count, 10) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntry(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    guestListId: row.guest_list_id,
    clubId: row.club_id,
    memberId: row.member_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    plusOnes: row.plus_ones,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    checkedInBy: row.checked_in_by,
    createdAt: row.created_at,
  };
}

const LIST_FIELD_MAP: Record<string, string> = {
  listName: 'list_name',
  eventDate: 'event_date',
  eventId: 'event_id',
  entryType: 'entry_type',
  maxGuests: 'max_guests',
  isActive: 'is_active',
};

class GuestListService {
  async getGuestLists(clubId: string) {
    const result = await query(
      `SELECT gl.*, COUNT(e.id)::int as entry_count
       FROM guest_lists gl
       LEFT JOIN guest_list_entries e ON e.guest_list_id = gl.id
       WHERE gl.club_id = $1 AND gl.is_active = true
       GROUP BY gl.id
       ORDER BY gl.event_date DESC`,
      [clubId]
    );
    return result.rows.map(mapList);
  }

  async getGuestListById(id: string, clubId: string) {
    const result = await query('SELECT * FROM guest_lists WHERE id = $1 AND club_id = $2', [id, clubId]);
    if (result.rows.length === 0) {
      throw new AppError('Guest list not found', 404);
    }
    return mapList(result.rows[0]);
  }

  async getEntries(guestListId: string, clubId: string) {
    const listResult = await query('SELECT id FROM guest_lists WHERE id = $1 AND club_id = $2', [
      guestListId,
      clubId,
    ]);
    if (listResult.rows.length === 0) {
      throw new AppError('Guest list not found', 404);
    }

    const result = await query(
      'SELECT * FROM guest_list_entries WHERE guest_list_id = $1 ORDER BY guest_name ASC',
      [guestListId]
    );
    return result.rows.map(mapEntry);
  }

  async createGuestList(clubId: string, userId: string, data: CreateGuestListData) {
    const result = await query(
      `INSERT INTO guest_lists (club_id, event_id, list_name, event_date, entry_type, max_guests, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        clubId,
        data.eventId || null,
        data.listName,
        data.eventDate,
        data.entryType || 'free_entry',
        data.maxGuests || null,
        userId,
      ]
    );
    return mapList(result.rows[0]);
  }

  async updateGuestList(id: string, clubId: string, updates: UpdateGuestListData) {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, column] of Object.entries(LIST_FIELD_MAP)) {
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
      `UPDATE guest_lists SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND club_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Guest list not found', 404);
    }
    return mapList(result.rows[0]);
  }

  async deleteGuestList(id: string, clubId: string) {
    const result = await query(
      'UPDATE guest_lists SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND club_id = $2 RETURNING id',
      [id, clubId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Guest list not found', 404);
    }
  }

  async addEntry(guestListId: string, clubId: string, data: AddEntryData) {
    const listResult = await query('SELECT id FROM guest_lists WHERE id = $1 AND club_id = $2', [
      guestListId,
      clubId,
    ]);
    if (listResult.rows.length === 0) {
      throw new AppError('Guest list not found', 404);
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
      `INSERT INTO guest_list_entries (guest_list_id, club_id, member_id, guest_name, guest_phone, plus_ones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [guestListId, clubId, data.memberId || null, data.guestName, data.guestPhone || null, data.plusOnes ?? 0]
    );
    return mapEntry(result.rows[0]);
  }

  async removeEntry(entryId: string, clubId: string) {
    const result = await query(
      'DELETE FROM guest_list_entries WHERE id = $1 AND club_id = $2 RETURNING id',
      [entryId, clubId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Guest list entry not found', 404);
    }
  }

  async checkInEntry(entryId: string, clubId: string, userId: string) {
    const result = await query(
      `UPDATE guest_list_entries
       SET checked_in = true, checked_in_at = CURRENT_TIMESTAMP, checked_in_by = $1
       WHERE id = $2 AND club_id = $3 AND checked_in = false
       RETURNING *`,
      [userId, entryId, clubId]
    );

    if (result.rows.length === 0) {
      const existsResult = await query('SELECT checked_in FROM guest_list_entries WHERE id = $1 AND club_id = $2', [
        entryId,
        clubId,
      ]);
      if (existsResult.rows.length === 0) {
        throw new AppError('Guest list entry not found', 404);
      }
      throw new AppError('Guest already checked in', 400);
    }

    return mapEntry(result.rows[0]);
  }
}

export default new GuestListService();
