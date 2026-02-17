# SPAD MVP Trading Platform - Architecture

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  React SPA (Web UI)                                              │  │
│  │  - Auth (Login/2FA)                                              │  │
│  │  - Dashboard (Portfolio, P&L)                                    │  │
│  │  - Trading Interface (Options/Futures Order Entry)               │  │
│  │  - Account Management (Deposit/Withdraw)                         │  │
│  │  - KYC Flow Integration (Persona iFrame)                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                      HTTPS (mTLS for sensitive routes)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY & AUTH LAYER                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Express.js / Hapi Server (or similar)                           │  │
│  │  - JWT auth middleware                                           │  │
│  │  - Rate limiting (per user, per endpoint)                        │  │
│  │  - Request validation                                            │  │
│  │  - Logging & monitoring                                          │  │
│  │  - Error handling                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
          │                         │                         │
          ▼                         ▼                         ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │ Auth Service │         │ Trading Svc  │         │Account Svc   │
    │              │         │              │         │              │
    │ - Register   │         │ - Order mgmt │         │ - User acct  │
    │ - Login      │         │ - Position   │         │ - Balance    │
    │ - 2FA        │         │   tracking   │         │ - KYC status │
    │ - JWT issue  │         │ - Ledger sync│         │ - Fee calc   │
    └──────────────┘         └──────────────┘         └──────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
    ┌──────────────────────────────────────────────────────────────┐
    │          CORE DATA LAYER (PostgreSQL)                        │
    │                                                              │
    │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
    │  │ Users      │  │ Accounts   │  │ Orders     │             │
    │  ├────────────┤  ├────────────┤  ├────────────┤             │
    │  │ id (PK)    │  │ id (PK)    │  │ id (PK)    │             │
    │  │ email      │  │ user_id    │  │ account_id │             │
    │  │ kyc_status │  │ currency   │  │ symbol     │             │
    │  │ kyc_data   │  │ balance    │  │ order_type │             │
    │  │ persona_id │  │ margin_avl │  │ quantity   │             │
    │  │ created_at │  │ created_at │  │ price      │             │
    │  └────────────┘  └────────────┘  │ status     │             │
    │                                   │ partner_id │             │
    │  ┌────────────┐  ┌────────────┐  │ fees       │             │
    │  │ Ledger     │  │ Fees       │  │ created_at │             │
    │  ├────────────┤  ├────────────┤  └────────────┘             │
    │  │ id (PK)    │  │ id (PK)    │                             │
    │  │ account_id │  │ order_id   │  ┌────────────┐             │
    │  │ debit/cred │  │ category   │  │ Positions  │             │
    │  │ amount     │  │ amount     │  ├────────────┤             │
    │  │ type       │  │ fee_type   │  │ id (PK)    │             │
    │  │ order_id   │  │ created_at │  │ account_id │             │
    │  │ created_at │  └────────────┘  │ symbol     │             │
    │  └────────────┘                   │ quantity   │             │
    │                                   │ open_price │             │
    │                                   │ current_pl │             │
    │                                   │ updated_at │             │
    │                                   └────────────┘             │
    │                                                              │
    │  WITH REPLICATION & BACKUP TO WARM STANDBY                 │
    └──────────────────────────────────────────────────────────────┘
          │                         │                         │
          ▼                         ▼                         ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │ Persona      │         │ Partner      │         │ Evolve       │
    │ (KYC/AML)    │         │ Broker API   │         │ (Banking)    │
    │              │         │              │         │              │
    │ - KYC flows  │         │ - Order exec │         │ - ACH setup  │
    │ - Document   │         │ - Settlement │         │ - Balance    │
    │   upload     │         │ - Positions  │         │   inquiry    │
    │ - Verification         │ - Account    │         │ - Transfers  │
    │ - Weighted   │         │   sync       │         │ - ACH trans  │
    │   score      │         │              │         │              │
    └──────────────┘         └──────────────┘         └──────────────┘


## Data Flow: Trade Execution

1. User submits order (React UI) → API validates → Checks KYC status (must be verified)
2. Checks balance/margin (DB) → Calculates fees
3. Routes order to Partner Broker API → Gets order_id back
4. Stores order in DB with partner_id
5. Partner confirms execution → Webhook received
6. Update order status + create ledger entries (debit trading account, credit fees/clearing)
7. Update positions in DB
8. User sees execution in portal

## Data Flow: Deposit (via Evolve)

1. User initiates ACH in UI
2. System creates ACH request via Evolve API
3. Evolve confirms transfer initiated
4. Bank clears ACH (1-2 days)
5. Webhook from Evolve notifies system
6. DB balance updated (ledger entry created)
7. User sees balance update

## Key Integration Points

### Partner Broker Integration
- **Order Submission**: POST /orders with symbol, quantity, price, order_type
- **Order Status**: Polling or WebSocket for execution updates
- **Settlement**: Automatic after broker confirms (T+1 for most derivatives)
- **Position Sync**: Daily reconciliation

### Persona KYC Integration
- **Embedded Flow**: iFrame in React for document collection
- **Webhook**: Persona notifies on document completion
- **Status**: PENDING → VERIFIED → REJECTED
- **Re-verification**: Required if >25% ownership change or annual refresh

### Evolve Banking Integration
- **ACH Setup**: User provides routing/account via secure form
- **ACH Initiation**: POST /ach with amount, direction (in/out)
- **Status**: REQUESTED → PROCESSING → COMPLETED/FAILED
- **Webhook**: Evolve confirms settlement (T+1, same-day after agreement)
- **Rate Limits**: Max $25k per transaction, $250k daily (can adjust)

## Infrastructure (MVP Phase 1)

- **Compute**: 2-3 EC2 instances (1 API, 1 DB primary, 1 DB replica/backup)
- **Database**: PostgreSQL 15+ with SSL, automated backups
- **Auth**: JWT (RS256), refresh tokens in secure httpOnly cookies
- **Secrets**: AWS Secrets Manager for API keys (Persona, Broker, Evolve)
- **Monitoring**: CloudWatch + Datadog for logs/metrics
- **CDN**: CloudFront for static React assets
- **VPC**: Private DB subnet, public API subnet, NAT gateway for outbound

## Compliance Notes

- **Unregulated**: No broker-dealer license needed (partner holds it)
- **Money Transmission**: Evolve holds MSB license for ACH
- **AML/KYC**: Persona handles Level 1 KYC, we store results
- **Recordkeeping**: All orders, positions, ledger entries logged for 5+ years
- **Customer Funds**: Held at Evolve (bank) + broker (clearing), not our balance sheet
