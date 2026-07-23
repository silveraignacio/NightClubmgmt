'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageLoader } from '@/components/Loading';
import { getMember, getMemberStats, type Member, type MemberStats } from '@/lib';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Zap, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-orange-100 text-orange-800 border-orange-300',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-300',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PLATINUM: 'bg-purple-100 text-purple-800 border-purple-300',
};

/**
 * Member detail view for staff — backed by GET member + GET member stats
 * (both already used elsewhere in the app, see frontend/lib/members.ts).
 */
export default function MemberDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.clubId || !params.id) return;

    Promise.all([getMember(user.clubId, params.id), getMemberStats(user.clubId, params.id)])
      .then(([memberData, statsData]) => {
        setMember(memberData);
        setStats(statsData);
      })
      .catch((err) => setError(err.message || 'Failed to load member'))
      .finally(() => setLoading(false));
  }, [user?.clubId, params.id]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return <PageLoader message="Loading member..." />;
  }

  if (error || !member) {
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => router.push('/admin/members')}
        >
          Back to Members
        </Button>
        <Button
          leftIcon={<Edit className="h-4 w-4" />}
          onClick={() => router.push(`/admin/members/${member.id}/edit`)}
        >
          Edit Member
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-purple-600">
                {member.firstName.charAt(0)}
                {member.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {member.firstName} {member.lastName}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {member.email}
                </span>
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {member.phone}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${
                TIER_COLORS[member.tier] || 'bg-gray-100 text-gray-800 border-gray-300'
              }`}
            >
              {member.tier} TIER
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Zap className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{member.points.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{member.totalVisits}</p>
            <p className="text-xs text-gray-500">Total Visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(member.totalSpent)}</p>
            <p className="text-xs text-gray-500">Total Spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">
              {member.lastVisit ? new Date(member.lastVisit).toLocaleDateString() : 'Never'}
            </p>
            <p className="text-xs text-gray-500">Last Visit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>This member&apos;s most recent purchases</CardDescription>
        </CardHeader>
        <CardContent>
          {stats && stats.recentVisits.length > 0 ? (
            <div className="space-y-3">
              {stats.recentVisits.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(activity.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
