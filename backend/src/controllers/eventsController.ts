import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/errorHandler';
import eventsService from '../services/eventsService';
import { auditService, AuditActionType } from '../services/auditService';

export const getEvents = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const upcomingOnly = req.query.upcoming === 'true';
  const events = await eventsService.getEvents(clubId, upcomingOnly);
  res.status(200).json({ status: 'success', data: { events } });
});

export const getEventById = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { eventId } = req.params;
  const event = await eventsService.getEventById(eventId, clubId);
  res.status(200).json({ status: 'success', data: { event } });
});

export const createEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const event = await eventsService.createEvent(clubId, userId, req.body);

  await auditService.logAction(AuditActionType.EVENT_CREATED, userId, clubId, { eventId: event!.id }, req);

  res.status(201).json({ status: 'success', data: { event } });
});

export const updateEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { eventId } = req.params;
  const event = await eventsService.updateEvent(eventId, clubId, req.body);
  res.status(200).json({ status: 'success', data: { event } });
});

export const deleteEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const { eventId } = req.params;

  await eventsService.deleteEvent(eventId, clubId);

  await auditService.logAction(AuditActionType.EVENT_DELETED, userId, clubId, { eventId }, req);

  res.status(204).send();
});

export const markAttendance = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const { eventId, memberId } = req.params;

  const result = await eventsService.markAttendance(eventId, clubId, memberId, userId);

  res.status(200).json({ status: 'success', data: result });
});
