'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageLoader } from '@/components/Loading';
import {
  createVisit,
  getMemberByQr,
  getGuestLists,
  getGuestListEntries,
  checkInGuestListEntry,
  getVisits,
  GuestList,
  GuestListEntry,
  Member,
  Visit,
} from '@/lib';
import {
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  AlertCircle,
  UserCheck,
  Smartphone,
  ClipboardList,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  member?: Member;
  message: string;
}

export default function DoorPage() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedQrCodeId, setSelectedQrCodeId] = useState<string | null>(null);
  const [entryMethod, setEntryMethod] = useState<'qr_scan' | 'manual'>('qr_scan');
  const [recentEntries, setRecentEntries] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualQrCodeId, setManualQrCodeId] = useState('');
  const [guestLists, setGuestLists] = useState<GuestList[]>([]);
  const [selectedGuestListId, setSelectedGuestListId] = useState('');
  const [guestEntries, setGuestEntries] = useState<GuestListEntry[]>([]);
  const [guestListsLoading, setGuestListsLoading] = useState(false);
  const [guestEntriesLoading, setGuestEntriesLoading] = useState(false);
  const [guestListError, setGuestListError] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [checkingInGuestId, setCheckingInGuestId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (user?.clubId) {
      loadRecentEntries();
      loadGuestLists();
    }

    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRecentEntries = async () => {
    if (!user?.clubId) return;

    try {
      const response = await getVisits(user.clubId, { page: 1, pageSize: 10 });
      setRecentEntries(response.data);
    } catch (err) {
      console.error('Failed to load recent entries:', err);
    }
  };

  const loadGuestLists = async () => {
    if (!user?.clubId) return;

    setGuestListsLoading(true);
    setGuestListError(null);

    try {
      const lists = await getGuestLists(user.clubId);
      setGuestLists(lists);
      setSelectedGuestListId((current) => {
        if (current && lists.some((list) => list.id === current)) {
          return current;
        }
        return lists[0]?.id || '';
      });
    } catch (err: any) {
      setGuestListError(err.message || 'Failed to load guest lists');
    } finally {
      setGuestListsLoading(false);
    }
  };

  const loadGuestEntries = useCallback(async () => {
    if (!user?.clubId || !selectedGuestListId) {
      setGuestEntries([]);
      return;
    }

    setGuestEntriesLoading(true);
    setGuestListError(null);

    try {
      const entries = await getGuestListEntries(user.clubId, selectedGuestListId);
      setGuestEntries(entries);
    } catch (err: any) {
      setGuestListError(err.message || 'Failed to load guest list entries');
    } finally {
      setGuestEntriesLoading(false);
    }
  }, [selectedGuestListId, user?.clubId]);

  useEffect(() => {
    loadGuestEntries();
  }, [loadGuestEntries]);

  const handleScan = useCallback(
    async (qrCodeId: string, method: 'qr_scan' | 'manual') => {
      if (!qrCodeId || !user?.clubId) return;

      setLoading(true);
      stopCamera();

      try {
        const member = await getMemberByQr(user.clubId, qrCodeId);

        setScanResult({
          success: true,
          member,
          message: 'Member verified successfully!',
        });
        setSelectedMember(member);
        setSelectedQrCodeId(qrCodeId);
        setEntryMethod(method);
      } catch (err: any) {
        setScanResult({
          success: false,
          message: err.message || 'Failed to verify member',
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.clubId]
  );

  // Decode QR codes from the live camera feed frame-by-frame.
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScan(code.data, 'qr_scan');
          return;
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [handleScan]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Failed to access camera:', err);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualScan = async () => {
    if (!manualQrCodeId.trim() || !user?.clubId) return;
    handleScan(manualQrCodeId.trim(), 'manual');
  };

  const confirmEntry = async () => {
    if (!selectedMember || !selectedQrCodeId || !user?.clubId) return;

    setLoading(true);

    try {
      await createVisit(user.clubId, {
        qrCodeId: selectedQrCodeId,
        entryMethod,
      });

      // Show success message
      setScanResult({
        success: true,
        message: 'Entry confirmed successfully!',
      });

      // Reset state
      setTimeout(() => {
        setSelectedMember(null);
        setSelectedQrCodeId(null);
        setScanResult(null);
        setManualQrCodeId('');
        loadRecentEntries();
      }, 2000);
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'Failed to confirm entry',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckIn = async (entry: GuestListEntry) => {
    if (!user?.clubId || !selectedGuestListId || entry.checkedIn) return;

    setCheckingInGuestId(entry.id);
    setGuestListError(null);

    try {
      const checkedInEntry = await checkInGuestListEntry(user.clubId, selectedGuestListId, entry.id);
      setGuestEntries((current) =>
        current.map((guestEntry) =>
          guestEntry.id === checkedInEntry.id ? checkedInEntry : guestEntry
        )
      );
    } catch (err: any) {
      setGuestListError(err.message || 'Failed to check in guest');
    } finally {
      setCheckingInGuestId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTierColor = (tier: string) => {
    const colors = {
      BRONZE: 'bg-orange-100 text-orange-800 border-orange-300',
      SILVER: 'bg-gray-100 text-gray-800 border-gray-300',
      GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PLATINUM: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const selectedGuestList = guestLists.find((list) => list.id === selectedGuestListId);
  const normalizedGuestSearch = guestSearch.trim().toLowerCase();
  const filteredGuestEntries = guestEntries.filter((entry) => {
    if (!normalizedGuestSearch) return true;
    return (
      entry.guestName.toLowerCase().includes(normalizedGuestSearch) ||
      (entry.guestPhone || '').toLowerCase().includes(normalizedGuestSearch)
    );
  });
  const checkedInGuests = guestEntries.filter((entry) => entry.checkedIn).length;
  const totalGuestsWithPlusOnes = guestEntries.reduce(
    (total, entry) => total + 1 + (entry.plusOnes || 0),
    0
  );

  if (!user) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Door Control</h1>
        <p className="text-lg text-gray-600">
          Scan member QR codes to verify and confirm entry
        </p>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            {scanning ? (
              <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Hidden canvas used to grab frames for QR decoding */}
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-4 border-purple-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white rounded-lg"></div>
                </div>
                <Button
                  variant="danger"
                  size="lg"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  onClick={stopCamera}
                >
                  Stop Scanning
                </Button>
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-24 w-24 text-purple-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Camera ready to scan QR codes
                  </p>
                  <Button
                    size="lg"
                    leftIcon={<Camera className="h-5 w-5" />}
                    onClick={startCamera}
                    fullWidth
                  >
                    Start Camera
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Or enter the member&apos;s QR code manually:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter QR code..."
                  value={manualQrCodeId}
                  onChange={(e) => setManualQrCodeId(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualScan();
                    }
                  }}
                  fullWidth
                  leftIcon={<Smartphone className="h-4 w-4" />}
                />
                <Button
                  onClick={handleManualScan}
                  disabled={!manualQrCodeId.trim() || loading}
                  isLoading={loading}
                >
                  Verify
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult && (
              <div
                className={`mb-6 p-4 rounded-lg border-2 ${
                  scanResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {scanResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  )}
                  <p
                    className={`font-medium ${
                      scanResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {scanResult.message}
                  </p>
                </div>
              </div>
            )}

            {selectedMember ? (
              <div className="space-y-6">
                {/* Member Details */}
                <div className="text-center">
                  <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-purple-600">
                      {selectedMember.firstName.charAt(0)}
                      {selectedMember.lastName.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedMember.email}</p>
                </div>

                {/* Tier Badge */}
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center px-6 py-2 rounded-full text-sm font-bold border-2 ${getTierColor(
                      selectedMember.tier
                    )}`}
                  >
                    {selectedMember.tier} TIER
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedMember.totalVisits}
                    </p>
                    <p className="text-sm text-blue-600">Total Visits</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-900">
                      {selectedMember.points}
                    </p>
                    <p className="text-sm text-green-600">Points</p>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  size="lg"
                  fullWidth
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                  onClick={confirmEntry}
                  isLoading={loading}
                  disabled={loading}
                >
                  Confirm Entry
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No member scanned</p>
                <p className="text-sm">Scan a QR code or enter it manually to begin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guest List Check-In */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Guest List Check-In
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Mark pre-approved guests as they arrive at the door
              </p>
            </div>
            {selectedGuestList && (
              <div className="text-sm text-gray-600 md:text-right">
                <p className="font-medium text-gray-900">{checkedInGuests}/{guestEntries.length} checked in</p>
                <p>{totalGuestsWithPlusOnes} total including plus ones</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {guestListError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {guestListError}
            </div>
          )}

          {guestListsLoading ? (
            <p className="text-sm text-gray-500">Loading guest lists...</p>
          ) : guestLists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active guest lists</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,260px)_1fr] gap-3">
                <div>
                  <label htmlFor="guest-list-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Active list
                  </label>
                  <select
                    id="guest-list-select"
                    value={selectedGuestListId}
                    onChange={(event) => setSelectedGuestListId(event.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {guestLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.listName} · {new Date(list.eventDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Search guests"
                  placeholder="Name or phone..."
                  value={guestSearch}
                  onChange={(event) => setGuestSearch(event.target.value)}
                  fullWidth
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>

              {guestEntriesLoading ? (
                <p className="text-sm text-gray-500">Loading guests...</p>
              ) : filteredGuestEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No guests match this search</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredGuestEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 border border-gray-200 rounded-lg p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {entry.guestName}
                          {entry.plusOnes > 0 && (
                            <span className="text-gray-500 font-medium"> +{entry.plusOnes}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.guestPhone || 'No phone on file'}
                        </p>
                      </div>
                      {entry.checkedIn ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Checked in
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={<CheckCircle2 className="h-4 w-4" />}
                          onClick={() => handleGuestCheckIn(entry)}
                          isLoading={checkingInGuestId === entry.id}
                          loadingText="Checking in..."
                          disabled={checkingInGuestId !== null}
                        >
                          Check in
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent entries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.memberName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(entry.checkInTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {entry.entryMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
