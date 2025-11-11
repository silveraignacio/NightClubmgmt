'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar, SidebarMenuItem } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { PageLoader } from '@/components/Loading';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Wine,
  BarChart3,
  Receipt,
  Settings,
  Calendar,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Role-based redirect
    if (user && pathname === '/admin') {
      const role = user.role.toLowerCase();

      // Doorman/Security role - redirect to door
      if (role === 'security') {
        router.push('/admin/door');
        return;
      }

      // Bartender/Staff role - redirect to bar
      if (role === 'staff' || role === 'host') {
        router.push('/admin/bar');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router, pathname]);

  // Show loading while checking auth
  if (isLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  // If not authenticated, return null (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const role = user.role.toLowerCase();

  // Define menu items based on role
  const getMenuItems = (): SidebarMenuItem[] => {
    const items: SidebarMenuItem[] = [];

    // Admin and Manager roles - full access
    if (role === 'club_owner' || role === 'club_manager' || role === 'super_admin') {
      items.push(
        {
          label: 'Dashboard',
          href: '/admin',
          icon: <LayoutDashboard className="h-5 w-5" />,
          requiredRoles: ['club_owner', 'club_manager', 'super_admin'],
        },
        {
          label: 'Members',
          href: '/admin/members',
          icon: <Users className="h-5 w-5" />,
          requiredRoles: ['club_owner', 'club_manager', 'super_admin'],
        },
        {
          label: 'Analytics',
          icon: <BarChart3 className="h-5 w-5" />,
          requiredRoles: ['club_owner', 'club_manager', 'super_admin'],
          children: [
            {
              label: 'Visits',
              href: '/admin/analytics/visits',
              icon: <Calendar className="h-5 w-5" />,
            },
            {
              label: 'Revenue',
              href: '/admin/analytics/revenue',
              icon: <Receipt className="h-5 w-5" />,
            },
          ],
        },
        {
          label: 'Door Control',
          href: '/admin/door',
          icon: <DoorOpen className="h-5 w-5" />,
          requiredRoles: ['club_owner', 'club_manager', 'super_admin'],
        },
        {
          label: 'Bar & POS',
          href: '/admin/bar',
          icon: <Wine className="h-5 w-5" />,
          requiredRoles: ['club_owner', 'club_manager', 'super_admin'],
        },
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: <Settings className="h-5 w-5" />,
          requiredRoles: ['club_owner', 'club_manager', 'super_admin'],
        }
      );
    }

    // Security/Doorman role - limited to door control
    if (role === 'security') {
      items.push({
        label: 'Door Control',
        href: '/admin/door',
        icon: <DoorOpen className="h-5 w-5" />,
        requiredRoles: ['security'],
      });
    }

    // Staff/Bartender role - limited to bar/POS
    if (role === 'staff' || role === 'host') {
      items.push({
        label: 'Bar & POS',
        href: '/admin/bar',
        icon: <Wine className="h-5 w-5" />,
        requiredRoles: ['staff', 'host'],
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar
        logoText="Club Nightlife"
        user={{
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role.replace('_', ' ').toUpperCase(),
          avatar: user.profileImage,
        }}
        onLogout={handleLogout}
        onProfileClick={() => router.push('/profile')}
        onSettingsClick={() => router.push('/admin/settings')}
        sticky
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          items={menuItems}
          currentRole={user.role}
          activeHref={pathname}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          header={
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-900">Admin</span>
            </div>
          }
          footer={
            <div className="text-xs text-gray-500">
              <p>Logged in as</p>
              <p className="font-medium text-gray-700 truncate">{user.fullName}</p>
            </div>
          }
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
