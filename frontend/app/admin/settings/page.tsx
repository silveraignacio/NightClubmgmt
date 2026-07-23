'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageLoader } from '@/components/Loading';
import { getClub, updateClub, type Club, type UpdateClubSettingsData } from '@/lib';
import { Building2, CheckCircle2, AlertCircle, Users, Calendar } from 'lucide-react';

/**
 * Club settings page (admin only for editing; admin/manager can view).
 * Backed by GET/PATCH /clubs/:clubId (see backend/src/controllers/clubsController.ts).
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [form, setForm] = useState<UpdateClubSettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit = user?.role === 'admin';

  useEffect(() => {
    if (!user?.clubId) return;

    getClub(user.clubId)
      .then((data) => {
        setClub(data);
        setForm({
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          description: data.description || '',
          website: data.website || '',
        });
      })
      .catch((err) => setError(err.message || 'Failed to load club settings'))
      .finally(() => setLoading(false));
  }, [user?.clubId]);

  const handleSave = async () => {
    if (!user?.clubId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateClub(user.clubId, form);
      setClub(updated);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading settings..." />;
  }

  if (!club) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{error || 'Unable to load club settings.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your club&apos;s profile and information</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {!canEdit && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Only club admins can edit these settings. You can view them below.
        </div>
      )}

      {/* Club Info Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Club Profile
          </CardTitle>
          <CardDescription>Basic information about your venue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Club Name"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!canEdit}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!canEdit}
              fullWidth
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!canEdit}
              fullWidth
            />
          </div>
          <Input
            label="Address"
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            disabled={!canEdit}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={form.city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              disabled={!canEdit}
              fullWidth
            />
            <Input
              label="Country"
              value={form.country || ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              disabled={!canEdit}
              fullWidth
            />
          </div>
          <Input
            label="Website"
            value={form.website || ''}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            disabled={!canEdit}
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={!canEdit}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {canEdit && (
            <Button onClick={handleSave} isLoading={saving} disabled={saving}>
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Account Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>Your subscription and membership capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Plan</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{club.currentPlan}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{club.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Members</p>
              <p className="text-lg font-semibold text-gray-900">
                {club.membersCount} / {club.maxMembers}
              </p>
            </div>
            {club.trialEndsAt && (
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Trial Ends
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(club.trialEndsAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
