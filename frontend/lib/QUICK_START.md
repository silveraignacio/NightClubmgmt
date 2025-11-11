# Quick Start Guide - Club Nightlife API Client

## Setup

1. **Install dependencies** (if not already installed):
```bash
npm install
```

2. **Set environment variables** in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. **Start your Next.js app**:
```bash
npm run dev
```

## Authentication Flow Example

```typescript
'use client'; // If using App Router

import { useState } from 'react';
import { login, logout, isAuthenticated, getCurrentUser } from '@/lib';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password });
      console.log('Logged in as:', result.user.email);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

## Members Example

```typescript
import { useState, useEffect } from 'react';
import { getMembers, type Member, type GetMembersParams } from '@/lib';

export default function MembersPage({ clubId }: { clubId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const params: GetMembersParams = {
          page: 1,
          pageSize: 20,
          sortBy: 'totalSpent',
          sortOrder: 'desc'
        };
        const result = await getMembers(clubId, params);
        setMembers(result.data);
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [clubId]);

  if (loading) return <div>Loading...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Tier</th>
          <th>Total Spent</th>
          <th>Visits</th>
        </tr>
      </thead>
      <tbody>
        {members.map(member => (
          <tr key={member.id}>
            <td>{member.firstName} {member.lastName}</td>
            <td>{member.email}</td>
            <td>{member.tier}</td>
            <td>${member.totalSpent}</td>
            <td>{member.totalVisits}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Check-in/Visit Example

```typescript
import { useState } from 'react';
import { createVisit, type CreateVisitData } from '@/lib';

export default function CheckInPage({ clubId }: { clubId: string }) {
  const [memberId, setMemberId] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [message, setMessage] = useState('');

  const handleCheckIn = async () => {
    try {
      const visitData: CreateVisitData = {
        memberId,
        entryMethod: 'QR_CODE',
        guestCount,
        notes: 'Check-in via QR scanner'
      };

      const visit = await createVisit(clubId, visitData);
      setMessage(`Checked in ${visit.memberName} with ${visit.guestCount} guest(s)`);

      // Reset form
      setMemberId('');
      setGuestCount(0);
    } catch (error) {
      setMessage('Check-in failed');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        placeholder="Scan QR Code or enter member ID"
      />
      <input
        type="number"
        value={guestCount}
        onChange={(e) => setGuestCount(parseInt(e.target.value))}
        min="0"
        placeholder="Number of guests"
      />
      <button onClick={handleCheckIn}>Check In</button>
      {message && <p>{message}</p>}
    </div>
  );
}
```

## Transactions Example

```typescript
import { useState } from 'react';
import { createTransaction, type CreateTransactionData } from '@/lib';

export default function PurchasePage({ clubId }: { clubId: string }) {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  const handlePurchase = async () => {
    try {
      const transaction: CreateTransactionData = {
        memberId,
        amount,
        type: 'PURCHASE',
        paymentMethod: 'CARD',
        description,
        itemsDescription: '2x Vodka Tonic, 1x Cocktail'
      };

      const result = await createTransaction(clubId, transaction);
      alert(`Transaction created: $${result.amount}`);
    } catch (error) {
      alert('Transaction failed');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        placeholder="Member ID"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value))}
        step="0.01"
        placeholder="Amount"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button onClick={handlePurchase}>Process Payment</button>
    </div>
  );
}
```

## With React Query (Recommended)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMembers, createVisit, type CreateVisitData } from '@/lib';

export default function Dashboard({ clubId }: { clubId: string }) {
  // Fetch members with React Query
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError
  } = useQuery({
    queryKey: ['members', clubId],
    queryFn: () => getMembers(clubId, { pageSize: 50 })
  });

  // Mutation for creating visits
  const createVisitMutation = useMutation({
    mutationFn: (visitData: CreateVisitData) =>
      createVisit(clubId, visitData),
    onSuccess: (visit) => {
      console.log('Visit created:', visit);
      // Invalidate queries to refetch data
    }
  });

  return (
    <div>
      <h2>Members ({membersData?.total || 0})</h2>
      {membersLoading && <p>Loading...</p>}
      {membersError && <p>Error loading members</p>}

      {membersData?.data.map(member => (
        <div key={member.id}>
          <span>{member.firstName} {member.lastName}</span>
          <button
            onClick={() =>
              createVisitMutation.mutate({
                memberId: member.id,
                entryMethod: 'MANUAL',
                guestCount: 1
              })
            }
          >
            Check In
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Common Patterns

### Error Handling

```typescript
import { ApiErrorResponse } from '@/lib';

try {
  await getMembers(clubId);
} catch (error) {
  const apiError = error as ApiErrorResponse;

  switch (apiError.statusCode) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      // Show forbidden message
      console.error('Access denied');
      break;
    case 404:
      // Resource not found
      console.error('Member not found');
      break;
    default:
      console.error('Error:', apiError.message);
  }
}
```

### Protected Routes

```typescript
import { useEffect } from 'react';
import { isAuthenticated } from '@/lib';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return <div>Protected Content</div>;
}
```

### Type Safety

```typescript
// Import all types you need
import type {
  Member,
  Visit,
  Transaction,
  LoginResponse,
  PaginatedResponse,
  ApiErrorResponse
} from '@/lib';

// Use them in your components
const member: Member = {
  id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  // ... rest of properties
};
```

## Troubleshooting

### Issue: "Cannot find module '@/lib'"

Make sure your `tsconfig.json` has the path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Token not persisting

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check browser localStorage in DevTools
3. Ensure login response includes token
4. Check for CORS errors in network tab

### Issue: "401 Unauthorized"

1. Token may have expired
2. Try logging out and back in
3. Clear localStorage and refresh

## Next Steps

- Explore the full API documentation in `README.md`
- Check the backend API endpoints
- Implement state management with Zustand
- Add custom hooks for common operations
- Set up React Query for data fetching

## API Endpoints

Refer to the backend API documentation for the complete list of endpoints and request/response formats. The base URL is configured in `NEXT_PUBLIC_API_URL`.
