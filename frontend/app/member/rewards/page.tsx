'use client';

import React, { useState, useEffect } from 'react';
import {
  getMemberStats,
  getMember,
  type Member,
  type MemberStats,
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
import { Gift, Check, Clock, Sparkles, Zap } from 'lucide-react';

/**
 * Reward Item Type
 */
interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  value: number;
  category: 'drinks' | 'food' | 'vip' | 'experiences';
  icon: React.ReactNode;
  image?: string;
  quantity?: number;
  expiresIn?: number; // days
}

/**
 * Redeemed Reward Type
 */
interface RedeemedReward {
  id: string;
  rewardId: string;
  rewardName: string;
  redeemedAt: string;
  expiresAt: string;
  code?: string;
  used: boolean;
}

/**
 * Member Rewards Page
 * Displays available rewards and redemption history
 */
export default function RewardsPage() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mock rewards catalog
  const mockRewards: Reward[] = [
    {
      id: '1',
      name: 'Free Cocktail',
      description: 'One complimentary classic cocktail of your choice',
      pointsRequired: 100,
      value: 12,
      category: 'drinks',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 30,
    },
    {
      id: '2',
      name: 'Premium Bottle Service',
      description: 'Enjoy bottle service at our exclusive VIP booth',
      pointsRequired: 500,
      value: 150,
      category: 'vip',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 60,
    },
    {
      id: '3',
      name: 'Appetizer Platter',
      description: 'Delicious assorted appetizers from our kitchen',
      pointsRequired: 150,
      value: 25,
      category: 'food',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 30,
    },
    {
      id: '4',
      name: 'VIP Table for 4',
      description: 'Reserved VIP table for you and 3 guests',
      pointsRequired: 750,
      value: 300,
      category: 'vip',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 90,
    },
    {
      id: '5',
      name: 'Premium Shots (5)',
      description: 'Five premium shots from our finest collection',
      pointsRequired: 200,
      value: 50,
      category: 'drinks',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 30,
    },
    {
      id: '6',
      name: 'DJ Request',
      description: 'Request your favorite song during the night',
      pointsRequired: 75,
      value: 15,
      category: 'experiences',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 7,
    },
    {
      id: '7',
      name: '25% Discount',
      description: '25% off any food or beverage purchase',
      pointsRequired: 250,
      value: 75,
      category: 'drinks',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 30,
    },
    {
      id: '8',
      name: 'VIP Entry Pass',
      description: 'Skip the line and guaranteed entry (2 guests)',
      pointsRequired: 300,
      value: 100,
      category: 'vip',
      icon: <Sparkles className="w-6 h-6" />,
      expiresIn: 60,
    },
  ];

  // Mock redeemed rewards
  const mockRedeemedRewards: RedeemedReward[] = [
    {
      id: 'r1',
      rewardId: '1',
      rewardName: 'Free Cocktail',
      redeemedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
      code: 'COCK-2024-11-04',
      used: false,
    },
    {
      id: 'r2',
      rewardId: '6',
      rewardName: 'DJ Request',
      redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      code: 'DJREQ-2024-11-09',
      used: true,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id || !user?.clubId) return;

        setLoading(true);
        setError(null);

        const [memberData, statsData] = await Promise.all([
          getMember(user.clubId, user.id),
          getMemberStats(user.clubId, user.id),
        ]);

        setMember(memberData);
        setStats(statsData);
        setRedeemedRewards(mockRedeemedRewards);
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

  // Handle reward redemption
  const handleRedeemReward = async (reward: Reward) => {
    if (!stats || stats.points < reward.pointsRequired) {
      setSuccessMessage(null);
      return;
    }

    try {
      setRedeeming(reward.id);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newReward: RedeemedReward = {
        id: `r${Date.now()}`,
        rewardId: reward.id,
        rewardName: reward.name,
        redeemedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + (reward.expiresIn || 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        code: `${reward.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
        used: false,
      };

      setRedeemedRewards([newReward, ...redeemedRewards]);
      setSuccessMessage(`Successfully redeemed ${reward.name}!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // In a real app, this would call an API to update the member's points
      if (stats) {
        setStats({
          ...stats,
          points: stats.points - reward.pointsRequired,
        });
      }
    } catch (err) {
      setError('Failed to redeem reward. Please try again.');
      console.error('Error redeeming reward:', err);
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

  const categories = [
    { id: 'all', label: 'All Rewards' },
    { id: 'drinks', label: 'Drinks' },
    { id: 'food', label: 'Food & Bites' },
    { id: 'vip', label: 'VIP Access' },
    { id: 'experiences', label: 'Experiences' },
  ];

  const filteredRewards =
    selectedCategory === 'all'
      ? mockRewards
      : mockRewards.filter((r) => r.category === selectedCategory);

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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-green-300 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
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
        {categories.map((category) => (
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
              {/* Reward Image/Icon */}
              <div className="w-full h-40 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-b border-purple-500/20 flex items-center justify-center">
                <div className="text-5xl opacity-20">{reward.icon}</div>
              </div>

              <CardHeader>
                <CardTitle className="text-white text-lg">
                  {reward.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {reward.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Points Required */}
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

                {/* Value */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Estimated Value</span>
                  <span className="text-green-400 font-semibold">
                    ${reward.value}
                  </span>
                </div>

                {/* Expires In */}
                {reward.expiresIn && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-4 h-4" />
                    Expires in {reward.expiresIn} days
                  </div>
                )}
              </CardContent>

              {/* Redeem Button */}
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
            {redeemedRewards.map((reward) => {
              const expiresAt = new Date(reward.expiresAt);
              const isExpired = expiresAt < new Date();
              const daysLeft = Math.ceil(
                (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card
                  key={reward.id}
                  className={`bg-gray-800/50 border-l-4 ${
                    reward.used
                      ? 'border-l-gray-500'
                      : isExpired
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
                              reward.used
                                ? 'bg-gray-700 text-gray-400'
                                : isExpired
                                  ? 'bg-red-900/30 text-red-400'
                                  : 'bg-green-900/30 text-green-400'
                            }`}
                          >
                            {reward.used
                              ? 'Used'
                              : isExpired
                                ? 'Expired'
                                : `Expires in ${daysLeft}d`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          Redeemed on{' '}
                          {new Date(reward.redeemedAt).toLocaleDateString()}
                        </p>
                        {!reward.used && !isExpired && reward.code && (
                          <div className="bg-gray-700/50 rounded-lg p-3 inline-block">
                            <p className="text-xs text-gray-400 mb-1">
                              Redemption Code
                            </p>
                            <p className="text-mono font-bold text-white">
                              {reward.code}
                            </p>
                          </div>
                        )}
                      </div>
                      {!reward.used && !isExpired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(reward.code || '');
                            setSuccessMessage('Code copied to clipboard!');
                            setTimeout(
                              () => setSuccessMessage(null),
                              2000
                            );
                          }}
                        >
                          Copy Code
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
