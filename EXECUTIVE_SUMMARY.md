# SPAD MVP - Executive Summary

## Overview

**SPAD** is a fintech platform that provides US retail investors access to derivatives trading (options & futures) through a web-based interface. The platform routes all orders through a regulated partner broker, handling customer onboarding, KYC compliance, ACH banking, and revenue collection.

**Model**: Route orders through partner broker, earn spread between customer fees (0.5%) and partner costs (0.2%).

---

## Key Differentiators

1. **Unregulated Play**: SPAD itself is not regulated; our partner broker holds the license
   - Faster time-to-market (no broker-dealer registration)
   - Lower regulatory burden
   - Faster scaling

2. **Simple Fee Structure**: 0.5% per trade (flat) vs. competitors' complex models
   - Easy for customers to understand
   - 0.3% margin per trade for SPAD
   - Competitive with Robinhood, Tastytrade

3. **Full Compliance Pipeline**: Persona (KYC/AML) + Evolve (Banking) + Partner Broker (Execution)
   - Outsourced compliance reduces headcount needs
   - Mitigates regulatory risk

4. **Small Footprint**: 
   - 2-3 engineers for MVP
   - No broker-dealer infrastructure needed
   - $23.5k/month operating costs at scale

---

## Market Opportunity

**TAM** (Total Addressable Market):
- ~40 million retail investors in US
- ~15% trade options/futures (~6 million)
- Average trading volume per active trader: $50k-$200k/year
- **Market size**: $300B+ annual options trading volume in US

**Competitors**:
- **Robinhood** (dominant, $free/$5/month premium)
- **TD Ameritrade** (0.65/contract options)
- **Interactive Brokers** (0.5% commission, competitive)
- **E*TRADE** (0.65/contract)
- **Tastytrade** (0.1-0.2/contract, niche)

**SPAD Positioning**: Simple, transparent, competitive pricing. Target: retail traders, platform simplicity over features.

---

## Product Overview

### Phase 1: MVP (Weeks 1-10)
- **Web UI only**: Login, trading, account management
- **Asset Classes**: Stocks options, futures (tradeable via partner broker)
- **Geography**: US only
- **Custody**: Third-party (Evolve for banking, partner broker for clearing)
- **KYC**: Persona (identity + address verification)
- **Banking**: ACH via Evolve (deposit/withdraw)
- **Execution**: Route to partner broker

### Phase 2: Growth (Months 4-6)
- Mobile app
- Algorithmic trading (API)
- Copy trading / social features
- Advanced charting

### Phase 3: Scale (Year 2)
- International expansion (Canada, EU)
- Margin trading
- IPO/SPAC access
- Lending (margin loans)

---

## Revenue Model

### Simple Math
```
Customer Fee: 0.5% per trade
Partner Broker Cost: 0.2% per trade
Our Revenue: 0.3% per trade
```

### Example
```
Customer buys $10,000 of SPY
Customer pays fee: $10,000 × 0.5% = $50
Partner broker costs: $10,000 × 0.2% = $20
SPAD revenue: $50 - $20 = $30
```

### 6-Month Projections

| Month | Volume | Trades | Revenue | Cumulative |
|-------|--------|--------|---------|-----------|
| 1 | $75k | 15 | $225 | $225 |
| 2 | $150k | 30 | $450 | $675 |
| 3 | $350k | 70 | $1,050 | $1,725 |
| 4 | $400k | 80 | $1,200 | $2,925 |
| 5 | $450k | 90 | $1,350 | $4,275 |
| 6 | $500k | 100 | $1,500 | $5,775 |

**Note**: Platform unprofitable at $500k/month ($23.5k/month costs). Break-even at ~$2M/month volume.

---

## Go-To-Market Strategy

### Launch Strategy
1. **Private Beta** (Week 1-2 post-launch): 20-30 friends/family
2. **Closed Beta** (Week 3-4): 100-200 early users (ProductHunt, Twitter, Reddit)
3. **Public Launch** (Week 5+): Open signups, marketing blitz

### Acquisition Channels
- **Organic**: Twitter, Reddit, trading communities
- **Paid**: Google Ads, Reddit ads (low CAC, high LTV for traders)
- **Partnerships**: Trading education platforms, YouTube channels
- **Referral**: $50/verified user program (future)

### Target User
- Age: 25-40
- Income: >$60k
- Interests: Investing, options trading, tech-savvy
- Pain point: Complex fees, slow platforms, poor UX

---

## Financial Projections

### Year 1

| Metric | Value |
|--------|-------|
| **Revenue (Year 1)** | ~$36k (ramp from $225/mo to $5k/mo by end of year) |
| **Operating Costs** | ~$280k (mostly salaries) |
| **Net Loss** | -$244k |
| **Active Users (EOY)** | 2,000 |
| **Verified Users (EOY)** | 1,500 |
| **AUM (EOY)** | ~$15M |

### Year 2 (With Growth)

Assumptions:
- 3x growth in trading volume
- Reduce developer headcount to 1 (hire PM, ops, support)
- Negotiate better broker rates (0.15% instead of 0.2%)
- Add referral fees & premium features

| Metric | Value |
|--------|-------|
| **Revenue (Year 2)** | ~$500k |
| **Operating Costs** | ~$400k |
| **Net Profit/Loss** | ~$100k (breakeven by Q4) |
| **Active Users (EOY)** | 25,000 |
| **Verified Users (EOY)** | 20,000 |
| **AUM (EOY)** | ~$200M |

---

## Team & Hiring

### MVP Phase (Weeks 1-10)
- **1 Lead Engineer** (full-stack capable, 10+ yrs exp)
- **1-2 Senior Engineers** (backend + frontend split)
- **1 PM** (product strategy, partner coordination)

**Budget**: ~$200k for 3 months (contractor rates: $150-200/hr)

### Launch Phase (Weeks 11+)
- Hire customer support (part-time)
- Hire operations/compliance (part-time)
- Consider second PM for growth

### Key Hires for Phase 2
- Mobile engineer (iOS + Android)
- DevOps engineer
- Compliance officer (part-time)
- Marketing/Growth manager

---

## Regulatory & Compliance

### SPAD's Regulatory Position
- **SPAD itself**: Unregulated (no broker-dealer license)
- **Partner broker**: Regulated (SEC-registered, FINRA member, SIPC member)
- **Banking**: Evolve (MSB license, FDIC partner)
- **KYC/AML**: Persona handles, we store results

### Regulatory Requirements (Tier 1)
- ✅ **KYC/AML**: Persona + compliance rules
- ✅ **Recordkeeping**: 5+ years (SEC Rule 17a-4)
- ✅ **Privacy**: GLBA compliance (no sale of customer data)
- ✅ **Disclosures**: Risk disclosures, fee transparency
- ✅ **Anti-fraud**: Monitoring for wash sales, spoofing, etc.

### FYI: What We Avoid
- ❌ No margin trading (too risky, requires capital)
- ❌ No proprietary trading (conflict of interest)
- ❌ No price improvement (executors responsibility)
- ❌ No dark pools (not regulated)

### Compliance Timeline
- **MVP Launch**: Basic KYC/AML, recordkeeping in place
- **Month 3**: SOC 2 Type I audit initiated
- **Year 1**: SOC 2 Type II attestation target
- **Year 2**: Consider external audit firm certification

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Partner broker cuts relationship** | Critical | Diversify to 2-3 brokers, API-agnostic architecture |
| **Regulatory crackdown** | Critical | Consult securities lawyer, monitor SEC/CFTC guidance |
| **Evolve banking issues** | High | Daily reconciliation, backup manual ACH process |
| **Security breach** | High | Annual pen testing, SOC 2 audit, cyber insurance |
| **User churn** | Medium | Product-market fit validation, competitive pricing |
| **Volume doesn't materialize** | Medium | Acquisition strategy, pivot to education/API |
| **Competitor undercuts us** | Medium | Brand loyalty, community, features (not just price) |

---

## Technical Highlights

### Architecture
```
React UI (web) → Node.js API → PostgreSQL → Partner APIs
                    ↓
    Persona (KYC) + Evolve (Banking) + Broker (Trading)
```

### Security
- ✅ TLS 1.3 encryption
- ✅ JWT authentication (RS256)
- ✅ 2FA (Google Authenticator)
- ✅ Database encryption at rest
- ✅ Webhook signature verification
- ✅ IP whitelisting for integrations
- ✅ Rate limiting & DDoS protection

### Scalability
- Horizontal scaling: Docker containers on EC2
- Database: PostgreSQL with read replicas
- Cache: Redis for rate limiting, session storage
- CDN: CloudFront for React assets

### Infrastructure Costs (Estimated)
| Service | Monthly | Notes |
|---------|---------|-------|
| AWS EC2 | $800 | 2-3 instances |
| RDS PostgreSQL | $400 | Multi-AZ |
| Data Transfer | $300 | API + webhooks |
| CloudFront | $150 | React assets |
| Monitoring | $100 | Datadog |
| **Total** | **$1,750** | Scales with volume |

---

## Success Metrics & KPIs

### User Metrics
- **DAU** (Daily Active Users): Target 30% of registered users
- **MAU** (Monthly Active Users): Target 50% of registered users
- **Verification Rate** (KYC completed): Target 80%+
- **Churn Rate**: Target <5%/month

### Trading Metrics
- **Avg Order Value**: $5,000-$10,000 per trade
- **Orders/User/Month**: 2-5 for retail traders
- **Fill Rate**: >99% (broker executes)
- **Cancellation Rate**: <5% of submitted orders

### Financial Metrics
- **Revenue per User**: Target $20/month active
- **Customer Acquisition Cost**: Target <$200 (via organic)
- **Lifetime Value**: Target >$2,000 (1 year active)
- **Gross Margin**: 60%+ (after partner costs)

### Operational Metrics
- **Uptime**: Target 99.5%+ (measured daily)
- **Latency (P95)**: <500ms for order submission
- **Error Rate**: <0.5% failed trades (user/system)
- **Support Response**: <24 hours for critical issues

---

## Exit Opportunities

1. **Acquisition by Larger Broker** (2-3 years)
   - Robinhood, E*TRADE, TD Ameritrade could acquire for product + users
   - Valuation: $10M-$50M based on user base & revenue

2. **Merger with FinTech Platform**
   - Wealthfront, Betterment, other robo-advisors could add trading
   - Valuation: $20M-$100M based on synergies

3. **IPO** (5+ years)
   - Scale to $50M+ revenue
   - Valuation: $500M-$2B (similar to Robinhood, Coinbase)

4. **Private Equity** (3-5 years)
   - Growth equity round to scale to profitability
   - Exit via secondary or strategic sale

---

## Conclusion

**SPAD is a high-growth, low-complexity FinTech play** that solves UX/pricing pain points in derivatives trading without regulatory burden (via partner broker).

### Why Now?
- Retail options trading up 400% since 2019
- Tech-savvy users want simple, transparent platforms
- Unregulated model proven (Robinhood, Wealthfront) with growing acceptance

### Why SPAD?
- Simple fee model (0.5% vs. confusing competitors)
- Transparent (no hidden costs)
- Fast execution (partner broker handles clearing)
- Outsourced compliance (Persona + Evolve)

### Why It Works?
- Low customer acquisition cost (DTC, organic)
- High lifetime value (active traders = repeat business)
- Lean operations (2-3 engineers, no compliance staff)
- Proven revenue model (0.3% margin is sustainable)

### Timeline
- **MVP**: 3 months to $500k monthly trading volume
- **Profitability**: 12-18 months to break-even (requires $2M+ monthly volume)
- **Scale**: Year 2-3, expand to 25k+ users, $200M+ AUM

---

## Appendix: Document Structure

This design includes 6 comprehensive documents:

1. **ARCHITECTURE.md** — High-level system design, data flows, integration points
2. **API_SPECIFICATION.md** — Complete REST API endpoints with examples
3. **DATABASE_SCHEMA.sql** — PostgreSQL schema (tables, indexes, views)
4. **FEE_MODEL.md** — Revenue model with formulas and break-even analysis
5. **SECURITY_CHECKLIST.md** — US-specific security & compliance requirements
6. **IMPLEMENTATION_ROADMAP.md** — 10-week development timeline & tech decisions
7. **EXECUTIVE_SUMMARY.md** — This document

All documents are **production-ready** and can be shared with engineers, lawyers, and investors.

---

**Last Updated**: 2026-02-17  
**Status**: MVP Design Complete (Ready for Implementation)

