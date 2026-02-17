# SPAD MVP - REST API Specification

## Base URL
```
https://api.spad.io/v1
```

All endpoints require JWT Bearer token in `Authorization: Bearer <token>` header (except Auth endpoints).

---

## AUTH ENDPOINTS

### POST /auth/register
Register new user with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password_hash",
  "given_name": "John",
  "family_name": "Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "kyc_status": "PENDING",
  "created_at": "2026-02-17T10:30:00Z",
  "requires_kyc": true
}
```

**Error (409 - Conflict):**
```json
{
  "error": "email_already_exists"
}
```

---

### POST /auth/login
Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password_hash"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "long_random_token",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "kyc_status": "VERIFIED"
  }
}
```

**Errors (401):**
```json
{
  "error": "invalid_credentials"
}
```

---

### POST /auth/refresh
Refresh access token using refresh_token (from HttpOnly cookie).

**Response (200):**
```json
{
  "access_token": "new_token",
  "expires_in": 3600
}
```

---

### POST /auth/2fa/setup
Initiate 2FA setup (TOTP via Google Authenticator).

**Response (200):**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qr_code": "data:image/png;base64,...",
  "backup_codes": ["12345-67890", ...]
}
```

---

### POST /auth/2fa/verify
Verify 2FA code during login.

**Request:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "verified": true,
  "access_token": "..."
}
```

---

## ACCOUNT ENDPOINTS

### GET /accounts
List all accounts for authenticated user.

**Response (200):**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "account_type": "TRADING",
      "currency": "USD",
      "balance": 50000.00,
      "margin_available": 0,
      "equity": 45000.00,
      "created_at": "2026-02-17T10:30:00Z",
      "status": "ACTIVE"
    }
  ]
}
```

---

### GET /accounts/{account_id}
Get single account details.

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "account_type": "TRADING",
  "currency": "USD",
  "balance": 50000.00,
  "equity": 45000.00,
  "buying_power": 50000.00,
  "margin_available": 0,
  "positions_count": 3,
  "open_orders_count": 1,
  "created_at": "2026-02-17T10:30:00Z",
  "iban": "DE89370400440532013000",
  "kyc_status": "VERIFIED"
}
```

---

### POST /accounts/{account_id}/deposits
Initiate ACH deposit via Evolve.

**Request:**
```json
{
  "amount": 10000.00,
  "routing_number": "021000021",
  "account_number": "123456789",
  "account_holder_name": "John Doe",
  "idempotency_key": "uuid-v4"
}
```

**Response (202 - Accepted):**
```json
{
  "id": "uuid",
  "status": "REQUESTED",
  "amount": 10000.00,
  "currency": "USD",
  "type": "ACH_IN",
  "evolve_transfer_id": "evt_12345",
  "estimated_settlement": "2026-02-19T15:00:00Z",
  "created_at": "2026-02-17T10:30:00Z"
}
```

---

### POST /accounts/{account_id}/withdrawals
Initiate ACH withdrawal via Evolve.

**Request:**
```json
{
  "amount": 5000.00,
  "idempotency_key": "uuid-v4"
}
```

**Response (202 - Accepted):**
```json
{
  "id": "uuid",
  "status": "REQUESTED",
  "amount": 5000.00,
  "currency": "USD",
  "type": "ACH_OUT",
  "evolve_transfer_id": "evt_12345",
  "estimated_settlement": "2026-02-19T15:00:00Z",
  "created_at": "2026-02-17T10:30:00Z"
}
```

---

### GET /accounts/{account_id}/transfers
List transfer history.

**Query Params:**
- `limit=50` (max 100)
- `offset=0`
- `status=REQUESTED,COMPLETED,FAILED`

**Response (200):**
```json
{
  "transfers": [
    {
      "id": "uuid",
      "type": "ACH_IN",
      "status": "COMPLETED",
      "amount": 10000.00,
      "created_at": "2026-02-17T10:30:00Z",
      "completed_at": "2026-02-19T15:00:00Z"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

---

## KYC ENDPOINTS

### GET /kyc/status
Get KYC status for user.

**Response (200):**
```json
{
  "status": "PENDING",
  "completed_steps": ["email_verification"],
  "pending_steps": ["identity_verification", "address_verification"],
  "documents_uploaded": 0,
  "persona_inquiry_id": "inq_12345"
}
```

---

### POST /kyc/start
Start KYC flow (returns Persona iFrame token).

**Request:**
```json
{
  "account_id": "uuid"
}
```

**Response (200):**
```json
{
  "template_id": "tmpl_spad_mvp",
  "inquiry_id": "inq_67890",
  "client_token": "ct_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "iframe_url": "https://withpersona.com/verify",
  "expires_in": 3600
}
```

---

### POST /kyc/webhook
Webhook from Persona (server-to-server, IP-whitelisted).

**Request (from Persona):**
```json
{
  "type": "inquiry.completed",
  "inquiry": {
    "id": "inq_12345",
    "status": "completed",
    "fields": [
      {
        "name": "name-first",
        "value": "John"
      },
      {
        "name": "name-last",
        "value": "Doe"
      },
      {
        "name": "address-street-1",
        "value": "123 Main St"
      },
      {
        "name": "address-city",
        "value": "San Francisco"
      },
      {
        "name": "address-subdivision",
        "value": "CA"
      },
      {
        "name": "address-postal-code",
        "value": "94102"
      }
    ],
    "verification": {
      "status": "approved"
    }
  }
}
```

**Response (200):**
```json
{
  "status": "processed"
}
```

---

## TRADING ENDPOINTS

### GET /accounts/{account_id}/orders
List orders for account.

**Query Params:**
- `limit=50`
- `offset=0`
- `status=PENDING,FILLED,REJECTED,CANCELLED`
- `symbol=SPY` (optional)

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "symbol": "SPY",
      "order_type": "LIMIT",
      "side": "BUY",
      "quantity": 10,
      "price": 450.25,
      "filled_quantity": 10,
      "filled_price": 450.25,
      "status": "FILLED",
      "partner_order_id": "broker_order_12345",
      "fee_amount": 25.00,
      "fee_rate": 0.005,
      "created_at": "2026-02-17T10:30:00Z",
      "filled_at": "2026-02-17T10:30:15Z"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

---

### POST /accounts/{account_id}/orders
Submit new order.

**Request:**
```json
{
  "symbol": "SPY",
  "side": "BUY",
  "quantity": 10,
  "order_type": "LIMIT",
  "price": 450.25,
  "time_in_force": "DAY",
  "idempotency_key": "uuid-v4"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "account_id": "uuid",
  "symbol": "SPY",
  "side": "BUY",
  "quantity": 10,
  "order_type": "LIMIT",
  "price": 450.25,
  "status": "PENDING",
  "fee_amount": 22.50,
  "fee_rate": 0.005,
  "total_cost": 4522.50,
  "created_at": "2026-02-17T10:30:00Z"
}
```

**Errors (400/403):**
```json
{
  "error": "insufficient_buying_power",
  "required": 4522.50,
  "available": 3000.00
}
```

or

```json
{
  "error": "kyc_not_verified",
  "kyc_status": "PENDING"
}
```

---

### GET /accounts/{account_id}/orders/{order_id}
Get order details.

**Response (200):**
```json
{
  "id": "uuid",
  "symbol": "SPY",
  "side": "BUY",
  "quantity": 10,
  "price": 450.25,
  "status": "FILLED",
  "filled_quantity": 10,
  "filled_price": 450.25,
  "fee_amount": 25.00,
  "fee_rate": 0.005,
  "partner_order_id": "broker_order_12345",
  "partner_status": "executed",
  "created_at": "2026-02-17T10:30:00Z",
  "filled_at": "2026-02-17T10:30:15Z"
}
```

---

### POST /accounts/{account_id}/orders/{order_id}/cancel
Cancel pending order.

**Response (200):**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelled_at": "2026-02-17T10:35:00Z"
}
```

---

### GET /accounts/{account_id}/positions
List open positions.

**Response (200):**
```json
{
  "positions": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "symbol": "SPY",
      "quantity": 10,
      "average_open_price": 450.25,
      "current_price": 455.00,
      "current_value": 4550.00,
      "unrealized_pl": 47.50,
      "unrealized_pl_pct": 1.05,
      "side": "LONG",
      "opened_at": "2026-02-17T10:30:00Z"
    }
  ],
  "total": 3,
  "portfolio_value": 45000.00,
  "total_pl": 1250.00
}
```

---

## REPORTING ENDPOINTS

### GET /accounts/{account_id}/statement
Account statement (for internal revenue reporting).

**Query Params:**
- `start_date=2026-02-01`
- `end_date=2026-02-28`

**Response (200):**
```json
{
  "account_id": "uuid",
  "period": {
    "start": "2026-02-01",
    "end": "2026-02-28"
  },
  "opening_balance": 50000.00,
  "deposits": 25000.00,
  "withdrawals": 5000.00,
  "trading_pl": 150.00,
  "fees_paid": 500.00,
  "closing_balance": 69650.00,
  "trades_executed": 12,
  "average_trade_size": 5000.00,
  "commissions_paid": [
    {
      "date": "2026-02-17",
      "fee_amount": 25.00,
      "order_id": "uuid"
    }
  ]
}
```

---

### GET /admin/dashboard
Admin dashboard (requires ADMIN role).

**Response (200):**
```json
{
  "platform": {
    "active_users": 45,
    "verified_users": 38,
    "pending_kyc": 7,
    "total_aum": 1850000.00,
    "monthly_revenue_est": 9250.00,
    "total_trades": 234,
    "avg_trade_value": 5000.00
  },
  "broker_connection": {
    "status": "connected",
    "last_sync": "2026-02-17T10:45:00Z",
    "pending_syncs": 0,
    "failed_orders": 0
  },
  "evolve_connection": {
    "status": "connected",
    "pending_transfers": 3,
    "total_deposits_pending": 25000.00,
    "total_deposits_completed": 125000.00
  },
  "persona_connection": {
    "status": "connected",
    "daily_inquiries": 5,
    "monthly_inquiries": 45
  }
}
```

---

### GET /admin/revenue?period=monthly
Admin revenue report (ADMIN only).

**Response (200):**
```json
{
  "period": "monthly",
  "report_date": "2026-02-28",
  "total_revenue": 9250.00,
  "revenue_breakdown": {
    "trading_fees": 9250.00,
    "other_fees": 0
  },
  "by_symbol": [
    {
      "symbol": "SPY",
      "trades": 45,
      "volume_notional": 900000.00,
      "revenue": 4500.00
    },
    {
      "symbol": "QQQ",
      "trades": 35,
      "volume_notional": 700000.00,
      "revenue": 3500.00
    }
  ],
  "partner_costs": {
    "total": 1850.00,
    "by_symbol": {
      "SPY": 1800.00,
      "QQQ": 50.00
    }
  },
  "gross_profit": 7400.00
}
```

---

## ERROR RESPONSES

All errors return standard format:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "status_code": 400,
  "request_id": "req_12345"
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `invalid_credentials` | 401 | Email/password incorrect |
| `kyc_not_verified` | 403 | User KYC not complete |
| `insufficient_buying_power` | 403 | Not enough cash/margin |
| `symbol_not_supported` | 400 | Derivative not tradeable |
| `order_not_found` | 404 | Order ID doesn't exist |
| `account_not_found` | 404 | Account ID doesn't exist |
| `rate_limit_exceeded` | 429 | Too many requests |
| `evolve_transfer_failed` | 502 | Banking service error |
| `broker_connection_error` | 502 | Partner broker unavailable |

---

## RATE LIMITS

- **Auth endpoints**: 5 req/min per email
- **Trading endpoints**: 30 req/min per user
- **General endpoints**: 100 req/min per user
- **Admin endpoints**: 20 req/min per admin

Rate limit headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1645014000
```

---

## IDEMPOTENCY

For state-changing endpoints (orders, transfers), include `idempotency_key` header (UUID v4):

```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

If duplicate request received within 24 hours, returns cached response with `Idempotency-Replay: true` header.

---

## WEBHOOKS (Inbound)

### Partner Broker Order Execution
Async notification when order fills.

**Payload:**
```json
{
  "type": "order.executed",
  "broker_order_id": "broker_12345",
  "our_order_id": "uuid",
  "status": "filled",
  "filled_quantity": 10,
  "filled_price": 450.25,
  "commission": 22.50,
  "timestamp": "2026-02-17T10:30:15Z"
}
```

### Evolve ACH Status Update
Banking transfer status change.

**Payload:**
```json
{
  "type": "transfer.completed",
  "transfer_id": "evt_12345",
  "our_transfer_id": "uuid",
  "status": "completed",
  "amount": 10000.00,
  "completed_at": "2026-02-19T15:00:00Z"
}
```

### Persona KYC Completion
User verification complete.

**Payload:**
```json
{
  "type": "inquiry.completed",
  "inquiry_id": "inq_12345",
  "status": "completed",
  "verification": {
    "status": "approved"
  }
}
```
