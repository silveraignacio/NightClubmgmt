'use client';

import React, { useState, useEffect } from 'react';
import {
  getMember,
  getMemberStats,
  updateMember,
  type Member,
  type MemberStats,
} from '@/lib';
import apiClient, { handleApiError } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  PageLoader,
} from '@/components';
import {
  LogOut,
  Save,
  Lock,
  Bell,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Member Profile Page
 * Allows members to manage their profile, settings, and view transaction history
 */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [recentActivity, setRecentActivity] = useState<MemberStats['recentVisits']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings (persisted via updateMember's notificationsEnabled/smsEnabled)
  const [notifications, setNotifications] = useState({ email: true, sms: false });
  const [savingNotification, setSavingNotification] = useState<'email' | 'sms' | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id || !user?.clubId) return;

        setLoading(true);
        setError(null);

        const [memberData, statsData] = await Promise.all([
          getMember(user.clubId, user.id),
          getMemberStats(user.clubId, user.id),
        ]);

        setMember(memberData);
        setRecentActivity(statsData.recentVisits || []);

        // Initialize form with member data
        setProfileForm({
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          dateOfBirth: memberData.dateOfBirth,
        });
        setNotifications({
          email: memberData.notificationsEnabled,
          sms: memberData.smsEnabled,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.clubId]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!member || !user?.clubId) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // First/last name are combined client-side since the schema stores a
      // single full_name column (see membersController.updateMember's
      // allowedFields — email is intentionally not sent, it's read-only here).
      const updated = await updateMember(user.clubId, member.id, {
        fullName: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
        phone: profileForm.phone,
        dateOfBirth: profileForm.dateOfBirth || undefined,
      });

      setMember(updated);
      setSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    setError(null);

    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsSaving(true);

      await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // handleApiError surfaces the backend's actual message (e.g. "Current
      // password is incorrect") — axios's own err.message is just a generic
      // "Request failed with status code 400".
      setError(handleApiError(err).message);
      console.error('Error changing password:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notification preference toggle (persisted immediately on change)
  const handleToggleNotification = async (key: 'email' | 'sms') => {
    if (!member || !user?.clubId) return;

    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setSavingNotification(key);
    setError(null);

    try {
      await updateMember(user.clubId, member.id, {
        notificationsEnabled: next.email,
        smsEnabled: next.sms,
      });
    } catch (err) {
      // Revert on failure
      setNotifications(notifications);
      setError('Failed to update notification preference');
    } finally {
      setSavingNotification(null);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error && !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-white">Unable to Load Profile</h2>
        <p className="text-gray-400">
          {error || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          My Profile
        </h1>
        <p className="text-gray-300">Manage your account settings and preferences</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Personal Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your profile details
                </CardDescription>
              </div>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <Input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            firstName: e.target.value,
                          })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <Input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            lastName: e.target.value,
                          })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-gray-700 border-gray-600 text-gray-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Contact support to change your email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="primary"
                      isLoading={isSaving}
                      onClick={handleSaveProfile}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400">First Name</p>
                      <p className="text-lg font-semibold text-white">
                        {member.firstName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Name</p>
                      <p className="text-lg font-semibold text-white">
                        {member.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-lg font-semibold text-white">
                        {member.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-lg font-semibold text-white">
                        {member.phone || 'Not set'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your password regularly for security
                </CardDescription>
              </div>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change
                </Button>
              )}
            </CardHeader>
            {isChangingPassword && (
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <p className="text-xs text-gray-400">
                  Password must be at least 8 characters long
                </p>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="primary"
                    isLoading={isSaving}
                    onClick={handleChangePassword}
                  >
                    Update Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you want to receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  {
                    id: 'email',
                    label: 'Email Notifications',
                    description: 'Receive updates via email',
                  },
                  {
                    id: 'sms',
                    label: 'SMS Notifications',
                    description: 'Receive updates via text message',
                  },
                ] as const
              ).map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30"
                >
                  <div>
                    <p className="font-medium text-white">{setting.label}</p>
                    <p className="text-sm text-gray-400">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification(setting.id)}
                    disabled={savingNotification === setting.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                      notifications[setting.id] ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[setting.id] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <Card className="bg-gray-800/50 border-purple-500/30 sticky top-24">
            <CardHeader>
              <CardTitle className="text-white">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="font-semibold text-white">
                  {format(new Date(member.joinDate), 'MMMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Member Status</p>
                <p className="font-semibold text-white capitalize">
                  {member.status.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Membership Tier</p>
                <p className="font-semibold text-white">{member.tier}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Account ID</p>
                <p className="font-mono text-xs text-gray-400 break-all">
                  {member.id}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-900/30 transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Total Visits</p>
                <p className="text-2xl font-bold text-white">
                  {member.totalVisits}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-green-400">
                  ${member.totalSpent?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Visit</p>
                <p className="text-sm font-semibold text-white">
                  {member.lastVisit
                    ? format(new Date(member.lastVisit), 'MMM d, yyyy')
                    : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card className="bg-gray-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
          <CardDescription className="text-gray-400">
            Your last purchases at the club
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr className="text-gray-400">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Description</th>
                    <th className="text-left py-3 px-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentActivity.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-700/50 transition">
                      <td className="py-3 px-2 text-white">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-2 text-gray-400">{tx.description}</td>
                      <td className="py-3 px-2 font-semibold text-white">
                        ${tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
