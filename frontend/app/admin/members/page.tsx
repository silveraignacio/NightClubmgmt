'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageLoader, Skeleton } from '@/components/Loading';
import { getMembers, deleteMember, exportMembersCsv, Member, GetMembersParams } from '@/lib';
import {
  Search,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type TierFilter = 'ALL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export default function MembersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    if (user?.clubId) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, tierFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.clubId) {
        setCurrentPage(1);
        loadMembers();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadMembers = async () => {
    if (!user?.clubId) return;

    setLoading(true);

    try {
      const params: GetMembersParams = {
        page: currentPage,
        pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (tierFilter !== 'ALL') {
        params.tier = tierFilter;
      }

      const response = await getMembers(user.clubId, params);
      setMembers(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!user?.clubId) return;
    if (!confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}? This cannot be undone.`)) {
      return;
    }

    setActionError(null);
    setDeletingId(member.id);
    try {
      await deleteMember(user.clubId, member.id);
      await loadMembers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete member');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    if (!user?.clubId) return;
    setActionError(null);
    setExporting(true);
    try {
      await exportMembersCsv(user.clubId, `members-${user.clubId}.csv`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to export members');
    } finally {
      setExporting(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      BRONZE: 'bg-orange-100 text-orange-800',
      SILVER: 'bg-gray-100 text-gray-800',
      GOLD: 'bg-yellow-100 text-yellow-800',
      PLATINUM: 'bg-purple-100 text-purple-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!user) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            Manage your club members and their memberships
          </p>
        </div>
        <Button
          leftIcon={<UserPlus className="h-5 w-5" />}
          onClick={() => router.push('/admin/members/new')}
        >
          Add Member
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name, email, or phone..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as TierFilter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Tiers</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
          </div>

          {actionError && (
            <p className="text-sm text-red-600 border-t border-gray-200 pt-4">{actionError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Showing {members.length} of {total} members
            </p>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              isLoading={exporting}
              disabled={exporting}
            >
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton count={5} height="h-16" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No members found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-purple-600">
                              {member.firstName.charAt(0)}
                              {member.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.totalVisits} visits
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.email}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                            member.tier
                          )}`}
                        >
                          {member.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(member.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.joinDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/members/${member.id}`)}
                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                            aria-label="View member"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/admin/members/${member.id}/edit`)
                            }
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            aria-label="Edit member"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            disabled={deletingId === member.id}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded disabled:opacity-50"
                            aria-label="Delete member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
