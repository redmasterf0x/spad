# SPAD MVP - Revenue & Fee Model

## Executive Summary

SPAD is a **commission-based platform** that earns revenue from the spread between customer-facing fees and partner broker costs.

- **Customer Fee Rate**: 0.5% per trade
- **Partner Cost Rate**: 0.2% per trade  
- **Net Spread**: 0.3% = Our Growth Margin

---

## Simple Fee Model

### Formula: Revenue per Trade

```
Gross Customer Fee = Order Notional Value × Customer Fee Rate
Partner Broker Cost = Order Notional Value × Partner Cost Rate
Our Revenue = Gross Customer Fee - Partner Broker Cost

Or Simplified:
Our Revenue = Order Notional Value × (Customer Rate - Partner Rate)
```

### Example Calculation

**Scenario**: Customer buys 100 shares of SPY at $450

| Parameter | Value |
|-----------|-------|
| **Symbol** | SPY |
| **Quantity** | 100 shares |
| **Price** | $450/share |
| **Order Notional Value** | 100 × $450 = **$45,000** |
| **Customer Fee Rate** | 0.5% (standard) |
| **Partner Broker Rate** | 0.2% (negotiated with broker) |
| **Spread Margin** | 0.3% (ours) |
| | |
| **Gross Customer Fee** | $45,000 × 0.5% = **$225.00** |
| **Partner Broker Cost** | $45,000 × 0.2% = **$90.00** |
| **Our Net Revenue** | $225.00 - $90.00 = **$135.00** |
| **Our Margin %** | $135 / $45,000 = **0.30%** |

---

## Larger Trade Example

**Scenario**: Customer buys 1000 shares of QQQ at $400

| Parameter | Value |
|-----------|-------|
| **Symbol** | QQQ |
| **Quantity** | 1,000 shares |
| **Price** | $400/share |
| **Order Notional Value** | 1,000 × $400 = **$400,000** |
| **Customer Rate** | 0.5% |
| **Partner Rate** | 0.2% |
| | |
| **We Charge Customer** | $400,000 × 0.5% = **$2,000.00** |
| **We Pay Partner** | $400,000 × 0.2% = **$800.00** |
| **We Keep** | **$1,200.00** |

---

## Alternative Fee Structures (Future Considerations)

### Tiered Fee Model
- **Tier 1**: 0-$100k monthly volume → 0.5% fee
- **Tier 2**: $100k-$500k volume → 0.4% fee  
- **Tier 3**: >$500k volume → 0.3% fee

**Rationale**: Incentivizes higher volume; partner broker likely gives us better rates at scale.

### Per-Contract Fees (for Options/Futures)
- **Options**: $0.65 per contract (instead of %)
  - Customer pays $0.65/contract
  - Partner costs $0.15/contract  
  - We make $0.50/contract
  
- **Futures**: $2.50 per round-turn (buy & sell)
  - Our cost: $1.00/RT
  - Our margin: $1.50/RT

### Premium Tier Features (Future)
- **Level 2 Market Data**: +$5/month
- **Advanced Charting**: +$10/month
- **API Access**: +$100/month

---

## Monthly Revenue Projection

**Target**: $500k monthly volume in first 6 months

### Month 1: Low Adoption
- **Total Trading Volume**: $75,000
- **Trades Executed**: 15
- **Average Trade Size**: $5,000
- **Customer Fees**: $75,000 × 0.5% = **$375**
- **Partner Costs**: $75,000 × 0.2% = **$150**
- **Our Revenue**: **$225**

### Month 3: Ramp-Up
- **Total Trading Volume**: $350,000
- **Trades Executed**: 70
- **Average Trade Size**: $5,000
- **Customer Fees**: $350,000 × 0.5% = **$1,750**
- **Partner Costs**: $350,000 × 0.2% = **$700**
- **Our Revenue**: **$1,050**

### Month 6: Target Volume
- **Total Trading Volume**: $500,000
- **Trades Executed**: 100
- **Average Trade Size**: $5,000
- **Customer Fees**: $500,000 × 0.5% = **$2,500**
- **Partner Costs**: $500,000 × 0.2% = **$1,000**
- **Our Revenue**: **$1,500**

**Cumulative 6-Month Revenue**:
```
Sum of monthly revenue: $225 + $225 + $1,050 + $1,050 + $1,350 + $1,500 = ~$6,400
(assuming exponential ramp from Month 1→3, then linear growth)
```

---

## Cost Structure

### Fixed Monthly Operating Costs (Assumed)

| Category | Estimated Monthly | Notes |
|----------|------------------|-------|
| **Infrastructure** | $2,000 | AWS (compute, DB, CDN) |
| **Persona KYC** | $500 | Per inquiry at ~$10-15/user |
| **Evolve Banking** | $1,000 | ACH transaction fees (~0.1% of volume) |
| **Partner Broker Commission** | Variable | See per-trade costs above |
| **Credit Card Processing** | Variable | ~2.9% + $0.30 if using Stripe |
| **Compliance/Legal** | $3,000 | Legal advice, audit prep |
| **Salaries (Lean Team)** | $15,000 | 2-3 engineers + PM |
| **Monitoring/Security** | $1,000 | Datadog, code scanning |
| **Miscellaneous** | $1,000 | Insurance, tools, software |
| | |
| **Total Fixed + Variable** | **~$23,500** (baseline) |

**Note**: Partner broker commission is the main variable cost, baked into our "0.2% partner cost" above.

---

## Break-Even Analysis

```
Monthly Fixed Costs: $23,500
Per-Trade Margin: 0.3% of notional value

At $5,000 average trade:
- Revenue per trade: $5,000 × 0.3% = $15
- Trades needed to break even: $23,500 / $15 = 1,567 trades/month

At 70 trades/month (Month 3 volume):
- Monthly revenue: $1,050
- Monthly loss: $23,500 - $1,050 = -$22,450

At 100 trades/month (Month 6 volume):
- Monthly revenue: $1,500  
- Monthly loss: $23,500 - $1,500 = -$22,000
```

**Implication**: Platform is unprofitable at $500k/month volume due to fixed costs. Would need ~$2M+ monthly volume to achieve profitability (assuming no cost increases).

**Mitigation Strategies**:
1. Reduce fixed costs (outsource compliance, use managed services)
2. Increase customer fees to 0.75% or 1.0%
3. Add additional revenue streams (premium features, data feeds)
4. Negotiate better broker rates as volume increases
5. Target higher-margin products (options have wider spreads than futures)

---

## Pricing Strategy Rationale

### Why 0.5% Fee?
- **Competitive**: Most retail brokers charge 0.1-1.0% on derivatives
- **Simple**: Easy to explain to customers
- **Sustainable**: Partner broker rates typically 0.15-0.25%, we have 0.25% room
- **Growth**: Tiered discounts can incentivize volume

### Why 0.2% Partner Cost?
- **Negotiated Rate**: Based on typical B2B broker splits
- **Volume Dependent**: As volume grows, we can negotiate lower partner rates (0.1-0.15%)
- **Assumable**: Conservative estimate for MVP planning

### Why Not Higher?
- **Competition Risk**: Robinhood, TD Ameritrade offer nearly free options trading
- **Regulatory**: No regulation = no protection from undercutting by bigger players
- **Customer Acquisition**: Can't be 2x+ more expensive than alternatives
- **Sustainability**: Tight margins force operational efficiency (good)

---

## Revenue Reporting (Admin Dashboard)

### Daily Revenue Report

```json
{
  "date": "2026-02-17",
  "total_trades": 12,
  "total_volume_notional": 60000.00,
  "customer_fees": 300.00,
  "partner_costs": 120.00,
  "gross_profit": 180.00,
  "by_symbol": {
    "SPY": {
      "trades": 7,
      "volume": 35000.00,
      "customer_fees": 175.00,
      "partner_costs": 70.00,
      "profit": 105.00
    },
    "QQQ": {
      "trades": 5,
      "volume": 25000.00,
      "customer_fees": 125.00,
      "partner_costs": 50.00,
      "profit": 75.00
    }
  }
}
```

### Monthly Revenue Report

```json
{
  "period": "2026-02",
  "total_trades": 250,
  "total_volume_notional": 1250000.00,
  "customer_fees": 6250.00,
  "partner_costs": 2500.00,
  "gross_profit": 3750.00,
  "operating_expenses": 23500.00,
  "net_loss": -19750.00,
  "metrics": {
    "average_trade_size": 5000.00,
    "profit_per_trade": 15.00,
    "customer_acquisition_cost": 250.00,
    "lifetime_value_per_customer": 500.00
  }
}
```

---

## Fee Display to Customer

When user places a $10,000 order:

```
╔════════════════════════════════════════╗
║       Order Summary                     ║
╠════════════════════════════════════════╣
║ Symbol:         SPY                    ║
║ Side:           BUY                    ║
║ Quantity:       22 shares              ║
║ Price:          $450.00                ║
║ ─────────────────────────────────────  ║
║ Subtotal:       $9,900.00              ║
║ Fee (0.5%):     $49.50                 ║
║ ═════════════════════════════════════  ║
║ Total Cost:     $9,949.50              ║
╚════════════════════════════════════════╝
```

**Transparency Note**: We do NOT show partner cost or our margin to customer (competitive secret). We just show total fee charged.

---

## Regulatory Considerations

### Fee Disclosure
- All fees must be disclosed **before order submission**
- No hidden fees allowed
- Fees must be "reasonable" per SEC Rule 10b-10 (applies to brokers)
- We're unregulated but follow best practices anyway

### Fee Adjustment Policy
- Fees can change with 30 days notice
- Changes must not apply to orders already placed
- We document all fee changes in audit log

---

## Future Revenue Opportunities

1. **Interest on Cash Balances**: 2-4% APY (via Evolve sweep account)
2. **Options Spreads**: Wider spreads on illiquid contracts
3. **Premium Data**: Real-time Level 2 quotes, IV analytics
4. **API Access**: Professional tier access at $100-500/month
5. **Referral Program**: $50 per referred verified user
6. **Lending**: Margin loans at 8-12% (long-term, not MVP)
7. **Affiliate Partnerships**: Refer to tax software, financial planning tools

---

## Summary

| Metric | Value |
|--------|-------|
| Customer Fee Rate | 0.5% |
| Partner Cost Rate | 0.2% |
| Net Spread | 0.3% |
| Target Monthly Volume | $500k |
| Revenue at Target | $1,500 |
| Monthly Costs | ~$23,500 |
| Break-Even Volume | ~$2M/month |
| Profitability Timeline | 12-18 months (at scale) |

This model is **simple, transparent, and sustainable** for an MVP. As the platform grows, we can optimize costs and increase volume to reach profitability.
