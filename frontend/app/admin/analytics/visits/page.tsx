'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { StatsCard, StatsGrid } from '@/components/StatsCard';
import { PageLoader } from '@/components/Loading';
import { getEngagementMetrics, type EngagementMetrics } from '@/lib';
import { Activity, Users, Repeat, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/**
 * Visits / engagement analytics — backed by GET /clubs/:clubId/metrics/engagement.
 */
export default function VisitsAnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.clubId) return;

    getEngagementMetrics(user.clubId, 30)
      .then(setMetrics)
      .catch((err) => setError(err.message || 'Failed to load visit metrics'))
      .finally(() => setLoading(false));
  }, [user?.clubId]);

  if (loading) {
    return <PageLoader message="Loading visit analytics..." />;
  }

  if (error || !metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{error || 'Unable to load visit metrics.'}</p>
      </div>
    );
  }

  // Trends come back most-recent-first; chart reads left-to-right chronologically.
  const chartData = [...metrics.trends].reverse().map((t) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visits: t.visits,
    uniqueMembers: t.uniqueMembers,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Visit Analytics</h1>
        <p className="text-gray-600 mt-1">Last 30 days</p>
      </div>

      <StatsGrid columns={3}>
        <StatsCard
          title="Today's Visits"
          value={metrics.dailyVisits}
          description="Check-ins today"
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Avg Visits / Member"
          value={metrics.avgVisitsPerMember.toFixed(1)}
          description="Over the last 30 days"
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="Repeat Visit Rate"
          value={`${metrics.repeatVisitRate.toFixed(0)}%`}
          description="Members with 2+ visits"
          icon={<Repeat className="h-6 w-6" />}
          color="green"
        />
      </StatsGrid>

      <Card>
        <CardHeader>
          <CardTitle>Daily Visits</CardTitle>
          <CardDescription>Check-ins over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No visit data yet</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#9333ea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
