'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { PageLoader } from '@/components/Loading';
import {
  getVipTables,
  createVipTable,
  getVipReservations,
  createVipReservation,
  updateVipReservationStatus,
  type VipTable,
  type VipReservation,
  type VipReservationStatus,
} from '@/lib';
import { Crown, Plus } from 'lucide-react';

const STATUS_STYLES: Record<VipReservationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-800',
  seated: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

const NEXT_STATUS: Partial<Record<VipReservationStatus, VipReservationStatus>> = {
  pending: 'confirmed',
  confirmed: 'seated',
  seated: 'completed',
};

/**
 * VIP tables + reservations (admin/manager — see
 * docs/architecture/rbac-matrix.md "VIP". Reservation status updates are
 * also allowed for doorman, who isn't on this page's sidebar item, only
 * via the API).
 */
export default function VipPage() {
  const { user } = useAuth();
  const [tables, setTables] = useState<VipTable[]>([]);
  const [reservations, setReservations] = useState<VipReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ tableName: '', capacity: '6', minimumSpend: '0' });
  const [tableSubmitting, setTableSubmitting] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    tableId: '',
    reservationDate: '',
    guestName: '',
    guestPhone: '',
    partySize: '2',
  });
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.clubId) return;
    setLoading(true);
    setError(null);
    try {
      const [tablesData, reservationsData] = await Promise.all([
        getVipTables(user.clubId),
        getVipReservations(user.clubId),
      ]);
      setTables(tablesData);
      setReservations(reservationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load VIP data');
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) return;

    setTableSubmitting(true);
    setTableError(null);
    try {
      await createVipTable(user.clubId, {
        tableName: tableForm.tableName,
        capacity: parseInt(tableForm.capacity, 10) || 6,
        minimumSpend: parseFloat(tableForm.minimumSpend) || 0,
      });
      setTableModalOpen(false);
      setTableForm({ tableName: '', capacity: '6', minimumSpend: '0' });
      await load();
    } catch (err: any) {
      setTableError(err.message || 'Failed to create table');
    } finally {
      setTableSubmitting(false);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) return;

    setReservationSubmitting(true);
    setReservationError(null);
    try {
      await createVipReservation(user.clubId, {
        tableId: reservationForm.tableId,
        reservationDate: reservationForm.reservationDate,
        guestName: reservationForm.guestName,
        guestPhone: reservationForm.guestPhone || undefined,
        partySize: parseInt(reservationForm.partySize, 10) || 2,
      });
      setReservationModalOpen(false);
      setReservationForm({ tableId: '', reservationDate: '', guestName: '', guestPhone: '', partySize: '2' });
      await load();
    } catch (err: any) {
      setReservationError(err.message || 'Failed to create reservation');
    } finally {
      setReservationSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (reservation: VipReservation) => {
    if (!user?.clubId) return;
    const next = NEXT_STATUS[reservation.status];
    if (!next) return;

    setUpdatingId(reservation.id);
    try {
      await updateVipReservationStatus(user.clubId, reservation.id, next);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update reservation');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (reservation: VipReservation) => {
    if (!user?.clubId) return;
    if (!confirm('Cancel this reservation?')) return;

    setUpdatingId(reservation.id);
    try {
      await updateVipReservationStatus(user.clubId, reservation.id, 'cancelled');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <PageLoader message="Loading VIP tables..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            VIP Tables
          </h1>
          <p className="text-gray-500 text-sm">Manage table inventory and reservations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTableModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New table
          </Button>
          <Button onClick={() => setReservationModalOpen(true)} disabled={tables.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            New reservation
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tables ({tables.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <p className="text-gray-500 text-sm">No tables yet — add one to start taking reservations.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tables.map((table) => (
                <div key={table.id} className="border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{table.tableName}</p>
                  <p className="text-xs text-gray-500 capitalize">{table.tableType.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">Capacity: {table.capacity}</p>
                  {table.minimumSpend > 0 && (
                    <p className="text-xs text-gray-500">Min spend: ${table.minimumSpend.toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-gray-500 text-sm">No reservations yet.</p>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[reservation.status]}`}
                      >
                        {reservation.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{reservation.guestName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {reservation.tableName} · {new Date(reservation.reservationDate).toLocaleDateString()} ·
                      party of {reservation.partySize}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {NEXT_STATUS[reservation.status] && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={updatingId === reservation.id}
                        onClick={() => handleAdvanceStatus(reservation)}
                      >
                        Mark {NEXT_STATUS[reservation.status]}
                      </Button>
                    )}
                    {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={updatingId === reservation.id}
                        onClick={() => handleCancel(reservation)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={tableModalOpen} onClose={() => setTableModalOpen(false)} title="New VIP table">
        <form onSubmit={handleCreateTable} className="space-y-4">
          {tableError && <p className="text-sm text-red-600">{tableError}</p>}
          <Input
            label="Table name"
            type="text"
            fullWidth
            value={tableForm.tableName}
            onChange={(e) => setTableForm({ ...tableForm, tableName: e.target.value })}
            required
            disabled={tableSubmitting}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capacity"
              type="number"
              min="1"
              fullWidth
              value={tableForm.capacity}
              onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
              disabled={tableSubmitting}
            />
            <Input
              label="Minimum spend"
              type="number"
              step="0.01"
              min="0"
              fullWidth
              value={tableForm.minimumSpend}
              onChange={(e) => setTableForm({ ...tableForm, minimumSpend: e.target.value })}
              disabled={tableSubmitting}
            />
          </div>
          <Button type="submit" fullWidth isLoading={tableSubmitting} loadingText="Creating...">
            Create table
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        title="New reservation"
      >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          {reservationError && <p className="text-sm text-red-600">{reservationError}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reservation-table">
              Table
            </label>
            <select
              id="reservation-table"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={reservationForm.tableId}
              onChange={(e) => setReservationForm({ ...reservationForm, tableId: e.target.value })}
              required
              disabled={reservationSubmitting}
            >
              <option value="">Select a table</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.tableName} (capacity {table.capacity})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Guest name"
            type="text"
            fullWidth
            value={reservationForm.guestName}
            onChange={(e) => setReservationForm({ ...reservationForm, guestName: e.target.value })}
            required
            disabled={reservationSubmitting}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              fullWidth
              value={reservationForm.reservationDate}
              onChange={(e) => setReservationForm({ ...reservationForm, reservationDate: e.target.value })}
              required
              disabled={reservationSubmitting}
            />
            <Input
              label="Party size"
              type="number"
              min="1"
              fullWidth
              value={reservationForm.partySize}
              onChange={(e) => setReservationForm({ ...reservationForm, partySize: e.target.value })}
              disabled={reservationSubmitting}
            />
          </div>

          <Input
            label="Guest phone (optional)"
            type="tel"
            fullWidth
            value={reservationForm.guestPhone}
            onChange={(e) => setReservationForm({ ...reservationForm, guestPhone: e.target.value })}
            disabled={reservationSubmitting}
          />

          <Button type="submit" fullWidth isLoading={reservationSubmitting} loadingText="Creating...">
            Create reservation
          </Button>
        </form>
      </Modal>
    </div>
  );
}
