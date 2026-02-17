# SPAD MVP - Implementation Roadmap & Technical Decisions

## Executive Overview

**Platform**: Unregulated derivatives routed through partner broker  
**Timeline**: 3 months to launch  
**Team**: 2-3 engineers + 1 PM  
**Budget**: ~$70k (est. contractor/fixed costs for MVP)  
**Post-Launch**: $23.5k/month operating costs  

---

## Phase 1: Architecture & Setup (Weeks 1-2)

### 1.1 Backend Foundation
**Tech Stack**:
- **Runtime**: Node.js 20+ (or Python FastAPI, both fast to develop)
- **Framework**: Express.js + TypeScript (or Hapi)
- **Database**: PostgreSQL 15 (AWS RDS)
- **Auth**: JWT (RS256) + HttpOnly cookies
- **ORM**: TypeORM or Sequelize (parameterized queries for SQL injection prevention)

**Deliverables**:
- [ ] Initialize monorepo structure (or separate backend/frontend repos)
- [ ] Database created in RDS, schema deployed
- [ ] Basic auth endpoints working (register, login)
- [ ] JWT token generation & refresh flow tested
- [ ] Docker containerization for local dev

### 1.2 Frontend Foundation
**Tech Stack**:
- **Framework**: React 18+ + TypeScript
- **State**: TanStack Query (data fetching) + Zustand (client state)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix-based, accessible)
- **Forms**: React Hook Form + Zod validation

**Deliverables**:
- [ ] Login/register pages working
- [ ] Dashboard shell (empty, no data yet)
- [ ] Real JWT auth integration
- [ ] 2FA setup flow (Google Authenticator QR code)
- [ ] CORS properly configured

### 1.3 Integration Setup
**Persona KYC**:
- [ ] Create Persona account & sandbox environment
- [ ] Build KYC iFrame embed in React
- [ ] Test webhook signature verification
- [ ] Implement KYC status flow in DB

**Evolve Banking**:
- [ ] Set up Evolve developer account
- [ ] Test ACH transfer sandbox
- [ ] Build deposit/withdraw form
- [ ] Implement webhook handling for transfer status

**Partner Broker**:
- [ ] Set up sandbox API credentials
- [ ] Implement order submission flow
- [ ] Test order status webhook
- [ ] Build mock broker responses for testing

**Deliverables**:
- [ ] All 3 integrations in sandbox mode working
- [ ] Webhook receivers implemented & tested
- [ ] Error handling for API failures

---

## Phase 2: Core Trading (Weeks 3-6)

### 2.1 Account Management
**Features**:
- [ ] List accounts (dashboard)
- [ ] Account details endpoint
- [ ] Cash balance display
- [ ] Positions list with P&L
- [ ] Account statement (report)

**Database**:
- [ ] Accounts table fully populated
- [ ] Positions table inserted on order execution
- [ ] Ledger entries created for all account movements

**Deliverables**:
- [ ] Account dashboard fully functional
- [ ] Positions update in real-time (via polling or WebSocket)
- [ ] Historical P&L chart (Chart.js)

### 2.2 Trading Interface
**Features**:
- [ ] Order entry form (symbol, quantity, price, side, order type)
- [ ] Order validation (KYC check, buying power check)
- [ ] Submit order to partner broker
- [ ] Order confirmation & receipt
- [ ] Order list with status updates

**Database**:
- [ ] Orders table fully operational
- [ ] Partner order ID tracking
- [ ] Order status webhook handling

**Error Handling**:
- [ ] Insufficient funds → show required balance
- [ ] Symbol not found → suggest valid symbols
- [ ] Broker API error → queue order locally, retry later
- [ ] KYC not verified → explain steps

**Deliverables**:
- [ ] Trade 10+ test orders through sandbox
- [ ] Order fills reflected in positions
- [ ] Ledger entries created for each fill

### 2.3 Fee Calculation & Ledger
**Features**:
- [ ] Calculate fees on order execution (0.5% for now)
- [ ] Create ledger entries (double-entry)
- [ ] Track partner costs (0.2%)
- [ ] Revenue report (total fees - partner costs)

**Database**:
- [ ] Fees table populated on order fills
- [ ] Ledger entries with debit/credit accounts
- [ ] Revenue daily aggregation

**Deliverables**:
- [ ] Fee displayed pre-order
- [ ] Fee charged on fill
- [ ] Ledger shows debit to trading account, credit to fees (or cash reserve)
- [ ] Admin can see gross margin per trade

---

## Phase 3: Banking Integration (Weeks 5-7)

### 3.1 Deposit (ACH In)
**Features**:
- [ ] ACH form: routing number, account number, amount
- [ ] Bank account verification (manual or micro-deposits)
- [ ] Submit to Evolve API
- [ ] Polling for completion (webhook + polling for redundancy)
- [ ] Balance update on completion

**Database**:
- [ ] Transfers table for deposit + withdrawal tracking
- [ ] Status tracking: REQUESTED → PROCESSING → COMPLETED
- [ ] Ledger entry on completion (credit to cash_balance)

**Error Handling**:
- [ ] NSF (return ACH) → reverse transaction
- [ ] Invalid routing number → validation error
- [ ] Evolve API down → queue request, retry

**Deliverables**:
- [ ] Test deposit $1,000 to account
- [ ] Balance updates after 1-2 days
- [ ] Ledger shows deposit transaction

### 3.2 Withdrawal (ACH Out)
**Features**:
- [ ] Withdrawal form (amount only, use linked account)
- [ ] T+1 processing
- [ ] Status tracking

**Error Handling**:
- [ ] Insufficient funds → show max available
- [ ] Daily limit exceeded ($250k) → error
- [ ] Account status check (not closed, not restricted)

**Deliverables**:
- [ ] Test withdrawal $500
- [ ] ACH initiated & tracked

### 3.3 Banking Reconciliation
**Manual Process** (Automated in future):
- [ ] Daily: Compare our transfer records to Evolve API balance
- [ ] Weekly: Reconciliation report (match our ledger to Evolve)
- [ ] Document any discrepancies

**Deliverables**:
- [ ] Reconciliation script created
- [ ] First 2 weeks tested manually
- [ ] Process documented for ops team

---

## Phase 4: KYC & Compliance (Weeks 4-7, Parallel)

### 4.1 Persona KYC Flow
**Features**:
- [ ] On register: prompt for KYC (defer until they want to trade)
- [ ] iFrame integration (Persona's UI)
- [ ] Status tracking: PENDING → VERIFIED → REJECTED
- [ ] Document re-upload if rejected
- [ ] Webhook updates status in DB

**Database**:
- [ ] Users.kyc_status updated
- [ ] Users.kyc_data stores verified info
- [ ] Users.persona_inquiry_id for audit trail

**Error Handling**:
- [ ] Verification fails → explain reason, allow retry
- [ ] Webhook fails → manual review queue

**Deliverables**:
- [ ] 5+ test KYC flows through Persona sandbox
- [ ] Status updates reflected in dashboard
- [ ] Verified users can only trade

### 4.2 Compliance Rules
- [ ] Trading only if KYC_STATUS = 'VERIFIED'
- [ ] Restriction on account creation per email (1/hour)
- [ ] Login attempts: 5 fails → lock 15 min
- [ ] Monitoring: Flag suspicious activity (logged to admin_logs)

**Deliverables**:
- [ ] All guards implemented in code
- [ ] Tests for each guard
- [ ] Admin can view compliance dashboard

### 4.3 Terms of Service & Disclosures
- [ ] Risk disclosure: High-risk derivatives, can lose all capital
- [ ] Partner broker disclosure: SPAD routes to [Partner Name]
- [ ] Fee disclosure: 0.5% per trade + ACH fees
- [ ] Conflict of interest: Partner broker earns on fills

**Deliverables**:
- [ ] ToS drafted (legal review recommended)
- [ ] Risk disclosure prominent on sign-up
- [ ] Acceptance checkbox required before trading

---

## Phase 5: Admin Panel & Reporting (Weeks 6-8)

### 5.1 Admin Dashboard
**Features**:
- [ ] Key metrics: # users, # verified, # active, AUM, daily revenue
- [ ] Broker connection status (last sync time, pending orders)
- [ ] Evolve connection status (pending transfers)
- [ ] Persona connection status (daily inquiries)
- [ ] Error log & alerts

**Database**:
- [ ] Admin users with ADMIN role
- [ ] Admin_logs table for audit trail

**Deliverables**:
- [ ] Dashboard deployed & tested
- [ ] Real data from first 50 test users

### 5.2 Revenue Reporting
**Features**:
- [ ] Daily revenue report (trades, volume, gross/net profit)
- [ ] Monthly rollup
- [ ] By-symbol breakdown
- [ ] Export to CSV

**Database**:
- [ ] Revenue_daily materialized view
- [ ] Queries for ad-hoc analysis

**Deliverables**:
- [ ] First month of revenue data complete
- [ ] Report exportable

### 5.3 User Management
**Features**:
- [ ] Search users by email
- [ ] View account status, KYC status, balances
- [ ] Suspend/unsuspend accounts (with reason)
- [ ] View order/transfer history
- [ ] Manual KYC approval (if Persona rejects but data is valid)

**Deliverables**:
- [ ] Admin can manage users
- [ ] All actions logged in admin_logs

---

## Phase 6: Testing & Launch Prep (Weeks 7-9)

### 6.1 Functional Testing
- [ ] Register → KYC → Deposit → Trade → Withdraw flow
- [ ] All error conditions tested
- [ ] Edge cases: min/max amounts, symbol not found, day trading rules (if any)
- [ ] Concurrent orders (ensure no race conditions)

**Deliverables**:
- [ ] Test plan created (50+ test cases)
- [ ] All tests passing
- [ ] UAT by internal team

### 6.2 Load Testing
- [ ] Simulate 100 concurrent users (basic load test)
- [ ] 10,000 orders/day (expected at month 6)
- [ ] Database connection pooling optimized
- [ ] Identify bottlenecks

**Deliverables**:
- [ ] Load test report
- [ ] Performance baseline documented

### 6.3 Security Testing
- [ ] Penetration test (limited scope, known team)
- [ ] Code review by 2+ engineers
- [ ] Verify HTTPS, JWT, rate limiting working
- [ ] Check for SQL injection, XSS vulnerabilities

**Deliverables**:
- [ ] Pen test report (critical findings fixed)
- [ ] Security checklist all green

### 6.4 Integration Testing
- [ ] Persona webhooks: test document rejection & retry
- [ ] Evolve webhooks: test ACH failure & reversal
- [ ] Broker webhooks: test partial fills & cancellations
- [ ] Reconciliation: daily sync verified

**Deliverables**:
- [ ] All integrations stable
- [ ] Failover scenarios tested

### 6.5 Operational Readiness
- [ ] Monitoring & alerting configured (Datadog/New Relic)
- [ ] On-call runbooks written
- [ ] Incident response plan reviewed
- [ ] Backup & disaster recovery tested
- [ ] Documentation complete (API docs, DB schema, deployment procedures)

**Deliverables**:
- [ ] Runbook for each critical service
- [ ] Team trained on operations
- [ ] DR drill completed

---

## Phase 7: Launch (Week 10+)

### 7.1 Pre-Launch
- [ ] Marketing copy & landing page
- [ ] Early access list (50-100 users)
- [ ] Closed beta (week 1-2)
- [ ] Public beta (week 3-4, if stable)

### 7.2 Launch Week
- [ ] Go-live monitoring 24/7
- [ ] Support team on standby
- [ ] Daily syncs for any issues
- [ ] Gradual user onboarding

### 7.3 Post-Launch
- [ ] Monitor performance metrics daily
- [ ] Customer feedback reviews
- [ ] Bug fixes prioritized
- [ ] Planned downtime for backups/maintenance

---

## Technology Decisions & Tradeoffs

### Backend Language: Node.js vs. Python
| Factor | Node.js | Python |
|--------|---------|--------|
| **Development Speed** | ✅ Faster | ⚠ Slower |
| **Type Safety** | ✅ TypeScript | ⚠ Type hints |
| **Performance** | ✅ Good | ⚠ Slower |
| **Team Familiarity** | ❓ (depends) | ❓ (depends) |
| **Ecosystem** | ✅ npm packages | ✅ pip packages |
| **Async Handling** | ✅ Native | ⚠ asyncio |

**Decision**: **Node.js + Express** for MVP speed.

---

### Database: PostgreSQL
**Why**:
- ✅ Strong data integrity (ACID)
- ✅ Great for financial data
- ✅ JSON support (for flexible fields like order metadata)
- ✅ Materialized views for reporting
- ✅ Great tooling (pgAdmin, Adminer)

**Alternatives Considered**:
- MongoDB: ❌ Not suitable for financial ledger (need ACID)
- MySQL: ✅ Also good, but PostgreSQL slightly better
- DynamoDB: ❌ Expensive for large datasets, no transactions

---

### Frontend: React (not Vue, Svelte)
**Why**:
- ✅ Largest ecosystem (most 3rd party integrations)
- ✅ Best job market (team hiring easier)
- ✅ TypeScript support excellent
- ✅ Great component libraries (shadcn/ui, Mantine)

**Decision**: React 18 + TailwindCSS + shadcn/ui.

---

### Hosting: AWS (not GCP, Azure)
**Why**:
- ✅ Largest regional availability
- ✅ RDS for managed PostgreSQL
- ✅ CloudFront CDN for React assets
- ✅ Secrets Manager for API keys
- ✅ CloudWatch for monitoring
- ✅ EC2 for containerized backend (or Lambda for serverless)

**For MVP**: EC2 + RDS + CloudFront, 2-3 instances in production.

---

### State Management: Zustand (not Redux)
**Why**:
- ✅ Minimal boilerplate (Redux is verbose)
- ✅ Easy to learn & fast to implement
- ✅ Small bundle size
- ✅ Works with React 18

---

### Payment Processing: Evolve (not Stripe)
**Why**:
- ✅ Evolve holds money for us (MSB license)
- ✅ ACH transfers built-in
- ✅ One API for banking
- ✅ Compliance + KYC handled by partner

**Stripe**: Only for subscription fees if added later (premium features).

---

### KYC Provider: Persona (not IDology, Socure)
**Why**:
- ✅ Great developer experience (easy iFrame embed)
- ✅ Good pricing at scale ($10-15/verification)
- ✅ Supports required verification types (identity + address)
- ✅ OFAC & sanctions screening built-in
- ✅ Webhook support

---

### Order Routing: Partner Broker (not Direct)
**Why**:
- ✅ No regulatory burden (they have the license)
- ✅ Faster to market (no broker-dealer registration, 6-12 months)
- ✅ Lower liability
- ✅ Proven clearing infrastructure
- ✅ Revenue via 0.3% spread is sustainable

**Risk**: Broker could cut off relationship. **Mitigation**: Diversify to 2+ brokers in future.

---

## Key Success Metrics

### Launch Phase (First 3 Months)
- **Users**: 100+ registered, 30+ verified (KYC passed)
- **Trading Volume**: $500k cumulative, trending toward $500k/month by month 6
- **Uptime**: 99.5%+ (measured daily)
- **Latency**: <500ms P95 order submission to broker
- **Errors**: <0.5% failed orders (user/system error)

### Revenue Phase (Months 4-6)
- **Monthly Revenue**: $1,500 (at target volume)
- **Customer Acquisition Cost**: <$250 (includes marketing, support)
- **Lifetime Value**: >$2,000 (assume 1 year active user)
- **Churn**: <5%/month

### Post-MVP (Months 7-12)
- **Break-Even**: Target $2M+/month volume (not MPV, but phase 2)
- **New Features**: Mobile app, algorithmic trading, education
- **Compliance**: SOC 2 Type I audit passed

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Partner broker API fails** | Medium | High | <li>Fallback queue (local retry)<li>Monitor broker status via health check<li>Plan broker switching (API compatibility) |
| **Evolve banking issue** | Low | High | <li>Daily reconciliation<li>Manual ACH if automated fails<li>Customer communication plan |
| **Security breach** | Low | Critical | <li>Regular penetration testing<li>Incident response plan<li>Customer notification process |
| **Regulatory shutdown** | Low | Critical | <li>Consult securities attorney<li>Partner compliance reviews<li>Maintain audit trail |
| **High user churn** | Medium | Medium | <li>Early customer interviews<li>Pricing optimization<li>Feature prioritization based on feedback |
| **Volume doesn't materialize** | Medium | Low | <li>Marketing strategy + growth hacking<li>Consider acquisition (not organic growth only)<li>Reduce fixed costs |

---

## Maintenance & Ops (Post-Launch)

### Daily
- [ ] Monitor error rates & latency
- [ ] Check for failed webhook deliveries
- [ ] Review suspicious activity logs
- [ ] Verify broker/Evolve connectivity

### Weekly
- [ ] Code review of any hot fixes
- [ ] Customer support tickets review
- [ ] Database backups verification
- [ ] Reconciliation (ours vs. broker vs. Evolve)

### Monthly
- [ ] Security log review
- [ ] Performance optimization
- [ ] Feature prioritization for next sprint
- [ ] Financial close & revenue reporting

### Quarterly
- [ ] Penetration testing (if security issues found)
- [ ] Vendor security reviews
- [ ] Team training updates
- [ ] Regulatory compliance check

---

## Documentation Required

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema & ERD
- [ ] Architecture diagrams
- [ ] Deployment procedures
- [ ] Incident response runbooks
- [ ] KYC/AML procedures
- [ ] Fee calculation methodology
- [ ] Customer Terms of Service
- [ ] Privacy Policy
- [ ] Risk Disclosure

---

## Summary

**Platform**: Unregulated derivatives routed through partner broker  
**Tech**: Node.js + React + PostgreSQL + AWS  
**Team**: 2-3 engineers  
**Timeline**: 3 months to MVP launch  
**Target**: $500k monthly trading volume, $1.5k monthly revenue by month 6  
**Profitability**: Requires $2M+/month volume (plan for phase 2 scaling)

All files created in `/workspaces/spad/`:
- ✅ ARCHITECTURE.md (high-level design)
- ✅ API_SPECIFICATION.md (complete REST API)
- ✅ DATABASE_SCHEMA.sql (PostgreSQL schema)
- ✅ FEE_MODEL.md (revenue model with examples)
- ✅ SECURITY_CHECKLIST.md (US-specific compliance)
- ✅ IMPLEMENTATION_ROADMAP.md (this document)

