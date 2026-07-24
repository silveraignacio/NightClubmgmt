import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/errorHandler';
import vipService from '../services/vipService';
import { auditService, AuditActionType } from '../services/auditService';

export const getTables = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const tables = await vipService.getTables(clubId);
  res.status(200).json({ status: 'success', data: { tables } });
});

export const createTable = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const table = await vipService.createTable(clubId, req.body);
  res.status(201).json({ status: 'success', data: { table } });
});

export const updateTable = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { tableId } = req.params;
  const table = await vipService.updateTable(tableId, clubId, req.body);
  res.status(200).json({ status: 'success', data: { table } });
});

export const deleteTable = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { tableId } = req.params;
  await vipService.deleteTable(tableId, clubId);
  res.status(204).send();
});

export const getReservations = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { date } = req.query;
  const reservations = await vipService.getReservations(clubId, date as string | undefined);
  res.status(200).json({ status: 'success', data: { reservations } });
});

export const createReservation = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const reservation = await vipService.createReservation(clubId, userId, req.body);

  await auditService.logAction(
    AuditActionType.VIP_RESERVATION_CREATED,
    userId,
    clubId,
    { reservationId: reservation!.id, tableId: reservation!.tableId },
    req
  );

  res.status(201).json({ status: 'success', data: { reservation } });
});

export const updateReservationStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { reservationId } = req.params;
  const { status } = req.body;
  const reservation = await vipService.updateReservationStatus(reservationId, clubId, status);
  res.status(200).json({ status: 'success', data: { reservation } });
});

export const deleteReservation = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { reservationId } = req.params;
  await vipService.deleteReservation(reservationId, clubId);
  res.status(204).send();
});
