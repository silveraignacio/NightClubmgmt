import React, { useState } from 'react';
import { Menu, X, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface NavbarUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface NavbarLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavbarProps {
  logo?: React.ReactNode;
  logoText?: string;
  user?: NavbarUser | null;
  links?: NavbarLink[];
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  rightContent?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  (
    {
      logo,
      logoText = 'Club Nightlife',
      user,
      links = [],
      onLogout,
      onProfileClick,
      onSettingsClick,
      rightContent,
      sticky = true,
      className,
    },
    ref
  ) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    return (
      <nav
        ref={ref}
        className={cn(
          'bg-white border-b border-gray-200 shadow-sm',
          sticky && 'sticky top-0 z-40',
          className
        )}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              {logo && <div className="h-8 w-8">{logo}</div>}
              <span className="font-bold text-lg text-purple-600 hidden sm:inline">
                {logoText}
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {link.icon && <span>{link.icon}</span>}
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {rightContent}

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      {user.role && (
                        <p className="text-xs text-gray-500">{user.role}</p>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          onProfileClick?.();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        role="menuitem"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          onSettingsClick?.();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>

                      {onLogout && (
                        <>
                          <div className="border-t border-gray-200" />
                          <button
                            onClick={() => {
                              onLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon && <span>{link.icon}</span>}
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';

export { Navbar };
export type { NavbarProps, NavbarUser, NavbarLink };
