'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageLoader } from '@/components/Loading';
import { getMember, updateMember, type Member } from '@/lib';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

/**
 * Edit a member's own profile fields. Tier is shown read-only: the backend's
 * updateMember endpoint doesn't support reassigning membership_tier_id today
 * (see backend/src/controllers/membersController.ts allowedFields) — that
 * needs its own dedicated flow, tracked in BACKLOG.md.
 */
export default function EditMemberPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', dateOfBirth: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.clubId || !params.id) return;

    getMember(user.clubId, params.id)
      .then((data) => {
        setMember(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
        });
      })
      .catch((err) => setError(err.message || 'Failed to load member'))
      .finally(() => setLoading(false));
  }, [user?.clubId, params.id]);

  const handleSave = async () => {
    if (!user?.clubId || !member) return;

    setSaving(true);
    setError(null);

    try {
      await updateMember(user.clubId, member.id, {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      router.push(`/admin/members/${member.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading member..." />;
  }

  if (!member) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{error || 'Member not found.'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/members')}>
          Back to Members
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => router.push(`/admin/members/${member.id}`)}
      >
        Back to Member
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              fullWidth
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              fullWidth
            />
          </div>

          <Input label="Email" type="email" value={member.email} disabled fullWidth />
          <p className="text-xs text-gray-500 -mt-2">Email cannot be changed here</p>

          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            fullWidth
          />

          <Input
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Membership Tier</label>
            <Input value={member.tier} disabled fullWidth />
            <p className="text-xs text-gray-500 mt-1">
              Tier changes aren&apos;t supported yet — coming in a future update.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} isLoading={saving} disabled={saving} leftIcon={<Save className="h-4 w-4" />}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/members/${member.id}`)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
