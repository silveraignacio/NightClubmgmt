# 🎉 Club Nightlife SaaS Platform

A complete SaaS platform for managing nightclubs, bars, and entertainment venues. Includes membership management, QR code check-ins, loyalty points, automatic discounts, and real-time analytics.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## ✨ Features

### For Club Owners (Admin Dashboard)
- 📊 Real-time KPIs (visits, revenue, active members)
- 👥 Member management with search and filtering
- 🎫 Event creation and management
- 🎁 Promotion and reward system
- 📈 Advanced analytics and reporting
- 👨‍💼 Staff management (doormen, bartenders)
- 💳 Stripe subscription management

### For Club Members (Client App)
- 📱 Unique QR code for identification
- ⭐ Loyalty points system
- 💰 Automatic discounts based on membership tier
- 🎉 Event registration and notifications
- 🏆 Gamification with badges and leaderboards
- 📬 Push notifications for promotions and rewards
- 📊 Personal stats and transaction history

### For Door Staff (Portero App)
- 📷 QR code scanner for entry
- ✅ Quick member verification
- 📝 Visit logging with notes
- 📱 Tablet-optimized horizontal layout

### For Bar Staff (Barra App)
- 🍹 Digital menu with categories
- 📷 Member QR scanning
- 💵 Automatic discount calculation
- 🎯 Points tracking
- 💳 Multiple payment methods
- 📱 Tablet-optimized interface

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (25+ tables)
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Payments**: Stripe
- **QR Codes**: qrcode library
- **Logging**: Winston
- **Testing**: Jest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand / React Query
- **Forms**: React Hook Form + Zod
- **QR Scanning**: jsQR
- **Charts**: Recharts

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway / Heroku
- **File Storage**: AWS S3
- **Monitoring**: Datadog / Sentry
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: SendGrid
- **SMS**: Twilio

## 🏗️ Architecture

### Multi-Tenant Design
- Each club is completely isolated
- Club-scoped authentication and authorization
- Tenant middleware ensures data separation
- Shared infrastructure reduces costs

### Database Schema
- **clubs**: Multi-tenant root table
- **club_users**: Staff members (admin, manager, bartender, doorman)
- **club_members**: Club customers with QR codes
- **membership_tiers**: Bronze, Silver, Gold, VIP, Platinum
- **visits**: Entry logs
- **transactions**: Purchase records with automatic discounts
- **promotions**: Time-based promotional campaigns
- **events**: Club events with registration
- **rewards**: Loyalty rewards
- **badges**: Gamification achievements
- **leaderboards**: Weekly/monthly rankings
- **notifications**: Push notification history
- **devices**: Registered tablets
- **menu_items**: Bar menu
- **points_history**: Audit trail for points

See `database/schema.sql` for complete schema.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Stripe account
- (Optional) Firebase project for push notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NightClubmgmt
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or install individually:
   ```bash
   # Root
   npm install

   # Backend
   cd backend && npm install

   # Frontend
   cd frontend && npm install
   ```

## 🔐 Environment Variables

Create `.env` files based on `.env.example`:

### Backend (`backend/.env`)

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clubnightlife
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Email
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@clubnightlife.com

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
TRIAL_DAYS=14
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 💾 Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb clubnightlife
   ```

2. **Run the schema**
   ```bash
   psql -U postgres -d clubnightlife < database/schema.sql
   ```

3. **Verify tables**
   ```bash
   psql clubnightlife -c "\dt"
   ```

## ▶️ Running the Application

### Development Mode

Run both backend and frontend:
```bash
npm run dev
```

Or run separately:

```bash
# Backend (http://localhost:5000)
npm run backend:dev

# Frontend (http://localhost:3000)
npm run frontend:dev
```

### Production Mode

```bash
# Build
npm run backend:build
npm run frontend:build

# Start
npm run backend:start
npm run frontend:start
```

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register Club Owner
```http
POST /api/auth/register/club
Content-Type: application/json

{
  "email": "owner@club.com",
  "password": "securepass123",
  "fullName": "John Doe",
  "clubName": "Epic Nightclub"
}
```

#### Register Member
```http
POST /api/auth/register/member
Content-Type: application/json

{
  "email": "member@example.com",
  "password": "securepass123",
  "fullName": "Jane Smith",
  "clubId": "uuid-here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

### Member Endpoints

All authenticated endpoints require header:
```http
Authorization: Bearer <jwt-token>
```

#### Get All Members
```http
GET /api/clubs/:clubId/members?search=john&limit=50&offset=0
```

#### Get Member QR Code
```http
GET /api/clubs/:clubId/members/:memberId/qr-code
```

#### Get Member Stats
```http
GET /api/clubs/:clubId/members/:memberId/stats
```

### Visit Endpoints

#### Create Visit (Door Entry)
```http
POST /api/clubs/:clubId/visits
Content-Type: application/json

{
  "qrCodeId": "club-uuid-member-uuid",
  "entryMethod": "qr_scan",
  "entryType": "free_entry"
}
```

#### Get Today's Visit Count
```http
GET /api/clubs/:clubId/visits/today/count
```

### Transaction Endpoints

#### Create Transaction (Bar Purchase)
```http
POST /api/clubs/:clubId/transactions
Content-Type: application/json

{
  "qrCodeId": "club-uuid-member-uuid",
  "transactionType": "drink_sale",
  "description": "Vodka Soda",
  "amount": 12.00,
  "paymentMethod": "cash"
}
```

#### Get Today's Revenue
```http
GET /api/clubs/:clubId/transactions/today/revenue
```

## 📁 Project Structure

```
NightClubmgmt/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis, Stripe config
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers, validators, logger
│   │   └── server.ts        # Express app entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── (client)/        # Client-facing app
│   │   ├── (admin)/         # Admin dashboard
│   │   ├── (door)/          # Door staff app
│   │   ├── (bar)/           # Bar staff app
│   │   └── page.tsx         # Landing page
│   ├── components/          # Shared React components
│   ├── lib/                 # Utilities, API client
│   └── package.json
├── database/
│   └── schema.sql           # PostgreSQL schema
├── .env.example             # Environment variables template
├── package.json             # Root package.json
└── README.md                # This file
```

## 🚢 Deployment

### Backend (Railway/Heroku)

1. **Set environment variables** in your hosting platform
2. **Add PostgreSQL addon**
3. **Add Redis addon**
4. **Deploy**
   ```bash
   git push railway main  # or heroku main
   ```

### Frontend (Vercel)

1. **Import project** to Vercel
2. **Set environment variables**
3. **Deploy** automatically on git push

### Database Migration

```bash
# Backup production database
pg_dump $DATABASE_URL > backup.sql

# Restore to another database
psql $NEW_DATABASE_URL < backup.sql
```

## 🔒 Security Features

- ✅ JWT authentication with 7-day expiration
- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ Rate limiting on all endpoints
- ✅ Zod validation on all inputs
- ✅ SQL injection prevention (prepared statements)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Multi-tenant data isolation
- ✅ Stripe webhook signature verification

## 📊 Subscription Plans

| Feature | Basic ($49/mo) | Pro ($149/mo) | Premium ($349/mo) |
|---------|----------------|---------------|-------------------|
| Max Members | 500 | 2,500 | 10,000 |
| QR Devices | 1 | 5 | Unlimited |
| Promotions | 3 active | 10 active | Unlimited |
| Push Notifications | ❌ | ✅ | ✅ |
| SMS Campaigns | ❌ | ❌ | ✅ |
| Analytics | Basic | Advanced | BI Suite |
| POS Integration | ❌ | ✅ | ✅ |
| Gamification | ❌ | ✅ | ✅ |
| Support | Email | Email + Chat | Priority + Manager |

## 🧪 Testing

Run tests:
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Coverage report
npm test -- --coverage
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For support, email support@clubnightlife.com or open an issue.

## 🙏 Acknowledgments

- Built with Next.js, Express, and PostgreSQL
- Payments powered by Stripe
- QR code generation with qrcode
- UI components styled with Tailwind CSS

---

**Made with ❤️ for nightclub owners and their members**
