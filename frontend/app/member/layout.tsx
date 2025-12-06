'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components';
import { LogOut, Home, Gift, User } from 'lucide-react';
import Link from 'next/link';

/**
 * Member Layout
 * Protected layout for authenticated members
 * Provides navigation, logout, and responsive design
 */
export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    setMounted(true);

    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Show loading state while checking auth
  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-purple-500/20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/member" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-purple-400 font-bold text-lg">♪</span>
                </div>
              </div>
              <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Club Nightlife
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/member"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </span>
              </Link>
              <Link
                href="/member/rewards"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Rewards
                </span>
              </Link>
              <Link
                href="/member/profile"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </span>
              </Link>
            </div>

            {/* Right Side - User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-around py-2 border-t border-gray-700">
            <Link
              href="/member"
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-gray-300 hover:text-white"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/member/rewards"
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-gray-300 hover:text-white"
            >
              <Gift className="w-5 h-5" />
              <span>Rewards</span>
            </Link>
            <Link
              href="/member/profile"
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-gray-300 hover:text-white"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-purple-500/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Club Nightlife</h3>
              <p className="text-gray-400 text-sm">
                Experience the ultimate nightclub management platform with QR check-ins,
                loyalty rewards, and real-time analytics.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/member" className="hover:text-white transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/member/rewards" className="hover:text-white transition">
                    My Rewards
                  </Link>
                </li>
                <li>
                  <Link href="/member/profile" className="hover:text-white transition">
                    My Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Email: support@clubnightlife.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Available 24/7</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; 2024 Club Nightlife. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-gray-300 transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-300 transition">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-300 transition">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
