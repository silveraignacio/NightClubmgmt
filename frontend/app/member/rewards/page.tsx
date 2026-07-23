'use client';

import React, { useState, useEffect } from 'react';
import {
  getMemberStats,
  getRewards,
  redeemReward,
  getMyRedeemedRewards,
  type MemberStats,
  type Reward,
  type RedeemedReward,
  type RewardType,
} from '@/lib';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  PageLoader,
} from '@/components';
import { Gift, Check, Clock, Sparkles, Zap, XCircle } from 'lucide-react';

const CATEGORIES: Array<{ id: RewardType | 'all'; label: string }> = [
  { id: 'all', label: 'All Rewards' },
  { id: 'discount', label: 'Discounts' },
  { id: 'free_item', label: 'Free Items' },
  { id: 'free_entry', label: 'Free Entry' },
  { id: 'merchandise', label: 'Merchandise' },
];

/**
 * Member Rewards Page
 * Displays the club's real reward catalog and lets a member redeem points for
 * one. Backed by GET/POST /clubs/:clubId/rewards (see frontend/lib/rewards.ts).
 */
export default function RewardsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RewardType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id || !user?.clubId) return;

        setLoading(true);
        setError(null);

        const [statsData, rewardsData, redeemedData] = await Promise.all([
          getMemberStats(user.clubId, user.id),
          getRewards(user.clubId),
          getMyRedeemedRewards(user.clubId),
        ]);

        setStats(statsData);
        setRewards(rewardsData);
        setRedeemedRewards(redeemedData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load rewards';
        setError(message);
        console.error('Error fetching rewards data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.clubId]);

  const handleRedeemReward = async (reward: Reward) => {
    if (!user?.clubId || !stats || stats.points < reward.pointsRequired) return;

    try {
      setRedeeming(reward.id);
      setRedeemError(null);

      const result = await redeemReward(user.clubId, reward.id);

      setRedeemedRewards([result.redemption, ...redeemedRewards]);
      setStats({ ...stats, points: result.pointsBalance });
      setSuccessMessage(`Successfully redeemed ${reward.name}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to redeem reward. Please try again.';
      setRedeemError(message);
      setTimeout(() => setRedeemError(null), 4000);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-white">Unable to Load Rewards</h2>
        <p className="text-gray-400">
          {error || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const filteredRewards =
    selectedCategory === 'all'
      ? rewards
      : rewards.filter((r) => r.rewardType === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Rewards Catalog
        </h1>
        <p className="text-gray-300">
          Browse and redeem exclusive rewards with your points
        </p>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-green-300 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      {redeemError && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {redeemError}
        </div>
      )}

      {/* Current Points */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Available Points</p>
              <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                {stats.points.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-4">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:text-white border border-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => {
          const canRedeem = stats.points >= reward.pointsRequired;
          return (
            <Card
              key={reward.id}
              className={`bg-gray-800/50 border-purple-500/30 flex flex-col ${
                !canRedeem ? 'opacity-60' : ''
              }`}
            >
              <div className="w-full h-40 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-b border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-purple-300/40" />
              </div>

              <CardHeader>
                <CardTitle className="text-white text-lg">{reward.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  {reward.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Points Required</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-400">
                      {reward.pointsRequired}
                    </span>
                    <span className="text-xs text-gray-400">
                      You have: {stats.points}
                    </span>
                  </div>
                </div>

                {reward.value > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Estimated Value</span>
                    <span className="text-green-400 font-semibold">
                      ${reward.value}
                    </span>
                  </div>
                )}

                {reward.validUntil && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-4 h-4" />
                    Available until {new Date(reward.validUntil).toLocaleDateString()}
                  </div>
                )}
              </CardContent>

              <div className="p-4 border-t border-gray-700">
                <Button
                  variant={canRedeem ? 'primary' : 'secondary'}
                  fullWidth
                  disabled={!canRedeem || redeeming === reward.id}
                  isLoading={redeeming === reward.id}
                  loadingText="Redeeming..."
                  onClick={() => handleRedeemReward(reward)}
                  leftIcon={<Gift className="w-4 h-4" />}
                >
                  {canRedeem ? 'Redeem' : 'Not Enough Points'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Redeemed Rewards Section */}
      {redeemedRewards.length > 0 && (
        <>
          <div className="border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Your Redeemed Rewards
            </h2>
          </div>

          <div className="space-y-4">
            {redeemedRewards.map((reward) => (
              <Card
                key={reward.id}
                className={`bg-gray-800/50 border-l-4 ${
                  reward.status === 'used'
                    ? 'border-l-gray-500'
                    : reward.status === 'expired'
                      ? 'border-l-red-500'
                      : 'border-l-green-500'
                } border-purple-500/30`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {reward.rewardName}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            reward.status === 'used'
                              ? 'bg-gray-700 text-gray-400'
                              : reward.status === 'expired'
                                ? 'bg-red-900/30 text-red-400'
                                : 'bg-green-900/30 text-green-400'
                          }`}
                        >
                          {reward.status === 'used'
                            ? 'Used'
                            : reward.status === 'expired'
                              ? 'Expired'
                              : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Redeemed on {new Date(reward.redeemedAt).toLocaleDateString()}
                        {' · '}
                        {reward.pointsSpent} points spent
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {filteredRewards.length === 0 && (
        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardContent className="pt-12 text-center pb-12">
            <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No rewards in this category
            </h3>
            <p className="text-gray-400">
              Check back soon or browse other categories
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
