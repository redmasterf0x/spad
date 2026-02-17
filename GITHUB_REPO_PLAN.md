# SPAD MVP - GitHub Repository Plan

## Tech Stack Decision: Node.js/TypeScript vs Python/FastAPI

### Recommendation: **Node.js + TypeScript + Express.js**

#### Justification

| Factor | Node.js/TypeScript | Python/FastAPI | Winner |
|--------|-------------------|-----------------|--------|
| **Development Speed** | ✅ Hot reload, mature tooling | ⚠️ Slower iteration | Node |
| **Type Safety** | ✅ TypeScript (mandatory types) | ⚠️ Optional type hints | Node |
| **Frontend Integration** | ✅ Same language (React, Zustand) | ❌ Separate ecosystem | Node |
| **Team Synergy** | ✅ One language, one mindset | ⚠️ Two ecosystems | Node |
| **Fintech Libraries** | ✅ Joi, Passport, Socket.io | ✅ SQLAlchemy, Pydantic | Tie |
| **Async/Await** | ✅ Native, battle-tested | ✅ asyncio, good but newer | Tie |
| **Deployment** | ✅ Containerization, Lambda ready | ✅ Same | Tie |
| **Performance** | ✅ Low latency (<100ms for API) | ✅ Slightly faster for CPU | Slight Python |
| **Learning Curve** | ✅ JS devs know it | ⚠️ Different paradigm | Node |
| **Hiring Pool** | ✅ Large for Node/TS | ⚠️ Smaller Python pool | Node |

**Why Node.js?**
1. **Single Language**: React (frontend) + Node.js (backend) = shared mental model
2. **Type Safety**: TypeScript prevents financial data bugs (crucial for ledger)
3. **Developer Velocity**: Hot reload = faster iteration in 10-week timeline
4. **Ecosystem**: Socket.io for real-time position updates, Joi for validation
5. **Financial Precedent**: Stripe, Plaid built with Node (proven production use)
6. **Team Composition**: 2-3 engineers, likely JS-experienced

**What we sacrifice**: ~5-10% raw performance (not material for MVP trading volume)

---

## Repository Structure

```
spad/
├── apps/
│   ├── api/                          # Backend API
│   │   ├── src/
│   │   │   ├── config/               # Configuration
│   │   │   │   ├── database.ts
│   │   │   │   ├── env.ts
│   │   │   │   └── secrets.ts
│   │   │   ├── db/
│   │   │   │   ├── migrations/       # SQL migration files
│   │   │   │   │   ├── 001_init_users.sql
│   │   │   │   │   ├── 002_init_accounts.sql
│   │   │   │   │   ├── 003_init_orders.sql
│   │   │   │   │   ├── 004_init_ledger.sql
│   │   │   │   │   ├── 005_init_fees.sql
│   │   │   │   │   └── 006_init_transfers.sql
│   │   │   │   ├── query/            # SQL query builders
│   │   │   │   │   ├── users.sql
│   │   │   │   │   ├── orders.sql
│   │   │   │   │   ├── ledger.sql
│   │   │   │   │   └── fees.sql
│   │   │   │   └── seed/             # Seed data for development
│   │   │   │       └── dev-seed.sql
│   │   │   ├── entities/             # TypeORM Entity definitions
│   │   │   │   ├── User.ts
│   │   │   │   ├── Account.ts
│   │   │   │   ├── Order.ts
│   │   │   │   ├── Position.ts
│   │   │   │   ├── LedgerEntry.ts
│   │   │   │   ├── Fee.ts
│   │   │   │   ├── Transfer.ts
│   │   │   │   └── RevenueStat.ts
│   │   │   ├── services/             # Business logic
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── UserService.ts
│   │   │   │   ├── OrderService.ts
│   │   │   │   ├── LedgerService.ts
│   │   │   │   ├── FeeService.ts
│   │   │   │   ├── BrokerService.ts  # Partner broker integration
│   │   │   │   ├── EvolveService.ts  # Evolve banking integration
│   │   │   │   ├── PersonaService.ts # KYC integration
│   │   │   │   └── AdminService.ts
│   │   │   ├── controllers/          # HTTP request handlers
│   │   │   │   ├── AuthController.ts
│   │   │   │   ├── AccountController.ts
│   │   │   │   ├── OrderController.ts
│   │   │   │   ├── KYCController.ts
│   │   │   │   ├── TransferController.ts
│   │   │   │   └── AdminController.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # JWT verification
│   │   │   │   ├── validation.ts     # Input validation
│   │   │   │   ├── error.ts          # Error handling
│   │   │   │   └── rateLimit.ts      # Rate limiting
│   │   │   ├── webhooks/             # Inbound webhooks
│   │   │   │   ├── PersonaWebhook.ts
│   │   │   │   ├── EvolveWebhook.ts
│   │   │   │   └── BrokerWebhook.ts
│   │   │   ├── utils/
│   │   │   │   ├── crypto.ts         # Encryption, hashing
│   │   │   │   ├── jwt.ts            # JWT utilities
│   │   │   │   ├── validation.ts     # Input validators
│   │   │   │   └── logger.ts         # Logging
│   │   │   ├── types/               # TypeScript interfaces
│   │   │   │   ├── index.ts
│   │   │   │   └── api.ts
│   │   │   └── server.ts            # Express app setup
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   ├── AuthService.test.ts
│   │   │   │   ├── OrderService.test.ts
│   │   │   │   ├── LedgerService.test.ts
│   │   │   │   ├── FeeService.test.ts
│   │   │   │   └── AdminService.test.ts
│   │   │   ├── integration/
│   │   │   │   ├── auth.integration.test.ts
│   │   │   │   ├── orders.integration.test.ts
│   │   │   │   ├── ledger.integration.test.ts
│   │   │   │   ├── webhooks.integration.test.ts
│   │   │   │   └── migrations.integration.test.ts
│   │   │   ├── fixtures/             # Test data
│   │   │   │   ├── users.ts
│   │   │   │   ├── orders.ts
│   │   │   │   └── accounts.ts
│   │   │   └── setup.ts             # Test database setup
│   │   ├── .env.example
│   │   ├── .env.test
│   │   ├── .env.prod
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── web/                          # React Frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── store/               # Zustand state
│       │   ├── api/                 # API client (tanstack query)
│       │   ├── types/
│       │   └── App.tsx
│       ├── tests/
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── db/                          # Shared database utilities
│   │   ├── src/
│   │   │   ├── migrations.ts        # Migration runner
│   │   │   ├── pool.ts              # Connection pooling
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── types/                       # Shared TypeScript types
│       ├── src/
│       │   ├── api.ts              # API types
│       │   ├── database.ts         # Entity types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml              # Local dev environment
├── .gitignore
├── .github/
│   └── workflows/
│       ├── test.yml               # CI/CD: Run tests on push
│       ├── lint.yml               # CI/CD: Linting
│       └── deploy.yml             # CI/CD: Deploy to staging/prod
├── README.md                       # How to set up locally
├── DEVELOPMENT.md                 # Developer guide
├── Makefile                       # Common commands (make test, make migrate, etc)
└── package.json                   # Monorepo root

```

---

## Technology Stack Details

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.0.0",
    "typeorm": "^0.3.15",
    "pg": "^8.10.0",
    "knex": "^2.5.1",
    "jsonwebtoken": "^9.0.1",
    "dotenv": "^16.3.1",
    "joi": "^17.10.0",
    "axios": "^1.4.0",
    "redis": "^4.6.7",
    "bcrypt": "^5.1.0",
    "uuid": "^9.0.0",
    "winston": "^3.10.0",
    "decimal.js": "^10.4.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.12",
    "ts-node": "^10.9.1",
    "eslint": "^8.42.0",
    "@typescript-eslint/parser": "^5.59.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0"
  }
}
```

### Key Choices

| Tool | Why |
|------|-----|
| **Express.js** | Lightweight, battle-tested, minimal opinionation |
| **TypeORM** | Type-safe ORM, works well with financial data |
| **Knex.js** | SQL migrations with control (essential for ledger) |
| **Jest** | Industry standard, great TS support |
| **Joi** | Validation engine (not Zod, as Joi handles async validation) |
| **Decimal.js** | Prevents floating-point errors in money calculations |
| **Winston** | Structured logging (JSON) for compliance audit trail |
| **Redis** | Rate limiting, session store, cache |

---

## Development Workflow

### Local Setup

```bash
# Clone repo
git clone https://github.com/redmasterf0x/spad.git
cd spad

# Install monorepo
npm install

# Setup .env files
cp apps/api/.env.example apps/api/.env
# Edit .env with local PostgreSQL details

# Start PostgreSQL (Docker)
docker-compose up -d

# Run migrations
npm run migrate

# Seed test data
npm run seed:dev

# Start API server
npm run dev:api

# (in another terminal) Start React UI
npm run dev:web
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:migrations
npm run test:auth
npm run test:orders
npm run test:ledger
npm run test:admin

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Formatting
npm run format
```

---

## CI/CD Pipeline (GitHub Actions)

### On Pull Request
- ✅ Run all tests (unit + integration)
- ✅ TypeScript type check
- ✅ ESLint validation
- ✅ Database migrations test (on replica)

### On Merge to Main
- ✅ Deploy to staging environment
- ✅ Run smoke tests
- ✅ Optional: Approval-based deploy to production

---

## Environment Variables

### apps/api/.env

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/spad_dev
DATABASE_URL_TEST=postgresql://user:password@localhost:5432/spad_test
DATABASE_POOL_SIZE=10

# JWT
JWT_SECRET=dev-secret-key-change-in-prod
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Third-party APIs
PERSONA_API_KEY=sandbox_key_xxx
PERSONA_WEBHOOK_SECRET=webhook_secret_xxx

EVOLVE_API_KEY=sandbox_key_xxx
EVOLVE_WEBHOOK_SECRET=webhook_secret_xxx

BROKER_API_KEY=sandbox_key_xxx
BROKER_WEBHOOK_SECRET=webhook_secret_xxx

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

---

## Getting Started with Steps

Each step below has:
- ✅ Complete code files
- ✅ Test examples
- ✅ Run instructions
- ✅ Environment setup

**Step 1**: Database migrations + models  
**Step 2**: Authentication (JWT + refresh tokens)  
**Step 3**: Order placement & broker routing  
**Step 4**: Ledger + fee posting (double-entry)  
**Step 5**: Admin revenue dashboard  

---

## File Generation Strategy

Due to size, I'll create:
- **Full files** for critical logic (services, migrations, tests)
- **Commented structure files** for controllers/middleware
- **Complete test suites** for verification

Total files generated: ~80+ (across both backend and infrastructure)

---

## Next Steps

1. Create comprehensive package.json (dependency list for backend)
2. Step 1: Database setup with TypeORM entities + Knex migrations
3. Step 2: Authentication service + JWT utilities + registration endpoint
4. Step 3: Order service + broker integration + webhook handling
5. Step 4: Ledger service (double-entry bookkeeping)
6. Step 5: Admin service + revenue reporting

---

**Ready to generate code?** Start with repository structure, then follow steps 1-5 below.
