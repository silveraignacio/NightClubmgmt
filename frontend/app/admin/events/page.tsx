'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { PageLoader } from '@/components/Loading';
import { getEvents, createEvent, deleteEvent, type Event } from '@/lib';
import { PartyPopper, Plus, Trash2 } from 'lucide-react';

/**
 * Events management (admin/manager — see docs/architecture/rbac-matrix.md
 * "Events"; viewing is open to any staff role, but this page is only linked
 * from the admin/manager sidebar).
 */
export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    eventName: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    eventType: 'special_event',
    entryPrice: '0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.clubId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents(user.clubId);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({ eventName: '', eventDate: '', startTime: '', endTime: '', eventType: 'special_event', entryPrice: '0' });
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clubId) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await createEvent(user.clubId, {
        eventName: form.eventName,
        eventDate: form.eventDate,
        startTime: form.startTime,
        endTime: form.endTime || undefined,
        eventType: form.eventType,
        entryPrice: parseFloat(form.entryPrice) || 0,
      });
      setCreateOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!user?.clubId) return;
    if (!confirm('Cancel this event?')) return;
    setDeletingId(eventId);
    try {
      await deleteEvent(user.clubId, eventId);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel event');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <PageLoader message="Loading events..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-purple-600" />
            Events
          </h1>
          <p className="text-gray-500 text-sm">Upcoming and past events for this club.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New event
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm">No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Attendees</th>
                    <th className="py-2 pr-4">Entry</th>
                    <th className="py-2 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-900">{event.eventName}</td>
                      <td className="py-2 pr-4">
                        {new Date(event.eventDate).toLocaleDateString()} · {event.startTime}
                      </td>
                      <td className="py-2 pr-4 capitalize">{event.eventType.replace('_', ' ')}</td>
                      <td className="py-2 pr-4">
                        {event.attendeeCount}
                        {event.capacity ? ` / ${event.capacity}` : ''}
                      </td>
                      <td className="py-2 pr-4">
                        {event.entryPrice > 0 ? `$${event.entryPrice.toFixed(2)}` : 'Free'}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={deletingId === event.id}
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title="New event"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Input
            label="Event name"
            type="text"
            fullWidth
            value={form.eventName}
            onChange={(e) => setForm({ ...form, eventName: e.target.value })}
            required
            disabled={submitting}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              fullWidth
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              required
              disabled={submitting}
            />
            <Input
              label="Start time"
              type="time"
              fullWidth
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
              disabled={submitting}
            />
          </div>

          <Input
            label="Entry price"
            type="number"
            step="0.01"
            min="0"
            fullWidth
            value={form.entryPrice}
            onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
            disabled={submitting}
          />

          <Button type="submit" fullWidth isLoading={submitting} loadingText="Creating...">
            Create event
          </Button>
        </form>
      </Modal>
    </div>
  );
}
