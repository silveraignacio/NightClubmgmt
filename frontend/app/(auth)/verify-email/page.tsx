'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import apiClient, { handleApiError } from '@/lib/api';

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This link is missing its token.');
      return;
    }

    let cancelled = false;
    apiClient
      .post('/auth/verify-email', { token })
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          setError(handleApiError(err).message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold text-white">Verifying your email...</h2>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-white">Email verified</h2>
        <p className="text-gray-400">Your email has been confirmed. You can now sign in.</p>
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-white">Couldn&apos;t verify email</h2>
      <p className="text-gray-400">{error}</p>
      <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
