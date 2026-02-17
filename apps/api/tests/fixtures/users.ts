import { v4 as uuidv4 } from 'uuid';
import { User } from '../../src/entities/User';
import Decimal from 'decimal.js';

export const testUsers = {
  alice: {
    id: uuidv4(),
    email: 'alice@example.com',
    passwordHash: '$2b$10$...hashed...', // Placeholder
    givenName: 'Alice',
    familyName: 'Smith',
    emailVerified: true,
    kycStatus: 'VERIFIED' as const,
    accountStatus: 'ACTIVE' as const,
    pepCheckStatus: 'VERIFIED' as const,
    sanctionsCheckStatus: 'VERIFIED' as const,
  },
  bob: {
    id: uuidv4(),
    email: 'bob@example.com',
    passwordHash: '$2b$10$...hashed...',
    givenName: 'Bob',
    familyName: 'Jones',
    emailVerified: true,
    kycStatus: 'PENDING' as const,
    accountStatus: 'ACTIVE' as const,
    pepCheckStatus: 'PENDING' as const,
    sanctionsCheckStatus: 'PENDING' as const,
  },
};

export const testAccounts = {
  aliceMain: {
    id: uuidv4(),
    userId: testUsers.alice.id,
    accountType: 'TRADING' as const,
    accountStatus: 'ACTIVE' as const,
    currency: 'USD' as const,
    cashBalance: new Decimal('10000.00'),
    reservedBalance: new Decimal('0.00'),
    marginAvailable: new Decimal('0.00'),
    totalPositionsValue: new Decimal('0.00'),
    totalPl: new Decimal('0.00'),
    equity: new Decimal('10000.00'),
  },
  bobMain: {
    id: uuidv4(),
    userId: testUsers.bob.id,
    accountType: 'TRADING' as const,
    accountStatus: 'ACTIVE' as const,
    currency: 'USD' as const,
    cashBalance: new Decimal('5000.00'),
    reservedBalance: new Decimal('0.00'),
    marginAvailable: new Decimal('0.00'),
    totalPositionsValue: new Decimal('0.00'),
    totalPl: new Decimal('0.00'),
    equity: new Decimal('5000.00'),
  },
};

export const testOrders = {
  aliceOrderSPY: {
    id: uuidv4(),
    accountId: testAccounts.aliceMain.id,
    symbol: 'SPY',
    assetType: 'OPTION' as const,
    side: 'BUY' as const,
    quantity: 10,
    orderType: 'LIMIT' as const,
    price: 450.25,
    status: 'PENDING' as const,
    feeRate: 0.005,
    feeAmount: 22.5,
  },
};
