# API Client Architecture

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                   React Components                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ imports
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    index.ts (Central Export)                │
│           Re-exports all functions and types                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┼──────────┬─────────────┐
                │          │          │             │
                ↓          ↓          ↓             ↓
           ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐
           │ auth   │ │members │ │ visits   │ │transactions │
           └────┬───┘ └────┬───┘ └────┬─────┘ └──────┬──────┘
                │          │          │              │
                └──────────┼──────────┼──────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │   api.ts     │
                    │ Axios Client │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   ┌────────┐        ┌──────────┐      ┌──────────┐
   │Request │        │Interceptor│     │ Response │
   │Header  │        │(Token)    │     │Handler   │
   │Inject  │        │           │     │(Error)   │
   └────────┘        └──────────┘     └──────────┘
        │
        └─────────────────────────────┐
                                      │
                                      ↓
                              ┌─────────────────┐
                              │ localStorage    │
                              │ (authToken)     │
                              └─────────────────┘
                                      │
                                      ↓
                              ┌──────────────────┐
                              │  Backend API     │
                              │  (REST/HTTP)     │
                              └──────────────────┘
```

## Data Flow Architecture

### Authentication Flow

```
User Login
    │
    ↓
┌─────────────────┐
│ login()         │
│ auth.ts         │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│ apiClient.post('/auth/login')
└────────┬────────────────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
    ↓                              ↓
Success                         Error
│                               │
│ Store Token                   │ handleApiError()
│ Store User Object             │ Throw ApiErrorResponse
│ Store RefreshToken            │
│                               │
↓                               ↓
User Authenticated          Show Error
Redirect to Dashboard       Redirect to Login
```

### Member Management Flow

```
getMembers(clubId, params)
    │
    ↓
┌────────────────────────────────────┐
│ Prepare params (pagination, filter) │
└────────┬─────────────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ api.get('/clubs/{clubId}...') │
└────────┬─────────────────────┘
         │
         ├─── Request Interceptor ──→ Add Authorization Header
         │
         ↓
┌────────────────────────┐
│ Backend Processes      │
│ Validates Token        │
│ Filters & Paginates    │
└────────┬───────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Response Interceptor           │
│ - Check Status                 │
│ - Handle Errors (401, 403)     │
│ - Parse Response               │
└────────┬─────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ PaginatedResponse<Member>   │
│ {                           │
│   data: Member[],          │
│   total: number,           │
│   page: number,            │
│   pageSize: number,        │
│   totalPages: number       │
│ }                           │
└─────────────────────────────┘
```

### Transaction Processing

```
createTransaction(clubId, data)
    │
    ↓
┌──────────────────────────────────┐
│ Validate Input Data              │
│ - memberId required              │
│ - amount > 0                      │
│ - type must be valid              │
│ - paymentMethod required          │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ apiClient.post('/clubs/...')│
└────────┬─────────────────────┘
         │
    ┌────┴──────────────────────┐
    │                           │
    ↓                           ↓
Success                      Error
│                            │
├─ Record in DB         ├─ handleApiError()
├─ Update Member Stats  ├─ Throw error
├─ Create Audit Log     │
│                       └─ Show error to user
↓
Return Transaction
Object with ID
```

## Module Interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                         members.ts                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ getMembers()          - List with pagination             │  │
│  │ getMember()           - Single member details            │  │
│  │ getMemberQRCode()     - Generate/fetch QR code          │  │
│  │ getMemberStats()      - Stats aggregation               │  │
│  │ searchMembers()       - Full-text search                │  │
│  └───────┬───────────────────────────────────────────────────┘  │
│          │                                                       │
│          ↓ All use                                              │
├─────────────────────────────────────────────────────────────────┤
│                         api.ts                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ HTTP Client (Axios)                                       │  │
│  │                                                            │  │
│  │ Request Interceptor:                                      │  │
│  │   - Get token from auth.ts (isAuthenticated check)       │  │
│  │   - Add Authorization header                             │  │
│  │   - Set Content-Type                                     │  │
│  │                                                            │  │
│  │ Response Interceptor:                                     │  │
│  │   - Check HTTP status codes                              │  │
│  │   - Handle 401 → logout() from auth.ts                  │  │
│  │   - Parse error responses                                │  │
│  │   - Extract data from response                           │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ↑         ↑           ↑            ↑
         │         │           │            │
    ┌────┴─────┬──┴────┬──────┴──┬─────────┴─┐
    │           │        │         │          │
    ↓           ↓        ↓         ↓          ↓
 auth.ts    members.ts visits.ts transactions.ts
```

## Error Handling Chain

```
Component
    │ await function()
    ↓
API Function (e.g., getMembers)
    │
    ├─ try
    └─ catch (error)
        │
        ↓
    handleApiError(error)
        │
        ├─ Check: axios.isAxiosError?
        │   │
        │   ├─ Yes → Extract response data
        │   │   └─ Return ApiErrorResponse
        │   │
        │   └─ No → Generic error
        │       └─ Return ApiErrorResponse
        │
        ↓
    throw ApiErrorResponse
        │
        ↓
    Component catch block
        │
        ├─ Check statusCode
        │   ├─ 401 → Redirect to login
        │   ├─ 403 → Show forbidden
        │   ├─ 404 → Item not found
        │   └─ 500 → Server error
        │
        └─ Show appropriate UI/message
```

## Request/Response Cycle

### 1. Request Path

```
Component
    │
    ↓
apiClient.get/post/put/delete()
    │
    ├─ Request Interceptor
    │   │
    │   ├─ Get token from localStorage
    │   ├─ Add "Authorization: Bearer {token}"
    │   ├─ Add "Content-Type: application/json"
    │   │
    │   └─ Pass to Axios
    │
    ↓
HTTP Request → Backend API
    │
    └─ Headers:
        - Authorization: Bearer eyJhbGc...
        - Content-Type: application/json
        - User-Agent: ...
```

### 2. Response Path

```
Backend API Response
    │
    ├─ Success (200-299)
    │   │
    │   └─ Response Interceptor
    │       │
    │       └─ Return response as-is
    │
    ├─ Unauthorized (401)
    │   │
    │   └─ Response Interceptor
    │       │
    │       ├─ Clear localStorage.authToken
    │       ├─ Redirect to /login
    │       │
    │       └─ Reject promise
    │
    ├─ Forbidden (403)
    │   │
    │   └─ Response Interceptor
    │       │
    │       ├─ Redirect to /forbidden
    │       │
    │       └─ Reject promise
    │
    └─ Other Errors (4xx, 5xx)
        │
        └─ Response Interceptor
            │
            └─ Reject promise with error data
                │
                ↓
            Component catch handler
```

## Type Safety Flow

```
Component knows expected type
    │
    ↓
import type { Member, PaginatedResponse }
    │
    ↓
Call function: getMembers(clubId, params)
    │
    ├─ Input types checked:
    │   - clubId: string
    │   - params?: GetMembersParams
    │
    ├─ Return type: Promise<PaginatedResponse<Member>>
    │
    └─ Component code auto-completes
        │
        └─ result.data // Member[]
           result.total // number
           result.page // number
           etc.
```

## Storage Management

```
┌──────────────────────────────┐
│     localStorage             │
├──────────────────────────────┤
│ authToken   (JWT)            │
│             → Used in        │
│               Request header │
│                              │
│ refreshToken                 │
│             → For token      │
│               refresh (API)  │
│                              │
│ user        (JSON)           │
│             → User object    │
│               from login     │
│                              │
│ clubId                       │
│             → Current club   │
│               for club owner │
└──────────────────────────────┘
         ↑           ↑
         │           │
    Stored by    Retrieved by
    auth.ts      api.ts
```

## State Management Integration

```
Component
    │
    ├─ Option 1: Direct API calls
    │   │
    │   └─ import { getMembers } from '@/lib'
    │       const data = await getMembers(clubId)
    │
    ├─ Option 2: React Query
    │   │
    │   └─ useQuery({
    │       queryKey: ['members'],
    │       queryFn: () => getMembers(clubId)
    │     })
    │
    └─ Option 3: Zustand Store
        │
        └─ const store = useMembersStore()
           store.fetchMembers(clubId)
           store.members // Access data
```

## Performance Considerations

```
API Client Features
    │
    ├─ Request Timeout: 30 seconds
    │   └─ Prevents hanging requests
    │
    ├─ Pagination Support
    │   └─ Fetch only needed data
    │
    ├─ Token Caching
    │   └─ Avoid repeated localStorage reads
    │
    ├─ Error Handling
    │   └─ Reduce unnecessary retries
    │
    └─ Axios Instance Reuse
        └─ Connection pooling
```

---

## Summary

The API client architecture follows these principles:

1. **Centralized**: Single axios instance in `api.ts`
2. **Modular**: Separate concerns (auth, members, visits, transactions)
3. **Type-Safe**: Full TypeScript support with exported types
4. **Secure**: Automatic JWT token handling
5. **Resilient**: Comprehensive error handling
6. **Flexible**: Works with React Query, Zustand, or direct usage
7. **Observable**: Request/response interceptors for debugging
8. **Scalable**: Easy to add new API modules following the pattern

