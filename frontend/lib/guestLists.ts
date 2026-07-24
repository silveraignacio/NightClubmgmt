import apiClient, { ApiResponse, handleApiError } from './api';

export interface GuestList {
  id: string;
  clubId: string;
  eventId?: string;
  listName: string;
  eventDate: string;
  entryType: string;
  maxGuests?: number;
  isActive: boolean;
  entryCount?: number;
  createdAt: string;
}

export interface GuestListEntry {
  id: string;
  guestListId: string;
  clubId: string;
  memberId?: string;
  guestName: string;
  guestPhone?: string;
  plusOnes: number;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
}

export interface CreateGuestListData {
  listName: string;
  eventDate: string;
  entryType?: string;
  maxGuests?: number;
}

export interface AddEntryData {
  guestName: string;
  guestPhone?: string;
  plusOnes?: number;
}

/** GET /clubs/:clubId/guest-lists — any authenticated staff of the club. */
export const getGuestLists = async (clubId: string): Promise<GuestList[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ guestLists: GuestList[] }>>(
      `/clubs/${clubId}/guest-lists`
    );
    return response.data.data?.guestLists || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** GET /clubs/:clubId/guest-lists/:listId/entries — any authenticated staff. */
export const getGuestListEntries = async (clubId: string, listId: string): Promise<GuestListEntry[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ entries: GuestListEntry[] }>>(
      `/clubs/${clubId}/guest-lists/${listId}/entries`
    );
    return response.data.data?.entries || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/guest-lists — admin/manager only. */
export const createGuestList = async (clubId: string, data: CreateGuestListData): Promise<GuestList> => {
  try {
    const response = await apiClient.post<ApiResponse<{ guestList: GuestList }>>(
      `/clubs/${clubId}/guest-lists`,
      data
    );
    if (!response.data.data) throw new Error('Failed to create guest list');
    return response.data.data.guestList;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/guest-lists/:listId/entries — admin/manager only. */
export const addGuestListEntry = async (
  clubId: string,
  listId: string,
  data: AddEntryData
): Promise<GuestListEntry> => {
  try {
    const response = await apiClient.post<ApiResponse<{ entry: GuestListEntry }>>(
      `/clubs/${clubId}/guest-lists/${listId}/entries`,
      data
    );
    if (!response.data.data) throw new Error('Failed to add guest');
    return response.data.data.entry;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST .../entries/:entryId/check-in — admin/manager/security/doorman. */
export const checkInGuestListEntry = async (
  clubId: string,
  listId: string,
  entryId: string
): Promise<GuestListEntry> => {
  try {
    const response = await apiClient.post<ApiResponse<{ entry: GuestListEntry }>>(
      `/clubs/${clubId}/guest-lists/${listId}/entries/${entryId}/check-in`
    );
    if (!response.data.data) throw new Error('Failed to check in guest');
    return response.data.data.entry;
  } catch (error) {
    throw handleApiError(error);
  }
};
