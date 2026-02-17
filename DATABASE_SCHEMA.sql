-- SPAD MVP - PostgreSQL Schema
-- Version: 1.0
-- Description: Complete database schema for US derivatives trading platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profile
  given_name VARCHAR(100) NOT NULL,
  family_name VARCHAR(100) NOT NULL,
  
  -- 2FA
  totp_secret VARCHAR(255),
  totp_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],
  
  -- KYC Status (Persona integration)
  kyc_status VARCHAR(50) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
  persona_inquiry_id VARCHAR(255),
  kyc_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- KYC Data (from Persona)
  kyc_data JSONB, -- Stores: {given_name, family_name, dob, address_street, address_city, address_state, address_zip, ssn_last4, phone}
  
  -- Compliance
  pep_check_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED, FAILED
  sanctions_check_status VARCHAR(50) DEFAULT 'PENDING',
  
  -- Account Status
  account_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  suspension_reason VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  last_login_at TIMESTAMP WITH TIME ZONE,
  ip_address_registered VARCHAR(45),
  user_agent_registered TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- ACCOUNTS & BALANCES
-- ============================================================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Account Type
  account_type VARCHAR(50) NOT NULL DEFAULT 'TRADING' CHECK (account_type IN ('TRADING', 'DEMO')),
  account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'CLOSED', 'RESTRICTED')),
  
  -- Currency (USD only in MVP)
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  
  -- Balances (in account currency)
  cash_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  reserved_balance DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Holds for pending orders
  
  -- Buying Power (no margin in MVP)
  margin_available DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (margin_available = 0),
  
  -- Reconciliation
  broker_account_id VARCHAR(255), -- Partner broker's account identifier
  evolve_account_id VARCHAR(255), -- Evolve banking account identifier
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Computed fields (materialized, refreshed hourly)
  total_positions_value DECIMAL(15, 2) DEFAULT 0,
  total_pl DECIMAL(15, 2) DEFAULT 0,
  equity DECIMAL(15, 2) DEFAULT 0
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_status ON accounts(account_status);
CREATE INDEX idx_accounts_broker_account_id ON accounts(broker_account_id);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- Enforce user has at least 1 active account
CREATE UNIQUE INDEX idx_accounts_one_active_per_user ON accounts(user_id) 
  WHERE account_status = 'ACTIVE' AND deleted_at IS NULL;

-- ============================================================================
-- ORDERS & TRADING
-- ============================================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  -- Order Details
  symbol VARCHAR(20) NOT NULL, -- SPY, QQQ, ES, GC, etc.
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('OPTION', 'FUTURE')),
  
  -- For options: include expiry, strike, type
  -- Format: "SPY 25FEB26 450C" for call, "SPY 25FEB26 450P" for put
  option_details JSONB, -- {expiry_date, strike_price, contract_type: 'CALL'|'PUT', multiplier}
  
  -- Order Params
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL(10, 2) NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT')),
  price DECIMAL(12, 4),
  stop_price DECIMAL(12, 4),
  time_in_force VARCHAR(10) NOT NULL DEFAULT 'DAY' CHECK (time_in_force IN ('DAY', 'GTC', 'IOC', 'FOK')),
  
  -- Execution Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'ACCEPTED', 'FILLED', 'PARTIALLY_FILLED', 
    'CANCELLED', 'REJECTED', 'EXPIRED'
  )),
  
  -- Fills
  filled_quantity DECIMAL(10, 2) DEFAULT 0,
  filled_price DECIMAL(12, 4),
  
  -- Partner Broker Integration
  partner_order_id VARCHAR(255), -- Broker's order ID (set when submitted)
  partner_status VARCHAR(50), -- Broker's status
  partner_rejection_reason VARCHAR(255),
  
  -- Fees
  fee_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.005, -- 0.5% default
  fee_amount DECIMAL(12, 2) DEFAULT 0, -- Calculated: filled_quantity * filled_price * fee_rate
  fee_type VARCHAR(50) DEFAULT 'COMMISSION' CHECK (fee_type IN ('COMMISSION', 'SPREAD', 'OTHER')),
  
  -- Idempotency
  idempotency_key VARCHAR(255) UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submitted_to_broker_at TIMESTAMP WITH TIME ZONE,
  filled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Notes
  rejection_reason VARCHAR(255),
  notes TEXT
);

CREATE INDEX idx_orders_account_id ON orders(account_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_partner_order_id ON orders(partner_order_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_filled_at ON orders(filled_at);

-- ============================================================================
-- POSITIONS
-- ============================================================================

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  -- Position Details
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('OPTION', 'FUTURE')),
  option_details JSONB, -- Same structure as orders
  
  -- Holdings
  quantity DECIMAL(10, 2) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  
  -- Cost Basis
  average_open_price DECIMAL(12, 4) NOT NULL,
  total_open_cost DECIMAL(15, 2) NOT NULL, -- quantity * average_open_price
  
  -- Current P&L
  current_price DECIMAL(12, 4), -- Last market price (cached, refreshed via broker feed)
  current_value DECIMAL(15, 2), -- quantity * current_price
  unrealized_pl DECIMAL(15, 2), -- current_value - total_open_cost
  unrealized_pl_pct DECIMAL(6, 2), -- (unrealized_pl / total_open_cost) * 100
  
  -- Realized P&L (when position closed)
  realized_pl DECIMAL(15, 2) DEFAULT 0,
  closed_quantity DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  current_price_updated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_account_id ON positions(account_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);
CREATE INDEX idx_positions_opened_at ON positions(opened_at);

-- ============================================================================
-- DOUBLE-ENTRY LEDGER (for accounting clarity)
-- ============================================================================

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  -- Entry Type
  entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN (
    'ORDER_EXECUTION', 'FEE', 'DEPOSIT', 'WITHDRAWAL', 
    'DIVIDEND', 'INTEREST', 'ADJUSTMENT', 'TRANSFER'
  )),
  
  -- Related Records
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transfer_id UUID, -- References transfers table
  
  -- Double Entry
  debit_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  credit_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  
  -- Currency
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Description
  description VARCHAR(255) NOT NULL,
  metadata JSONB, -- Additional context: {order_symbol, broker_order_id, etc}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX idx_ledger_order_id ON ledger_entries(order_id);
CREATE INDEX idx_ledger_entry_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at);

-- Verify double-entry: every transaction affects at least 2 accounts
-- (can be relaxed to single-account adjustments with a special accounting acct)

-- ============================================================================
-- FEES & REVENUE TRACKING
-- ============================================================================

CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  -- Fee Classification
  fee_category VARCHAR(50) NOT NULL CHECK (fee_category IN (
    'TRADING_COMMISSION', 'SPREAD', 'SLIPPAGE', 'ADMIN', 'OTHER'
  )),
  fee_type VARCHAR(50) NOT NULL,
  
  -- Amount
  gross_fee_amount DECIMAL(12, 2) NOT NULL, -- What customer would pay
  net_fee_amount DECIMAL(12, 2) NOT NULL, -- What we keep (gross - partner cost)
  partner_cost DECIMAL(12, 2) NOT NULL, -- What partner charges us
  
  -- Rates
  customer_rate DECIMAL(5, 4),
  partner_rate DECIMAL(5, 4),
  our_margin DECIMAL(5, 4), -- (customer_rate - partner_rate)
  
  -- Related Data
  notional_value DECIMAL(15, 2), -- Order quantity * price (for % calc)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_fees_account_id ON fees(account_id);
CREATE INDEX idx_fees_order_id ON fees(order_id);
CREATE INDEX idx_fees_created_at ON fees(created_at);

-- ============================================================================
-- TRANSFERS (ACH via Evolve)
-- ============================================================================

CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  -- Transfer Type
  transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('ACH_IN', 'ACH_OUT', 'WIRE_IN', 'WIRE_OUT')),
  
  -- Amount & Currency
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  )),
  
  -- Evolve Integration
  evolve_transfer_id VARCHAR(255), -- Evolve's tracking ID
  evolve_status VARCHAR(50),
  
  -- Bank Details (encrypted in production)
  routing_number VARCHAR(10),
  account_number VARCHAR(20),
  account_holder_name VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_settlement_date DATE,
  
  -- Risk/Compliance
  is_return BOOLEAN DEFAULT FALSE,
  return_reason VARCHAR(255),
  
  -- Idempotency
  idempotency_key VARCHAR(255) UNIQUE,
  
  -- Notes
  notes TEXT
);

CREATE INDEX idx_transfers_account_id ON transfers(account_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_evolve_transfer_id ON transfers(evolve_transfer_id);
CREATE INDEX idx_transfers_created_at ON transfers(created_at);

-- ============================================================================
-- ADMIN & REPORTING
-- ============================================================================

CREATE TABLE revenue_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL UNIQUE,
  
  -- Aggregates
  total_trades_executed INTEGER NOT NULL DEFAULT 0,
  total_trading_volume DECIMAL(18, 2) NOT NULL DEFAULT 0, -- Notional value
  
  -- Revenue
  total_customer_fees DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_partner_costs DECIMAL(15, 2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- By Symbol (stored as JSONB for flexibility)
  revenue_by_symbol JSONB, -- {SPY: {trades: 10, volume: 500k, revenue: 2500}, ...}
  
  -- Users
  daily_active_users INTEGER NOT NULL DEFAULT 0,
  new_verified_users INTEGER NOT NULL DEFAULT 0,
  
  -- Platform
  total_aum DECIMAL(18, 2) NOT NULL DEFAULT 0,
  avg_account_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_daily_date ON revenue_daily(report_date);

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Action
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  
  -- Changes
  changes JSONB, -- {field: {old_value, new_value}, ...}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- ============================================================================
-- RECONCILIATION & AUDIT
-- ============================================================================

CREATE TABLE broker_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reconciliation
  reconciliation_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'MATCHED', 'MISMATCHED')),
  
  -- Counts
  our_order_count INTEGER,
  broker_order_count INTEGER,
  matched_orders INTEGER,
  unmatched_orders INTEGER,
  
  -- Summary
  our_total_volume DECIMAL(18, 2),
  broker_total_volume DECIMAL(18, 2),
  discrepancy_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_reconciliation_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE evolve_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reconciliation
  reconciliation_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'MATCHED', 'MISMATCHED')),
  
  -- Counts
  our_transfer_count INTEGER,
  evolve_transfer_count INTEGER,
  matched_transfers INTEGER,
  
  -- Amounts
  our_total_deposits DECIMAL(18, 2),
  evolve_total_deposits DECIMAL(18, 2),
  our_total_withdrawals DECIMAL(18, 2),
  evolve_total_withdrawals DECIMAL(18, 2),
  
  -- Summary
  discrepancy_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SYSTEM HEALTH & MONITORING
-- ============================================================================

CREATE TABLE api_requests_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Request
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  
  -- Timing
  response_time_ms INTEGER,
  
  -- Error
  error_code VARCHAR(100),
  error_message TEXT,
  
  -- Client
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_requests_user_id ON api_requests_log(user_id);
CREATE INDEX idx_api_requests_endpoint ON api_requests_log(endpoint);
CREATE INDEX idx_api_requests_created_at ON api_requests_log(created_at);
CREATE INDEX idx_api_requests_status ON api_requests_log(status_code);

-- ============================================================================
-- MATERIALIZED VIEWS (for reporting)
-- ============================================================================

CREATE MATERIALIZED VIEW account_summary AS
SELECT
  a.id,
  a.user_id,
  u.email,
  a.currency,
  a.cash_balance,
  COALESCE(a.total_positions_value, 0) AS positions_value,
  (a.cash_balance + COALESCE(a.total_positions_value, 0)) AS equity,
  a.total_pl,
  COUNT(DISTINCT o.id) AS total_trades,
  COUNT(DISTINCT CASE WHEN o.status = 'FILLED' THEN o.id END) AS filled_trades,
  COALESCE(SUM(CASE WHEN o.status = 'FILLED' THEN f.net_fee_amount END), 0) AS total_fees_paid,
  a.created_at
FROM accounts a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN orders o ON a.id = o.account_id
LEFT JOIN fees f ON o.id = f.order_id
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.user_id, u.email, a.currency, a.cash_balance, a.total_positions_value, a.total_pl, a.created_at;

CREATE INDEX idx_account_summary_user_id ON account_summary(user_id);
CREATE INDEX idx_account_summary_equity ON account_summary(equity);

-- ============================================================================
-- VIEWS & HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate account equity (cash + positions)
CREATE OR REPLACE FUNCTION calculate_account_equity(account_id_param UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT (a.cash_balance + COALESCE(SUM(p.current_value), 0))
    FROM accounts a
    LEFT JOIN positions p ON a.id = p.account_id AND p.closed_at IS NULL
    WHERE a.id = account_id_param
    GROUP BY a.cash_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Function to reserve balance for pending order
CREATE OR REPLACE FUNCTION reserve_for_order(
  account_id_param UUID,
  order_quantity DECIMAL,
  order_price DECIMAL,
  fee_rate DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL;
BEGIN
  total_cost := order_quantity * order_price * (1 + fee_rate);
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Update account.updated_at on changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_update_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_account_timestamp();

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Core user records with KYC (Persona) and authentication data';
COMMENT ON TABLE accounts IS 'Trading accounts per user; USD-only in MVP';
COMMENT ON TABLE orders IS 'Orders routed to partner broker; stores partner_order_id for tracking';
COMMENT ON TABLE positions IS 'Open/closed positions with real-time P&L';
COMMENT ON TABLE ledger_entries IS 'Double-entry accounting ledger for cash movements';
COMMENT ON TABLE fees IS 'Fee calculations with partner cost breakdown for revenue reporting';
COMMENT ON TABLE transfers IS 'ACH transfers via Evolve; status synced via webhook';
COMMENT ON TABLE revenue_daily IS 'Daily revenue aggregates for reporting';
COMMENT ON COLUMN orders.partner_order_id IS 'Will be populated when order is submitted to broker';
COMMENT ON COLUMN users.kyc_data IS 'Encrypts: full name, DOB, address, SSN last 4, phone from Persona';
COMMENT ON COLUMN fees.our_margin IS 'Spread = customer_rate - partner_rate; our profit per trade';

-- End of schema
