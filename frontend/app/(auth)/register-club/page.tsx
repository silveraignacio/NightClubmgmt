'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Building2, Check } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Zod validation schema for club registration form
 */
const registerClubSchema = z
  .object({
    fullName: z
      .string()
      .nonempty('Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .nonempty('Email is required'),
    clubName: z
      .string()
      .nonempty('Club name is required')
      .min(2, 'Club name must be at least 2 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().nonempty('Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterClubFormData = z.infer<typeof registerClubSchema>;

/**
 * Club Owner Registration Page Component
 * Handles club owner registration with club information
 * Features:
 * - Full form validation with react-hook-form + zod
 * - Password strength requirements
 * - Club name input
 * - Terms & conditions agreement
 * - Error handling and display
 * - Loading state
 * - Redirect to admin on success
 */
export default function RegisterClubPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState(1); // For multi-step form
  const [passwordStrength, setPasswordStrength] = useState(0);

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
    control,
  } = useForm<RegisterClubFormData>({
    resolver: zodResolver(registerClubSchema),
    mode: 'onBlur',
  });

  const password = watch('password');

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [password]);

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
  const onSubmit = async (data: RegisterClubFormData) => {
    try {
      setGeneralError(null);
      clearError();

      // Simulate API call for club registration
      // In production, this would call a registerClub endpoint
      const registerResponse = {
        token: 'mock-token-' + Date.now(),
        user: {
          id: 'club-' + Math.random().toString(36).substr(2, 9),
          email: data.email,
          fullName: data.fullName,
          role: 'club_owner',
          clubId: 'club-' + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      // Attempt login with registered credentials
      await login(data.email, data.password);

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      const errorMessage =
        error || (err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setGeneralError(errorMessage);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-orange-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    if (strength <= 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Register Your Club</h2>
        <p className="text-gray-400">Create an account to manage your nightclub</p>
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
          placeholder="John Doe"
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

        {/* Club Name Field */}
        <Input
          label="Club Name"
          type="text"
          placeholder="The Midnight Lounge"
          fullWidth
          leftIcon={<Building2 className="h-5 w-5" />}
          error={errors.clubName?.message}
          {...register('clubName')}
          disabled={isLoading}
        />

        {/* Password Field */}
        <div>
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

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      level <= passwordStrength ? getPasswordStrengthColor(passwordStrength) : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Password strength: <span className="text-gray-300 font-medium">{getPasswordStrengthText(passwordStrength)}</span>
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mt-3 space-y-1">
            <div className="text-xs text-gray-400 font-medium mb-2">Password requirements:</div>
            <div className="space-y-1">
              <RequirementCheck met={!!(password && password.length >= 8)} text="At least 8 characters" />
              <RequirementCheck met={!!(password && /[A-Z]/.test(password))} text="One uppercase letter" />
              <RequirementCheck met={!!(password && /[0-9]/.test(password))} text="One number" />
              <RequirementCheck met={!!(password && /[^A-Za-z0-9]/.test(password))} text="One special character" />
            </div>
          </div>
        </div>

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
          disabled={isLoading}
        >
          Create Club Account
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
          By registering, you agree to our service terms. Club verification may take 24-48 hours.
        </p>
      </div>
    </div>
  );
}

/**
 * Password Requirement Check Component
 */
interface RequirementCheckProps {
  met: boolean;
  text: string;
}

function RequirementCheck({ met, text }: RequirementCheckProps) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-400' : 'text-gray-500'}`}>
      <Check className={`h-4 w-4 flex-shrink-0 ${met ? 'block' : 'invisible'}`} />
      <span>{text}</span>
    </div>
  );
}
