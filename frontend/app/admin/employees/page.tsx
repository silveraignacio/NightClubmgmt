'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { PageLoader } from '@/components/Loading';
import {
  getEmployees,
  getInvitations,
  inviteEmployee,
  revokeInvitation,
  deactivateEmployee,
  type Employee,
  type EmployeeInvitation,
  type EmployeeRole,
} from '@/lib';
import { UserPlus, Mail, Trash2, UserX } from 'lucide-react';

const ROLES: EmployeeRole[] = ['admin', 'manager', 'bartender', 'doorman', 'security', 'staff'];

/**
 * Employee invite/management (admin only — see .claude/rules/rbac.md, this
 * page is only linked from the sidebar for role === 'admin').
 */
export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invitations, setInvitations] = useState<EmployeeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<EmployeeRole>('bartender');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.clubId) return;
    setLoading(true);
    setError(null);
    try {
      const [employeesData, invitationsData] = await Promise.all([
        getEmployees(user.clubId),
        getInvitations(user.clubId),
      ]);
      setEmployees(employeesData);
      setInvitations(invitationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) return;

    setInviteSubmitting(true);
    setInviteError(null);
    try {
      await inviteEmployee(user.clubId, inviteEmail, inviteRole);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('bartender');
      await load();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const closeInviteModal = () => {
    setInviteOpen(false);
    setInviteError(null);
    setInviteSuccess(null);
  };

  const handleRevoke = async (invitationId: string) => {
    if (!user?.clubId) return;
    setBusyId(invitationId);
    try {
      await revokeInvitation(user.clubId, invitationId);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invitation');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (employeeId: string) => {
    if (!user?.clubId) return;
    if (!confirm('Deactivate this employee? They will no longer be able to log in.')) return;
    setBusyId(employeeId);
    try {
      await deactivateEmployee(user.clubId, employeeId);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate employee');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader message="Loading employees..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm">Invite and manage your club&apos;s staff accounts.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite employee
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Staff accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-gray-500 text-sm">No employees yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{employee.fullName}</td>
                      <td className="py-2 pr-4">{employee.email}</td>
                      <td className="py-2 pr-4 capitalize">{employee.role}</td>
                      <td className="py-2 pr-4">
                        {employee.isActive ? (
                          <span className="text-green-700">Active</span>
                        ) : (
                          <span className="text-gray-400">Deactivated</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {employee.isActive && employee.id !== user?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={busyId === employee.id}
                            onClick={() => handleDeactivate(employee.id)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending invitations.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Expires</th>
                    <th className="py-2 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {invitation.email}
                      </td>
                      <td className="py-2 pr-4 capitalize">{invitation.role}</td>
                      <td className="py-2 pr-4">{new Date(invitation.expiresAt).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={busyId === invitation.id}
                          onClick={() => handleRevoke(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={inviteOpen} onClose={closeInviteModal} title="Invite employee">
        {inviteSuccess ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700">{inviteSuccess}</p>
            <Button fullWidth onClick={closeInviteModal}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}

            <Input
              label="Email"
              type="email"
              placeholder="employee@example.com"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              disabled={inviteSubmitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invite-role">
                Role
              </label>
              <select
                id="invite-role"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as EmployeeRole)}
                disabled={inviteSubmitting}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role} className="capitalize">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" fullWidth isLoading={inviteSubmitting} loadingText="Sending...">
              Send invitation
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
