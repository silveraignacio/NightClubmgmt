'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { StatsCard, StatsGrid } from '@/components/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageLoader } from '@/components/Loading';
import {
  getTodayVisitsCount,
  getTodayRevenue,
  getVisits,
  getMemberMetrics,
  Visit,
} from '@/lib';
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  UserPlus,
  QrCode,
  Wine,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  todayVisits: number;
  todayRevenue: number;
  activeMembers: number;
  totalMembers: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    todayVisits: 0,
    todayRevenue: 0,
    activeMembers: 0,
    totalMembers: 0,
  });
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.clubId) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.clubId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all stats in parallel. Member metrics require admin/manager
      // (see backend/src/routes/metrics.ts), so tolerate it failing for other roles.
      const [visitsCount, revenue, visitsData, memberMetrics] = await Promise.all([
        getTodayVisitsCount(user.clubId),
        getTodayRevenue(user.clubId),
        getVisits(user.clubId, { page: 1, pageSize: 5 }),
        getMemberMetrics(user.clubId).catch(() => null),
      ]);

      setStats({
        todayVisits: visitsCount,
        todayRevenue: revenue,
        activeMembers: memberMetrics?.activeMembers ?? 0,
        totalMembers: memberMetrics?.totalMembers ?? 0,
      });

      setRecentVisits(visitsData.data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.fullName}! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card border="light" padding="md" className="bg-red-50 border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {/* KPI Cards */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Today's Visits"
          value={stats.todayVisits}
          description="Total check-ins today"
          icon={<Activity className="h-6 w-6" />}
          color="blue"
          onClick={() => router.push('/admin/door')}
          actionLabel="Go to door control"
        />

        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          description="Total earnings today"
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
          onClick={() => router.push('/admin/bar')}
          actionLabel="Go to bar & POS"
        />

        <StatsCard
          title="Active Members"
          value={stats.activeMembers}
          description="Members with recent activity"
          icon={<Users className="h-6 w-6" />}
          color="purple"
          onClick={() => router.push('/admin/members')}
          actionLabel="Manage members"
        />

        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          description="All-time registered members"
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
          onClick={() => router.push('/admin/members')}
          actionLabel="Manage members"
        />
      </StatsGrid>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={<UserPlus className="h-5 w-5" />}
              onClick={() => router.push('/admin/members/new')}
            >
              Add New Member
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={<QrCode className="h-5 w-5" />}
              onClick={() => router.push('/admin/door')}
            >
              Scan QR Code
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={<Wine className="h-5 w-5" />}
              onClick={() => router.push('/admin/bar')}
            >
              Process Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Visits</CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No visits yet today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {visit.memberName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(visit.checkInTime)}
                          {visit.guestCount > 0 && (
                            <span className="ml-2">
                              +{visit.guestCount} {visit.guestCount === 1 ? 'guest' : 'guests'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {visit.entryMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => router.push('/admin/door')}
                >
                  Go to door control
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {stats.todayVisits} new visits today
                  </p>
                  <p className="text-xs text-gray-500">Member check-ins</p>
                </div>
                <span className="text-xs text-gray-400">Just now</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(stats.todayRevenue)} revenue generated
                  </p>
                  <p className="text-xs text-gray-500">Total transactions</p>
                </div>
                <span className="text-xs text-gray-400">Today</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {stats.activeMembers} active of {stats.totalMembers} members
                  </p>
                  <p className="text-xs text-gray-500">Active in the last 30 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
