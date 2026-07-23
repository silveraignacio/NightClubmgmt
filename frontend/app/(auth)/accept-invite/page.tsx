'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, User } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import apiClient, { handleApiError } from '@/lib/api';

const acceptInviteSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!token) {
      setError('This invite link is missing its token. Ask whoever invited you to send a new one.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/accept-invitation', {
        token,
        password: data.password,
        fullName: data.fullName,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-white">Account created</h2>
        <p className="text-gray-400">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Accept your invitation</h2>
        <p className="text-gray-400">Set your name and password to create your account.</p>
      </div>

      {!token && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">
            This link is missing its token — ask whoever invited you to resend it.
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
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          fullWidth
          leftIcon={<User className="h-5 w-5" />}
          error={errors.fullName?.message}
          {...register('fullName')}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          fullWidth
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          {...register('password')}
          disabled={isLoading}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          fullWidth
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          disabled={isLoading}
        />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading} loadingText="Creating account...">
          Create account
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

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
