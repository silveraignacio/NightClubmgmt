import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { catchAsync } from '../utils/errorHandler';

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
