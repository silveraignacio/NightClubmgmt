'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { StatsCard, StatsGrid } from '@/components/StatsCard';
import { PageLoader } from '@/components/Loading';
import { getRevenueMetrics, type RevenueMetrics } from '@/lib';
import { DollarSign, Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/**
 * Revenue analytics — backed by GET /clubs/:clubId/metrics/revenue.
 */
export default function RevenueAnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.clubId) return;

    getRevenueMetrics(user.clubId, 30)
      .then(setMetrics)
      .catch((err) => setError(err.message || 'Failed to load revenue metrics'))
      .finally(() => setLoading(false));
  }, [user?.clubId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return <PageLoader message="Loading revenue analytics..." />;
  }

  if (error || !metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{error || 'Unable to load revenue metrics.'}</p>
      </div>
    );
  }

  // Trends come back most-recent-first; chart reads left-to-right chronologically.
  const chartData = [...metrics.trends].reverse().map((t) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: t.revenue,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
        <p className="text-gray-600 mt-1">Last 30 days</p>
      </div>

      <StatsGrid columns={3}>
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(metrics.monthlyRevenue)}
          description="Completed transactions, last 30 days"
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="Transactions"
          value={metrics.transactionCount}
          description="Total completed transactions"
          icon={<Receipt className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Average Transaction"
          value={formatCurrency(metrics.averageTransaction)}
          description="Per transaction"
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      </StatsGrid>

      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue</CardTitle>
          <CardDescription>Revenue trend over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No revenue data yet</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
