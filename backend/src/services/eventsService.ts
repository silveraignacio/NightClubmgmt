import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface CreateEventData {
  eventName: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  eventType?: string;
  featuredImageUrl?: string;
  capacity?: number;
  entryPrice?: number;
  vipDiscount?: number;
  isPublic?: boolean;
}

export type UpdateEventData = Partial<CreateEventData> & { isActive?: boolean };

function mapEvent(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    clubId: row.club_id,
    eventName: row.event_name,
    description: row.description,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    eventType: row.event_type,
    featuredImageUrl: row.featured_image_url,
    capacity: row.capacity,
    attendeeCount: row.attendee_count,
    entryPrice: parseFloat(row.entry_price),
    vipDiscount: parseFloat(row.vip_discount),
    isPublic: row.is_public,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const FIELD_MAP: Record<string, string> = {
  eventName: 'event_name',
  description: 'description',
  eventDate: 'event_date',
  startTime: 'start_time',
  endTime: 'end_time',
  eventType: 'event_type',
  featuredImageUrl: 'featured_image_url',
  capacity: 'capacity',
  entryPrice: 'entry_price',
  vipDiscount: 'vip_discount',
  isPublic: 'is_public',
  isActive: 'is_active',
};

class EventsService {
  async getEvents(clubId: string, upcomingOnly = false) {
    const whereExtra = upcomingOnly ? 'AND event_date >= CURRENT_DATE' : '';
    const result = await query(
      `SELECT * FROM events WHERE club_id = $1 AND is_active = true ${whereExtra}
       ORDER BY event_date ASC, start_time ASC`,
      [clubId]
    );
    return result.rows.map(mapEvent);
  }

  async getEventById(id: string, clubId: string) {
    const result = await query('SELECT * FROM events WHERE id = $1 AND club_id = $2', [id, clubId]);
    if (result.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }
    return mapEvent(result.rows[0]);
  }

  async createEvent(clubId: string, userId: string, data: CreateEventData) {
    const result = await query(
      `INSERT INTO events (
        club_id, event_name, description, event_date, start_time, end_time,
        event_type, featured_image_url, capacity, entry_price, vip_discount,
        is_public, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        clubId,
        data.eventName,
        data.description || null,
        data.eventDate,
        data.startTime,
        data.endTime || null,
        data.eventType || 'special_event',
        data.featuredImageUrl || null,
        data.capacity || null,
        data.entryPrice ?? 0,
        data.vipDiscount ?? 0,
        data.isPublic ?? true,
        userId,
      ]
    );
    return mapEvent(result.rows[0]);
  }

  async updateEvent(id: string, clubId: string, updates: UpdateEventData) {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, column] of Object.entries(FIELD_MAP)) {
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
      `UPDATE events SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND club_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }
    return mapEvent(result.rows[0]);
  }

  async deleteEvent(id: string, clubId: string) {
    const result = await query(
      'UPDATE events SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND club_id = $2 RETURNING id',
      [id, clubId]
    );
    if (result.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }
  }

  async markAttendance(eventId: string, clubId: string, memberId: string, markedBy: string) {
    const eventResult = await query('SELECT id FROM events WHERE id = $1 AND club_id = $2', [eventId, clubId]);
    if (eventResult.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    const memberResult = await query(
      'SELECT id FROM club_members WHERE id = $1 AND club_id = $2 AND deleted_at IS NULL',
      [memberId, clubId]
    );
    if (memberResult.rows.length === 0) {
      throw new AppError('Member not found', 404);
    }

    const inserted = await query(
      `INSERT INTO event_attendance (event_id, club_id, member_id, marked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, member_id) DO NOTHING
       RETURNING id`,
      [eventId, clubId, memberId, markedBy]
    );

    if (inserted.rows.length > 0) {
      await query('UPDATE events SET attendee_count = attendee_count + 1 WHERE id = $1', [eventId]);
    }

    return { eventId, memberId, alreadyMarked: inserted.rows.length === 0 };
  }
}

export default new EventsService();
