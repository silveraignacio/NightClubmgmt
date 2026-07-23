'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import apiClient, { handleApiError } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', data);
      // Always show the same success state, whether or not the email exists —
      // the backend never reveals that either (see passwordResetService).
      setSubmitted(true);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-white">Check your email</h2>
        <p className="text-gray-400">
          If that email is registered, we&apos;ve sent instructions to reset your password.
        </p>
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Forgot your password?</h2>
        <p className="text-gray-400">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button type="submit" fullWidth size="lg" isLoading={isLoading} loadingText="Sending...">
          Send reset link
        </Button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
