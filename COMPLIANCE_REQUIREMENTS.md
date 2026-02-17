# US Compliance Requirements: Derivatives Trading Platform with Partner Broker

**Platform Model**: Unregulated platform routing orders to regulated partner broker (who holds customer funds and clearing relationships)

**Scope**: KYC/AML, OFAC, Recordkeeping, Disclosures, Custody Controls

**Last Updated**: February 2026

---

## 1. KYC/AML REQUIREMENTS (MANDATORY)

### 1.1 Regulatory Framework

**Applicable Rules**:
- FinCEN's Customer Identification Program (CIP) - 31 CFR § 1020.210
- Customer Due Diligence (CDD) Rule - 31 CFR § 1020.220
- Bank Secrecy Act (BSA) - 31 U.S.C. § 5318
- Money Laundering Control Act (MLCA) - 18 U.S.C. § 1956-1957
- CFTC Regulation 4.2 (for derivatives platforms)

**Key Point**: Even though you route through a partner broker, **YOU are still responsible** for your own KYC/AML program. The partner broker has their own program but doesn't exempt you.

### 1.2 Customer Identification Program (CIP) - What to Collect

**Mandatory Data** (collect at account opening):
```
- Full legal name
- Date of birth
- Residential address (street, city, state, ZIP)
- Tax Identification Number (SSN or EIN for US persons)
- State/country of citizenship (for each beneficial owner if entity)
```

**Store in Database**:
- User entity fields needed:
  ```
  - givenName, familyName (full legal name)
  - dateOfBirth (DATE type)
  - addressStreet, addressCity, addressState, addressZip
  - tin (Tax ID - encrypted field)
  - citizenship (enum: US, FOREIGN, DUAL)
  - accountOpeningDate (timestamps CIP completion)
  ```

**Current Status**: ✅ User.ts has `kycData` JSONB field - sufficient for initial collection

### 1.3 Customer Due Diligence (CDD) - Understanding Purpose/Use

**What to Understand & Record**:
1. **Source of Funds** - Where does money come from?
   - Employment income
   - Investment returns
   - Inheritance
   - Business owner
   - Other ____

2. **Source of Wealth** - Total net worth estimate
   - $0-50k
   - $50k-250k
   - $250k-1M
   - $1M+

3. **Business Purpose** - Why trade derivatives?
   - Professional/institutional trading
   - Personal investing
   - Hedging existing position
   - Speculation
   - Other ____

4. **Expected Trading Activity** - Estimated volume
   - <$10k/month
   - $10k-100k/month
   - $100k-1M/month
   - $1M+/month

**Store in Database**:
```typescript
// Add to User.ts kycData JSONB field:
{
  sourceOfFunds: "employment_income" | "investment_returns" | "inheritance" | "business_owner" | "other",
  sourceOfWealthDescription: string, // If "other"
  estimatedNetWorth: "0-50k" | "50k-250k" | "250k-1m" | "1m+",
  businessPurpose: "professional" | "personal_investing" | "hedging" | "speculation" | "other",
  expectedMonthlyVolume: "0-10k" | "10k-100k" | "100k-1m" | "1m+",
  cddCompletionDate: Date,
  cddVerifiedBy: string, // User ID of compliance officer
  cddRiskLevel: "low" | "medium" | "high", // Internal risk assessment
}
```

**Implementation**: Add CDD questionnaire in KYC flow (after Persona completes identity verification)

### 1.4 Beneficial Ownership (for Business Accounts)

**Required if Account is ENTITY** (not individual):
- If account opened in name of entity (LLC, Corporation, Trust, etc.), must identify:
  - All owners with 25%+ ownership
  - Managing members/officers
  - Beneficial owners if different from legal owners

**Store in Database**:
```typescript
// Add to Account.ts:
interface BeneficialOwner {
  legalName: string,
  dateOfBirth: Date,
  addressStreet: string,
  addressCity: string,
  addressState: string,
  addressZip: string,
  tin: string, // Encrypted
  ownershipPercentage: number, // 0-100
  role: "owner" | "managing_member" | "officer" | "trustee" | "other",
  identificationType: "passport" | "driver_license" | "national_id",
  identificationNumber: string, // Encrypted
  verificationDate: Date,
}

// In Account entity:
beneficialOwners?: BeneficialOwner[] // JSONB array, only if accountType = "entity"
```

**DEPENDS**: **LAWYER** - Whether routing platform must collect this or if partner broker's CIP is sufficient. Most likely you need your own collection for regulatory exam preparedness.

### 1.5 Persona Integration (Current Implementation Points)

**What Persona provides**:
- Identity verification (document scanning, liveness check)
- Address verification
- Birth date verification
- SSN verification

**What Persona does NOT provide** (you must collect separately):
- Source of funds / Source of wealth
- Business purpose / Trading intent
- Beneficial ownership (for entities)
- AML/sanctions status updates

**Implementation in Code**:

```typescript
// User.ts entity - already has fields for:
- personaInquiryId: string // Persona's unique inquiry ID
- kycStatus: "PENDING" | "PROCESSING" | "VERIFIED" | "REJECTED" | "FAILED"
- kycData: {
    givenName: string,
    familyName: string,
    dob: string, // ISO date
    addressStreet: string,
    addressCity: string,
    addressState: string,
    addressZip: string,
    ssnLast4: string, // Store LAST 4 ONLY (encrypted)
    phone: string,
    // ADD: Source of funds, wealth, business purpose
  }
- kycVerifiedAt: Date
- kycRejectionReason?: string
```

**Webhook Handling** (from Persona):
```typescript
// POST /webhooks/persona
// Expected events:
{
  eventType: "inquiry.approved" | "inquiry.failed" | "inquiry.expired",
  inquiryId: string,
  personId: string,
  status: "approved" | "failed",
  attributes: {
    name: { first: string, middle: string, last: string },
    dateOfBirth: Date,
    addresses: [{ street: string, city: string, state: string, zipCode: string }],
    phoneNumber: string,
    email: string,
    identityDocuments: [{ type: string, issuer: string }],
  }
}

// Action when approved:
// 1. Update User.kycStatus = "VERIFIED"
// 2. Restrict further deposits (won't happen) - already verified by partner
// 3. Continue to OFAC checking (your responsibility)
```

**Status**: ✅ Persona integration webhook handlers ready to add

---

## 2. OFAC SCREENING (MANDATORY)

### 2.1 Regulatory Framework

**Requirements**:
- Office of Foreign Assets Control (OFAC) - Department of Treasury
- Screened against: Specially Designated Nationals (SDN) List
- Screened against: Non-SDN lists (Consolidated Non-SDN, Denied Persons, etc.)
- Must screen: ALL new customers (CIP trigger) + ongoing monitoring

**Penalties for Non-Compliance**:
- Civil penalties: up to $250,000 per violation
- Criminal penalties: up to $20,000,000 and 20 years imprisonment
- Blocking required for any match (no exceptions)

### 2.2 What to Screen

**At Account Opening (CIP)** - Screen against:
1. Customer name (full legal name + variations)
2. Customer DOB
3. Customer residential address
4. Customer nationality/citizenship

**For Entities**:
1. Entity legal name
2. All beneficial owners (25%+ ownership)
3. All managing officers with authority

**When to Screen**:
- At account opening (mandatory)
- Daily/weekly ongoing monitoring (recommended industry standard)
- When customer provides new residential address (re-screen)
- When customer provides new beneficial owners (re-screen)

### 2.3 Watchlist Sources

**Official OFAC Lists**:
1. **Specially Designated Nationals (SDN) List** - Primary list (~10,000 entries)
2. **Consolidated Non-SDN List** - Secondary (~7,000 entries)
3. **Denied Persons List (Census Bureau)** - Dual-use exports
4. **Entity List (Census Bureau)** - Export controls
5. **Unverified List (Census Bureau)** - Security concern

**Recommendation**: Use commercial OFAC service (below) rather than downloading raw lists - daily updates are required

### 2.4 Implementation Approach

**Option A: Commercial OFAC Service** (Recommended for MVP)
- Use: Plaid, Trulioo, Accuity, Refinitiv, or Thomson Reuters
- Cost: $0.50-$2 per screen (one-time), $50-500/month base
- Pros: Daily updates, false positive handling, audit trail, compliance docs
- Cons: Adds external dependency

**Option B: Open Source OFAC Lists** (Not recommended for MVP)
- Download raw OFAC CSV lists
- Implement fuzzy matching algorithm
- Must update daily (FinCEN releases Fridays)
- Higher false positive risk
- No legal indemnification

**For SPAD**: **Recommend Option A** - Use Trulioo or similar service

### 2.5 Implementation in Code

**Store Screening Results**:

```typescript
// User.ts entity - add fields:
- ofacScreeningId?: string // ID from OFAC service
- ofacStatus: "NOT_SCREENED" | "PENDING" | "CLEAR" | "MATCH" | "REVIEW_REQUIRED"
- ofacScreenedAt?: Date
- ofacMatchDetails?: {
    serviceName: string, // "trulioo", "plaid", etc.
    riskLevel: "low" | "medium" | "high",
    matchScore: number, // 0-100
    matchedNames: string[],
    matchedEntities: string[],
    reviewNotes: string,
    reviewedBy?: string, // Compliance officer ID
    reviewedAt?: Date,
    reviewDecision: "approved" | "blocked" | "escalated",
  }
- sanctionsCheckStatus: "NOT_CHECKED" | "CHECKED" | "PASSED" | "FAILED" // Redundant field for legacy

// Add to Account.ts:
- accountStatus can be "BLOCKED_OFAC" in addition to "ACTIVE", "SUSPENDED", "CLOSED"
```

**API Call Pattern** (using pseudocode for generic OFAC service):

```typescript
async function screenCustomerOFAC(user: User): Promise<void> {
  const client = new OFACService(process.env.OFAC_API_KEY);

  const result = await client.screen({
    firstName: user.kycData.givenName,
    lastName: user.kycData.familyName,
    dateOfBirth: user.kycData.dob,
    address: user.kycData.addressStreet,
    city: user.kycData.addressCity,
    state: user.kycData.addressState,
    zip: user.kycData.addressZip,
    countryOfCitizenship: user.citizenship,
  });

  // Handle results
  if (result.status === "MATCH") {
    // Block immediately - no exceptions
    user.ofacStatus = "MATCH";
    user.account.accountStatus = "BLOCKED_OFAC";
    user.account.suspensionReason = "OFAC match - customer blocked";
    
    // Log for compliance
    await complianceLog.create({
      eventType: "OFAC_MATCH",
      userId: user.id,
      details: result.matchedNames,
      timestamp: new Date(),
    });

    // Alert compliance team
    await alertComplianceTeam({
      title: "OFAC Match Detected",
      userId: user.id,
      userEmail: user.email,
      matchScore: result.matchScore,
    });

    throw new Error(`Customer blocked due to OFAC match`);
  }

  if (result.status === "REVIEW_REQUIRED") {
    user.ofacStatus = "REVIEW_REQUIRED";
    // Queue for manual review (don't block yet)
    // Must be reviewed within 10 business days
  }

  if (result.status === "CLEAR") {
    user.ofacStatus = "CLEAR";
    user.ofacScreenedAt = new Date();
  }

  await userRepository.save(user);
}
```

### 2.6 Ongoing Monitoring

**FinCEN Guidance**: Screen existing customers regularly (monthly minimum, weekly recommended)

**Implementation**:

```typescript
// Daily batch job (run 2am ET after OFAC Friday releases)
async function dailyOFACMonitoring() {
  const accountsToRescreen = await accountRepository.find({
    where: {
      accountStatus: "ACTIVE",
      ofacScreenedAt: LessThan(oneWeekAgo), // Re-screen weekly minimum
    },
  });

  for (const account of accountsToRescreen) {
    const user = await userRepository.findOne({
      where: { id: account.userId },
    });

    await screenCustomerOFAC(user);

    // If newly matched, block immediately and alert
  }
}

// Schedule with: node-schedule or AWS EventBridge
schedule.scheduleJob("0 2 * * *", dailyOFACMonitoring);
```

### 2.7 False Positive Handling

**What Triggers Review**:
- Name match score 70-89%
- "John Smith" matches someone on SDN list
- Customer has same address as sanctioned person

**Manual Review Process**:

```typescript
interface OFACReview {
  screenshotId: string,
  originalMatch: {
    customerName: string,
    sdnName: string,
    matchScore: number,
  },
  reviewerDecision: "approved" | "blocked" | "escalated",
  reviewerNotes: string,
  reviewedBy: string, // Compliance officer ID
  reviewedAt: Date,
  // Additional info:
  customerExplanation?: string, // "I'm John Smith Jr., not the SDN John Smith Sr."
  additionalDocumentation?: string[], // URLs to supporting docs
}
```

**Timeline**: Must complete review within 10 business days of match

### 2.8 Blocking Requirements

**When to Block**:
- Any exact or high-confidence match (score 90+)
- Any SDN list match
- Any Denied Persons match

**How to Block**:
```typescript
// When match confirmed:
account.accountStatus = "BLOCKED_OFAC"
account.suspensionReason = "OFAC/Sanctions match confirmed by compliance"

// Prevent all operations:
// - No deposits
// - No withdrawals
// - No order submissions
// - No transfers

// Notify customer (optional but recommended):
await sendEmail(user.email, {
  subject: "Account Restricted",
  body: `Your account has been restricted due to regulatory compliance. 
         Please contact compliance@spad.com for more information.`,
});

// Alert FinCEN if significant funds involved (DEPENDS on threshold)
```

**DEPENDS: LAWYER** - Must block immediately with no exceptions. Some platforms provide "appeal" process, but legally risky.

---

## 3. RECORDKEEPING REQUIREMENTS (MANDATORY)

### 3.1 Regulatory Framework

**Applicable Rules**:
- SEC Rule 17a-4 (recordkeeping for brokers)
- SEC Rule 17a-3 (required contents of records)
- FinCEN BSA recordkeeping (31 CFR § 1020.320)
- CFTC Regulation 4.7 (derivatives platforms)

**Key Requirement**: All records must be **immutable** (write-once, read-many - WORM)

**Retention**: **Minimum 5 years**, with evidence of retention

### 3.2 What Records to Keep

**Customer Records**:
```
✅ CIP information (name, DOB, address, TIN)
✅ CDD documentation (source of funds, business purpose)
✅ ID verification documentation (Persona results)
✅ OFAC screening results
✅ Account opening timestamp
✅ Account closing timestamp (if applicable)
✅ KYC approval/rejection decision
✅ Beneficial owner information (if entity)
✅ Enhanced due diligence (if high-risk)
✅ Customer contact information (email, phone)
```

**Transaction Records**:
```
✅ Order/trade details:
  - Order ID
  - Timestamp (to second)
  - Customer ID
  - Symbol, quantity, side (BUY/SELL), price
  - Order type (LIMIT/MARKET)
  - Time in force (DAY/GTC)
  - Order status (PENDING/FILLED/CANCELLED/REJECTED)
  - Fill details (quantity filled, price filled, timestamp)
  - Broker order ID (link to partner)
  - Fees charged (gross and net)

✅ Deposit/Withdrawal:
  - Transaction ID
  - Timestamp
  - Amount
  - Method (ACH, wire, etc.)
  - Status (REQUESTED/PROCESSING/COMPLETED/FAILED)
  - Partner reference (Evolve transfer ID)
  - Customer instructions
  - Approval/rejection reason (if failed)

✅ Account movements:
  - Balance updates
  - Position changes
  - Asset purchases/sales
  - Dividend payments
  - Interest payments
  - Fees charged

✅ Ledger entries:
  - Debit/credit entries
  - Linked transaction ID
  - Amount, currency, timestamp
  - Description
```

**Communication Records**:
```
✅ Email communications with customer
✅ Support tickets / help requests
✅ API calls to external services (broker, Persona, Evolve)
✅ Webhook notifications received
✅ Error logs related to orders/accounts
✅ Admin actions (account suspension, fee adjustments, etc.)
```

**Compliance Records**:
```
✅ Background checks (if performed)
✅ SAR filings (Suspicious Activity Reports)
✅ CTR filings (Currency Transaction Reports) - if applicable
✅ OFAC screening results
✅ Audit logs
✅ Account review decisions
✅ Compliance policy documents
```

### 3.3 Current Database Structure Assessment

**LedgerEntry entity** - ✅ Already implements record structure
```typescript
class LedgerEntry {
  id: string // PK
  accountId: string // FK
  entryType: string // DEPOSIT, WITHDRAWAL, ORDER_EXECUTION, FEE, etc.
  amount: number
  currency: string
  description: string
  orderId?: string // FK to order
  transferId?: string // FK to transfer
  metadata: object // Flexible for additional details
  isReconciled: boolean
  reconciliationId?: string
  reconciledAt?: Date
  createdAt: Date // Auto timestamp
  updatedAt?: Date // Auto timestamp
}
```

✅ Good - captures timestamped transactions

**Order entity** - ✅ Captures order details
```typescript
class Order {
  id: string
  symbol: string
  assetType: 'OPTION' | 'FUTURE'
  side: 'BUY' | 'SELL'
  quantity: number
  price?: number
  orderType: 'MARKET' | 'LIMIT'
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED'
  filledQuantity?: number
  filledPrice?: number
  filledAt?: Date
  partnerOrderId?: string // Link to broker
  createdAt: Date
  updatedAt: Date
}
```

✅ Good - captures order details with broker link

**Transfer entity** - ✅ Captures deposit/withdrawal
```typescript
class Transfer {
  id: string
  transferType: 'ACH_IN' | 'ACH_OUT'
  amount: number
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  evolveTransferId?: string // Link to Evolve
  routingNumber: string
  accountNumber: string
  createdAt: Date
}
```

✅ Good - captures deposit/withdrawal with partner link

**Issues to Fix**:

1. **LedgerEntry should be immutable** - Add database constraint
   ```sql
   -- PostgreSQL trigger to prevent updates:
   CREATE OR REPLACE FUNCTION prevent_ledger_update()
   RETURNS TRIGGER AS $$
   BEGIN
     RAISE EXCEPTION 'Ledger entries cannot be updated';
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER ledger_immutable
   BEFORE UPDATE ON ledger_entry
   FOR EACH ROW
   EXECUTE FUNCTION prevent_ledger_update();
   ```

2. **Add compliance_log table** - Separate immutable log for compliance events
   ```typescript
   @Entity()
   class ComplianceLog {
     @PrimaryColumn('uuid')
     id: string = uuidv4();

     @Column()
     eventType: 'KYC_APPROVED' | 'KYC_REJECTED' | 'OFAC_MATCH' | 
                'SAR_FILED' | 'ACCOUNT_SUSPENDED' | 'ADMIN_ACTION';

     @Column('uuid')
     userId: string;

     @Column('uuid', { nullable: true })
     accountId: string;

     @Column('jsonb')
     details: Record<string, any>;

     @Column()
     performedBy: string; // Admin/system user ID

     @CreateDateColumn()
     timestamp: Date;

     @Column()
     immutable: boolean = true; // Prevent deletion
   }
   ```

3. **Add request_log table** - API call audit trail
   ```typescript
   @Entity()
   class RequestLog {
     @PrimaryColumn('uuid')
     id: string = uuidv4();

     @Column('uuid')
     userId: string;

     @Column()
     method: string; // GET, POST, etc.

     @Column()
     endpoint: string; // /orders, /auth/login, etc.

     @Column()
     requestBody: string; // Masked PII

     @Column()
     responseCode: number;

     @Column()
     responseTime: number; // ms

     @Column()
     ipAddress: string;

     @CreateDateColumn()
     timestamp: Date;

     @Index()
     @Column()
     immutable: boolean = true;
   }
   ```

### 3.4 Retention & Archive

**5-Year Retention Requirements**:

```typescript
// Implement data retention policy
interface RetentionPolicy {
  dataType: 'customer_records' | 'transaction_records' | 'communications' | 'compliance_logs',
  retentionYears: 5,
  deletionAllowed: boolean, // typically false
  archiveLocation: 'postgresql' | 's3' | 'glacier', // Hot -> Cold -> Archive tier
  archiveSchedule: 'after_1_year' | 'after_3_years' | 'after_5_years',
}

// Implement archival job (runs annually on Jan 1)
async function archiveOldRecords() {
  const fiveYearsAgo = new Date(Date.now() - 5 * 365.25 * 24 * 60 * 60 * 1000);
  
  // Archive ledger entries older than 5 years
  const oldLedgers = await ledgerRepository.find({
    where: {
      createdAt: LessThan(fiveYearsAgo),
      archived: false,
    },
  });

  // Export to S3 (Glacier Deep Archive for compliance)
  const exportData = JSON.stringify(oldLedgers);
  await s3.putObject({
    Bucket: 'spad-compliance-archive-glacier',
    Key: `ledger-entries/pre-${fiveYearsAgo.getFullYear()}.json.gz`,
    Body: gzip(exportData),
    ServerSideEncryption: 'AES256',
  });

  // Mark as archived (but don't delete from DB)
  for (const entry of oldLedgers) {
    entry.archived = true;
    entry.archivedAt = new Date();
    entry.archiveLocation = 's3://spad-compliance-archive-glacier/...';
    await ledgerRepository.save(entry);
  }
}
```

**DEPENDS: LAWYER** - Verify whether deleted customer records require explicit retention after closure (answer is typically: you can't delete, just flag as closed)

### 3.5 Audit Trail Requirements

**What Needs Audit Trail**:
- ✅ All ledger entries (already has timestamps)
- ✅ All order changes (already tracked)
- ✅ All account status changes
- ✅ All fee calculations
- ✅ Admin actions (overrides, manual approvals)
- ✅ External API calls (broker, Persona, Evolve, OFAC)

**Implement Audit Decorator** (for all important operations):

```typescript
// Create decorator for automatic audit logging
function Auditable(eventType: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      let result, error;

      try {
        result = await originalMethod.apply(this, args);
      } catch (e) {
        error = e;
      }

      const endTime = Date.now();
      const userId = (args[0]?.userId || 'system');
      const accountId = (args[0]?.accountId || result?.accountId);

      await auditLog.create({
        eventType,
        userId,
        accountId,
        method: propertyKey,
        success: !error,
        errorMessage: error?.message,
        executionTime: endTime - startTime,
        timestamp: new Date(),
        details: {
          arguments: sanitize(args), // Remove sensitive data
          result: sanitize(result),
        },
      });

      if (error) throw error;
      return result;
    };

    return descriptor;
  };
}

// Usage:
class OrderService {
  @Auditable('ORDER_SUBMITTED')
  async submitOrder(req: SubmitOrderRequest): Promise<Order> {
    // ... order submission logic
  }

  @Auditable('ORDER_FILLED')
  async fillOrder(orderId: string, ...): Promise<Order> {
    // ... order fill logic
  }
}
```

**Status**: ⏳ Need to add ComplianceLog, RequestLog, archival job, and @Auditable decorators

---

## 4. DISCLOSURES & DISCLAIMERS (MANDATORY)

### 4.1 Required Disclosures by Topic

#### A. Risk Disclaimer
**Required by**: CFTC, FINRA, State regulators

**Content to Include**:
```
OPTIONS TRADING INVOLVES SUBSTANTIAL RISK OF LOSS

Options trading is not suitable for all investors. You may lose all or more 
of the funds invested in a relatively short period of time. Before deciding 
to trade options, you should be thoroughly familiar with the risks involved 
and have the financial ability to sustain losses.

Key Risks:
• Leverage: Options provide leveraged exposure. Small market movements can 
  result in significant gains or losses.
• Time Decay: Options lose value as they approach expiration, especially 
  out-of-the-money options.
• Liquidity: Some options have limited trading volume and may be difficult 
  to buy or sell.
• Exercise Risk: Early exercise of American options can occur at any time.
• Expiration: Options expire worthless if they don't meet strike price by 
  expiration date.
• Counterparty Risk: Our platform routes to [Partner Broker Name]. 
  [Partner] could default or face operational issues.

You are responsible for understanding these risks before trading.
```

**Where to Display**: 
- ✅ Before account opening (required acknowledgment)
- ✅ Before first trade (required acknowledgment)
- ✅ In "Risk Disclosure" link in footer (always available)
- ✅ In Terms of Service

**Implementation**:
```typescript
// Add to User entity:
- riskDisclosureAcknowledged: boolean
- riskDisclosureAcknowledgedAt: Date
- riskDisclosureVersion: string // "1.0" for tracking

// In account creation flow:
if (!user.riskDisclosureAcknowledged) {
  throw new Error('Risk disclosure must be acknowledged before trading');
}

// In order submission:
if (!account.user.riskDisclosureAcknowledged) {
  return res.status(400).json({ 
    error: 'Risk disclosure must be acknowledged before trading' 
  });
}
```

#### B. Fee Disclosure
**Required by**: SEC, FINRA, state regulators

**Content to Include**:
```
TRADING FEES

We charge the following fees on each trade:

Trading Commission: 0.5% of notional value
  • Charged on buy and sell sides
  • Applied to options and futures
  • Example: Buying 100 SPY options contracts at $4.50 = 
    $45,000 notional × 0.5% = $225 commission

Fees are deducted automatically from your account and displayed in order 
confirmation.

There are NO additional fees for:
• Account maintenance
• Account transfers
• Regulatory fees (absorbed by SPAD)

Our partner broker ([Partner Name]) may charge additional fees as specified 
in their separate agreements. We strongly recommend reviewing their complete 
fee schedule.
```

**Where to Display**:
- ✅ Before account opening (required acknowledgment)
- ✅ Before first trade (show estimated fee)
- ✅ In order confirmation (show actual fee charged)
- ✅ In "Fees" link in footer
- ✅ In monthly statement

**Implementation**:
```typescript
// Show fee to user BEFORE submitting order:
GET /orders/calculate-fee?symbol=SPY&quantity=100&price=450.25
Response: {
  symbol: "SPY",
  quantity: 100,
  estimatedValue: 45025,
  estimatedFee: 225.13, // 0.5%
  ourCost: 90.05, // 0.2%
  ourMargin: 135.08, // 0.3%
}

// Show fee in order confirmation:
POST /orders/submit
Response: {
  orderId: "ORD_123",
  symbol: "SPY",
  quantity: 100,
  price: 450.25,
  notionalValue: 45025,
  feesCharged: {
    commission: 225.13,
    description: "0.5% trading commission",
  },
  netCash: -45250.13, // debit from account
  timestamp: "2026-02-17T14:30:00Z"
}

// Add to order confirmation page:
<div class="fee-disclosure">
  <p>Commission charged: $225.13 (0.5% of order value)</p>
  <a href="/disclosures/fees">View complete fee schedule</a>
</div>
```

**Add to Fee entity**:
```typescript
@Entity()
class Fee {
  // ... existing fields ...

  @Column()
  disclosureVersion: string; // "1.0" for tracking

  @Column()
  customerAcknowledged: boolean; // User saw and accepted fee

  @Column()
  customerAcknowledgedAt?: Date;
}
```

#### C. Custody & Regulatory Status Disclosure
**Required by**: SEC, FINRA, CFTC

**Content to Include**:
```
CUSTODY & REGULATORY STATUS

Important: [SPAD Platform Name] does NOT hold your funds. Your cash and 
securities are held by [Partner Broker Name], which is a registered 
[broker-dealer / futures commission merchant / clearing member].

Your Protections:
• Securities: Protected by SIPC (Securities Investor Protection Corporation) 
  up to $500,000 per account
• Cash: Protected by FDIC insurance (via Evolve Bank) up to $250,000 per 
  account per deposit category
• Segregation: Your funds are segregated and cannot be used by the broker 
  for proprietary trading
• Bankruptcy: If [Partner Broker] fails, your assets go to SIPC trustee, 
  not creditors

[SPAD Platform Name] is an unregulated platform providing order routing 
technology. We do not have regulatory oversight authority but must comply 
with anti-money laundering (AML) and anti-fraud laws.

Conflicts of Interest:
• We earn fees on every trade. This creates incentive for higher volume.
• [Partner Broker] may have conflicts between their fee structure and yours.
• We do not provide investment advice.
```

**Where to Display**:
- ✅ Before account opening
- ✅ In "About Us" / "Regulatory Status" section
- ✅ In Terms of Service
- ✅ In Help/FAQ

**Implementation**:
```typescript
// Add to footer/legal section:
<div class="regulatory-status">
  <h3>Regulatory Status</h3>
  <p>SPAD Platform is not a registered broker-dealer. Orders are routed to 
  [Partner Broker], a registered member of FINRA and SIPC.</p>
  <ul>
    <li><strong>Securities:</strong> Protected by SIPC up to $500,000</li>
    <li><strong>Cash:</strong> Held by Evolve Bank with FDIC insurance</li>
  </ul>
</div>

// Add acknowledgment checkbox:
<input type="checkbox" name="regulatory-status-acknowledged" required />
I understand that [SPAD] routes my orders to [Partner Broker] and my funds 
are held there, not at [SPAD].
```

#### D. Options-Specific Disclosures
**Required by**: Options Clearing Corporation (OCC), SEC, FINRA

**Content to Include**:
```
CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS

Before trading options, you must understand:

1. CALLS & PUTS
   • Call: Right to buy at specific price (strike) by expiration
   • Put: Right to sell at specific price (strike) by expiration
   • Both expire worthless if not exercised by expiration

2. EXERCISE & ASSIGNMENT
   • Exercise: You exercise your option to buy/sell at strike price
   • Assignment: Your option is exercised against you (usually on ITM options)
   • Can happen at any time (American options), only at expiration (European)

3. TIME DECAY (THETA)
   • Options lose value as expiration approaches
   • Time decay accelerates in final days
   • Example: Call worth $1 today might be worth $0.10 the next day

4. VOLATILITY
   • Implied Volatility (IV): Market expectation of future price movement
   • Higher IV → higher option prices
   • Can change dramatically on news/earnings

5. LIQUIDITY
   • Some strikes/expirations have no buyers/sellers
   • Wide bid/ask spreads can reduce profit potential
   • May not be able to exit position when desired

[Provide OCC "Characteristics and Risks of Standardized Options" document]
```

**Where to Display**:
- ✅ Before first options trade (required)
- ✅ Link to full OCC document
- ✅ In "Options" section of help

**Implementation**:
```typescript
// Add to User entity:
- optionsTrainingCompleted: boolean
- optionsTrainingCompletedAt?: Date

// In options order endpoint:
if (!account.user.optionsTrainingCompleted && !wasCompletedBefore) {
  throw new Error('Options training must be completed before first trade');
}

// In frontend:
// Before allowing options order, show training modal with OCC document
```

#### E. Suitability Disclaimer
**Required by**: FINRA Rule 2111

**Content to Include**:
```
SUITABILITY

IMPORTANT: [SPAD] does NOT provide investment advice. Trading decisions are 
yours alone.

Options and derivatives are high-risk investments. They are NOT suitable for 
all investors. Before trading, consider:

• Risk Tolerance: Can you afford to lose your entire investment?
• Investment Objective: Does derivatives trading align with your goals?
• Experience: Do you understand options mechanics?
• Net Worth: Does this represent a reasonable portion of your wealth?

This service is strictly for experienced traders who understand derivatives.

Our platform is NOT suitable for:
• Investors seeking principal protection
• Retirement accounts (unless self-directed)
• Investors uncomfortable with losses
• Someone using borrowed money

You are solely responsible for evaluating whether options trading is 
appropriate for you.
```

**Where to Display**:
- ✅ Before account opening
- ✅ In Terms of Service
- ✅ Required annual re-acknowledgment

**Implementation**:
```typescript
// Add to account entity:
- suitabilityAcknowledged: boolean
- suitabilityAcknowledgedAt: Date
- suitabilityVersion: string

// Add annual re-consent flow:
if (user.suitabilityAcknowledgedAt < oneYearAgo) {
  // Force re-acknowledgment
  throw new Error('Annual suitability review required');
}
```

### 4.2 Required Disclosures for Specific Actions

#### Before Account Opening:
- ☑️ Risk Disclaimer (options and futures)
- ☑️ Custody Disclosure (partner broker holds funds)
- ☑️ Regulatory Status
- ☑️ Fee Disclosure
- ☑️ Suitability Disclaimer
- ☑️ Terms of Service
- ☑️ Privacy Policy

#### Before First Trade:
- ☑️ Options Characteristics (if trading options)
- ☑️ Futures Characteristics (if trading futures)
- ☑️ Fee estimate display

#### In Order Confirmation:
- ☑️ Final fee charged
- ☑️ Timestamp
- ☑️ Broker order ID (if filled)

#### On Monthly Statement:
- ☑️ Total fees charged
- ☑️ P&L summary
- ☑️ Custody reminder
- ☑️ Links to disclosures

### 4.3 Disclosure Tracking Implementation

```typescript
@Entity()
class DisclosureAcknowledgment {
  @PrimaryColumn('uuid')
  id: string = uuidv4();

  @Column('uuid')
  userId: string;

  @Column()
  disclosureType: 
    'RISK_WARNING' |
    'FEE_DISCLOSURE' |
    'CUSTODY_DISCLOSURE' |
    'OPTIONS_TRAINING' |
    'SUITABILITY' |
    'TERMS_OF_SERVICE';

  @Column()
  version: string; // "1.0", "1.1", tracks policy updates

  @Column()
  acknowledged: boolean;

  @CreateDateColumn()
  acknowledgedAt: Date;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string; // Device/browser info

  @Column()
  expiresAt?: Date; // For annual re-consent

  @Index()
  @Column()
  immutable: boolean = true; // Prevent tampering
}

// Verification logic:
async function verifyDisclosureAcknowledged(
  userId: string,
  disclosureType: string,
  maxAge?: Date
): Promise<boolean> {
  const acknowledgment = await disclosureRepository.findOne({
    where: {
      userId,
      disclosureType,
      acknowledged: true,
    },
    order: { acknowledgedAt: 'DESC' },
  });

  if (!acknowledgment) return false;

  if (maxAge && acknowledgment.acknowledgedAt < maxAge) {
    return false; // Too old, needs re-acknowledgment
  }

  return true;
}

// Usage in order submission:
async function submitOrder(req: SubmitOrderRequest, userId: string) {
  // Verify all required disclosures
  const disclosuresValid = await Promise.all([
    verifyDisclosureAcknowledged(userId, 'RISK_WARNING'),
    verifyDisclosureAcknowledged(userId, 'FEE_DISCLOSURE'),
    verifyDisclosureAcknowledged(userId, 'SUITABILITY'),
    ...(req.assetType === 'OPTION' ? 
      [verifyDisclosureAcknowledged(userId, 'OPTIONS_TRAINING')] : 
      []),
  ]);

  if (!disclosuresValid.every(d => d)) {
    throw new DisclosureNotAcknowledgedException(
      'All required disclosures must be acknowledged'
    );
  }

  // Proceed with order
  return orderService.submitOrder(req);
}
```

**Status**: ⏳ Need to implement DisclosureAcknowledgment entity and verification logic

---

## 5. CUSTODY CONTROLS (Since Partner Holds Assets)

### 5.1 Regulatory Framework

**Applicable Rules**:
- SIPC (Securities Investor Protection Act) - Protects customers
- FINRA Rule 4512 (Safeguarding Customer Funds/Securities)
- SEC Rule 15c3-3 (Customer Protection Rule)
- CFTC Regulation 1.20 (Safeguarding Customer Funds)

**Key Concept**: You don't hold custody, but you have responsibility to:
1. Verify partner is properly segregating customer funds
2. Establish controls to verify asset reconciliation
3. Ensure no commingling of customer funds with broker's own funds

### 5.2 Verification at Onboarding

**Before routing first order, verify with partner broker that**:

```
☑️ Customer Account Setup
   - Partner confirms account opened in customer's legal name
   - Account number assigned
   - Account properly segregated (not omnibus account)
   - Regulatory status verified (SIPC/SILO coverage)

☑️ Custody Structure
   - Funds held in customer name (not broker name)
   - Segregated account maintained (not commingled)
   - Subaccount structure documented (if applicable)
   - Delivery vs Payment (DVP) process documented

☑️ Risk Controls
   - Max position limits (per customer, per symbol)
   - Max notional exposure (per customer)
   - Leverage limits (margin requirements)
   - Counterparty credit limits

☑️ Data Exchange
   - Real-time account data feed (balances, positions)
   - Daily reconciliation procedure
   - Error correction process
   - Dispute resolution procedure
```

**Implement in Code**:

```typescript
@Entity()
class BrokerVerification {
  @PrimaryColumn('uuid')
  id: string = uuidv4();

  @Column('uuid')
  accountId: string;

  @Column()
  brokerName: string; // "Interactive Brokers", "Schwab", etc.

  @Column()
  brokerAccountNumber: string; // Link to partner's system

  @Column()
  segregationStatus: 
    'SEGREGATED' | // Customer's own account
    'OMNIBUS' | // commingled but tracked
    'UNKNOWN';

  @Column()
  sipicCoverage: number; // $500,000 for securities

  @Column()
  fdicCoverage: number; // $250,000 for cash (via Evolve)

  @Column()
  maxPositionSize?: number; // Per-position limit set by broker

  @Column()
  maxNotionalExposure?: number; // Total exposure limit

  @Column()
  marginAllowed: boolean; // Does broker allow margin?

  @Column()
  maintenanceMarginRequirement?: number; // 25-35% typically

  @CreateDateColumn()
  verificationDate: Date;

  @Column()
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED';

  @Column()
  verificationDetails: string; // JSON or notes about verification

  @Column()
  nextReVerificationDate: Date; // Annual re-verification
}
```

### 5.3 Daily Reconciliation

**What to reconcile daily**:
```
1. Cash Balance
   - Our records: Account.cashBalance
   - Partner records: API call to get broker balance
   - Difference must be < $0.01 (rounding tolerance)

2. Positions
   - Our records: Position entities with quantity, value
   - Partner records: API call to get broker positions
   - Difference must be zero (exact match required)

3. Pending Orders
   - Our records: Order.status = "PENDING" plus quantity
   - Partner records: Open orders in broker system
   - All open orders must match exactly

4. Fills
   - Our records: Order.status = "FILLED"
   - Partner records: Historical fills
   - Match by: order ID, symbol, quantity, price, timestamp
```

**Implementation**:

```typescript
async function dailyReconciliation(accountId: string) {
  const account = await accountRepository.findOne({ where: { accountId } });
  const brokerService = getBrokerService();

  // Get our records
  const ourCash = account.cashBalance;
  const ourPositions = await positionRepository.find({ 
    where: { accountId },
    order: { symbol: 'ASC' },
  });
  const ourOpenOrders = await orderRepository.find({
    where: { accountId, status: 'PENDING' },
  });

  // Get broker records
  const brokerData = await brokerService.getAccountData(
    account.brokerAccountNumber
  );

  // Reconcile cash
  const cashDifference = (ourCash.toNumber() - brokerData.cash).abs();
  if (cashDifference > 0.01) {
    await createReconciliationException({
      accountId,
      type: 'CASH_MISMATCH',
      ourValue: ourCash,
      brokerValue: brokerData.cash,
      difference: cashDifference,
      severity: 'HIGH',
    });
  }

  // Reconcile positions
  for (const ourPosition of ourPositions) {
    const brokerPosition = brokerData.positions.find(
      p => p.symbol === ourPosition.symbol
    );

    if (!brokerPosition || brokerPosition.quantity !== ourPosition.quantity.toNumber()) {
      await createReconciliationException({
        accountId,
        type: 'POSITION_MISMATCH',
        symbol: ourPosition.symbol,
        ourQuantity: ourPosition.quantity,
        brokerQuantity: brokerPosition?.quantity,
        severity: 'CRITICAL', // Stop trading until resolved
      });
    }
  }

  // Reconcile pending orders


  // Log successful reconciliation
  await reconciliationLog.create({
    accountId,
    reconciliationDate: new Date(),
    cashMatch: cashDifference < 0.01,
    positionsMatch: /* all must match */,
    ordersMatch: /* all must match */,
    status: 'PASSED' | 'FAILED_WITH_EXCEPTIONS',
    exceptionCount: /* number of issues found */,
  });
}

// Run daily at 4:00 AM ET (after market close + overnight settlement)
schedule.scheduleJob('0 4 * * 1-5', async () => {
  const accounts = await accountRepository.find({
    where: { accountStatus: 'ACTIVE' },
  });

  for (const account of accounts) {
    try {
      await dailyReconciliation(account.id);
    } catch (error) {
      await alertComplianceTeam({
        title: 'Reconciliation Failed',
        accountId: account.id,
        error: error.message,
        severity: 'HIGH',
      });
    }
  }
});
```

### 5.4 Exception Handling

**What constitutes a reconciliation break**:

```typescript
enum ReconciliationException {
  CASH_MISMATCH = 'CASH_MISMATCH', // Our $10k vs Broker $9,999
  POSITION_MISMATCH = 'POSITION_MISMATCH', // We think 100 shares, broker has 99
  ORDER_MISMATCH = 'ORDER_MISMATCH', // Order in our system not at broker
  FILL_MISMATCH = 'FILL_MISMATCH', // Fill reported by broker not in our records
  TIMING_ISSUE = 'TIMING_ISSUE', // Data not yet synchronized (24hr window)
}

@Entity()
class ReconciliationException {
  @PrimaryColumn('uuid')
  id: string = uuidv4();

  @Column('uuid')
  accountId: string;

  @Column()
  exceptionType: ReconciliationException;

  @Column()
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column('jsonb')
  details: {
    ourValue: any,
    brokerValue: any,
    difference: string,
  };

  @Column()
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'ESCALATED';

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  resolvedAt?: Date;

  @Column()
  resolutionDetails?: string;

  @Column()
  resolvedBy?: string; // Compliance officer ID

  @Column()
  falsePositive: boolean = false; // Was it actually a system error?
}

// Resolution logic:
async function resolveReconciliationException(
  exceptionId: string,
  resolution: 'RECONCILED' | 'TIMING_DELAY' | 'SYSTEM_ERROR' | 'ESCALATE',
  notes: string
) {
  const exception = await exceptionRepository.findOne({
    where: { id: exceptionId },
  });

  exception.status = 
    resolution === 'RECONCILED' ? 'RESOLVED' :
    resolution === 'TIMING_DELAY' ? 'RESOLVED' :
    resolution === 'SYSTEM_ERROR' ? 'RESOLVED' :
    'ESCALATED';

  exception.resolutionDetails = notes;
  exception.resolvedAt = new Date();
  exception.falsePositive = 
    resolution === 'TIMING_DELAY' || resolution === 'SYSTEM_ERROR';

  if (resolution === 'ESCALATE') {
    // Alert compliance and management
    await alertManagement({
      title: 'Critical Reconciliation Exception',
      exception: exception,
      action: 'MANUAL_REVIEW_REQUIRED',
    });
  }

  await exceptionRepository.save(exception);
}
```

**Timeline for Resolution**:
- LOW: Resolve within 5 business days
- MEDIUM: Resolve within 2 business days
- HIGH: Resolve within 1 business day
- CRITICAL: Resolve within 24 hours

### 5.5 Partner Broker Communication

**Establish SLA with partner broker**:

```
SERVICE LEVEL AGREEMENT (SLA) - Custody & Reconciliation Requirements

1. Account Information
   - New account opening: confirmed within 1 business day
   - Account data feed: real-time or updated by 9:30 AM ET daily
   - Account statements: generated daily by 8:00 AM ET

2. Reconciliation Support
   - Respond to reconciliation exceptions: within 1 business day
   - Provide detailed transaction records: within 4 hours of request
   - Maintain audit trail logs: available for 7 years minimum

3. Fund Segregation
   - Customer funds must be segregated (not omnibus)
   - SIPC coverage must apply to each customer account
   - No commingling with broker's proprietary funds
   - Monthly certification of segregation status

4. Data Exchange Standards
   - Account balance data (cash, margin, buying power)
   - Open positions with real-time pricing
   - Order confirmations and fills
   - Transaction history (daily settlement)
   - Market data (symbols, bid/ask, last sale price)

5. Error Correction Process
   - Identified errors: corrected within 1 business day
   - Dispute resolution: escalated to compliance if not resolved in 5 days
   - Root cause analysis: provided for material errors
```

**Implementation**:

```typescript
@Entity()
class BrokerAgreement {
  @PrimaryColumn()
  id: string = 'master-agreement'

  @Column()
  brokerName: string

  @Column()
  contractDate: Date

  @Column()
  renewalDate: Date

  @Column('jsonb')
  sla: {
    accountOpeningTime: string, // "1 business day"
    dataFeedFrequency: string, // "real-time" or "daily 9:30 AM ET"
    statementDelivery: string, // "daily 8:00 AM ET"
    exceptionResponseTime: string, // "1 business day"
    segregationCertification: string, // "monthly"
  }

  @Column()
  signatoryFromPartner: string

  @Column()
  dateOfSignature: Date

  @Column()
  lastAuditDate?: Date

  @Column()
  nextAuditDate: Date // Annual audit of compliance
}

// Verify compliance monthly:
async function verifySLACompliance(month: Date) {
  const brokerAgreement = await brokerAgreementRepository.findOne({
    where: { id: 'master-agreement' },
  });

  const metrics = {
    accountOpeningsOnTime: await getAccountOpeningMetrics(month),
    dataFeedUptime: await getDataFeedMetrics(month),
    exceptionResponseTime: await getExceptionResponseMetrics(month),
    errorCorrectionTime: await getErrorCorrectionMetrics(month),
    segregationStatus: await getSegregationCertification(month),
  };

  const report = {
    month,
    compliant: Object.values(metrics).every(m => m.onTarget),
    metrics,
    generatedAt: new Date(),
  };

  return report;
}
```

### 5.6 Third-Party Custody Audit

**Annual Third-Party Audit Requirements**:

Each year (recommend Q1), engage independent auditor to verify:

```
AUDIT SCOPE - CUSTODY CONTROLS FOR DERIVATIVES TRADING PLATFORM

1. Segregation Verification
   ☑ Customer funds are segregated from broker's own funds
   ☑ Omnibus accounts (if used) have proper sub-accounting
   ☑ No unauthorized use of customer funds for broker trades
   ☑ Compliance with segregation requirements

2. Account Reconciliation
   ☑ Daily/weekly reconciliation procedures are documented
   ☑ Reconciliation breaks are investigated and resolved
   ☑ Exception logs are maintained with resolution trails
   ☑ Sample reconciliation testing: 30 accounts x 12 months

3. Data Integrity
   ☑ Account records match broker's records (sample verification)
   ☑ Order records are complete and accurate
   ☑ Fill records match between platform and broker
   ☑ Position valuations are accurate and timely

4. Controls Over Fund Movements
   ☑ Deposit instructions match customer intent
   ☑ Withdrawal requests are properly authorized
   ☑ No unauthorized transfers
   ☑ Broker's clearing processes verified

5. Documentation
   ☑ Broker agreements are current and signed
   ☑ Account verification documents exist
   ☑ SIPC/SILO coverage letters on file
   ☑ Segregation certifications from broker
   ☑ Audit trail logs are complete

AUDIT REPORT SHOULD INCLUDE:
- Compliance with SEC Rule 15c3-3
- SIPC coverage adequacy
- Remediation recommendations if issues found
- Attestation letter
```

**Implementation**:

```typescript
@Entity()
class CustodyAuditReport {
  @PrimaryColumn('uuid')
  id: string = uuidv4();

  @Column()
  auditFirmName: string; // "Big 4 or local CPA firm"

  @Column()
  auditPeriod: string; // "Calendar Year 2026"

  @Column()
  auditDate: Date;

  @Column()
  reportDeliveryDate: Date;

  @Column('jsonb')
  findings: {
    compliant: boolean,
    segregationStatus: 'COMPLIANT' | 'REMEDIATION_NEEDED',
    reconciliationControls: 'STRONG' | 'ACCEPTABLE' | 'WEAK',
    dataIntegrityIssues: string[],
    recommendedActions: string[],
  }

  @Column()
  auditorSignature: string; // Digital signature or handwritten scan

  @Column()
  auditorLicense: string; // CPA license #

  @Column()
  nextAuditDue: Date; // Usually next year same time

  @Column()
  comments: string; // Additional notes
}

// Track audit follow-up:
@Entity()
class AuditFinding {
  @PrimaryColumn('uuid')
  id: string = uuidv4();

  @Column('uuid')
  auditReportId: string;

  @Column()
  category: 'SEGREGATION' | 'RECONCILIATION' | 'DATA_INTEGRITY' | 'CONTROL';

  @Column()
  severity: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column()
  description: string;

  @Column()
  recommendedAction: string;

  @Column()
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WAIVED';

  @Column()
  targetResolutionDate: Date;

  @Column()
  actualResolutionDate?: Date;

  @Column()
  resolutionDetails?: string;

  @Column()
  approvedBy?: string; // Compliance officer or external auditor
}
```

**Status**: ⏳ Need to implement BrokerVerification, reconciliation jobs, and AuditReport entities

---

## 6. SUMMARY: WHAT'S REQUIRED IN CODEBASE

### 6.1 Database Entities to Add/Modify

**New Entities**:
- ✅ ComplianceLog (immutable audit log)
- ✅ RequestLog (API audit trail)
- ✅ DisclosureAcknowledgment (track user disclosures)
- ✅ BrokerVerification (verify partner custody setup)
- ✅ ReconciliationException (track daily reconciliation breaks)
- ✅ BrokerAgreement (SLA terms and verification)
- ✅ CustodyAuditReport (annual third-party audit results)
- ✅ AuditFinding (follow-up on audit recommendations)

**Modify Existing Entities**:
- ✅ User.ts: Add OFAC fields, CDD data, KYC tracking
- ✅ Account.ts: Add beneficial owners, OFAC status, max limits
- ✅ Fee.ts: Add disclosure version, acknowledgment tracking
- ✅ LedgerEntry.ts: Add immutability constraint (DB trigger)

### 6.2 Services/Controllers to Add

**New Services**:
- ✅ ComplianceService - KYC/AML/OFAC logic
- ✅ ReconciliationService - Daily broker reconciliation
- ✅ AuditService - Compliance reporting
- ✅ DisclosureService - Track user acknowledgments

**Modify Existing Services**:
- ✅ AuthService: Call OFAC screening on user registration
- ✅ OrderService: Check disclosures before order submission
- ✅ FeeService: Track fee disclosures and acknowledgments

### 6.3 Compliance Jobs to Implement

- ✅ OFAC screening (on user creation)
- ✅ Daily OFAC re-screening (weekly minimum)
- ✅ Daily broker reconciliation (4 AM ET)
- ✅ Reconciliation exception investigation (daily)
- ✅ Annual SLA compliance report (monthly review)
- ✅ Data archival/retention (annual)

### 6.4 Required Documentation

- ✅ KYC Policy (document what you collect and why)
- ✅ OFAC Policy (how you screen and resolve false positives)
- ✅ Recordkeeping Policy (retention, archival, audit trails)
- ✅ Custody Policy (partner broker verification)
- ✅ Disclosure Policy (what disclosures required when)
- ✅ Compliance Manual (complete procedures)

---

## 7. ITEMS REQUIRING LEGAL REVIEW

| Item | Required Action | Timeline |
|------|-----------------|----------|
| **DEPENDS: LAWYER - Beneficial Ownership** | Determine if platform must collect or if partner broker's collection is sufficient for regulatory exam | Before launch |
| **DEPENDS: LAWYER - OFAC Blocking Logic** | Confirm whether blocked customers can appeal or must be absolutely prohibited | Before launch |
| **DEPENDS: LAWYER - Deletion vs Retention** | Clarify whether 5-year retention means you can delete after 5 years or must retain indefinitely after closure | After 1 year |
| **DEPENDS: LAWYER - Suitability Duty** | Define scope of suitability assessment (questionnaire vs. advisor consultation) | Before launch |
| **DEPENDS: LAWYER - Custody SLA** | Draft and execute SLA with partner broker before going live | Before launch |
| **DEPENDS: LAWYER - AML Program** | Submit complete AML program to FinCEN or relevant regulator | Before launch |
| **DEPENDS: LAWYER - State Money Transmitter** | Determine if platform needs state money transmission license (likely NO but verify per state) | Before launch |
| **DEPENDS: LAWYER - Fiduciary Duty** | If you provide any advice/recommendations, determine if you have fiduciary duty | Before launch |

---

## 8. IMPLEMENTATION TIMELINE

### Pre-Launch (Weeks 1-4)
- [ ] Draft KYC/AML Policy
- [ ] Draft OFAC Policy
- [ ] Draft Custody Policy
- [ ] Select OFAC screening service
- [ ] Finalize Broker SLA
- [ ] Implement DisclosureAcknowledgment entity

### Launch (Week 5)
- [ ] All disclosures displayed and acknowledged
- [ ] OFAC screening on user registration
- [ ] KYC flow with Persona + source of funds questions

### Post-Launch (Weeks 6-12)
- [ ] Daily reconciliation job implemented
- [ ] ReconciliationException tracking
- [ ] Weekly OFAC re-screening
- [ ] ComplianceLog and audit trail
- [ ] Admin dashboard for compliance events

### Ongoing (Annual)
- [ ] Third-party custody audit
- [ ] SLA compliance review
- [ ] Data archival/retention
- [ ] OFAC policy updates

---

## 9. CONTACTS & RESOURCES

### Regulatory Agencies
- **FinCEN** (AML/KYC): 800-767-2946, www.fincen.gov
- **SEC** (Broker Issues): 202-551-5500, www.sec.gov
- **CFTC** (Derivatives): 202-418-5000, www.cftc.gov
- **OFAC** (Sanctions): 202-622-2490, www.treasury.gov/ofac

### Compliance Vendors
- **OFAC Screening**: Trulioo ($1-5 per screen), Plaid, Accuity
- **KYC Verification**: Persona ($0.50-$2 per verify), Socure, IDology
- **Banking**: Evolve Bank (FDIC, ACH processing)
- **Audit**: Big 4 or local CPA firms with fintech experience

### Reference Documents
- [SEC Rule 17a-3 (Record Requirements)](https://www.law.cornell.edu/cfr/text/17/240.17a-3)
- [SEC Rule 17a-4 (Recordkeeping)](https://www.law.cornell.edu/cfr/text/17/240.17a-4)
- [FinCEN CIP Requirements (31 CFR 1020.210)](https://www.law.cornell.edu/cfr/text/31/1020.210)
- [OCC Options Disclosure](https://www.theocc.com/about/publications/character-risks.jsp)
- [SIPC Coverage](https://www.sipc.org/investors/what-sipc-protects)

---

**Last Updated**: February 2026  
**Next Review**: Monthly for first 6 months, then quarterly
