'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Shown when the API rejects a request with 403 Forbidden (see the response
 * interceptor in lib/api.ts). This is reached when a logged-in user's role
 * doesn't allow the action they tried, as opposed to not being logged in at
 * all (401, which redirects to /login instead).
 */
export default function ForbiddenPage() {
  const router = useRouter();
  const { user } = useAuth();

  const homeHref = user?.role === 'member' ? '/member' : '/admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-gray-400 mb-8">
          You don&apos;t have permission to view this page or perform this action.
          If you think this is a mistake, contact your club administrator.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:opacity-90 transition"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
