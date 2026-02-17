# SPAD MVP - Developer Quick Reference

## Project Overview

**SPAD** = Derivatives trading platform, unregulated, routes orders to partner broker.

```
Web (React) → API (Node.js) → DB (PostgreSQL) → Partner Broker/Evolve/Persona
```

**Timeline**: 10 weeks to MVP. **Team**: 2-3 engineers. **Goal**: $500k/month trading volume.

---

## Quick Links

- [Architecture](ARCHITECTURE.md) - System design & data flows
- [API Spec](API_SPECIFICATION.md) - All REST endpoints with examples
- [Database Schema](DATABASE_SCHEMA.sql) - PostgreSQL DDL
- [Fee Model](FEE_MODEL.md) - Revenue calculations
- [Security Checklist](SECURITY_CHECKLIST.md) - Compliance requirements
- [Roadmap](IMPLEMENTATION_ROADMAP.md) - 10-week development plan
- [Executive Summary](EXECUTIVE_SUMMARY.md) - Business overview

---

## Key Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + TypeScript + TailwindCSS + shadcn/ui |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL 15 (AWS RDS) |
| **Auth** | JWT (RS256) + HttpOnly cookies |
| **Hosting** | AWS (EC2 + RDS + CloudFront) |
| **ORM** | TypeORM (Sequelize alt) |
| **State** | Zustand + TanStack Query |
| **Validation** | Zod |
| **Monitoring** | Datadog (or CloudWatch) |

---

## Database Schema Cheat Sheet

### Core Tables
```
users (id, email, kyc_status, persona_inquiry_id, kyc_data)
accounts (id, user_id, cash_balance, equity, broker_account_id)
orders (id, account_id, symbol, price, status, partner_order_id, fee_rate)
positions (id, account_id, symbol, quantity, current_price, unrealized_pl)
ledger_entries (id, account_id, debit_id, credit_id, amount, entry_type)
fees (id, order_id, gross_fee_amount, net_fee_amount, partner_cost)
transfers (id, account_id, amount, status, evolve_transfer_id, transfer_type)
```

### Key Relationships
```
users (1) ──→ (N) accounts
accounts (1) ──→ (N) orders
accounts (1) ──→ (N) positions
accounts (1) ──→ (N) ledger_entries
accounts (1) ──→ (N) transfers
orders (1) ──→ (N) fees
orders (1) ──→ (N) ledger_entries
```

---

## API Endpoints Summary

### Auth
```
POST   /auth/register       - Create account
POST   /auth/login          - Login
POST   /auth/refresh        - Refresh JWT
POST   /auth/2fa/setup      - Init TOTP
POST   /auth/2fa/verify     - Verify TOTP
```

### Accounts
```
GET    /accounts            - List accounts
GET    /accounts/{id}       - Get account details
POST   /accounts/{id}/deposits    - Initiate ACH in
POST   /accounts/{id}/withdrawals - Initiate ACH out
GET    /accounts/{id}/transfers   - List transfers
```

### Trading
```
GET    /accounts/{id}/orders      - List orders
POST   /accounts/{id}/orders      - Submit order
GET    /accounts/{id}/orders/{oid}- Get order details
POST   /accounts/{id}/orders/{oid}/cancel - Cancel order
GET    /accounts/{id}/positions   - List positions
```

### KYC
```
GET    /kyc/status          - Get KYC status
POST   /kyc/start           - Start KYC flow (returns iFrame token)
POST   /kyc/webhook         - Persona webhook (inbound)
```

### Admin
```
GET    /admin/dashboard     - Dashboard summary
GET    /admin/revenue?period=monthly - Revenue report
```

---

## Fee Calculation

### Formula
```
Order Notional Value = Quantity × Price
Customer Fee = Notional × 0.5%
Partner Cost = Notional × 0.2%
Our Revenue = Customer Fee - Partner Cost = Notional × 0.3%
```

### Example
```
Buy 100 shares of SPY at $450
Notional = 100 × $450 = $45,000
Customer Fee = $45,000 × 0.5% = $225
Partner Cost = $45,000 × 0.2% = $90
Our Revenue = $225 - $90 = $135 ✓
```

---

## Integration Checklist

### Persona (KYC)
- [ ] Embed iFrame in React component
- [ ] Verify webhook signature: `HMAC-SHA256(body, webhook_secret)`
- [ ] Update `users.kyc_status` on webhook
- [ ] Store `users.kyc_data` (encrypted)
- [ ] Block trading if `kyc_status != 'VERIFIED'`

### Evolve (Banking)
- [ ] Implement ACH form (routing, account number)
- [ ] POST to Evolve API to initiate transfer
- [ ] Store in `transfers` table with `evolve_transfer_id`
- [ ] Verify webhook signature (same as Persona)
- [ ] Update transfer status on webhook
- [ ] Create ledger entry on completion
- [ ] Daily reconciliation: ours vs. Evolve balance

### Partner Broker
- [ ] POST order to broker API (include idempotency_key)
- [ ] Store `partner_order_id` in `orders` table
- [ ] Verify broker webhook signature
- [ ] Create ledger entry on fill
- [ ] Create position entry on fill
- [ ] Create fee entry on fill
- [ ] Daily reconciliation: our orders vs. broker orders

---

## Security Essentials

### Must-Have
- ✅ TLS 1.3 for all HTTPS
- ✅ JWT RS256 (not HS256)
- ✅ Parameterized queries (ORM)
- ✅ Input validation (Zod)
- ✅ Rate limiting (Redis)
- ✅ CORS restrict to own domain
- ✅ HSTS + CSP headers
- ✅ HttpOnly + Secure cookies for refresh tokens
- ✅ 2FA (TOTP) for users
- ✅ Webhook signature verification (HMAC)
- ✅ IP whitelisting for partner APIs

### Database
- ✅ Encryption at rest (pgcrypto or RDS native)
- ✅ Encrypt sensitive fields: `kyc_data`, `routing_number`, `account_number`
- ✅ No cleartext passwords (bcrypt hash)
- ✅ Immutable audit logs
- ✅ 5+ year retention (SEC Rule 17a-4)

### Error Handling
- ✅ Generic error messages to client (no SQL/stack traces)
- ✅ Return 404 for non-existent resources (prevent enumeration)
- ✅ Return 403 for forbidden (not 401)
- ✅ Log detailed errors server-side (with request_id)

---

## Deployment Checklist

### Pre-Production
- [ ] Environment variables in Secrets Manager
- [ ] Database backup routine (daily)
- [ ] Database read replica (for load balancing)
- [ ] CDN for React assets (CloudFront)
- [ ] SSL certificate (Let's Encrypt)
- [ ] DNS configured
- [ ] Monitoring alerts set up
- [ ] On-call runbooks written
- [ ] Disaster recovery plan tested

### Go-Live
- [ ] All tests passing
- [ ] Manual QA on all critical flows
- [ ] Pen test completed (basic)
- [ ] Monitoring dashboard active
- [ ] On-call engineer available 24/7
- [ ] Customer support templates ready
- [ ] Status page deployed
- [ ] Incident response team briefed

---

## Common Gotchas

### 1. Idempotency
❌ **Wrong**: User clicks "submit order" twice → 2 orders created  
✅ **Right**: Include `idempotency_key` (UUID) in request; deduplicate on backend

### 2. Double-Entry Ledger
❌ **Wrong**: Debit trading account, forget to credit fees account  
✅ **Right**: Every ledger entry has debit + credit accounts

### 3. Fee Timing
❌ **Wrong**: Charge fee when order submitted, but order might not fill  
✅ **Right**: Charge fee only when order filled (on partner webhook)

### 4. Race Conditions
❌ **Wrong**: Check balance, then submit order (race: concurrent orders)  
✅ **Right**: In DB transaction: reserve balance, submit order, release reserve

### 5. KYC Enforcement
❌ **Wrong**: Only check KYC on login flow  
✅ **Right**: Enforce in order submission endpoint too

### 6. Webhook Failures
❌ **Wrong**: Process webhook, then delete from queue  
✅ **Right**: Process first, then mark processed. Retry on error for 7 days.

### 7. Currency
❌ **Wrong**: Store amounts as float (0.1 + 0.2 != 0.3)  
✅ **Right**: Store amounts as DECIMAL(15, 2) in database

---

## Testing Strategy

### Unit Tests
- Utility functions (fee calculation, validation)
- Database query builders
- JWT encoding/decoding

### Integration Tests
- Auth flow (register → login → 2FA)
- Order flow (submit → fill → ledger)
- ACH flow (initiate → webhook → balance update)
- KYC flow (start → complete → verify)

### End-to-End Tests
- Full user journey (register → KYC → deposit → trade → withdraw)
- Error conditions (insufficient funds, invalid symbol, KYC not verified)
- Partner broker scenarios (order fill, partial fill, rejection)

### Load Tests
- 100 concurrent users
- 10,000 orders/day
- Identify bottlenecks

---

## Monitoring & Alerts

### Critical Metrics
- API error rate (>1%)
- Order fill latency (>1 second P95)
- Database connection pool exhaustion
- Broker API unavailable
- Evolve API unavailable
- Webhook failures (3+ consecutive)
- Successful orders < 95%

### Logs to Query
```bash
# Failed orders
SELECT * FROM orders WHERE status = 'REJECTED' AND created_at > NOW() - INTERVAL '1 hour';

# Webhook failures
SELECT * FROM admin_logs WHERE action LIKE '%webhook%' AND created_at > NOW() - INTERVAL '1 hour';

# KYC rejections
SELECT COUNT(*) FROM users WHERE kyc_status = 'REJECTED' AND updated_at > NOW() - INTERVAL '24 hours';

# High-value trades
SELECT * FROM orders WHERE (quantity * price) > 100000 AND created_at > NOW() - INTERVAL '1 hour';
```

---

## Common Commands

### Database
```bash
# Deploy schema
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f DATABASE_SCHEMA.sql

# Backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%s).sql

# Connect
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### Docker
```bash
# Build
docker build -t spad-api .

# Run locally
docker run -p 3000:3000 spad-api

# Deploy to ECR
aws ecr get-login-password --region us-east-1 | docker login ...
docker tag spad-api:latest $ECR_REPO/spad-api:latest
docker push $ECR_REPO/spad-api:latest
```

### Environment Variables
```bash
# .env
DATABASE_URL=postgresql://user:pass@host:5432/spad
JWT_PRIVATE_KEY=<RSA_PRIVATE_KEY_BASE64>
JWT_PUBLIC_KEY=<RSA_PUBLIC_KEY_BASE64>
PERSONA_API_KEY=<key>
PERSONA_WEBHOOK_SECRET=<secret>
EVOLVE_API_KEY=<key>
EVOLVE_WEBHOOK_SECRET=<secret>
BROKER_API_KEY=<key>
BROKER_WEBHOOK_SECRET=<secret>
AWS_SECRET_MANAGER_ARN=<arn>
```

---

## Design Principles

1. **Security First**: Never compromise on auth, encryption, input validation
2. **Simplicity**: No premature optimization. Build for correctness first.
3. **Compliance**: Every ledger entry logged, every user action audited
4. **Transparency**: Customer sees all fees before order submission
5. **Partner Decoupling**: Switch brokers/banks without code changes (API abstraction)
6. **Test Coverage**: Aim for 80%+ on critical paths (auth, trading, ledger)
7. **Observability**: Log everything, make it queryable for debugging & compliance

---

## When You're Stuck

1. **API error?** → Check webhook signature, rate limits, mTLS cert
2. **Order not submitted?** → Check KYC status, buying power, reserved balance
3. **Balance doesn't match?** → Ledger audit (debit/credit), reconcile with broker
4. **Latency spike?** → Check DB query times, API timeouts, broker response times
5. **User lockout?** → Check 2FA backup codes, password reset flow
6. **Compliance issue?** → Check audit logs, KYC data retention, fee calculations

---

## Release Checklist

### Before Each Release
- [ ] All tests passing
- [ ] Code reviewed (2+ approvals)
- [ ] Database migrations tested on staging
- [ ] API endpoints tested (Postman/manual)
- [ ] Partner integrations verified
- [ ] Security fixes included (if any)
- [ ] Monitoring alerts updated
- [ ] CHANGELOG updated
- [ ] Version bumped (semantic versioning)

### After Deployment
- [ ] Monitor error logs (first 30 min)
- [ ] Check key metrics (latency, error rate, throughput)
- [ ] Verify webhook deliveries
- [ ] Sample test on live (if not automated)
- [ ] Post deployment slack message with version + changes

---

## Useful Resources

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [OAuth 2.0](https://oauth.net/2/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SEC Rules](https://www.sec.gov/rules/)
- [FINRA Rules](https://www.finra.org/rules-guidance/)

---

**Last Updated**: 2026-02-17  
**Maintained By**: Engineering Team  
**Questions?**: Check ARCHITECTURE.md or pair with senior engineer

