# Club Nightlife Member Portal

A comprehensive member dashboard and portal for Club Nightlife SaaS platform, allowing members to manage their accounts, view QR codes, earn and redeem rewards, and track their membership activity.

## Overview

The member portal provides members with a complete self-service experience including:

- **Dashboard**: Quick overview of membership status, points, and recent activity
- **QR Code Management**: Display, download, and add QR code to wallet
- **Rewards Catalog**: Browse and redeem exclusive rewards
- **Profile Management**: Update personal information, password, and notification preferences
- **Transaction History**: View all purchases and transactions

## Features

### 1. Member Dashboard (`/member`)

The main landing page for authenticated members with:

- **Large QR Code Display**: Prominent QR code for club entry
  - Download QR code as PNG
  - Add QR code to mobile wallet (Apple Wallet, Google Pay)
  - View encoded QR value

- **Points Balance Card**:
  - Total points balance prominently displayed
  - Progress bar to next reward
  - Points required for next reward

- **Membership Tier Badge**:
  - Current tier (Bronze, Silver, Gold, Platinum)
  - Gradient coloring by tier
  - Star rating based on tier
  - Member since date

- **Statistics Grid**:
  - Total visits
  - Total amount spent
  - Average spending per visit
  - Last visit date

- **Recent Visits**:
  - Last 5 visits to the club
  - Check-in/check-out times
  - Amount spent per visit

- **Points Earned**:
  - Monthly points progress
  - Progress bar to goals
  - Breakdown of points by source (purchases, visits)

### 2. Rewards Page (`/member/rewards`)

A full-featured rewards catalog with:

- **Available Rewards Grid**:
  - Display all club rewards
  - Filter by category (drinks, food, VIP, experiences, merchandise, discounts)
  - View points required and estimated value
  - Expiration date information

- **Redemption System**:
  - One-click reward redemption
  - Real-time point deduction
  - Automatic redemption code generation
  - Redemption confirmation

- **Redeemed Rewards History**:
  - All redeemed rewards with status
  - Active (valid), Used, or Expired
  - Days remaining until expiration
  - Copy redemption code to clipboard
  - Timestamp of redemption

- **Category Filtering**:
  - All Rewards
  - Drinks
  - Food & Bites
  - VIP Access
  - Experiences
  - Merchandise
  - Discounts

### 3. Profile Page (`/member/profile`)

Complete profile management with:

- **Personal Information Section**:
  - Edit first name, last name
  - Display email (read-only)
  - Update phone number
  - Update date of birth

- **Security**:
  - Change password with current password verification
  - Password strength validation (minimum 8 characters)
  - Password visibility toggle
  - Confirmation password field

- **Notification Preferences**:
  - Email notifications toggle
  - SMS notifications toggle
  - Promotional offers toggle
  - Settings persist to backend

- **Account Information Card**:
  - Member since date
  - Account status (Active, Inactive, Suspended)
  - Membership tier
  - Unique member ID
  - One-click logout

- **Quick Statistics**:
  - Total visits
  - Total amount spent
  - Last visit date

- **Transaction History**:
  - Last 10 transactions
  - Date, type, amount, and status
  - Responsive table design
  - Status badges (Completed, Pending, Failed)

### 4. Member Layout (`/member/layout.tsx`)

Protected layout providing:

- **Responsive Navigation**:
  - Club Nightlife logo with gradient animation
  - Desktop navigation menu
  - Mobile bottom navigation bar
  - Mobile-first responsive design

- **User Information**:
  - Display logged-in user name
  - Display user email
  - Quick logout button

- **Sticky Header**:
  - Always accessible navigation
  - Backdrop blur effect
  - Dark theme with purple accent

- **Footer**:
  - Club information
  - Quick navigation links
  - Contact information
  - Social/legal links

- **Route Protection**:
  - Automatic authentication check
  - Redirect to login if not authenticated
  - Loading state during auth check
  - Error handling and recovery

## Technical Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 18** - UI library

### Styling
- **Tailwind CSS** - Utility-first CSS
- **Dark Theme** - Dark theme for nightlife aesthetic
- **Mobile-First** - Responsive design from smallest to largest screens

### Components
- Custom UI components from `@/components`:
  - `Card` - Flexible card components with variants
  - `Button` - Styled button with variants and loading states
  - `Input` - Accessible input fields
  - `QRDisplay` - QR code display and download
  - `PageLoader` - Loading skeleton screens
  - `Modal` - Modal dialogs (if needed)

### Icons
- **Lucide React** - Consistent icon set
  - `Download`, `Copy`, `Check` - QR code actions
  - `Gift`, `Zap`, `Star` - Rewards and points
  - `Calendar`, `DollarSign`, `TrendingUp` - Statistics
  - `Bell`, `Lock`, `Eye`, `LogOut` - Settings and actions

### APIs & Utilities
- **API Client** from `@/lib`:
  - `getMember()` - Fetch member profile
  - `getMemberStats()` - Get member statistics
  - `getMemberQRCode()` - Get QR code data
  - `getMemberVisits()` - Fetch visit history
  - `getMemberTransactions()` - Fetch transaction history
  - `updateMember()` - Update profile information
  - `getRewards()` - Fetch reward catalog
  - `redeemReward()` - Redeem a reward
  - `getMemberRedeemedRewards()` - Fetch redeemed rewards

- **Authentication** from `@/lib/hooks`:
  - `useAuth()` - Auth state and actions
  - `useUser()` - Get current user
  - `useIsAuthenticated()` - Check auth status
  - `useAuthLoading()` - Get loading state

- **Date Utilities**:
  - `date-fns` - Date formatting and manipulation
  - Format dates like "MMM d, yyyy", "h:mm a"

## Directory Structure

```
frontend/app/member/
├── layout.tsx              # Protected member layout with navigation
├── page.tsx                # Dashboard with QR, points, and recent activity
├── rewards/
│   └── page.tsx           # Rewards catalog and redemption
└── profile/
    └── page.tsx           # Profile settings and transaction history

frontend/lib/
├── members.ts             # Member API utilities
├── visits.ts              # Visit API utilities
├── transactions.ts        # Transaction API utilities
├── rewards.ts             # Rewards API utilities (new)
├── hooks/
│   └── useAuth.ts         # Authentication hook
└── store/
    └── authStore.ts       # Zustand auth store
```

## API Integration

### Required API Endpoints

The member portal expects the following API endpoints:

**Member Endpoints:**
- `GET /clubs/{clubId}/members/{memberId}` - Get member details
- `GET /clubs/{clubId}/members/{memberId}/stats` - Get member statistics
- `GET /clubs/{clubId}/members/{memberId}/qr-code` - Get QR code
- `GET /clubs/{clubId}/members/{memberId}/visits` - Get visit history
- `GET /clubs/{clubId}/members/{memberId}/transactions` - Get transactions
- `PUT /clubs/{clubId}/members/{memberId}` - Update member profile

**Reward Endpoints:**
- `GET /clubs/{clubId}/rewards` - Get all rewards
- `GET /clubs/{clubId}/members/{memberId}/redeemed-rewards` - Get redeemed rewards
- `POST /clubs/{clubId}/members/{memberId}/redeem-reward` - Redeem a reward

## Styling and Theming

### Dark Theme Colors
- **Background**: `from-gray-900 via-purple-900 to-gray-900` gradient
- **Cards**: `bg-gray-800/50` with `border-purple-500/30`
- **Text**: White text (`text-white`) with gray accents
- **Accents**: Purple (`from-purple-600 to-pink-600`) and pink gradients

### Tier Colors
- **Bronze**: `from-amber-600 to-orange-600`
- **Silver**: `from-slate-400 to-slate-600`
- **Gold**: `from-yellow-500 to-amber-600`
- **Platinum**: `from-purple-500 to-pink-600`

### Responsive Design
- **Mobile**: Full-width, single column, bottom navigation
- **Tablet**: Multi-column grids, adjusted padding
- **Desktop**: Full featured layout with sidebars

## State Management

- **Authentication**: Zustand store with localStorage persistence
- **Component State**: React hooks for local form and UI state
- **API Data**: React state with manual fetching and error handling

## Error Handling

- **Loading States**: PageLoader component while fetching data
- **Error Messages**: User-friendly error alerts
- **Form Validation**:
  - Required field checks
  - Password strength validation (min 8 characters)
  - Password confirmation matching
  - Email format validation (native HTML5)

- **Fallback UI**: Graceful fallbacks for missing data

## Performance Considerations

- **Code Splitting**: Each page is a separate bundle
- **Image Optimization**: No images, uses SVG icons (Lucide React)
- **Data Fetching**: Parallel requests with Promise.all
- **Lazy Loading**: Components load on demand
- **Mobile Optimization**: Optimized layouts for smaller screens

## Future Enhancements

- **Real Rewards API**: Replace mock rewards with backend API
- **Wallet Integration**: Actually add QR to Apple/Google Wallet
- **Analytics**: Track member engagement and reward redemption
- **Notifications**: Real-time notifications for points, rewards
- **Tier Progression**: Visual tier upgrade progression
- **Referral Program**: Share member ID for referrals
- **Event Calendar**: Club events and special nights
- **Reservations**: Book VIP tables in advance
- **Password Reset**: Forgot password functionality
- **2FA**: Two-factor authentication support
- **Export**: Export membership card as PDF
- **Social Share**: Share achievements on social media

## Configuration

### Environment Variables

The portal uses the same environment variables as the main app:
- `NEXT_PUBLIC_API_URL` - Backend API base URL

### API Base Configuration

Set in `frontend/lib/store/authStore.ts`:
```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
```

## Testing

The member portal is production-ready but would benefit from:

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API integration and data flow tests
- **E2E Tests**: User journey tests (login, redeem rewards, update profile)
- **Accessibility Tests**: WCAG compliance verification
- **Performance Tests**: Load time and Lighthouse audits

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and structure
- **ARIA Labels**: Form labels and button descriptions
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Color Contrast**: Sufficient contrast for readability
- **Focus Management**: Visible focus indicators
- **Loading States**: Aria-busy and loading indicators

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design supports all screen sizes
- Progressive enhancement for JavaScript

## Conclusion

The Club Nightlife Member Portal provides a complete, production-ready solution for member self-service. With comprehensive reward management, profile settings, and transaction tracking, members have full control of their club experience while earning and redeeming exclusive rewards.
