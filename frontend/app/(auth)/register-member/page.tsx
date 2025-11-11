'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Zod validation schema for member registration form
 */
const registerMemberSchema = z
  .object({
    fullName: z
      .string()
      .nonempty('Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .nonempty('Email is required'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().nonempty('Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterMemberFormData = z.infer<typeof registerMemberSchema>;

/**
 * Member Registration Page Component
 * Handles member registration with basic information
 * Features:
 * - Simplified form compared to club registration
 * - Full form validation with react-hook-form + zod
 * - Club ID from URL params or selection
 * - Error handling and display
 * - Loading state
 * - Redirect to member dashboard on success
 */
function RegisterMemberForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string>('');
  const [clubName, setClubName] = useState<string>('');
  const [availableClubs, setAvailableClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [showClubSelector, setShowClubSelector] = useState(false);

  // Get auth functions from store
  const login = useAuthStore((state) => state.login);
  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterMemberFormData>({
    resolver: zodResolver(registerMemberSchema),
    mode: 'onBlur',
  });

  // Get clubId from URL params on mount
  useEffect(() => {
    const paramClubId = searchParams.get('clubId');
    const paramClubName = searchParams.get('clubName');

    if (paramClubId) {
      setClubId(paramClubId);
    }

    if (paramClubName) {
      setClubName(decodeURIComponent(paramClubName));
    }

    // Fetch available clubs if no clubId is provided
    if (!paramClubId) {
      fetchAvailableClubs();
    }
  }, [searchParams]);

  /**
   * Fetch available clubs from API
   * In production, this would be an actual API call
   */
  const fetchAvailableClubs = async () => {
    try {
      // Mock data - replace with actual API call
      const mockClubs = [
        { id: 'club-1', name: 'The Midnight Lounge' },
        { id: 'club-2', name: 'Neon Dreams' },
        { id: 'club-3', name: 'Club Paradise' },
        { id: 'club-4', name: 'The Silver Fox' },
      ];
      setAvailableClubs(mockClubs);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
    }
  };

  // Clear errors when user starts typing
  useEffect(() => {
    const subscription = watch(() => {
      setGeneralError(null);
      clearError();
    });
    return () => subscription.unsubscribe();
  }, [watch, clearError]);

  /**
   * Handle registration form submission
   */
  const onSubmit = async (data: RegisterMemberFormData) => {
    try {
      setGeneralError(null);
      clearError();

      // Validate club selection
      if (!clubId) {
        setGeneralError('Please select a club');
        return;
      }

      // Simulate API call for member registration
      // In production, this would call a registerMember endpoint
      const registerResponse = {
        token: 'mock-token-' + Date.now(),
        user: {
          id: 'member-' + Math.random().toString(36).substr(2, 9),
          email: data.email,
          fullName: data.fullName,
          role: 'member',
          clubId: clubId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      // Attempt login with registered credentials
      await login(data.email, data.password);

      // Redirect to member dashboard
      router.push('/member');
    } catch (err) {
      const errorMessage =
        error || (err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setGeneralError(errorMessage);
    }
  };

  /**
   * Handle club selection
   */
  const handleSelectClub = (club: { id: string; name: string }) => {
    setClubId(club.id);
    setClubName(club.name);
    setShowClubSelector(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Join as Member</h2>
        <p className="text-gray-400">Create an account to access exclusive club experiences</p>
      </div>

      {/* Error Alert */}
      {(generalError || error) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300 flex items-center">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {generalError || error}
          </p>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Smith"
          fullWidth
          leftIcon={<User className="h-5 w-5" />}
          error={errors.fullName?.message}
          {...register('fullName')}
          disabled={isLoading}
        />

        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          fullWidth
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
          disabled={isLoading}
        />

        {/* Club Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Select Your Club
            <span className="text-red-500 ml-1">*</span>
          </label>

          {clubId ? (
            <div className="flex items-center justify-between p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
              <span className="text-gray-100 font-medium">{clubName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowClubSelector(!showClubSelector)}
                className="text-sm"
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowClubSelector(!showClubSelector)}
              className="justify-center"
            >
              Select a club
            </Button>
          )}

          {/* Club Selector Dropdown */}
          {showClubSelector && availableClubs.length > 0 && (
            <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden shadow-lg">
              {availableClubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => handleSelectClub(club)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0 text-gray-100 hover:text-white"
                >
                  {club.name}
                </button>
              ))}
            </div>
          )}

          {!clubId && (
            <p className="text-sm text-red-300 flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Please select a club
            </p>
          )}
        </div>

        {/* Password Field */}
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          fullWidth
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-400 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        {/* Confirm Password Field */}
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          fullWidth
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-500 hover:text-gray-400 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          disabled={isLoading}
        />

        {/* Terms & Conditions */}
        <label className="flex items-start gap-3 cursor-pointer group pt-2">
          <input
            type="checkbox"
            {...register('agreeToTerms')}
            disabled={isLoading}
            className="w-4 h-4 rounded bg-gray-700 border border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 transition-colors cursor-pointer mt-1 group-hover:border-gray-500 flex-shrink-0"
          />
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            I agree to the{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </Link>
          </span>
        </label>

        {errors.agreeToTerms && (
          <p className="text-sm text-red-300 flex items-center mt-2">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {errors.agreeToTerms.message}
          </p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Creating account..."
          className="mt-6"
          disabled={isLoading || !clubId}
        >
          Create Member Account
        </Button>
      </form>

      {/* Divider */}
      <div className="relative pt-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-800 text-gray-500">Already have an account?</span>
        </div>
      </div>

      {/* Sign In Link */}
      <Link href="/auth/login">
        <Button
          variant="outline"
          fullWidth
          disabled={isLoading}
          className="w-full"
        >
          Sign In
        </Button>
      </Link>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
        <p className="text-xs text-blue-300">
          Start enjoying exclusive member benefits, loyalty rewards, and special club events.
        </p>
      </div>
    </div>
  );
}

export default function RegisterMemberPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterMemberForm />
    </Suspense>
  );
}
