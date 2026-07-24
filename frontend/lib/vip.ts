import apiClient, { ApiResponse, handleApiError } from './api';

export type VipTableType = 'booth' | 'table' | 'skybox' | 'cabana' | 'stage_side';
export type VipReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

export interface VipTable {
  id: string;
  clubId: string;
  tableName: string;
  tableType: VipTableType;
  capacity: number;
  location?: string;
  minimumSpend: number;
  isAvailable: boolean;
}

export interface VipReservation {
  id: string;
  clubId: string;
  tableId: string;
  tableName: string;
  memberId?: string;
  reservationDate: string;
  guestName: string;
  guestPhone?: string;
  partySize: number;
  status: VipReservationStatus;
  specialRequests?: string;
  createdAt: string;
}

export interface CreateVipTableData {
  tableName: string;
  tableType?: VipTableType;
  capacity?: number;
  location?: string;
  minimumSpend?: number;
}

export interface CreateVipReservationData {
  tableId: string;
  reservationDate: string;
  guestName: string;
  guestPhone?: string;
  partySize?: number;
}

/** GET /clubs/:clubId/vip/tables — any authenticated staff of the club. */
export const getVipTables = async (clubId: string): Promise<VipTable[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ tables: VipTable[] }>>(`/clubs/${clubId}/vip/tables`);
    return response.data.data?.tables || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/vip/tables — admin/manager only. */
export const createVipTable = async (clubId: string, data: CreateVipTableData): Promise<VipTable> => {
  try {
    const response = await apiClient.post<ApiResponse<{ table: VipTable }>>(
      `/clubs/${clubId}/vip/tables`,
      data
    );
    if (!response.data.data) throw new Error('Failed to create table');
    return response.data.data.table;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** GET /clubs/:clubId/vip/reservations — any authenticated staff of the club. */
export const getVipReservations = async (clubId: string, date?: string): Promise<VipReservation[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ reservations: VipReservation[] }>>(
      `/clubs/${clubId}/vip/reservations`,
      { params: date ? { date } : undefined }
    );
    return response.data.data?.reservations || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/vip/reservations — any authenticated staff of the club. */
export const createVipReservation = async (
  clubId: string,
  data: CreateVipReservationData
): Promise<VipReservation> => {
  try {
    const response = await apiClient.post<ApiResponse<{ reservation: VipReservation }>>(
      `/clubs/${clubId}/vip/reservations`,
      data
    );
    if (!response.data.data) throw new Error('Failed to create reservation');
    return response.data.data.reservation;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** PATCH /clubs/:clubId/vip/reservations/:id/status — admin/manager/doorman. */
export const updateVipReservationStatus = async (
  clubId: string,
  reservationId: string,
  status: VipReservationStatus
): Promise<VipReservation> => {
  try {
    const response = await apiClient.patch<ApiResponse<{ reservation: VipReservation }>>(
      `/clubs/${clubId}/vip/reservations/${reservationId}/status`,
      { status }
    );
    if (!response.data.data) throw new Error('Failed to update reservation');
    return response.data.data.reservation;
  } catch (error) {
    throw handleApiError(error);
  }
};
