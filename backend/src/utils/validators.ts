import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  clubName: z.string().optional(),
  role: z.enum(['admin', 'member']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Member validation schemas
export const memberRegistrationSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().optional(),
  membershipTierId: z.string().uuid().optional(),
});

export const memberUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fullName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  profilePhotoUrl: z.string().url().optional(),
  notificationsEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
});

// Transaction validation schemas
export const createTransactionSchema = z.object({
  memberId: z.string().uuid().optional(),
  qrCodeId: z.string().optional(),
  transactionType: z.enum(['drink_sale', 'food_sale', 'entry_fee', 'table_service']),
  description: z.string(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['cash', 'card', 'points', 'mixed']),
  menuItemId: z.string().uuid().optional(),
  deviceId: z.string().optional(),
});

// Promotion validation schemas
export const createPromotionSchema = z.object({
  promotionName: z.string().min(3, 'Promotion name must be at least 3 characters'),
  description: z.string().optional(),
  promotionType: z.enum(['percentage', 'fixed_amount', 'free_item', 'double_points', 'entry_discount']),
  discountValue: z.number().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  applicableTiers: z.array(z.string()).optional(),
  appliesTo: z.enum(['drinks', 'entry', 'food', 'all']).default('all'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxUses: z.number().positive().optional(),
  code: z.string().optional(),
});

// Event validation schemas
export const createEventSchema = z.object({
  eventName: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  eventType: z.string().default('special_event'),
  featuredImageUrl: z.string().url().optional(),
  capacity: z.number().positive().optional(),
  entryPrice: z.number().min(0).default(0),
  vipDiscount: z.number().min(0).default(0),
  isPublic: z.boolean().default(true),
});

// Reward validation schemas
export const createRewardSchema = z.object({
  rewardName: z.string().min(3, 'Reward name must be at least 3 characters'),
  description: z.string().optional(),
  pointsRequired: z.number().positive('Points required must be positive'),
  rewardType: z.enum(['discount', 'free_item', 'free_entry', 'merchandise']),
  value: z.number().optional(),
  imageUrl: z.string().url().optional(),
  quantityAvailable: z.number().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

// Device validation schemas
export const createDeviceSchema = z.object({
  deviceName: z.string().min(2, 'Device name must be at least 2 characters'),
  deviceType: z.enum(['door', 'bar', 'counter']),
  location: z.string().optional(),
  assignedUserId: z.string().uuid().optional(),
});

// Menu item validation schemas
export const createMenuItemSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters'),
  category: z.enum(['beers', 'cocktails', 'shots', 'wines', 'food', 'other']),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url().optional(),
  pointsValue: z.number().min(0).default(10),
  isAvailable: z.boolean().default(true),
});

// Club validation schemas
export const createClubSchema = z.object({
  name: z.string().min(3, 'Club name must be at least 3 characters'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
});

export const updateClubSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
});

// Membership tier validation schemas
export const createMembershipTierSchema = z.object({
  tierName: z.string().min(2, 'Tier name must be at least 2 characters'),
  description: z.string().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex').optional(),
  pointsMultiplier: z.number().min(0.1).max(10).default(1),
  discountPercentage: z.number().min(0).max(100).default(0),
  entryCost: z.number().min(0).default(0),
  pointsRequired: z.number().min(0).default(0),
  durationMonths: z.number().positive().optional(),
  sortOrder: z.number().min(0).default(0),
});

// Visit validation schema
export const createVisitSchema = z.object({
  qrCodeId: z.string().min(1, 'QR code ID is required'),
  entryMethod: z.enum(['qr_scan', 'manual', 'list_entry']).default('qr_scan'),
  entryType: z.enum(['free_entry', 'paid_entry', 'vip_pass', 'promotional']).default('free_entry'),
  notes: z.string().optional(),
});
