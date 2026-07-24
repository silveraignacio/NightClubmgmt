'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { PageLoader } from '@/components/Loading';
import {
  getGuestLists,
  getGuestListEntries,
  createGuestList,
  addGuestListEntry,
  checkInGuestListEntry,
  type GuestList,
  type GuestListEntry,
} from '@/lib';
import { ClipboardList, Plus, CheckCircle2 } from 'lucide-react';

/**
 * Guest list management (admin/manager — see
 * docs/architecture/rbac-matrix.md "Guest Lists". Check-in is also allowed
 * for security/doorman via the API, not exposed on this page yet.)
 */
export default function GuestListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<GuestList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [entries, setEntries] = useState<GuestListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listModalOpen, setListModalOpen] = useState(false);
  const [listForm, setListForm] = useState({ listName: '', eventDate: '', maxGuests: '' });
  const [listSubmitting, setListSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({ guestName: '', guestPhone: '', plusOnes: '0' });
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    if (!user?.clubId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGuestLists(user.clubId);
      setLists(data);
      if (data.length > 0 && !selectedListId) {
        setSelectedListId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load guest lists');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.clubId]);

  const loadEntries = useCallback(async () => {
    if (!user?.clubId || !selectedListId) {
      setEntries([]);
      return;
    }
    setEntriesLoading(true);
    try {
      const data = await getGuestListEntries(user.clubId, selectedListId);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load guests');
    } finally {
      setEntriesLoading(false);
    }
  }, [user?.clubId, selectedListId]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) return;

    setListSubmitting(true);
    setListError(null);
    try {
      const created = await createGuestList(user.clubId, {
        listName: listForm.listName,
        eventDate: listForm.eventDate,
        maxGuests: listForm.maxGuests ? parseInt(listForm.maxGuests, 10) : undefined,
      });
      setListModalOpen(false);
      setListForm({ listName: '', eventDate: '', maxGuests: '' });
      setSelectedListId(created.id);
      await loadLists();
    } catch (err: any) {
      setListError(err.message || 'Failed to create guest list');
    } finally {
      setListSubmitting(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId || !selectedListId) return;

    setGuestSubmitting(true);
    setGuestError(null);
    try {
      await addGuestListEntry(user.clubId, selectedListId, {
        guestName: guestForm.guestName,
        guestPhone: guestForm.guestPhone || undefined,
        plusOnes: parseInt(guestForm.plusOnes, 10) || 0,
      });
      setGuestModalOpen(false);
      setGuestForm({ guestName: '', guestPhone: '', plusOnes: '0' });
      await loadEntries();
      await loadLists();
    } catch (err: any) {
      setGuestError(err.message || 'Failed to add guest');
    } finally {
      setGuestSubmitting(false);
    }
  };

  const handleCheckIn = async (entryId: string) => {
    if (!user?.clubId || !selectedListId) return;
    setCheckingInId(entryId);
    try {
      await checkInGuestListEntry(user.clubId, selectedListId, entryId);
      await loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to check in guest');
    } finally {
      setCheckingInId(null);
    }
  };

  if (loading) return <PageLoader message="Loading guest lists..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-600" />
            Guest Lists
          </h1>
          <p className="text-gray-500 text-sm">Pre-approved guests for free/reduced entry.</p>
        </div>
        <Button onClick={() => setListModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New list
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {lists.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-gray-500 text-sm py-4">No guest lists yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedListId === list.id
                        ? 'bg-purple-50 border border-purple-200 text-purple-900'
                        : 'border border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <p className="font-medium">{list.listName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(list.eventDate).toLocaleDateString()} · {list.entryCount ?? 0} guests
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Guests</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setGuestModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add guest
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : entries.length === 0 ? (
                <p className="text-gray-500 text-sm">No guests on this list yet.</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.guestName}
                          {entry.plusOnes > 0 && ` +${entry.plusOnes}`}
                        </p>
                        {entry.guestPhone && <p className="text-xs text-gray-500">{entry.guestPhone}</p>}
                      </div>
                      {entry.checkedIn ? (
                        <span className="text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Checked in
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={checkingInId === entry.id}
                          onClick={() => handleCheckIn(entry.id)}
                        >
                          Check in
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal isOpen={listModalOpen} onClose={() => setListModalOpen(false)} title="New guest list">
        <form onSubmit={handleCreateList} className="space-y-4">
          {listError && <p className="text-sm text-red-600">{listError}</p>}
          <Input
            label="List name"
            type="text"
            fullWidth
            value={listForm.listName}
            onChange={(e) => setListForm({ ...listForm, listName: e.target.value })}
            required
            disabled={listSubmitting}
          />
          <Input
            label="Event date"
            type="date"
            fullWidth
            value={listForm.eventDate}
            onChange={(e) => setListForm({ ...listForm, eventDate: e.target.value })}
            required
            disabled={listSubmitting}
          />
          <Input
            label="Max guests (optional)"
            type="number"
            min="1"
            fullWidth
            value={listForm.maxGuests}
            onChange={(e) => setListForm({ ...listForm, maxGuests: e.target.value })}
            disabled={listSubmitting}
          />
          <Button type="submit" fullWidth isLoading={listSubmitting} loadingText="Creating...">
            Create list
          </Button>
        </form>
      </Modal>

      <Modal isOpen={guestModalOpen} onClose={() => setGuestModalOpen(false)} title="Add guest">
        <form onSubmit={handleAddGuest} className="space-y-4">
          {guestError && <p className="text-sm text-red-600">{guestError}</p>}
          <Input
            label="Guest name"
            type="text"
            fullWidth
            value={guestForm.guestName}
            onChange={(e) => setGuestForm({ ...guestForm, guestName: e.target.value })}
            required
            disabled={guestSubmitting}
          />
          <Input
            label="Phone (optional)"
            type="tel"
            fullWidth
            value={guestForm.guestPhone}
            onChange={(e) => setGuestForm({ ...guestForm, guestPhone: e.target.value })}
            disabled={guestSubmitting}
          />
          <Input
            label="Plus ones"
            type="number"
            min="0"
            fullWidth
            value={guestForm.plusOnes}
            onChange={(e) => setGuestForm({ ...guestForm, plusOnes: e.target.value })}
            disabled={guestSubmitting}
          />
          <Button type="submit" fullWidth isLoading={guestSubmitting} loadingText="Adding...">
            Add guest
          </Button>
        </form>
      </Modal>
    </div>
  );
}
