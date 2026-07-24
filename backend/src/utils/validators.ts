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

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const inviteEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'bartender', 'doorman', 'security', 'staff']),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

export const deleteAccountSchema = z.object({
  reason: z.string().max(500).optional(),
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

export const updateEventSchema = z.object({
  eventName: z.string().min(3).optional(),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  eventType: z.string().optional(),
  featuredImageUrl: z.string().url().optional(),
  capacity: z.number().positive().optional(),
  entryPrice: z.number().min(0).optional(),
  vipDiscount: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

// Incident validation schemas
export const createIncidentSchema = z.object({
  incidentType: z.enum([
    'altercation',
    'medical',
    'theft',
    'noise_complaint',
    'ejection',
    'id_issue',
    'overcapacity',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  location: z.string().optional(),
  involvedMembers: z.array(z.string().uuid()).optional(),
  involvedStaff: z.array(z.string().uuid()).optional(),
  actionTaken: z.string().optional(),
  policeCalled: z.boolean().optional(),
  ambulanceCalled: z.boolean().optional(),
});

export const updateIncidentSchema = z.object({
  incidentType: z
    .enum(['altercation', 'medical', 'theft', 'noise_complaint', 'ejection', 'id_issue', 'overcapacity', 'other'])
    .optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().min(3).optional(),
  location: z.string().optional(),
  involvedMembers: z.array(z.string().uuid()).optional(),
  involvedStaff: z.array(z.string().uuid()).optional(),
  actionTaken: z.string().optional(),
  policeCalled: z.boolean().optional(),
  ambulanceCalled: z.boolean().optional(),
});

export const resolveIncidentSchema = z.object({
  notes: z.string().optional(),
});

// VIP validation schemas
export const createVipTableSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  tableType: z.enum(['booth', 'table', 'skybox', 'cabana', 'stage_side']).optional(),
  capacity: z.number().positive().optional(),
  location: z.string().optional(),
  minimumSpend: z.number().min(0).optional(),
});

export const updateVipTableSchema = z.object({
  tableName: z.string().min(1).optional(),
  tableType: z.enum(['booth', 'table', 'skybox', 'cabana', 'stage_side']).optional(),
  capacity: z.number().positive().optional(),
  location: z.string().optional(),
  minimumSpend: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export const createVipReservationSchema = z.object({
  tableId: z.string().uuid(),
  memberId: z.string().uuid().optional(),
  reservationDate: z.string().min(1, 'Reservation date is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestPhone: z.string().optional(),
  partySize: z.number().positive().optional(),
  specialRequests: z.string().optional(),
});

export const updateVipReservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']),
});

// Guest list validation schemas
export const createGuestListSchema = z.object({
  listName: z.string().min(1, 'List name is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  eventId: z.string().uuid().optional(),
  entryType: z.enum(['free_entry', 'reduced', 'vip']).optional(),
  maxGuests: z.number().positive().optional(),
});

export const updateGuestListSchema = z.object({
  listName: z.string().min(1).optional(),
  eventDate: z.string().optional(),
  eventId: z.string().uuid().optional(),
  entryType: z.enum(['free_entry', 'reduced', 'vip']).optional(),
  maxGuests: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const addGuestListEntrySchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  guestPhone: z.string().optional(),
  plusOnes: z.number().min(0).optional(),
  memberId: z.string().uuid().optional(),
});
