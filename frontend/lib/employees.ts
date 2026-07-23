import apiClient, { ApiResponse, handleApiError } from './api';

export type EmployeeRole = 'admin' | 'manager' | 'bartender' | 'doorman' | 'security' | 'staff';

export interface Employee {
  id: string;
  email: string;
  fullName: string;
  role: EmployeeRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  clubId: string;
  email: string;
  role: EmployeeRole;
  invitedBy: string;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

/** GET /clubs/:clubId/employees (admin only). */
export const getEmployees = async (clubId: string): Promise<Employee[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ employees: Employee[] }>>(
      `/clubs/${clubId}/employees`
    );
    return response.data.data?.employees || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** GET /clubs/:clubId/employees/invitations (admin only) — pending, unexpired invites. */
export const getInvitations = async (clubId: string): Promise<Invitation[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ invitations: Invitation[] }>>(
      `/clubs/${clubId}/employees/invitations`
    );
    return response.data.data?.invitations || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/** POST /clubs/:clubId/employees/invite (admin only). */
export const inviteEmployee = async (
  clubId: string,
  email: string,
  role: EmployeeRole
): Promise<Invitation> => {
  try {
    const response = await apiClient.post<ApiResponse<{ invitation: Invitation }>>(
      `/clubs/${clubId}/employees/invite`,
      { email, role }
    );
    if (!response.data.data) throw new Error('Invite failed');
    return response.data.data.invitation;
  } catch (error) {
    throw handleApiError(error);
  }
};

/** DELETE /clubs/:clubId/employees/invitations/:id (admin only). */
export const revokeInvitation = async (clubId: string, invitationId: string): Promise<void> => {
  try {
    await apiClient.delete(`/clubs/${clubId}/employees/invitations/${invitationId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/** DELETE /clubs/:clubId/employees/:userId (admin only) — deactivates, does not hard-delete. */
export const deactivateEmployee = async (clubId: string, userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/clubs/${clubId}/employees/${userId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};
