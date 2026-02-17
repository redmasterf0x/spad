# SPAD MVP - Security & Compliance Checklist

## 1. AUTHENTICATION & IDENTITY

### 1.1 User Registration & Password Security
- [ ] **Password Requirements**: Min 12 chars, uppercase, lowercase, number, special char
- [ ] **Password Storage**: bcrypt with salt rounds ≥ 12 (NIST SP 800-132)
- [ ] **Password Reset Flow**: 
  - [ ] Email link (10-min expiry)
  - [ ] Rate limit: 5 attempts/hour per email
  - [ ] Old passwords hashed separately (prevent reuse of last 3)
- [ ] **No Cleartext Storage**: Never log, store, or transmit passwords in plain text
- [ ] **Session Timeout**: 30 minutes of inactivity → re-authentication required
- [ ] **Concurrent Sessions**: Max 3 concurrent sessions per user (kick off oldest)

### 1.2 Multi-Factor Authentication (2FA)
- [ ] **TOTP Implementation**: Google Authenticator, Authy compatible
- [ ] **Backup Codes**: Generate 10 backup codes, stored hashed, used once only
- [ ] **2FA Enforcement**: Required if account balance > $10,000 (can be disabled by user)
- [ ] **Recovery**: Out-of-band verification (email link) if 2FA device lost
- [ ] **2FA Rate Limiting**: Max 5 failed attempts, 15-min lockout

### 1.3 JWT & Session Tokens
- [ ] **Token Algorithm**: RS256 (RSA, not HS256/symmetric)
- [ ] **Token Expiry**: 1 hour access token, 7 day refresh token
- [ ] **Token Signature Verification**: Every request validates
- [ ] **Refresh Token Storage**: HttpOnly, Secure, SameSite=Strict cookies (not localStorage)
- [ ] **Token Revocation**: Logout invalidates refresh token (stored in Redis blacklist)
- [ ] **Token Claims**: Include user_id, email, kyc_status, roles, issued_at, not_used_before

### 1.4 Email Verification
- [ ] **Email Confirmation on Register**: 24-hour link, 1-click verification
- [ ] **Email Change**: Re-verify new email before activation
- [ ] **Bounce Handling**: Automatically suspend account if 5 consecutive bounces

---

## 2. AUTHORIZATION & ACCESS CONTROL

### 2.1 Role-Based Access Control (RBAC)
- [ ] **Roles Implemented**:
  - [ ] `USER` (default customer)
  - [ ] `ADMIN` (internal operations & compliance)
  - [ ] `SUPPORT` (limited user support access)
  - [ ] `TRADER` (future: algorithmic access)
- [ ] **Principle of Least Privilege**: Users get minimum required roles
- [ ] **Admin Role Restrictions**:
  - [ ] Can only be assigned via manual database change
  - [ ] Requires approval from 2+ directors
  - [ ] All admin actions logged in `admin_logs` table
  - [ ] Can suspend user accounts, but cannot modify transactions

### 2.2 Endpoint Authorization
- [ ] **Unprotected Endpoints**: Only `/auth/*` and `/health` allowed without token
- [ ] **Protected Endpoints**: All `/accounts/*`, `/orders/*`, `trading/*` require JWT
- [ ] **Account Isolation**: Users can only access their own accounts
  - [ ] Enforce via: `WHERE accounts.user_id = current_user.id`
  - [ ] Prevent account_id enumeration (return 404 for non-existent)
- [ ] **Rate Limiting by Role**:
  - [ ] User: 30 req/min trading, 100 req/min general
  - [ ] Admin: 20 req/min (track for auditing)

### 2.3 IP Whitelisting (Critical Endpoints)
- [ ] **Persona Webhooks**: IP whitelist Persona's servers only
- [ ] **Partner Broker Webhooks**: IP whitelist partner's IP ranges
- [ ] **Evolve Webhooks**: IP whitelist Evolve's IP ranges
- [ ] **Signature Verification**: All webhooks also signed with HMAC-SHA256

---

## 3. DATA PROTECTION & ENCRYPTION

### 3.1 Encryption in Transit
- [ ] **HTTPS Enforced**: 
  - [ ] TLS 1.3 minimum
  - [ ] Disable SSLv3, TLS 1.0, 1.1
  - [ ] TLS_ECDHE_RSA* ciphersuites only (forward secrecy)
- [ ] **HSTS Header**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] **Certificate**: 
  - [ ] Valid domain certificate (not self-signed in prod)
  - [ ] Auto-renewal via Let's Encrypt
  - [ ] Certificate pinning for API clients (future)
- [ ] **mTLS for Partner APIs**: 
  - [ ] Server cert + client cert mutual authentication
  - [ ] Partner broker, Persona, Evolve all support mTLS

### 3.2 Encryption at Rest
- [ ] **Database Encryption**: PostgreSQL native encryption (pgcrypto) or AWS RDS encryption
- [ ] **Sensitive Fields Encrypted**:
  - [ ] `users.kyc_data` (Persona responses)
  - [ ] `transfers.routing_number`, `account_number` (PII/bank details)
  - [ ] `users.password_hash` (salted already, but encrypted key at rest)
- [ ] **Encryption Keys**:
  - [ ] Stored in AWS Secrets Manager
  - [ ] Rotated ≥ annually
  - [ ] Different key per environment (dev/staging/prod)
- [ ] **Backup Encryption**: All database backups encrypted

### 3.3 PII Minimization
- [ ] **Collect Only Necessary Data**:
  - [ ] Name, email, DOB, address (from Persona KYC)
  - [ ] Routing number, account number (during ACH setup)
  - [ ] Do NOT collect SSN (Persona handles it, we get last 4 only)
- [ ] **Data Retention Policy**:
  - [ ] User data: Keep 5+ years (for SEC recordkeeping)
  - [ ] Deleted accounts: Anonymize after 30 days
  - [ ] PII in logs: Rotate logs after 90 days (keep hashed user_id only)

---

## 4. API SECURITY

### 4.1 Input Validation
- [ ] **Type Validation**: All inputs validated against schema
  - [ ] Use JSON-Schema or Joi validation library
  - [ ] Reject unknown fields (whitelist approach)
- [ ] **Format Validation**:
  - [ ] Email: RFC 5322 regex
  - [ ] Amounts: Decimal, 2 places, max 15 integer digits
  - [ ] Symbol: 1-20 uppercase alphanumeric (SPY, SPY_C_450)
  - [ ] Quantity: Positive decimal, max contracts/shares allowed
- [ ] **Length Limits**:
  - [ ] Email: max 255 chars
  - [ ] Username/name: max 100 chars
  - [ ] Order notes: max 1000 chars
- [ ] **SQL Injection Prevention**:
  - [ ] Use parameterized queries (prepared statements)
  - [ ] ORM (TypeORM, Sequelize) by default
  - [ ] No string concatenation for queries
- [ ] **XSS Prevention**:
  - [ ] Sanitize all user-supplied text before display
  - [ ] Use templating engines that auto-escape
  - [ ] CSP headers: `Content-Security-Policy: default-src 'self'; script-src 'self'`

### 4.2 Rate Limiting & DDoS Protection
- [ ] **Per-User Rate Limits**:
  - [ ] Login: 5 attempts/min per email
  - [ ] Register: 1 account/hour per IP, 3 per day
  - [ ] Trading: 30 orders/min per user
  - [ ] Transfers: 5 requests/hour per user
- [ ] **IP-based Rate Limits**:
  - [ ] 1000 requests/min per IP
  - [ ] Block after 2000 requests/min (DDoS)
- [ ] **Implementation**: Redis-backed rate limiter (key = user_id + endpoint)
- [ ] **CloudFlare/WAF**: Frontend protection for DDoS, bots, SQL injection

### 4.3 CORS Configuration
- [ ] **Allowed Origins**: Only `https://spad.io`, `https://app.spad.io` (no *)
- [ ] **Allowed Methods**: GET, POST, PUT, DELETE only
- [ ] **Allowed Headers**: Authorization, Content-Type only
- [ ] **Credentials**: `credentials: include` (send cookies cross-origin)
- [ ] **Preflight Caching**: `max-age=3600`

### 4.4 Error Handling
- [ ] **No Sensitive Info in Errors**:
  - [ ] ❌ "User john@example.com not found" (user enumeration)
  - [ ] ✅ "Invalid credentials"
  - [ ] ❌ "Database connection failed" (exposes stack)
  - [ ] ✅ "Internal server error, request ID: req_12345"
- [ ] **Generic Error Messages**: Use request_id for support debugging
- [ ] **Stack Traces**: Only log to server logs, never return to client
- [ ] **404 vs 403**: Return 404 for forbidden resources (don't leak existence)

---

## 5. PARTNER INTEGRATIONS SECURITY

### 5.1 Persona KYC Integration
- [ ] **Webhook Signature Verification**:
  - [ ] Persona sends `X-Persona-Signature` header with HMAC-SHA256
  - [ ] We verify: `HMAC-SHA256(webhook_body, persona_webhook_secret) == signature`
  - [ ] Reject if invalid
- [ ] **IP Whitelisting**: Only accept webhooks from Persona IPs
- [ ] **Encryption**:
  - [ ] KYC data from Persona stored encrypted in DB
  - [ ] Never log personal data (SSN, full name) in plain text
  - [ ] Logs: "KYC verification completed for user_id X" only
- [ ] **Data Minimization**:
  - [ ] We request only: name, DOB, address (identity verification)
  - [ ] We do NOT request: SSN, biometric data, employment info
  - [ ] Store only: encrypted name/DOB/address + Persona inquiry_id

### 5.2 Partner Broker API Integration
- [ ] **Authentication**:
  - [ ] API key stored in AWS Secrets Manager
  - [ ] Rotated every 90 days
  - [ ] mTLS certificate for all connections
- [ ] **Order Submission**:
  - [ ] Sign order with HMAC before sending
  - [ ] Include idempotency_key (UUID) for replay protection
  - [ ] Timeout: 30 seconds, retry up to 3x with exponential backoff
- [ ] **Order Status Webhooks**:
  - [ ] Verify signature before processing
  - [ ] Log all order fills to ledger immediately
  - [ ] Reconciliation: Daily check broker account vs. our records
- [ ] **Error Handling**:
  - [ ] If broker API unreachable, queue orders locally
  - [ ] Retry up to 7 days, then reject with user notification
  - [ ] Partial fills handled: split ledger entries for filled qty

### 5.3 Evolve Banking Integration
- [ ] **Connection**:
  - [ ] mTLS certificate (mutual authentication)
  - [ ] REST API key rotated quarterly
- [ ] **ACH Initiation**:
  - [ ] Bank account verified with micro-deposits (not MVP, use manual verification)
  - [ ] Daily limit: $250k per account (can increase post-MVP)
  - [ ] Transaction limit: $25k per transfer
- [ ] **Webhook Status Updates**:
  - [ ] Verify HMAC signature on all ACH webhooks
  - [ ] Status: REQUESTED → PROCESSING → COMPLETED/FAILED
  - [ ] Support returns: Reverse ACH automatically if customer disputes
- [ ] **Funds Holding**:
  - [ ] Funds at Evolve (bank) + Partner Broker (clearing)
  - [ ] We maintain: Transactional DB only (no custody)
  - [ ] Daily reconciliation with Evolve balance

---

## 6. TRANSACTION SECURITY

### 6.1 Order Execution
- [ ] **Pre-Trade Checks**:
  - [ ] KYC status verified (VERIFIED only, not PENDING/REJECTED)
  - [ ] Account status: ACTIVE (not CLOSED/SUSPENDED)
  - [ ] Sufficient buying power: cash_balance ≥ notional + fees
  - [ ] Symbol tradeable: in our supported list
  - [ ] Order quantity within limits (min: 1 contract, max: 1000 per order)
- [ ] **Order Atomicity**:
  - [ ] Reserve cash, submit to broker, store in DB (all-or-nothing)
  - [ ] Use database transaction: BEGIN → insert order → release reserve → COMMIT
  - [ ] If broker API fails, rollback and retry
- [ ] **Fee Calculation**:
  - [ ] Double-check fee calculation before charging
  - [ ] Store calculation in `fees` table: amount, rate, category
  - [ ] Ledger entry: debit trading_account, credit fees_account

### 6.2 Margin & Risk Limits (All Disabled in MVP)
- [ ] **No Margin Trading**: margin_available = 0 for all accounts
- [ ] **Daily Loss Limit**: None (customer can lose entire balance, disclosed in ToS)
- [ ] **Position Limits**: No position size restrictions (customer responsibility)
- [ ] **Buying Power Check**: cash_balance only (no margin component)

### 6.3 Conflict of Interest
- [ ] **No Proprietary Trading**: SPAD doesn't trade accounts (only custodial routing)
- [ ] **No Order Flow Payment**: Partner broker has no incentive to prioritize orders
- [ ] **Disclosure**: Terms of Service discloses partner broker's order execution

---

## 7. DETECTION & MONITORING

### 7.1 Fraud Detection
- [ ] **Suspicious Activity Monitoring**:
  - [ ] Rapid balance drainage (>80% in 1 day, investigate)
  - [ ] Many failed login attempts (auto-suspend after 5/min)
  - [ ] New device login: email confirmation required
  - [ ] Large withdrawal: Email confirmation + SMS verification
- [ ] **AML (Anti-Money Laundering)**:
  - [ ] Persona handles initial KYC screening against OFAC list
  - [ ] Monitor for: structuring deposits ($9,999 pattern), rapid roundtrip deposits/withdrawals
  - [ ] If detected: flag for manual review, potentially close account
- [ ] **Unusual Trading**:
  - [ ] 100+ orders in 1 day (likely automated/testing, warn user)
  - [ ] Orders cancelled 95% of the time (market manipulation detection?)
  - [ ] Alert internal team, but no auto-ban

### 7.2 Logging & Auditing
- [ ] **All State Changes Logged**:
  - [ ] User registration, login, logout, 2FA enable/disable
  - [ ] KYC status changes (PENDING → VERIFIED → REJECTED)
  - [ ] Account creation, suspension, closure
  - [ ] Order submission, fill, cancellation
  - [ ] Fee charging, transfer initiation
  - [ ] Admin actions (user suspension, fee adjustments)
- [ ] **Log Format**: Structured JSON with:
  - [ ] timestamp, user_id, endpoint, action, object_id, old_value, new_value, ip_address, user_agent
- [ ] **Log Retention**:
  - [ ] Application logs: 90 days (AWS CloudWatch)
  - [ ] Audit logs (ledger, admin_logs): 7 years (SEC requirement)
  - [ ] API request logs: 30 days (performance troubleshooting)
- [ ] **Log Security**:
  - [ ] No passwords, API keys, PII in logs
  - [ ] Logs encrypted at rest & in transit
  - [ ] Immutable logs (append-only, no deletion)

### 7.3 Real-Time Alerts
- [ ] **Set up Datadog/PagerDuty for**:
  - [ ] Database connection failures
  - [ ] High API latency (>1000ms)
  - [ ] High error rate (>1% 5xx responses)
  - [ ] Partner broker API unreachable (3 failures in a row)
  - [ ] Evolve webhook failures (3 consecutive)
  - [ ] Sudden traffic spike (>2x normal)
  - [ ] Unauthorized access attempts (brute force)
- [ ] **On-Call Rotation**: 24/7 coverage for critical alerts

---

## 8. REGULATORY COMPLIANCE (US-SPECIFIC)

### 8.1 SEC Recordkeeping (Rule 17a-4)
- [ ] **Records Retained** (5+ years):
  - [ ] User registration data
  - [ ] KYC documents (stored by Persona)
  - [ ] All orders (submitted, filled, rejected)
  - [ ] All account statements & positions
  - [ ] All trades & executions
  - [ ] Allocation of orders (e.g., if we fill 100 orders, allocate to specific users)
- [ ] **Format**: Electronic storage (database), accessible within 1 business day
- [ ] **Archival**: Cold storage after 1 year, warm storage for recent data
- [ ] **Immutability**: Records cannot be deleted, only marked archived

### 8.2 Anti-Money Laundering (AML)
- [ ] **KYC Program** (done by Persona):
  - [ ] Collect: Name, DOB, address, ID type/state
  - [ ] Verify: Against government ID (photo)
  - [ ] Enhancement: OFAC/sanctions check
  - [ ] Re-verify: Annually (Persona handles)
- [ ] **Suspicious Activity Reporting (SAR)**:
  - [ ] Threshold: >$5,000 suspicious transaction
  - [ ] Report to FinCEN if detected
  - [ ] Keep records for 5 years
  - [ ] Do NOT notify customer of SAR filing (federal law)
- [ ] **Customer Due Diligence (CDD)**:
  - [ ] Understand purpose of account & customer
  - [ ] Monitor for beneficial ownership changes (>25%)
  - [ ] Evolve (banking partner) does most of this; we defer

### 8.3 Fair Trading Practices
- [ ] **Order Execution**: 
  - [ ] Best execution clause in ToS
  - [ ] We route to partner broker; broker executes
  - [ ] We don't have order routing choice (not registered broker-dealer)
- [ ] **Disclosure**:
  - [ ] Explicitly state "routed to [Partner Broker]"
  - [ ] Disclose partner can make money on order flow (conflict)
  - [ ] Disclose we earn 0.3% spread on fees
- [ ] **No Manipulation**: 
  - [ ] Prohibit spoofing, layering, capping (all in ToS)
  - [ ] Monitor for wash sales (customer buying/selling same security same day)

### 8.4 Consumer Protection (CFPB Oversight)
- [ ] **Money Transmission Regulations**:
  - [ ] Evolve holds MSB license (they're regulated, we're not)
  - [ ] ACH transfers via Evolve; we're not taking custody
  - [ ] Disclose: "Your funds are held at [Evolve Bank], not SPAD"
- [ ] **Customer Disclosures**:
  - [ ] Risk disclosure: "Options/futures trading is high-risk, you can lose entire investment"
  - [ ] Fee disclosure: All fees clearly displayed
  - [ ] Conflict of interest: Partner broker makes money on spreads
- [ ] **Customer Complaint Handling**:
  - [ ] Respond to complaints within 30 days
  - [ ] Record keeping: Complaint log with resolution
  - [ ] Escalate unresolved complaints to Evolve/partner as appropriate

### 8.5 Derivatives Regulations (CFTC)
- [ ] **Futures Contracts**: CFTC regulated, routed through registered broker
  - [ ] Partner broker is registered with CFTC
  - [ ] We don't touch futures directly (broker handles)
  - [ ] Disclose: "Futures trading subject to CFTC regulations"
- [ ] **Options**: SEC regulated, partner broker registered
  - [ ] Disclose: "Options trading subject to SEC regulations"

### 8.6 State Registration (Money Transmission License)
- [ ] **Currently**: Evolve holds federal MSB license + state licenses
  - [ ] We don't hold money (Evolve does)
  - [ ] We don't need separate state MSB license for now
- [ ] **Future**: If custody changes, may need state registration

---

## 9. INCIDENT RESPONSE

### 9.1 Security Breach Response Plan
- [ ] **Incident Severity Levels**:
  - [ ] Level 1 (Critical): Customer funds at risk, confirmed data breach
  - [ ] Level 2 (High): Service outage, possible compromise
  - [ ] Level 3 (Medium): Minor data leak, failed auth attempts
- [ ] **Immediate Actions** (within 1 hour):
  - [ ] Isolate affected systems
  - [ ] Notify internal team & management
  - [ ] Preserve logs & evidence
  - [ ] Do NOT delete anything
- [ ] **Investigation** (within 24 hours):
  - [ ] Forensic analysis
  - [ ] Identify root cause & scope
  - [ ] Patch vulnerable systems
- [ ] **Notification** (timing depends on severity):
  - [ ] Affected users (if data leak)
  - [ ] Regulators (if required by law)
  - [ ] Partner broker & Evolve (if their system compromised)
- [ ] **Public Disclosure**: Transparent communication on status page within 72 hours

### 9.2 Disaster Recovery
- [ ] **Backup Strategy**:
  - [ ] Daily backups to separate AWS region
  - [ ] Transactional logs: Continuous replication
  - [ ] Test restore: Monthly DR drill
- [ ] **RTO (Recovery Time Objective)**: < 4 hours
- [ ] **RPO (Recovery Point Objective)**: < 15 minutes
- [ ] **Failover Plan**: Promote standby DB, switch DNS, verify
- [ ] **Communication**: Notify users of outage within 15 min, updates every hour

---

## 10. THIRD-PARTY SECURITY

### 10.1 Vendor Management
- [ ] **Vendor Assessment** (before onboarding):
  - [ ] Security questionairre (SOC 2, ISO 27001, penetration tests)
  - [ ] Data handling practices
  - [ ] Sub-processors list
- [ ] **Contracts**:
  - [ ] DPA (Data Processing Agreement) for Persona, Evolve, Broker
  - [ ] Liability caps
  - [ ] Audit rights (we can audit their security)
  - [ ] Right to terminate if security issues

### 10.2 Persona (KYC Provider)
- [ ] **Data Agreement**:
  - [ ] Persona stores original documents
  - [ ] We store only: verification result + last 4 SSN
  - [ ] Data deletion: Upon request or after 5+ years
- [ ] **Controls We Perform**:
  - [ ] Verify webhook signatures (they sign with HMAC)
  - [ ] IP whitelist Persona servers
  - [ ] Log all KYC status changes

### 10.3 Evolve (Banking Partner)
- [ ] **Data Agreement**:
  - [ ] Evolve holds actual bank account
  - [ ] We receive: account ID, balance, transfer status
  - [ ] We store: encrypted routing/account number (for future transfers)
  - [ ] PII: Minimal (only necessary for ACH)
- [ ] **Controls We Perform**:
  - [ ] Verify ACH webhook signatures
  - [ ] Daily balance reconciliation
  - [ ] Rate limits: validate Evolve ACH limits before submitting

### 10.4 Partner Broker
- [ ] **Data Agreement**:
  - [ ] Broker executes orders & holds customer funds (clearing)
  - [ ] We maintain relationship via API
  - [ ] Share: User account ID, order details, positions
- [ ] **Controls We Perform**:
  - [ ] mTLS for all connections
  - [ ] Daily order & position reconciliation
  - [ ] Webhook signature verification

---

## 11. TESTING & VALIDATION

### 11.1 Security Testing
- [ ] **Penetration Testing**:
  - [ ] Perform annual pen test by external firm
  - [ ] Address critical findings within 30 days
  - [ ] Document all tests & results
- [ ] **Code Review**:
  - [ ] All code reviewed before merge (no exceptions)
  - [ ] Security checklist: SQLi, XSS, CSRF, broken auth
  - [ ] Tools: SonarQube, Snyk for SAST/dependency scanning
- [ ] **Dependency Audits**:
  - [ ] `npm audit` on every build
  - [ ] Remove unmaintained packages
  - [ ] Patch critical CVEs within 48 hours

### 11.2 Compliance Testing
- [ ] **Data Retention**: Monthly audit of old data (verify 7-year retention)
- [ ] **Fee Accuracy**: Monthly reconciliation of fees charged vs. ledger
- [ ] **AML Monitoring**: Monthly review of flagged suspicious accounts
- [ ] **Breach Detection**: Weekly review of failed login attempts, alerts

---

## 12. SECURITY CHECKLIST (MVP LAUNCH)

### Pre-Launch
- [ ] TLS 1.3 certificate installed
- [ ] Database encryption enabled (at-rest)
- [ ] Secrets manager configured (API keys, database password)
- [ ] 2FA implementation tested
- [ ] Rate limiting deployed
- [ ] CORS configured
- [ ] HSTS headers added
- [ ] CSP headers added
- [ ] SQL injection testing (parameterized queries verified)
- [ ] XSS testing (input sanitization verified)
- [ ] Persona webhook signature verification working
- [ ] Evolve webhook signature verification working
- [ ] Broker API mTLS working
- [ ] Logging implementation verified (no PII in logs)
- [ ] Audit trail started (admin_logs, ledger_entries)
- [ ] Incident response plan documented
- [ ] Privacy policy drafted (disclose Persona, Evolve, Broker)
- [ ] Terms of Service drafted (risk disclosure, conflict of interest)
- [ ] Internal security training completed (team)

### Post-Launch (First 90 Days)
- [ ] Security assessment by external firm
- [ ] Penetration test (basic, scoped)
- [ ] Code review of all MVP code
- [ ] SOC 2 Type I audit initiated (complete within 12 months)
- [ ] First AML monitoring review
- [ ] First data retention audit
- [ ] Customer complaint handling policy tested
- [ ] Disaster recovery drill performed
- [ ] Security incident response plan tested (tabletop exercise)

### Ongoing
- [ ] Monthly security reviews (alerts, logs, incidents)
- [ ] Quarterly dependency audits
- [ ] Semi-annual penetration testing (targeted)
- [ ] Annual full security assessment
- [ ] Annual employee security training
- [ ] Annual vendor security reviews

---

## Summary Table

| Control | MVP | Priority | Owner |
|---------|-----|----------|-------|
| Password Policy | ✅ | Critical | Auth |
| 2FA (TOTP) | ✅ | Critical | Auth |
| JWT (RS256) | ✅ | Critical | Auth |
| HTTPS (TLS 1.3) | ✅ | Critical | Infra |
| HSTS Headers | ✅ | Critical | API |
| Database Encryption | ✅ | Critical | Infra |
| Secrets Manager | ✅ | Critical | DevOps |
| Rate Limiting | ✅ | High | API |
| CORS Security | ✅ | High | API |
| Input Validation | ✅ | Critical | API |
| SQL Injection Prevention | ✅ | Critical | API |
| XSS Prevention | ✅ | High | Frontend |
| Webhook Signature Verification | ✅ | Critical | Integrations |
| IP Whitelisting | ✅ | High | Integrations |
| KYC Status in Orders | ✅ | Critical | Trading |
| Account Isolation | ✅ | Critical | API |
| Audit Logging | ✅ | Critical | Backend |
| Data Retention (5yr) | ✅ | Critical | Ops |
| PII Minimization | ✅ | Critical | Design |
| Error Handling (Generic) | ✅ | High | API |
| Fraud Detection | ⏳ | Medium | Post-MVP |
| Penetration Testing | ⏳ | High | Post-MVP |
| SOC 2 Audit | ⏳ | High | Post-MVP |
| Incident Response Plan | ✅ | High | Security |
| Disaster Recovery Plan | ✅ | Medium | Infra |

---

**Last Updated**: 2026-02-17  
**Next Review**: 2026-03-17 (monthly)
