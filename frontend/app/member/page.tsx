'use client';

import React, { useEffect, useState } from 'react';
import {
  getMemberStats,
  getMemberQRCode,
  getMember,
  getMemberVisits,
  type Member,
  type MemberStats,
  type QRCodeResponse,
  type Visit,
} from '@/lib';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  QRDisplay,
  PageLoader,
} from '@/components';
import {
  Download,
  Gift,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Member Dashboard Page
 * Displays member's QR code, points, stats, and recent visits
 */
export default function MemberDashboard() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [qrCode, setQrCode] = useState<QRCodeResponse | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tier badge colors
  const tierColors: Record<string, { bg: string; text: string; gradient: string }> = {
    BRONZE: {
      bg: 'bg-amber-900/20',
      text: 'text-amber-400',
      gradient: 'from-amber-600 to-orange-600',
    },
    SILVER: {
      bg: 'bg-slate-700/20',
      text: 'text-slate-300',
      gradient: 'from-slate-400 to-slate-600',
    },
    GOLD: {
      bg: 'bg-yellow-900/20',
      text: 'text-yellow-400',
      gradient: 'from-yellow-500 to-amber-600',
    },
    PLATINUM: {
      bg: 'bg-purple-900/20',
      text: 'text-purple-300',
      gradient: 'from-purple-500 to-pink-600',
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id || !user?.clubId) return;

        setLoading(true);
        setError(null);

        // Fetch all required data
        const [memberData, statsData, qrData, visitsData] = await Promise.all([
          getMember(user.clubId, user.id),
          getMemberStats(user.clubId, user.id),
          getMemberQRCode(user.clubId, user.id),
          getMemberVisits(user.clubId, user.id, { pageSize: 5 }),
        ]);

        setMember(memberData);
        setStats(statsData);
        setQrCode(qrData);
        setVisits(visitsData.data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load member data';
        setError(message);
        console.error('Error fetching member data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.clubId]);

  if (loading) {
    return <PageLoader />;
  }

  if (error || !member || !stats || !qrCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-400 mb-6">
            {error || 'Something went wrong. Please try again later.'}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const tier = member.tier as keyof typeof tierColors;
  const tierColor = tierColors[tier] || tierColors.BRONZE;
  const nextRewardPoints = 100; // Mock value
  const pointsUntilReward = Math.max(0, nextRewardPoints - (stats.points % 100));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Welcome back, {member.firstName}!
        </h1>
        <p className="text-gray-300">
          Enjoy exclusive rewards and VIP experiences with Club Nightlife
        </p>
      </div>

      {/* QR Code & Points Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 border-purple-500/30 h-full">
            <CardHeader>
              <CardTitle className="text-white">Your QR Code</CardTitle>
              <CardDescription className="text-gray-400">
                Show this QR code at the club entrance to check in
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              {qrCode.qrCode && (
                <QRDisplay
                  value={qrCode.qrCode}
                  size={280}
                  bgColor="#1f2937"
                  fgColor="#ffffff"
                  showDownloadButton
                  showCopyButton={false}
                  downloadFileName={`${member.firstName}-${member.lastName}-qr.png`}
                  containerClassName="w-full"
                />
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="primary"
                  className="flex-1 sm:flex-none"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download QR
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  leftIcon={<Gift className="w-4 h-4" />}
                >
                  Add to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Points & Tier Card */}
        <div className="space-y-6">
          {/* Points Card */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Points</p>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {stats.points.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-3">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <p className="text-xs text-gray-400 mb-2">
                  {pointsUntilReward} points until next reward
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${((nextRewardPoints - pointsUntilReward) / nextRewardPoints) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Badge Card */}
          <Card className={`${tierColor.bg} border-purple-500/30`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Membership Tier</p>
                <div className={`inline-block bg-gradient-to-r ${tierColor.gradient} bg-clip-text text-transparent text-3xl font-bold mb-2`}>
                  {tier}
                </div>
                <p className="text-xs text-gray-400">
                  Member since {format(new Date(member.joinDate), 'MMM yyyy')}
                </p>
                <div className="mt-3 flex justify-center">
                  {[...Array(4)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Object.keys(tierColors).indexOf(tier) + 1
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Reward Preview */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Next Reward</p>
                  <p className="text-white font-semibold">Free Drink</p>
                  <p className="text-xs text-gray-400 mt-1">Worth $12</p>
                </div>
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Visits</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalVisits}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalSpent?.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Spending</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.averageSpending?.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Visit</p>
                <p className="text-lg font-bold text-white">
                  {stats.lastVisit
                    ? format(new Date(stats.lastVisit), 'MMM d')
                    : 'Never'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits & Points This Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Recent Visits</CardTitle>
            <CardDescription className="text-gray-400">
              Your last 5 visits to the club
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visits.length > 0 ? (
              <div className="space-y-3">
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-purple-500/30 transition"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {format(new Date(visit.checkInTime), 'EEEE, MMM d')}
                      </p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(visit.checkInTime), 'h:mm a')}
                        {visit.checkOutTime &&
                          ` - ${format(new Date(visit.checkOutTime), 'h:mm a')}`}
                      </p>
                    </div>
                    {visit.amount && (
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">
                          +${visit.amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No visits yet. Come visit us soon!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points This Month */}
        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Points Earned</CardTitle>
            <CardDescription className="text-gray-400">
              This month&apos;s points progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">November 2024</span>
                  <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {Math.floor(stats.points / 5)} pts
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (stats.points / 500) * 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Goal: 500 points for next tier upgrade
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Purchase Points</p>
                    <p className="text-lg font-bold text-blue-400">
                      {Math.floor(stats.points * 0.7)}
                    </p>
                  </div>
                  <div className="bg-green-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Visit Bonus</p>
                    <p className="text-lg font-bold text-green-400">
                      {Math.floor(stats.points * 0.3)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Card */}
      <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/50">
        <CardContent className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Ready to redeem your rewards?
            </h3>
            <p className="text-gray-300">
              Browse our exclusive rewards catalog and claim your points
            </p>
          </div>
          <Button variant="primary" className="whitespace-nowrap">
            View Rewards
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
