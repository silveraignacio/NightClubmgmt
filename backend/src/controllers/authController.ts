import { Response } from 'express';
import * as authService from '../services/authService';
import { passwordResetService } from '../services/passwordResetService';
import { catchAsync } from '../utils/errorHandler';
import { auditService, AuditActionType } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import type { Request } from 'express';

export const registerClubOwner = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerClubOwner(req.body);

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const registerMember = catchAsync(async (req: Request, res: Response) => {
  const clubId = req.params.clubId || req.body.clubId;

  const result = await authService.registerMember({
    ...req.body,
    clubId,
  });

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  // Client-side will remove token
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const verifyToken = catchAsync(async (req: AuthRequest, res: Response) => {
  // User is already authenticated via middleware
  res.status(200).json({
    status: 'success',
    data: {
      valid: true,
      user: req.user,
    },
  });
});

export const changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(
    req.user!.id,
    req.user!.role,
    currentPassword,
    newPassword
  );

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;

  const { id, clubId } = await authService.verifyMemberEmail(token);

  await auditService.logAction(AuditActionType.EMAIL_VERIFIED, id, clubId, {}, req);

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully',
  });
});

export const resendVerificationEmail = catchAsync(async (req: AuthRequest, res: Response) => {
  await authService.resendMemberVerification(req.user!.id, req.clubId!);

  await auditService.logAction(
    AuditActionType.EMAIL_VERIFICATION_SENT,
    req.user!.id,
    req.clubId,
    {},
    req
  );

  res.status(200).json({
    status: 'success',
    message: 'Verification email sent',
  });
});

// Always responds identically whether or not the email exists — no account
// enumeration (see passwordResetService.requestReset).
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await passwordResetService.requestReset(email);

  await auditService.logAction(AuditActionType.PASSWORD_RESET_REQUESTED, undefined, undefined, {}, req);

  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, password reset instructions have been sent',
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  await passwordResetService.resetPassword(token, password);

  await auditService.logAction(AuditActionType.PASSWORD_RESET_COMPLETED, undefined, undefined, {}, req);

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful',
  });
});
