'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import apiClient, { handleApiError } from '@/lib/api';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('This reset link is missing its token. Request a new one.');
      setStatus('error');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', { token, password: data.password });
      setStatus('success');
    } catch (err) {
      setError(handleApiError(err).message);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-white">Password updated</h2>
        <p className="text-gray-400">You can now sign in with your new password.</p>
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Reset your password</h2>
        <p className="text-gray-400">Choose a new password for your account.</p>
      </div>

      {!token && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">
            This link is missing its token. Request a new one from the{' '}
            <Link href="/forgot-password" className="underline">
              forgot password
            </Link>{' '}
            page.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="••••••••"
          fullWidth
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        <Input
          label="Confirm new password"
          type="password"
          placeholder="••••••••"
          fullWidth
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          disabled={isLoading}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading} loadingText="Updating...">
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
