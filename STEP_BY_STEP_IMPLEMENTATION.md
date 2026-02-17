# Step-by-Step Implementation Guide

This guide walks through the complete SPAD trading platform implementation across 5 steps.

## Prerequisites

- **Node.js**: v18+
- **PostgreSQL**: 14+ (or use Docker Compose)
- **npm**: v8+

## Setup Local Environment

### 1. Install Dependencies

```bash
# From workspace root
npm install

# From backend directory
cd apps/api
npm install
```

### 2. Setup PostgreSQL (Docker)

```bash
# Option A: Use Docker Compose (creates local PostgreSQL + Redis)
docker-compose up -d

# Option B: Use existing database
# Update .env with your DATABASE_URL
```

### 3. Configure Environment Variables

```bash
cd apps/api
cp .env.example .env

# Generate RS256 keys (required for JWT):
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Update .env with:
# - DATABASE_URL=postgresql://user:password@localhost:5432/spad_dev
# - DATABASE_URL_TEST=postgresql://user:password@localhost:5432/spad_test
# - JWT_PRIVATE_KEY=$(cat private.pem | base64)
# - JWT_PUBLIC_KEY=$(cat public.pem | base64)
```

## Implementation Steps

### Step 1: Database Setup (Weeks 1-2)

**Objective**: Define complete schema with TypeORM entities

**What was created**:
- 7 TypeORM entities (User, Account, Order, Position, LedgerEntry, Fee, Transfer)
- Database configuration with connection pooling
- Test infrastructure with global setup hooks
- Mock fixtures for testing

**Run the tests**:

```bash
npm run test:migrations

# Or run specific test file:
npm test -- tests/integration/migrations.integration.test.ts
```

**What the tests verify**:
- ✅ User registration with KYC fields
- ✅ Account creation and balance tracking
- ✅ Order creation with options/futures metadata
- ✅ Double-entry ledger entries
- ✅ Fee tracking with partner cost breakdown
- ✅ ACH transfer entities
- ✅ Relationships and foreign key constraints

**Expected output**:
```
PASS  tests/integration/migrations.integration.test.ts
  Database Migrations and Schema
    Step 1.1: Users table creation
      ✓ should create a user with KYC fields (25ms)
      ✓ should prevent duplicate emails (18ms)
      ✓ should track KYC status changes (12ms)
    Step 1.2: Accounts table creation
      ✓ should create an account for a user (15ms)
      ✓ should calculate available balance (10ms)
      ...
    (40+ test cases total)

Test Suites: 1 passed, 1 total
Tests:       40 passed, 40 total
Duration:    2.3s
```

---

### Step 2: Authentication (Weeks 3-4)

**Objective**: User registration, login, JWT, 2FA (TOTP)

**What was created**:
- AuthService with bcrypt password hashing
- JWT utilities (sign, verify, refresh tokens)
- User registration/login endpoints
- 2FA setup with TOTP (Google Authenticator compatible)
- Password reset flow

**Run the tests**:

```bash
npm run test:auth

# Or run specific test file:
npm test -- tests/integration/auth.integration.test.ts
```

**What the tests verify**:
- ✅ User registration with password validation
- ✅ Bcrypt password hashing
- ✅ Email uniqueness constraint
- ✅ Login with email/password
- ✅ Token generation (access + refresh)
- ✅ Token verification and refresh
- ✅ 2FA setup and confirmation with TOTP
- ✅ Login with 2FA requirement
- ✅ Password change and reset flows

**Expected output**:
```
PASS  tests/integration/auth.integration.test.ts
  Step 2: Authentication Service
    Step 2.1: User Registration
      ✓ should register a new user with valid credentials (45ms)
      ✓ should hash password with bcrypt (50ms)
      ✓ should reject weak passwords (15ms)
      ✓ should prevent duplicate email registration (30ms)
      ✓ should return access and refresh tokens on registration (40ms)
    Step 2.2: User Login
      ✓ should login with valid credentials (35ms)
      ✓ should reject invalid email (20ms)
      ...
    (25+ test cases total)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Duration:    3.1s
```

**Try it manually**:

```bash
# Start development server
npm run dev

# In another terminal:
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "SecurePassword123!",
    "givenName": "John",
    "familyName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "SecurePassword123!"
  }'
```

---

### Step 3: Order Submission & Broker Integration (Weeks 5-6)

**Objective**: Submit orders, integrate with partner broker, handle fills

**What was created**:
- OrderService for order lifecycle management
- BrokerService (wrapper around partner broker API)
- Mock broker mode for local testing
- Order submission, fill, and cancellation logic
- Fee calculation on order fill
- Position tracking (long/short)

**Run the tests**:

```bash
npm run test:orders

# Or run specific test file:
npm test -- tests/integration/orders.integration.test.ts
```

**What the tests verify**:
- ✅ Submit BUY order with balance validation
- ✅ Submit SELL order with position validation
- ✅ Reserve balance for pending orders
- ✅ Send orders to broker
- ✅ Fill orders and create/update positions
- ✅ Calculate fees (0.5% customer, 0.2% partner, 0.3% ours)
- ✅ Post ledger entries for order execution
- ✅ Adjust account cash and equity on fill
- ✅ Cancel pending orders
- ✅ Release reserved balance on cancel
- ✅ Retrieve order history and open orders

**Expected output**:
```
PASS  tests/integration/orders.integration.test.ts
  Step 3: Order Service and Broker Integration
    Step 3.1: Submit Buy Order
      ✓ should submit a buy order with LIMIT type (30ms)
      ✓ should reserve balance for BUY orders (25ms)
      ✓ should reject BUY order if insufficient balance (20ms)
      ✓ should create fee record on order submission (28ms)
      ✓ should send order to broker (22ms)
    Step 3.2: Submit Sell Order
      ✓ should submit a sell order (28ms)
      ✓ should reject SELL order if insufficient position (18ms)
      ...
    (35+ test cases total)

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Duration:    3.8s
```

**Key data flow**:
1. Customer submits BUY order (SPY, 100 qty @ $450)
2. OrderService validates balance ($45,000 available)
3. Reserve $45,000 in account.reservedBalance
4. BrokerService sends to partner broker (mock: generates MOCK_xxx123_12345)
5. Broker webhook or polling detects fill
6. OrderService.fillOrder() called
7. Calculate fee: $45,000 × 0.003 = $135 (our margin)
8. Create Position (SPY, qty 100, avg price $450)
9. Post LedgerEntry (ORDER_EXECUTION, -$45,000)
10. Debit account: cash becomes $55,000, reserved $0, equity $100,000

---

### Step 4: Ledger & Fee Services (Weeks 7-8)

**Objective**: Double-entry accounting, fee tracking, reconciliation

**What was created**:
- LedgerService for double-entry posting
- Fee calculations and tracking
- Reconciliation workflow
- Account statements and trial balance (audit)

**Run the tests**:

```bash
npm run test:ledger

# Or run specific test file:
npm test -- tests/integration/ledger.integration.test.ts
```

**What the tests verify**:
- ✅ Post DEPOSIT/WITHDRAWAL entries
- ✅ Update account balance on entry
- ✅ Link entries to orders (audit trail)
- ✅ Query entries with pagination
- ✅ Filter by entry type
- ✅ Calculate balance at date
- ✅ Generate trial balance (debits = credits)
- ✅ Fee calculation (0.5% customer, 0.2% partner, 0.3% ours)
- ✅ Record fees on order execution
- ✅ Reconcile entries with external records
- ✅ Generate account statements
- ✅ Audit trail for orders

**Expected output**:
```
PASS  tests/integration/ledger.integration.test.ts
  Step 4: Ledger and Fee Services
    Step 4.1: Double-Entry Ledger Posting
      ✓ should post a deposit entry (22ms)
      ✓ should update account balance on deposit (25ms)
      ✓ should post a withdrawal entry (18ms)
      ...
    Step 4.2: Ledger Querying
      ✓ should retrieve all entries for account (20ms)
      ✓ should support pagination (18ms)
      ...
    (30+ test cases total)

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Duration:    2.9s
```

**Revenue model verification**:
- Customer pays: 0.5% on notional value
- Partner costs: 0.2% on notional value
- We keep: 0.3% on notional value

Example: $100,000 order
- Customer fee: $500
- Partner cost: $200
- Our revenue: $300
- Our margin %: 60% of collected fee

---

### Step 5: Admin Dashboard & Revenue Reporting (Weeks 9-10)

**Objective**: Platform analytics, revenue tracking, customer metrics

**What was created**:
- AdminService for platform-wide metrics
- Daily/monthly revenue calculations
- Customer ranking by volume
- Platform KPIs (ARPU, total volume, fill rate)
- Audit reports

**Run the tests**:

```bash
npm run test:admin

# Or run specific test file:
npm test -- tests/integration/admin.integration.test.ts
```

**What the tests verify**:
- ✅ Calculate daily revenue
- ✅ Verify revenue split (0.5% → customer fee, 0.2% → cost, 0.3% → us)
- ✅ Monthly revenue summary with ARPU
- ✅ Rank customers by trading volume
- ✅ Show customer metrics (volume, fees, avg order size)
- ✅ Calculate platform-wide KPIs
- ✅ Revenue vs cost analysis (margin %)
- ✅ Order statistics (fill rate, side volumes)
- ✅ Audit trails for compliance

**Expected output**:
```
PASS  tests/integration/admin.integration.test.ts
  Step 5: Admin Service and Revenue Dashboard
    Step 5.1: Daily Revenue Metrics
      ✓ should calculate daily revenue (35ms)
      ✓ should show correct revenue split (30ms)
    Step 5.2: Monthly Revenue Summary
      ✓ should calculate monthly revenue (40ms)
    Step 5.3: Top Customers Analytics
      ✓ should rank customers by trading volume (50ms)
      ✓ should show customer metrics (45ms)
    ...
    (20+ test cases total)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Duration:    3.5s
```

**Revenue target tracking**:
- Monthly revenue target: $500,000
- Revenue model: 0.3% of notional volume
- Volume needed: $500,000 ÷ 0.003 = **$166.67 Million**
- Assuming $8.33M/trading day: 20 days to hit target
- Requires ~$400k+ in orders per day at $450/contract

---

## Run All Tests

```bash
# Run all tests with coverage
npm run test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

**Expected summary**:
```
Jest Summary
============

Test Suites: 5 passed, 5 total
Tests:       150 passed, 150 total
Duration:    15-20s
Coverage:    ~75% (target: 70%)

Files covered:
  - src/services/AuthService.ts: 85%
  - src/services/OrderService.ts: 82%
  - src/services/LedgerService.ts: 88%
  - src/services/FeeService.ts: 90%
  - src/services/AdminService.ts: 80%
```

---

## Local Development Server

```bash
# Start development server (with hot reload)
npm run dev

# OR start production build
npm run build
npm start

# Server runs on http://localhost:3000
```

### Test API endpoints

```bash
# Health check
curl http://localhost:3000/health

# Access auth endpoints
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Database Migrations

Current implementation uses **TypeORM synchronize mode** (auto-sync on startup).

For production, convert to explicit migrations:

```bash
# Generate migration
npm run migration:generate -- -n AddUserTable

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
```

---

## Deployment Checklist

- [ ] All tests passing (npm run test)
- [ ] Coverage > 70% (npm run test:coverage)
- [ ] Linting passes (npm run lint)
- [ ] Built successfully (npm run build)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis cache configured
- [ ] Broker API keys configured (Persona, Evolve, Partner)
- [ ] TLS certificates configured
- [ ] Logging and monitoring setup
- [ ] Rate limiting configured
- [ ] CORS whitelist updated
- [ ] Security headers configured

---

## Architecture Review

### Request Flow (Example: User places order)

```
1. User (React UI) sends POST /orders with JWT token
2. AuthMiddleware verifies token
3. OrderController extracts orderId from token
4. OrderService.submitOrder() called
   - Validate account & balance
   - Create Order entity
   - Call BrokerService.submitOrder()
   - Post fee record
   - Reserve balance
5. Response sent: {orderId, status, fees}
6. Client waits for fill notification
7. Broker webhook → /orders/{orderId}/fill
8. OrderService.fillOrder() called
   - Update position
   - Debit account
   - Post ledger entries
9. Real-time notification sent to client (WebSocket)
10. Client UI updates with fill confirmation
```

### Data Integrity

- Decimal.js prevents floating-point errors
- Foreign key constraints prevent orphaned records
- Double-entry ledger ensures balance integrity
- Idempotency keys prevent duplicate orders
- Webhook signatures verify authenticity

---

## Troubleshooting

### Database connection error
```bash
# Check PostgreSQL is running
docker-compose ps

# Check connection string in .env
echo $DATABASE_URL

# Manually test connection
psql postgresql://user:password@localhost:5432/spad_dev
```

### JWT key error
```bash
# Regenerate keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Update .env
export JWT_PRIVATE_KEY=$(cat private.pem | base64 -w0)
export JWT_PUBLIC_KEY=$(cat public.pem | base64 -w0)
```

### Test timeout
```bash
# Increase Jest timeout
npm test -- --testTimeout=10000
```

---

## Next Steps

### Phase 2 (Weeks 11-12)
- [ ] React UI components (login, trading dashboard, orders)
- [ ] WebSocket real-time updates
- [ ] Order form validation
- [ ] P&L display

### Phase 3 (Weeks 13-14)
- [ ] Persona KYC webhook integration
- [ ] Evolve ACH banking integration
- [ ] Production AWS RDS deployment
- [ ] Load testing & optimization

### Phase 4 (Weeks 15+)
- [ ] Advanced analytics
- [ ] Risk management alerts
- [ ] Regulatory reporting
- [ ] Mobile app
