'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { User, Mail, Phone, ArrowLeft, QrCode as QrCodeIcon, CreditCard, Shield } from 'lucide-react';
import apiClient from '@/lib/api';

const registerMemberSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().optional(),
  membershipType: z.enum(['free', 'bronze', 'silver', 'gold', 'platinum']),
  notes: z.string().optional(),
});

type RegisterMemberForm = z.infer<typeof registerMemberSchema>;

export default function NewMemberPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newMemberId, setNewMemberId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterMemberForm>({
    resolver: zodResolver(registerMemberSchema),
    defaultValues: {
      membershipType: 'free',
    },
  });

  const onSubmit = async (data: RegisterMemberForm) => {
    if (!user?.clubId) {
      setError('Club information not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/clubs/${user.clubId}/members`, {
        ...data,
        clubId: user.clubId,
      });

      setNewMemberId(response.data.data.id);
      setSuccess(true);

      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        router.push(`/admin/members`);
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Failed to register member. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setNewMemberId(null);
    setError(null);
    reset();
  };

  if (success && newMemberId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="glass border-green-500/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Member Registered Successfully!
              </h2>

              <p className="text-gray-400 mb-6">
                The member can now check in using their QR code
              </p>

              <div className="bg-dark-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-primary-400 mb-2">
                  <QrCodeIcon className="h-5 w-5" />
                  <span className="font-mono text-sm">Member ID: {newMemberId.slice(0, 8)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  QR code will be sent to member&apos;s email
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleAddAnother}
                  className="flex-1"
                >
                  Register Another Member
                </Button>
                <Button
                  onClick={() => router.push('/admin/members')}
                  className="flex-1"
                >
                  View All Members
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push('/admin/members')}
            className="mb-4"
          >
            Back to Members
          </Button>

          <h1 className="text-3xl font-bold text-white mb-2">
            Register New Member
          </h1>
          <p className="text-gray-400">
            Add a new member to your club. They&apos;ll receive a QR code via email.
          </p>
        </div>

        {/* Form Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <Input
                  {...register('fullName')}
                  leftIcon={<User className="h-5 w-5" />}
                  placeholder="John Doe"
                  error={errors.fullName?.message}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <Input
                  {...register('email')}
                  leftIcon={<Mail className="h-5 w-5" />}
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Member will receive QR code at this email
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <Input
                  {...register('phone')}
                  leftIcon={<Phone className="h-5 w-5" />}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  error={errors.phone?.message}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth (Optional)
                </label>
                <Input
                  {...register('dateOfBirth')}
                  type="date"
                  error={errors.dateOfBirth?.message}
                />
              </div>

              {/* Membership Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Membership Tier *
                </label>
                <select
                  {...register('membershipType')}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="free">Free - Basic access</option>
                  <option value="bronze">Bronze - 5% discount</option>
                  <option value="silver">Silver - 10% discount</option>
                  <option value="gold">Gold - 15% discount</option>
                  <option value="platinum">Platinum - 20% discount</option>
                </select>
                {errors.membershipType && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.membershipType.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Members can upgrade tiers by earning points
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Add any additional notes about this member..."
                />
              </div>

              {/* Info Box */}
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <QrCodeIcon className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-primary-300 font-medium mb-1">
                      What happens next?
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Unique QR code will be generated automatically</li>
                      <li>• Member receives email with their QR code</li>
                      <li>• They can use it immediately for check-ins</li>
                      <li>• Points and rewards start accumulating from first visit</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/members')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  leftIcon={<User className="h-5 w-5" />}
                  className="flex-1"
                >
                  Register Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out the{' '}
            <a href="#" className="text-primary-400 hover:text-primary-300">
              member registration guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
