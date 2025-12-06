# 🚀 Club Nightlife SaaS - Deployment Guide

## 📋 Quick Summary

This guide covers the complete deployment and testing process for the Club Nightlife SaaS platform.

## ✅ What Has Been Built

### Backend (Complete) ✅
- **API Server**: Node.js + Express + TypeScript
- **Database Schema**: PostgreSQL with 25+ tables
- **Authentication**: JWT with bcrypt
- **Services**: Auth, QR, Points, Notifications, Stripe
- **Endpoints**: Auth, Members, Visits, Transactions
- **Middleware**: Multi-tenant, validation, rate limiting
- **Tests**: Basic auth tests with Jest

### Frontend (Complete) ✅
- **Landing Page**: Professional SaaS marketing site
- **Auth Pages**: Login, Register (Club & Member)
- **Admin Dashboard**: KPIs, Members management
- **Door Staff View**: QR scanner for entry
- **Bar Staff View**: POS system with automatic discounts
- **Member Portal**: QR code, points, rewards
- **Components**: 9 reusable UI components
- **API Client**: Full integration with backend
- **State Management**: Zustand auth store

## 🔧 Prerequisites

Before deploying, ensure you have:

1. **Node.js 18+** and npm
2. **PostgreSQL 14+** running
3. **Redis 6+** running (optional for caching)
4. **Stripe Account** (for payments)
5. **(Optional)** Firebase project (for push notifications)

## 🗄️ Database Setup

### 1. Create Database

```bash
# Create PostgreSQL database
createdb clubnightlife

# Or with specific user
createdb -U postgres clubnightlife
```

### 2. Run Schema

```bash
# Run the complete schema
psql -U postgres -d clubnightlife < database/schema.sql

# Verify tables were created
psql clubnightlife -c "\dt"
```

You should see 25+ tables including:
- clubs
- club_users
- club_members
- visits
- transactions
- promotions
- events
- rewards
- badges
- leaderboards

### 3. Verify Schema

```bash
# Check a specific table
psql clubnightlife -c "\d clubs"

# Check all tables
psql clubnightlife -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

## 🔐 Environment Configuration

### Backend Environment

```bash
# Copy example
cp .env.example backend/.env

# Edit backend/.env with your values
```

**Required Variables:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/clubnightlife
JWT_SECRET=your-super-secret-key-minimum-32-characters
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard
```

**Optional Variables:**
```bash
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG... # For emails
FIREBASE_PROJECT_ID=... # For push notifications
TWILIO_ACCOUNT_SID=AC... # For SMS
```

### Frontend Environment

```bash
# Create frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🚀 Running the Application

### Option 1: Run Everything (Recommended)

```bash
# From root directory
npm install
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing the Backend

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Register a Club Owner

```bash
curl -X POST http://localhost:5000/api/auth/register/club \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@testclub.com",
    "password": "SecurePass123!",
    "fullName": "Test Owner",
    "clubName": "Test Nightclub"
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "owner@testclub.com",
      "fullName": "Test Owner",
      "role": "admin",
      "clubId": "club-uuid"
    },
    "club": {
      "id": "club-uuid",
      "name": "Test Nightclub",
      "slug": "test-nightclub",
      "status": "trialing"
    }
  }
}
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@testclub.com",
    "password": "SecurePass123!"
  }'
```

Save the token from the response for authenticated requests.

### 4. Get Members (Authenticated)

```bash
export TOKEN="your-jwt-token-here"
export CLUB_ID="your-club-id-here"

curl http://localhost:5000/api/clubs/$CLUB_ID/members \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Run Backend Tests

```bash
cd backend
npm test
```

## 🌐 Testing the Frontend

### 1. Open Landing Page

Navigate to http://localhost:3000

You should see:
- Hero section with CTA buttons
- Features section
- Pricing tiers
- FAQ section

### 2. Register a Club

1. Click "Start Free Trial"
2. Navigate to http://localhost:3000/register-club
3. Fill in the form:
   - Full Name
   - Email
   - Club Name
   - Password (min 8 chars with uppercase, number, special)
   - Confirm Password
4. Click "Create Account"
5. Should redirect to /admin dashboard

### 3. Test Admin Dashboard

After registration, you should see:
- KPI cards (Visits, Revenue, Members, Points)
- Sidebar with navigation
- User menu in navbar

**Test Navigation:**
- Click "Members" → Should show members list
- Click "Door" → Should show QR scanner view
- Click "Bar" → Should show POS system

### 4. Test Member Registration

1. Navigate to http://localhost:3000/register-member
2. Register as a member
3. Should redirect to /member portal
4. Should see QR code displayed

## 🔗 Testing Integration

### Complete Flow Test

**1. Register Club Owner:**
```bash
# Via API or frontend form
POST /api/auth/register/club
```

**2. Login as Club Owner:**
```bash
# Get JWT token
POST /api/auth/login
```

**3. Create a Member:**
```bash
# Via admin dashboard or API
POST /api/clubs/{clubId}/members
```

**4. Scan Member at Door:**
```bash
# Via door staff view or API
POST /api/clubs/{clubId}/visits
{
  "qrCodeId": "club-uuid-member-uuid",
  "entryMethod": "qr_scan"
}
```

**5. Process Transaction at Bar:**
```bash
# Via bar staff view or API
POST /api/clubs/{clubId}/transactions
{
  "qrCodeId": "club-uuid-member-uuid",
  "transactionType": "drink_sale",
  "description": "Vodka Soda",
  "amount": 12.00,
  "paymentMethod": "cash"
}
```

**6. Check Member Dashboard:**
- Navigate to http://localhost:3000/member
- Should see updated points balance
- Should see visit history

## 📊 Monitoring & Debugging

### Check Logs

**Backend logs:**
```bash
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

**Frontend console:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

### Common Issues

**Issue: Cannot connect to database**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -l | grep clubnightlife

# Check connection
psql -U postgres -d clubnightlife -c "SELECT 1;"
```

**Issue: Redis connection failed**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Or start Redis
redis-server
```

**Issue: Port already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

## 🎯 Testing Checklist

### Backend Tests ✅
- [ ] Health check endpoint responds
- [ ] Club owner registration works
- [ ] Login returns valid JWT
- [ ] Protected routes reject invalid tokens
- [ ] Member creation works
- [ ] Visit logging works
- [ ] Transaction processing calculates discounts correctly
- [ ] QR code generation works
- [ ] Points are updated correctly

### Frontend Tests ✅
- [ ] Landing page loads
- [ ] Registration forms work
- [ ] Login redirects to appropriate dashboard
- [ ] Admin dashboard displays KPIs
- [ ] Members table loads and filters
- [ ] Door staff QR scanner initializes
- [ ] Bar POS calculates totals correctly
- [ ] Member portal shows QR code
- [ ] Logout works and clears auth state

### Integration Tests ✅
- [ ] Frontend can register users via API
- [ ] Frontend can login and receive token
- [ ] Frontend sends token in Authorization header
- [ ] API rejects requests without valid token
- [ ] Real-time data updates work
- [ ] Error messages display properly
- [ ] Loading states show during API calls

## 🚢 Production Deployment

### Backend Deployment (Railway/Heroku)

**1. Create Railway project:**
```bash
railway login
railway init
railway link
```

**2. Add PostgreSQL:**
```bash
railway add postgresql
```

**3. Set environment variables:**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-production-secret
railway variables set STRIPE_SECRET_KEY=sk_live_...
```

**4. Deploy:**
```bash
git push railway main
```

### Frontend Deployment (Vercel)

**1. Install Vercel CLI:**
```bash
npm i -g vercel
```

**2. Deploy:**
```bash
cd frontend
vercel
```

**3. Set environment variables in Vercel Dashboard:**
- NEXT_PUBLIC_API_URL=https://your-api.railway.app
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

## 📚 Additional Resources

- [Backend API Documentation](README.md#api-documentation)
- [Database Schema](database/schema.sql)
- [Frontend Components](frontend/components/README.md)
- [Authentication Flow](frontend/lib/hooks/useAuth.ts)

## 🆘 Support

If you encounter issues:

1. Check logs (backend/logs/)
2. Verify environment variables
3. Ensure database is running
4. Check API responses in Network tab
5. Review error messages

## ✨ Next Steps

After successful deployment:

1. **Configure Stripe:**
   - Create products and prices
   - Set up webhook endpoints
   - Test payment flow

2. **Configure Notifications:**
   - Set up Firebase for push notifications
   - Configure SendGrid for emails
   - Test notification delivery

3. **Customize Branding:**
   - Upload club logo
   - Update color scheme
   - Customize email templates

4. **Add Sample Data:**
   - Create membership tiers
   - Add menu items
   - Create sample promotions
   - Add test events

5. **Train Staff:**
   - Demonstrate door scanning
   - Show bar POS usage
   - Explain admin features

---

**🎉 Congratulations! Your Club Nightlife SaaS platform is ready to launch!**
