import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/errorHandler';
import employeeInvitationService from '../services/employeeInvitationService';
import { auditService, AuditActionType } from '../services/auditService';

export const listEmployees = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const employees = await employeeInvitationService.getEmployees(clubId);
  res.status(200).json({ status: 'success', data: { employees } });
});

export const inviteEmployee = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const invitedById = req.user!.id;
  const { email, role } = req.body;

  const invitation = await employeeInvitationService.createInvitation(clubId, invitedById, email, role);

  await auditService.logAction(
    AuditActionType.USER_CREATED,
    invitedById,
    clubId,
    { invitationId: invitation.id, role },
    req
  );

  res.status(201).json({ status: 'success', data: { invitation } });
});

export const listInvitations = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const invitations = await employeeInvitationService.getInvitations(clubId);
  res.status(200).json({ status: 'success', data: { invitations } });
});

export const revokeInvitation = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { id } = req.params;
  await employeeInvitationService.revokeInvitation(clubId, id);
  res.status(204).send();
});

export const deactivateEmployee = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { userId } = req.params;
  await employeeInvitationService.deactivateEmployee(clubId, userId);

  await auditService.logAction(
    AuditActionType.USER_DELETED,
    req.user!.id,
    clubId,
    { deactivatedUserId: userId },
    req
  );

  res.status(204).send();
});

export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  const { token, password, fullName } = req.body;
  const result = await employeeInvitationService.acceptInvitation(token, password, fullName);

  await auditService.logAction(
    AuditActionType.USER_CREATED,
    result.userId,
    result.clubId,
    { source: 'invitation', role: result.role },
    req
  );

  res.status(201).json({ status: 'success', data: result });
});
