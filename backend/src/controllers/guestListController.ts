import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/errorHandler';
import guestListService from '../services/guestListService';
import { auditService, AuditActionType } from '../services/auditService';

export const getGuestLists = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const guestLists = await guestListService.getGuestLists(clubId);
  res.status(200).json({ status: 'success', data: { guestLists } });
});

export const getGuestListById = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { listId } = req.params;
  const guestList = await guestListService.getGuestListById(listId, clubId);
  res.status(200).json({ status: 'success', data: { guestList } });
});

export const getEntries = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { listId } = req.params;
  const entries = await guestListService.getEntries(listId, clubId);
  res.status(200).json({ status: 'success', data: { entries } });
});

export const createGuestList = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const guestList = await guestListService.createGuestList(clubId, userId, req.body);
  res.status(201).json({ status: 'success', data: { guestList } });
});

export const updateGuestList = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { listId } = req.params;
  const guestList = await guestListService.updateGuestList(listId, clubId, req.body);
  res.status(200).json({ status: 'success', data: { guestList } });
});

export const deleteGuestList = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { listId } = req.params;
  await guestListService.deleteGuestList(listId, clubId);
  res.status(204).send();
});

export const addEntry = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { listId } = req.params;
  const entry = await guestListService.addEntry(listId, clubId, req.body);
  res.status(201).json({ status: 'success', data: { entry } });
});

export const removeEntry = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { entryId } = req.params;
  await guestListService.removeEntry(entryId, clubId);
  res.status(204).send();
});

export const checkInEntry = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const { entryId } = req.params;
  const entry = await guestListService.checkInEntry(entryId, clubId, userId);

  await auditService.logAction(
    AuditActionType.GUEST_LIST_CHECK_IN,
    userId,
    clubId,
    { entryId: entry!.id, guestListId: entry!.guestListId },
    req
  );

  res.status(200).json({ status: 'success', data: { entry } });
});
