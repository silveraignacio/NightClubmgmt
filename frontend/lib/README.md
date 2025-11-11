# Club Nightlife Frontend API Client Utilities

Production-ready API client utilities for the Club Nightlife SaaS platform frontend.

## Overview

This library provides a complete set of typed API client utilities for interacting with the Club Nightlife backend API. All modules are built on Axios with automatic JWT token management, error handling, and request/response interceptors.

## Installation

The dependencies are already included in `package.json`:
- `axios` - HTTP client
- `typescript` - Type safety

## Environment Variables

Create a `.env.local` file in the frontend root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Or for production:

```env
NEXT_PUBLIC_API_URL=https://api.clubnightlife.com/api
```

## Core Modules

### 1. api.ts - HTTP Client Configuration

The base Axios instance with automatic JWT token handling and interceptors.

**Features:**
- Automatic JWT token injection into request headers
- Token refresh on 401 responses
- Automatic logout on 401/403 errors
- Global error handling and standardized error responses
- Request timeout management (30 seconds)

**Usage:**

```typescript
import apiClient, { handleApiError } from '@/lib';

try {
  const response = await apiClient.get('/endpoint');
} catch (error) {
  const apiError = handleApiError(error);
  console.error(apiError.message);
}
```

### 2. auth.ts - Authentication

Handle user registration, login, and authentication state.

**Available Functions:**

- **login(credentials)** - Login with email and password
  ```typescript
  import { login } from '@/lib';

  const response = await login({
    email: 'user@example.com',
    password: 'password123'
  });

  // Response includes token, refreshToken, and user object
  ```

- **registerClub(data)** - Register a new club
  ```typescript
  import { registerClub } from '@/lib';

  const response = await registerClub({
    email: 'owner@club.com',
    password: 'secure123',
    confirmPassword: 'secure123',
    firstName: 'John',
    lastName: 'Doe',
    clubName: 'The Nightspot',
    location: '123 Main St',
    phone: '+1234567890',
    businessLicense: 'LIC123456'
  });
  ```

- **registerMember(data)** - Register a new member
  ```typescript
  import { registerMember } from '@/lib';

  const response = await registerMember({
    email: 'member@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567890',
    dateOfBirth: '1990-05-15'
  });
  ```

- **logout()** - Logout current user
  ```typescript
  import { logout } from '@/lib';

  await logout();
  // Token is automatically cleared from localStorage
  ```

- **verifyToken()** - Check if stored token is valid
  ```typescript
  import { verifyToken } from '@/lib';

  const { valid, user } = await verifyToken();
  ```

- **getCurrentUser()** - Get user object from localStorage
  ```typescript
  import { getCurrentUser } from '@/lib';

  const user = getCurrentUser();
  ```

- **isAuthenticated()** - Check if user is logged in
  ```typescript
  import { isAuthenticated } from '@/lib';

  if (isAuthenticated()) {
    // Show authenticated UI
  }
  ```

### 3. members.ts - Member Management

Manage club members and their data.

**Available Functions:**

- **getMembers(clubId, params?)** - Get paginated list of members
  ```typescript
  import { getMembers } from '@/lib';

  const result = await getMembers('club-123', {
    page: 1,
    pageSize: 20,
    search: 'john',
    status: 'ACTIVE',
    tier: 'GOLD',
    sortBy: 'totalSpent',
    sortOrder: 'desc'
  });

  console.log(result.data); // Member[]
  console.log(result.totalPages);
  ```

- **getMember(clubId, memberId)** - Get single member details
  ```typescript
  import { getMember } from '@/lib';

  const member = await getMember('club-123', 'member-456');
  ```

- **getMemberQRCode(clubId, memberId)** - Get member's QR code
  ```typescript
  import { getMemberQRCode } from '@/lib';

  const { qrCode, qrCodeUrl } = await getMemberQRCode('club-123', 'member-456');
  ```

- **getMemberStats(clubId, memberId)** - Get member statistics
  ```typescript
  import { getMemberStats } from '@/lib';

  const stats = await getMemberStats('club-123', 'member-456');
  // Returns: visits, spending, tier, points, recent visits
  ```

- **updateMember(clubId, memberId, data)** - Update member information
  ```typescript
  import { updateMember } from '@/lib';

  await updateMember('club-123', 'member-456', {
    status: 'SUSPENDED',
    tier: 'PLATINUM'
  });
  ```

- **searchMembers(clubId, query)** - Search by name, email, phone
  ```typescript
  import { searchMembers } from '@/lib';

  const members = await searchMembers('club-123', 'john@');
  ```

- **getMembersByTier(clubId, tier)** - Filter by membership tier
  ```typescript
  import { getMembersByTier } from '@/lib';

  const platinumMembers = await getMembersByTier('club-123', 'PLATINUM');
  ```

- **exportMembers(clubId)** - Export members list as CSV
  ```typescript
  import { exportMembers } from '@/lib';

  const blob = await exportMembers('club-123');
  // Download the blob as CSV
  ```

### 4. visits.ts - Visit Tracking

Manage member check-ins and visit history.

**Available Functions:**

- **createVisit(clubId, data)** - Create a check-in
  ```typescript
  import { createVisit } from '@/lib';

  const visit = await createVisit('club-123', {
    memberId: 'member-456',
    entryMethod: 'QR_CODE',
    guestCount: 2,
    notes: 'VIP guest'
  });
  ```

- **getVisits(clubId, params?)** - Get paginated visits
  ```typescript
  import { getVisits } from '@/lib';

  const result = await getVisits('club-123', {
    page: 1,
    pageSize: 50,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    entryMethod: 'QR_CODE',
    sortBy: 'checkInTime',
    sortOrder: 'desc'
  });
  ```

- **getTodayVisitsCount(clubId)** - Get today's visit count
  ```typescript
  import { getTodayVisitsCount } from '@/lib';

  const count = await getTodayVisitsCount('club-123');
  ```

- **getVisitStats(clubId)** - Get visit statistics
  ```typescript
  import { getVisitStats } from '@/lib';

  const stats = await getVisitStats('club-123');
  // Returns: today, week, month totals, peak hours, etc.
  ```

- **checkOutVisit(clubId, visitId)** - Check out a member
  ```typescript
  import { checkOutVisit } from '@/lib';

  await checkOutVisit('club-123', 'visit-789');
  ```

- **getActiveVisits(clubId)** - Get current check-ins
  ```typescript
  import { getActiveVisits } from '@/lib';

  const activeVisits = await getActiveVisits('club-123');
  ```

- **getMemberVisits(clubId, memberId, params?)** - Get member's visit history
  ```typescript
  import { getMemberVisits } from '@/lib';

  const visits = await getMemberVisits('club-123', 'member-456', {
    page: 1,
    pageSize: 10
  });
  ```

### 5. transactions.ts - Financial Transactions

Manage purchases, refunds, and revenue tracking.

**Available Functions:**

- **createTransaction(clubId, data)** - Create a transaction
  ```typescript
  import { createTransaction } from '@/lib';

  const transaction = await createTransaction('club-123', {
    memberId: 'member-456',
    amount: 50.00,
    type: 'PURCHASE',
    paymentMethod: 'CARD',
    description: 'Drinks and cocktails',
    itemsDescription: '2x vodka tonic, 1x cocktail'
  });
  ```

- **getTransactions(clubId, params?)** - Get paginated transactions
  ```typescript
  import { getTransactions } from '@/lib';

  const result = await getTransactions('club-123', {
    page: 1,
    pageSize: 50,
    type: 'PURCHASE',
    paymentMethod: 'CARD',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    minAmount: 10,
    maxAmount: 500,
    sortBy: 'amount',
    sortOrder: 'desc'
  });
  ```

- **getTodayRevenue(clubId)** - Get today's revenue
  ```typescript
  import { getTodayRevenue } from '@/lib';

  const revenue = await getTodayRevenue('club-123');
  ```

- **getTransactionStats(clubId)** - Get transaction statistics
  ```typescript
  import { getTransactionStats } from '@/lib';

  const stats = await getTransactionStats('club-123');
  // Returns: daily/weekly/monthly totals, payment methods breakdown
  ```

- **getRevenueStats(clubId)** - Get revenue analysis
  ```typescript
  import { getRevenueStats } from '@/lib';

  const revenue = await getRevenueStats('club-123');
  // Returns: revenue trends, average per visit, growth indicators
  ```

- **refundTransaction(clubId, transactionId, reason?)** - Refund a transaction
  ```typescript
  import { refundTransaction } from '@/lib';

  await refundTransaction('club-123', 'transaction-789', 'Wrong amount charged');
  ```

- **getMemberTransactions(clubId, memberId, params?)** - Get member's transaction history
  ```typescript
  import { getMemberTransactions } from '@/lib';

  const transactions = await getMemberTransactions('club-123', 'member-456');
  ```

- **exportTransactions(clubId, params?)** - Export transactions as CSV
  ```typescript
  import { exportTransactions } from '@/lib';

  const blob = await exportTransactions('club-123', {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  ```

## Error Handling

All functions throw standardized `ApiErrorResponse` objects:

```typescript
import { getMembers, ApiErrorResponse } from '@/lib';

try {
  await getMembers('club-123');
} catch (error) {
  const apiError = error as ApiErrorResponse;
  console.error(apiError.statusCode); // HTTP status code
  console.error(apiError.error);      // Error code
  console.error(apiError.message);    // Human-readable message
  console.error(apiError.details);    // Validation errors, etc.
}
```

## Types

All TypeScript types are properly exported:

```typescript
import type {
  Member,
  Visit,
  Transaction,
  LoginResponse,
  PaginatedResponse,
  ApiResponse,
} from '@/lib';
```

## Token Management

The API client automatically:
- Injects JWT token from localStorage into all requests
- Handles token expiration (401 responses)
- Clears token and redirects to login on 401/403
- Stores tokens after successful login/registration

## Usage in React Components

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib';

function MembersPage({ clubId }: { clubId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['members', clubId],
    queryFn: () => getMembers(clubId)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as any).message}</div>;

  return (
    <div>
      {data?.data.map(member => (
        <div key={member.id}>{member.firstName} {member.lastName}</div>
      ))}
    </div>
  );
}
```

### With Zustand

```typescript
import { create } from 'zustand';
import { getMembers, Member } from '@/lib';

interface MembersStore {
  members: Member[];
  loading: boolean;
  fetchMembers: (clubId: string) => Promise<void>;
}

export const useMembersStore = create<MembersStore>((set) => ({
  members: [],
  loading: false,
  fetchMembers: async (clubId: string) => {
    set({ loading: true });
    try {
      const result = await getMembers(clubId);
      set({ members: result.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  }
}));
```

## Production Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Ensure backend API is running and accessible
- [ ] Test all authentication flows
- [ ] Verify JWT token handling
- [ ] Test error scenarios (401, 403, 500)
- [ ] Verify token auto-refresh (if implemented on backend)
- [ ] Test pagination with large datasets
- [ ] Verify CSV exports work correctly
- [ ] Test concurrent API requests
- [ ] Monitor network requests in browser DevTools

## Troubleshooting

**401 Unauthorized:**
- Token has expired or is invalid
- Check localStorage for `authToken`
- Re-login to get a fresh token

**CORS Errors:**
- Verify API URL is correct
- Check backend CORS configuration
- Use browser DevTools to inspect request headers

**Token Not Persisting:**
- Ensure localStorage is enabled
- Check that login response includes token
- Verify token is being saved in `auth.ts`

## License

Part of Club Nightlife SaaS Platform
