import apiClient, { ApiResponse, handleApiError } from './api';

export interface Event {
  id: string;
  clubId: string;
  eventName: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  eventType: string;
  featuredImageUrl?: string;
  capacity?: number;
  attendeeCount: number;
  entryPrice: number;
  vipDiscount: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  eventName: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  eventType?: string;
  capacity?: number;
  entryPrice?: number;
  vipDiscount?: number;
  isPublic?: boolean;
}

/** GET /clubs/:clubId/events — any authenticated staff of the club. */
export const getEvents = async (clubId: string, upcomingOnly = false): Promise<Event[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ events: Event[] }>>(`/clubs/${clubId}/events`, {
      params: upcomingOnly ? { upcoming: 'true' } : undefined,
    });
    return response.data.data?.events || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/events — admin/manager only. */
export const createEvent = async (clubId: string, data: CreateEventData): Promise<Event> => {
  try {
    const response = await apiClient.post<ApiResponse<{ event: Event }>>(`/clubs/${clubId}/events`, data);
    if (!response.data.data) throw new Error('Failed to create event');
    return response.data.data.event;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** DELETE /clubs/:clubId/events/:eventId — admin/manager only (soft-delete). */
export const deleteEvent = async (clubId: string, eventId: string): Promise<void> => {
  try {
    await apiClient.delete(`/clubs/${clubId}/events/${eventId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};
