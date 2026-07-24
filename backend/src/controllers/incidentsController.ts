import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/errorHandler';
import incidentsService from '../services/incidentsService';
import { auditService, AuditActionType } from '../services/auditService';

export const getIncidents = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { incidentType, severity, resolved, limit, offset } = req.query;

  const result = await incidentsService.getIncidents(clubId, {
    incidentType: incidentType as string | undefined,
    severity: severity as string | undefined,
    resolved: resolved === undefined ? undefined : resolved === 'true',
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  });

  res.status(200).json({ status: 'success', data: result });
});

export const getTonightIncidents = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const incidents = await incidentsService.getTonightIncidents(clubId);
  res.status(200).json({ status: 'success', data: { incidents } });
});

export const getIncidentStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { days } = req.query;
  const stats = await incidentsService.getIncidentStats(clubId, days ? parseInt(days as string, 10) : undefined);
  res.status(200).json({ status: 'success', data: { stats } });
});

export const getIncidentById = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { incidentId } = req.params;
  const incident = await incidentsService.getIncidentById(incidentId, clubId);
  res.status(200).json({ status: 'success', data: { incident } });
});

export const createIncident = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;

  const incident = await incidentsService.createIncident(clubId, userId, req.body);

  await auditService.logAction(
    AuditActionType.INCIDENT_REPORTED,
    userId,
    clubId,
    { incidentId: incident!.id, severity: incident!.severity, incidentType: incident!.incidentType },
    req
  );

  res.status(201).json({ status: 'success', data: { incident } });
});

export const updateIncident = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const { incidentId } = req.params;
  const incident = await incidentsService.updateIncident(incidentId, clubId, req.body);
  res.status(200).json({ status: 'success', data: { incident } });
});

export const resolveIncident = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId!;
  const userId = req.user!.id;
  const { incidentId } = req.params;
  const { notes } = req.body || {};

  const incident = await incidentsService.resolveIncident(incidentId, clubId, userId, notes);

  await auditService.logAction(
    AuditActionType.INCIDENT_RESOLVED,
    userId,
    clubId,
    { incidentId: incident!.id },
    req
  );

  res.status(200).json({ status: 'success', data: { incident } });
});
