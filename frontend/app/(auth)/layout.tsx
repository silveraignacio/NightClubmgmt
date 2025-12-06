'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout Component
 * Provides a centered, styled container for authentication pages
 * Includes logo, background, and form container
 * Redirects authenticated users away from auth pages
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users to admin dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">CN</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Club Nightlife</h1>
          <p className="text-gray-400 text-sm">Modern Nightclub Management Platform</p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 backdrop-blur-sm">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>© 2024 Club Nightlife. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
