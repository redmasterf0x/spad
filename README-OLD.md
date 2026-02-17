# SPAD MVP - US Derivatives Trading Platform

**Status**: MVP Design Complete (Ready for Implementation)  
**Timeline**: 3 months to launch (10 weeks development)  
**Team**: 2-3 engineers + 1 PM

---

## What is SPAD?

SPAD is a fintech platform that provides retail investors access to derivatives trading (options & futures) through a simple web interface. All orders are routed through a regulated partner broker, handling customer onboarding, KYC compliance, ACH banking, and revenue collection.

**Model**: Route orders through partner broker, earn spread between customer fees (0.5%) and partner costs (0.2%).

```
Web (React) → API (Node.js) → Database (PostgreSQL) → Partner Broker/Evolve/Persona
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** | Business overview, market opportunity, financial projections |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | High-level system design, data flows, integration points |
| **[API_SPECIFICATION.md](API_SPECIFICATION.md)** | Complete REST API endpoints with request/response examples |
| **[DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql)** | PostgreSQL schema (tables, indexes, materialized views) |
| **[FEE_MODEL.md](FEE_MODEL.md)** | Revenue model with formulas, break-even analysis, projections |
| **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** | US-specific security & compliance (SEC, CFTC, AML) |
| **[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)** | 10-week development timeline, tech stack, milestones |
| **[DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md)** | Quick reference guide, common gotchas, testing |

---

## Quick Facts

- **Asset Type**: Derivatives (options/futures)
- **Geography**: US only
- **Custody**: Third-party (Evolve bank + partner broker clearing)
- **Execution**: Route all orders to partner broker
- **Target Volume**: $500k/month (first 6 months)
- **Margin**: No (MVP phase)
- **Regulatory**: Unregulated entity (using partner's licenses)
- **Currency**: USD only
- **KYC**: Persona (identity + address)
- **Banking**: Evolve (ACH transfers)
- **Timeline**: 3 months to launch
- **Access**: Web UI only (MVP)

---

## Revenue Model

### Formula
```
Customer Fee: 0.5% per trade
Partner Broker Cost: 0.2% per trade
Our Revenue: 0.3% per trade
```

### Example
```
Customer buys $10,000 of SPY
Customer pays: $10,000 × 0.5% = $50
Partner costs: $10,000 × 0.2% = $20
SPAD keeps: $30
```

### 6-Month Trajectory
| Month | Volume | Revenue |
|-------|--------|---------|
| 1 | $75k | $225 |
| 3 | $350k | $1,050 |
| 6 | $500k | $1,500 |

---

## Technology Stack

```
Frontend:   React 18 + TypeScript + TailwindCSS
Backend:    Node.js + Express.js + TypeScript
Database:   PostgreSQL 15 (AWS RDS)
Auth:       JWT (RS256) + 2FA (TOTP)
State:      Zustand + TanStack Query
Hosting:    AWS (EC2 + RDS + CloudFront)
```

---

## System Architecture

```
┌─────────────────────────────────────┐
│       React Web UI                  │
│  (Login, Trading, Accounts, KYC)    │
└────────────────┬────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────┐
│    Node.js + Express API            │
│  (Auth, Rate Limit, Validation)     │
└────────────────┬────────────────────┘
                 │
    ┌────────────┼────────────┬──────────┐
    ▼            ▼            ▼          ▼
┌─────────┐ ┌────────┐ ┌───────────┐ ┌────────┐
│PostgreSQL│ │ Persona│ │  Evolve   │ │ Broker │
│(Core DB) │ │ (KYC)  │ │ (Banking) │ │(Trading)
└─────────┘ └────────┘ └───────────┘ └────────┘
```

---

## Core Features

### MVP Phase
- User registration & 2FA
- KYC/AML (Persona iFrame)
- ACH deposits & withdrawals
- Order entry & execution
- Position tracking
- P&L reporting
- Double-entry ledger
- Fee charging (0.5%)
- Admin dashboard
- Compliance audit trail

### Data Model
- **Users** - With KYC data from Persona
- **Accounts** - USD-only trading accounts
- **Orders** - With partner broker tracking
- **Positions** - Real-time P&L
- **Ledger** - Double-entry accounting
- **Fees** - Track partner costs

---

## Security (US-Specific)

✅ **Authentication**: JWT (RS256) + 2FA + HttpOnly cookies  
✅ **Encryption**: TLS 1.3 + database encryption at rest  
✅ **Data Protection**: Parameterized queries, input validation, CORS  
✅ **KYC/AML**: Persona + OFAC screening  
✅ **Recordkeeping**: 5+ years (SEC Rule 17a-4)  
✅ **Compliance**: Webhook signature verification, rate limiting  
✅ **Audit Trail**: All actions logged for SEC/CFTC review  

---

## Implementation Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| **Architecture** | Weeks 1-2 | Backend, Frontend, Integrations |
| **Core Trading** | Weeks 3-6 | Orders, Positions, Fees, Ledger |
| **Banking** | Weeks 5-7 | Deposits, Withdrawals, ACH |
| **KYC** | Weeks 4-7 | Persona, Compliance, ToS |
| **Admin** | Weeks 6-8 | Dashboard, Revenue Reports |
| **Testing** | Weeks 7-9 | QA, Security, Load Testing |
| **Launch** | Week 10+ | Beta & Public Launch |

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Unregulated** | Fast to market (no broker registration) |
| **Partner Broker** | Clearing, risk transfer, revenue model |
| **Persona KYC** | iFrame UX, quick verification, OFAC |
| **Evolve Banking** | MSB license, ACH, regulatory |
| **Node.js + React** | Development speed, ecosystem, scalability |
| **PostgreSQL** | ACID, financial data, JSON support |
| **0.5% Fees** | Competitive, sustainable model |

---

## Financial Overview

### Year 1
- Revenue: ~$36k
- Costs: ~$280k
- Loss: -$244k
- Users: 2,000

### Year 2
- Revenue: ~$500k
- Costs: ~$400k
- Profit: ~$100k
- Users: 25,000

**Note**: Break-even requires ~$2M/month volume

---

## Getting Started

### For Business
- Read [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)
- Review [FEE_MODEL.md](FEE_MODEL.md)

### For Product
- Study [ARCHITECTURE.md](ARCHITECTURE.md)
- Review [API_SPECIFICATION.md](API_SPECIFICATION.md)

### For Engineering
- Read [DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md)
- Study [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql)
- Review [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

---

## Key Success Metrics

| Metric | Target |
|--------|--------|
| **Users (Month 3)** | 100+ registered, 30+ verified |
| **Volume (Month 6)** | $500k/month |
| **Uptime** | 99.5%+ |
| **Latency (P95)** | <500ms |
| **Error Rate** | <0.5% |

---

## FAQ

**Q: Is this legal?**  
A: Yes. Unregulated platforms are legal if they don't hold customer funds. We route to a regulated partner.

**Q: How do you make money?**  
A: 0.3% spread per trade (customers pay 0.5%, partner costs 0.2%).

**Q: What if the partner broker shuts down?**  
A: We can switch brokers. Customer funds are held by broker/clearinghouse, not us.

**Q: Can this be profitable?**  
A: Yes, at scale. Break-even at ~$2M/month trading volume.

---

## Resources

- [SEC Rules](https://www.sec.gov/rules/)
- [FINRA Rulebook](https://www.finra.org/rules-guidance/)
- [OWASP Security](https://owasp.org/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Docs](https://react.dev/)

---

**Status**: ✅ MVP Design Complete  
**Last Updated**: 2026-02-17  
**Ready for**: Implementation Phase
