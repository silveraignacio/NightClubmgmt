import apiClient, { ApiResponse, handleApiError } from './api';

export type IncidentType =
  | 'altercation'
  | 'medical'
  | 'theft'
  | 'noise_complaint'
  | 'ejection'
  | 'id_issue'
  | 'overcapacity'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  clubId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location?: string;
  actionTaken?: string;
  policeCalled: boolean;
  ambulanceCalled: boolean;
  reportedBy?: string;
  reporterName?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolverName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentData {
  incidentType: IncidentType;
  severity?: IncidentSeverity;
  description: string;
  location?: string;
  actionTaken?: string;
  policeCalled?: boolean;
  ambulanceCalled?: boolean;
}

/** GET /clubs/:clubId/incidents — admin/manager/security. */
export const getIncidents = async (
  clubId: string,
  filters: { resolved?: boolean } = {}
): Promise<{ incidents: Incident[]; total: number }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ incidents: Incident[]; total: number }>>(
      `/clubs/${clubId}/incidents`,
      { params: filters }
    );
    return response.data.data || { incidents: [], total: 0 };
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/incidents — admin/manager/security. */
export const createIncident = async (clubId: string, data: CreateIncidentData): Promise<Incident> => {
  try {
    const response = await apiClient.post<ApiResponse<{ incident: Incident }>>(
      `/clubs/${clubId}/incidents`,
      data
    );
    if (!response.data.data) throw new Error('Failed to create incident');
    return response.data.data.incident;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/incidents/:incidentId/resolve — admin/manager only. */
export const resolveIncident = async (
  clubId: string,
  incidentId: string,
  notes?: string
): Promise<Incident> => {
  try {
    const response = await apiClient.post<ApiResponse<{ incident: Incident }>>(
      `/clubs/${clubId}/incidents/${incidentId}/resolve`,
      { notes }
    );
    if (!response.data.data) throw new Error('Failed to resolve incident');
    return response.data.data.incident;
  } catch (error) {
    throw handleApiError(error);
  }
};
