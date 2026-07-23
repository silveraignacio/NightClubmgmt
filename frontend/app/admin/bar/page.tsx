'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PageLoader } from '@/components/Loading';
import {
  createTransaction,
  getMemberByQr,
  getTransactions,
  Member,
  Transaction,
} from '@/lib';
import {
  Wine,
  Search,
  QrCode,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  icon: string;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

// Sample menu items - In production, fetch from API
const MENU_ITEMS: MenuItem[] = [
  // Drinks
  { id: '1', name: 'Beer', category: 'Drinks', price: 8.00, icon: '🍺' },
  { id: '2', name: 'Cocktail', category: 'Drinks', price: 15.00, icon: '🍹' },
  { id: '3', name: 'Wine', category: 'Drinks', price: 12.00, icon: '🍷' },
  { id: '4', name: 'Whiskey', category: 'Drinks', price: 18.00, icon: '🥃' },
  { id: '5', name: 'Vodka Shot', category: 'Drinks', price: 10.00, icon: '🍸' },
  { id: '6', name: 'Soft Drink', category: 'Drinks', price: 5.00, icon: '🥤' },

  // Food
  { id: '7', name: 'Burger', category: 'Food', price: 16.00, icon: '🍔' },
  { id: '8', name: 'Pizza Slice', category: 'Food', price: 8.00, icon: '🍕' },
  { id: '9', name: 'Nachos', category: 'Food', price: 12.00, icon: '🌮' },
  { id: '10', name: 'Wings', category: 'Food', price: 14.00, icon: '🍗' },
  { id: '11', name: 'Fries', category: 'Food', price: 6.00, icon: '🍟' },
  { id: '12', name: 'Salad', category: 'Food', price: 10.00, icon: '🥗' },
];

// Matches the backend's payment_method enum (see database/schema.sql / validators.ts)
type PaymentMethod = 'cash' | 'card' | 'points' | 'mixed';

export default function BarPage() {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberQrInput, setMemberQrInput] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(MENU_ITEMS.map(item => item.category)))];

  useEffect(() => {
    if (user?.clubId) {
      loadRecentTransactions();
    }
  }, [user]);

  const loadRecentTransactions = async () => {
    if (!user?.clubId) return;

    try {
      const response = await getTransactions(user.clubId, {
        page: 1,
        pageSize: 5,
      });
      setRecentTransactions(response.data);
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
    }
  };

  const handleScanMember = async () => {
    if (!memberQrInput.trim() || !user?.clubId) return;

    setLoading(true);
    setSearchError(null);

    try {
      const member = await getMemberByQr(user.clubId, memberQrInput.trim());
      setSelectedMember(member);
      setSearchError(null);
    } catch (err: any) {
      setSearchError(err.message || 'Member not found');
      setSelectedMember(null);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItem.id);

    if (existingItem) {
      setOrderItems(
        orderItems.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([...orderItems, { menuItem, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(menuItemId);
      return;
    }

    setOrderItems(
      orderItems.map(item =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItem.id !== menuItemId));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const getDiscount = () => {
    if (!selectedMember) return 0;

    // Tier-based discounts
    const discounts = {
      BRONZE: 0.05, // 5%
      SILVER: 0.10, // 10%
      GOLD: 0.15,   // 15%
      PLATINUM: 0.20, // 20%
    };

    return discounts[selectedMember.tier as keyof typeof discounts] || 0;
  };

  const calculateDiscountAmount = () => {
    return calculateSubtotal() * getDiscount();
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const calculatePointsEarned = () => {
    if (!selectedMember) return 0;
    // 1 point per dollar spent
    return Math.floor(calculateTotal());
  };

  const handleProcessOrder = async () => {
    if (!selectedMember || !user?.clubId || orderItems.length === 0) return;

    setLoading(true);

    try {
      const itemsDescription = orderItems
        .map(item => `${item.quantity}x ${item.menuItem.name}`)
        .join(', ');

      // Send the pre-discount subtotal: the backend looks up the member's tier
      // discount itself and computes the final charged amount server-side
      // (see transactionsController.createTransaction) — sending an
      // already-discounted total here would double-apply the discount.
      const hasFood = orderItems.every((item) => item.menuItem.category === 'Food');

      await createTransaction(user.clubId, {
        qrCodeId: memberQrInput.trim(),
        amount: calculateSubtotal(),
        transactionType: hasFood ? 'food_sale' : 'drink_sale',
        paymentMethod,
        description: itemsDescription,
      });

      // Show success
      setTransactionSuccess(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setOrderItems([]);
        setSelectedMember(null);
        setMemberQrInput('');
        setTransactionSuccess(false);
        setPaymentMethod('card');
        loadRecentTransactions();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  const filteredMenuItems = selectedCategory === 'All'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(item => item.category === selectedCategory);

  if (!user) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Bar & POS</h1>
        <p className="text-lg text-gray-600">
          Process orders and transactions for members
        </p>
      </div>

      {/* Success Message */}
      {transactionSuccess && (
        <Card className="bg-green-50 border-green-200 border-2">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-800">
                  Transaction Successful!
                </p>
                <p className="text-sm text-green-600">
                  Payment processed and points awarded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Menu & Member */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-6 w-6" />
                Scan Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter or scan member's QR code..."
                    value={memberQrInput}
                    onChange={(e) => setMemberQrInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleScanMember();
                      }
                    }}
                    fullWidth
                    leftIcon={<QrCode className="h-4 w-4" />}
                  />
                  <Button
                    onClick={handleScanMember}
                    disabled={!memberQrInput.trim() || loading}
                    isLoading={loading}
                  >
                    Search
                  </Button>
                </div>

                {searchError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{searchError}</p>
                  </div>
                )}

                {selectedMember && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-purple-600">
                          {selectedMember.firstName.charAt(0)}
                          {selectedMember.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {selectedMember.firstName} {selectedMember.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getTierColor(
                              selectedMember.tier
                            )}`}
                          >
                            {selectedMember.tier}
                          </span>
                          <span className="text-sm text-gray-600">
                            {selectedMember.points} points
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Discount</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {(getDiscount() * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="h-6 w-6" />
                Menu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-purple-300 transition-all text-left"
                  >
                    <div className="text-4xl mb-2">{item.icon}</div>
                    <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(item.price)}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Order */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No items in order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div
                        key={item.menuItem.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.menuItem.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.menuItem.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.menuItem.id, item.quantity - 1)
                            }
                            className="h-8 w-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.menuItem.id, item.quantity + 1)
                            }
                            className="h-8 w-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>

                    {selectedMember && getDiscount() > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Discount ({(getDiscount() * 100).toFixed(0)}%)
                          </span>
                          <span>-{formatCurrency(calculateDiscountAmount())}</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Points to Earn
                          </span>
                          <span>{calculatePointsEarned()} pts</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'card'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm font-medium">Card</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Banknote className="h-5 w-5" />
                        <span className="text-sm font-medium">Cash</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('mixed')}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'mixed'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Smartphone className="h-5 w-5" />
                        <span className="text-sm font-medium">Mixed</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('points')}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'points'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Award className="h-5 w-5" />
                        <span className="text-sm font-medium">Points</span>
                      </button>
                    </div>
                  </div>

                  {/* Process Order Button */}
                  <Button
                    size="lg"
                    fullWidth
                    leftIcon={<DollarSign className="h-5 w-5" />}
                    onClick={handleProcessOrder}
                    isLoading={loading}
                    disabled={!selectedMember || orderItems.length === 0 || loading}
                  >
                    Process Payment
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setOrderItems([])}
                  >
                    Clear Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {transaction.memberName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatTime(transaction.createdAt)} • {transaction.paymentMethod}
                    </p>
                    {transaction.itemsDescription && (
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.itemsDescription}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {transaction.status}
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
