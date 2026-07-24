'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { PageLoader } from '@/components/Loading';
import {
  getIncidents,
  createIncident,
  resolveIncident,
  type Incident,
  type IncidentType,
  type IncidentSeverity,
} from '@/lib';
import { ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';

const INCIDENT_TYPES: IncidentType[] = [
  'altercation',
  'medical',
  'theft',
  'noise_complaint',
  'ejection',
  'id_issue',
  'overcapacity',
  'other',
];

const SEVERITIES: IncidentSeverity[] = ['low', 'medium', 'high', 'critical'];

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

/**
 * Security incident reporting (admin/manager/security — see
 * .claude/rules/rbac.md and docs/architecture/rbac-matrix.md "Incidents").
 * Only admin/manager can resolve; security can report and view.
 */
export default function SecurityPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const canResolve = user?.role === 'admin' || user?.role === 'manager';

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState<IncidentType>('other');
  const [reportSeverity, setReportSeverity] = useState<IncidentSeverity>('low');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.clubId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getIncidents(user.clubId, { resolved: showResolved ? undefined : false });
      setIncidents(result.incidents);
    } catch (err: any) {
      setError(err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [user?.clubId, showResolved]);

  useEffect(() => {
    load();
  }, [load]);

  const resetReportForm = () => {
    setReportType('other');
    setReportSeverity('low');
    setReportDescription('');
    setReportLocation('');
    setReportError(null);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) return;

    setReportSubmitting(true);
    setReportError(null);
    try {
      await createIncident(user.clubId, {
        incidentType: reportType,
        severity: reportSeverity,
        description: reportDescription,
        location: reportLocation || undefined,
      });
      setReportOpen(false);
      resetReportForm();
      await load();
    } catch (err: any) {
      setReportError(err.message || 'Failed to report incident');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    if (!user?.clubId) return;
    setResolvingId(incidentId);
    try {
      await resolveIncident(user.clubId, incidentId);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve incident');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <PageLoader message="Loading incidents..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Security Incidents
          </h1>
          <p className="text-gray-500 text-sm">Report and track security incidents tonight.</p>
        </div>
        <Button onClick={() => setReportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report incident
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Show resolved
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-gray-500 text-sm">No incidents to show.</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEVERITY_STYLES[incident.severity]}`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {incident.incidentType.replace('_', ' ')}
                      </span>
                      {incident.resolved && (
                        <span className="text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{incident.description}</p>
                    <p className="text-xs text-gray-400">
                      {incident.location && `${incident.location} · `}
                      {new Date(incident.createdAt).toLocaleString()}
                      {incident.reporterName && ` · reported by ${incident.reporterName}`}
                    </p>
                  </div>
                  {canResolve && !incident.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={resolvingId === incident.id}
                      onClick={() => handleResolve(incident.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={reportOpen}
        onClose={() => {
          setReportOpen(false);
          resetReportForm();
        }}
        title="Report incident"
      >
        <form onSubmit={handleReport} className="space-y-4">
          {reportError && <p className="text-sm text-red-600">{reportError}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="incident-type">
              Type
            </label>
            <select
              id="incident-type"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as IncidentType)}
              disabled={reportSubmitting}
            >
              {INCIDENT_TYPES.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="incident-severity">
              Severity
            </label>
            <select
              id="incident-severity"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={reportSeverity}
              onChange={(e) => setReportSeverity(e.target.value as IncidentSeverity)}
              disabled={reportSubmitting}
            >
              {SEVERITIES.map((severity) => (
                <option key={severity} value={severity} className="capitalize">
                  {severity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="incident-description">
              Description
            </label>
            <textarea
              id="incident-description"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              required
              disabled={reportSubmitting}
            />
          </div>

          <Input
            label="Location (optional)"
            type="text"
            placeholder="Main bar, entrance, VIP area..."
            fullWidth
            value={reportLocation}
            onChange={(e) => setReportLocation(e.target.value)}
            disabled={reportSubmitting}
          />

          <Button type="submit" fullWidth isLoading={reportSubmitting} loadingText="Reporting...">
            Report incident
          </Button>
        </form>
      </Modal>
    </div>
  );
}
