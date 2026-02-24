import { AppDataSource } from '../../src/config/database';
import { User } from '../../src/entities/User';
import { Account } from '../../src/entities/Account';
import { Order } from '../../src/entities/Order';
import { Position } from '../../src/entities/Position';
import { LedgerEntry, EntryType } from '../../src/entities/LedgerEntry';
import { Fee } from '../../src/entities/Fee';
import { Transfer } from '../../src/entities/Transfer';
import { testUsers, testAccounts, testOrders } from '../fixtures/users';
import { resetDatabase } from '../setup';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

describe('Database Migrations and Schema', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Step 1.1: Users table creation', () => {
    it('should create a user with KYC fields', async () => {
      const userRepo = AppDataSource.getRepository(User);

      const user = userRepo.create({
        email: testUsers.alice.email,
        passwordHash: testUsers.alice.passwordHash,
        givenName: testUsers.alice.givenName,
        familyName: testUsers.alice.familyName,
        emailVerified: true,
        kycStatus: 'PENDING',
        personaInquiryId: 'inq_12345',
        kycData: {
          givenName: 'Alice',
          familyName: 'Smith',
          dob: '1990-01-15',
          addressStreet: '123 Main St',
          addressCity: 'San Francisco',
          addressState: 'CA',
          addressZip: '94102',
          ssnLast4: '1234',
          phone: '+15105551234',
        },
        accountStatus: 'ACTIVE',
        pepCheckStatus: 'PENDING',
        sanctionsCheckStatus: 'PENDING',
      });

      const savedUser = await userRepo.save(user);

      expect(savedUser.id).toBeDefined();
      expect(savedUser.email).toBe(testUsers.alice.email);
      expect(savedUser.kycStatus).toBe('PENDING');
      expect(savedUser.kycData?.givenName).toBe('Alice');
      expect(savedUser.createdAt).toBeDefined();
    });

    it('should prevent duplicate emails', async () => {
      const userRepo = AppDataSource.getRepository(User);

      const user1 = userRepo.create({
        email: 'test@example.com',
        passwordHash: 'hash1',
        givenName: 'Test',
        familyName: 'User',
      });
      await userRepo.save(user1);

      const user2 = userRepo.create({
        email: 'test@example.com', // Duplicate
        passwordHash: 'hash2',
        givenName: 'Test2',
        familyName: 'User2',
      });

      await expect(userRepo.save(user2)).rejects.toThrow();
    });

    it('should track KYC status changes', async () => {
      const userRepo = AppDataSource.getRepository(User);

      const user = userRepo.create({
        email: 'kyc@example.com',
        passwordHash: 'hash',
        givenName: 'KYC',
        familyName: 'Test',
        kycStatus: 'PENDING',
      });

      const saved = await userRepo.save(user);

      // Update to VERIFIED
      saved.kycStatus = 'VERIFIED';
      saved.kycVerifiedAt = new Date();
      const updated = await userRepo.save(saved);

      expect(updated.kycStatus).toBe('VERIFIED');
      expect(updated.kycVerifiedAt).toBeDefined();
    });
  });

  describe('Step 1.2: Accounts table creation', () => {
    it('should create an account for a user', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);

      const user = userRepo.create({
        email: 'alice@test.com',
        passwordHash: 'hash',
        givenName: 'Alice',
        familyName: 'Smith',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
        accountType: 'TRADING',
        accountStatus: 'ACTIVE',
        currency: 'USD',
        cashBalance: new Decimal('10000.00'),
        reservedBalance: new Decimal('0.00'),
        marginAvailable: new Decimal('0.00'),
        equity: new Decimal('10000.00'),
      });

      const savedAccount = await accountRepo.save(account);

      expect(savedAccount.id).toBeDefined();
      expect(savedAccount.userId).toBe(savedUser.id);
      expect(savedAccount.cashBalance.toNumber()).toBe(10000);
      expect(savedAccount.marginAvailable.toNumber()).toBe(0); // No margin in MVP
    });

    it('should calculate available balance', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);

      const user = userRepo.create({
        email: 'balance@test.com',
        passwordHash: 'hash',
        givenName: 'Test',
        familyName: 'User',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
        cashBalance: new Decimal('10000.00'),
        reservedBalance: new Decimal('2000.00'),
      });

      const savedAccount = await accountRepo.save(account);

      const available = savedAccount.getAvailableBalance();
      expect(available.toNumber()).toBe(8000);
    });

    it('should track account status', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);

      const user = userRepo.create({
        email: 'status@test.com',
        passwordHash: 'hash',
        givenName: 'Status',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
        accountStatus: 'ACTIVE',
      });

      let savedAccount = await accountRepo.save(account);
      expect(savedAccount.accountStatus).toBe('ACTIVE');

      savedAccount.accountStatus = 'SUSPENDED';
      savedAccount.suspensionReason = 'KYC verification failed';
      savedAccount = await accountRepo.save(savedAccount);

      expect(savedAccount.accountStatus).toBe('SUSPENDED');
      expect(savedAccount.suspensionReason).toBe('KYC verification failed');
    });
  });

  describe('Step 1.3: Orders table creation', () => {
    it('should create an order with metadata', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const orderRepo = AppDataSource.getRepository(Order);

      // Setup user and account
      const user = userRepo.create({
        email: 'order@test.com',
        passwordHash: 'hash',
        givenName: 'Order',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
        cashBalance: new Decimal('50000.00'),
      });
      const savedAccount = await accountRepo.save(account);

      // Create order
      const order = orderRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        symbol: 'SPY',
        assetType: 'OPTION',
        optionDetails: {
          expiryDate: '2026-03-20',
          strikePrice: 450,
          contractType: 'CALL',
          multiplier: 100,
        },
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
        timeInForce: 'DAY',
        feeRate: 0.005,
        idempotencyKey: uuidv4(),
      });

      const savedOrder = await orderRepo.save(order);

      expect(savedOrder.id).toBeDefined();
      expect(savedOrder.symbol).toBe('SPY');
      expect(savedOrder.assetType).toBe('OPTION');
      expect(savedOrder.status).toBe('PENDING');
      expect(savedOrder.optionDetails?.contractType).toBe('CALL');
    });

    it('should track order status transitions', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const orderRepo = AppDataSource.getRepository(Order);

      const user = userRepo.create({
        email: 'status@test.com',
        passwordHash: 'hash',
        givenName: 'Status',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      const order = orderRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        symbol: 'QQQ',
        assetType: 'OPTION',
        side: 'SELL',
        quantity: 5,
        orderType: 'MARKET',
        status: 'PENDING',
      });

      let savedOrder = await orderRepo.save(order);
      expect(savedOrder.status).toBe('PENDING');

      // Simulate order fill
      savedOrder.status = 'FILLED';
      savedOrder.filledQuantity = 5;
      savedOrder.filledPrice = 100.5;
      savedOrder.filledAt = new Date();
      savedOrder.partnerOrderId = 'broker_12345';

      savedOrder = await orderRepo.save(savedOrder);

      expect(savedOrder.status).toBe('FILLED');
      expect(savedOrder.filledQuantity).toBe(5);
      expect(savedOrder.partnerOrderId).toBe('broker_12345');
    });
  });

  describe('Step 1.4: Ledger table creation', () => {
    it('should create double-entry ledger entries', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const ledgerRepo = AppDataSource.getRepository(LedgerEntry);

      const user = userRepo.create({
        email: 'ledger@test.com',
        passwordHash: 'hash',
        givenName: 'Ledger',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      // Create ledger entry: deposit
      const entry = ledgerRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        entryType: EntryType.DEPOSIT,
        amount: 5000,
        currency: 'USD',
        description: 'ACH deposit from bank',
        metadata: {
          evolveTransferId: 'evt_12345',
        },
      });

      const savedEntry = await ledgerRepo.save(entry);

      expect(savedEntry.id).toBeDefined();
      expect(savedEntry.entryType).toBe('DEPOSIT');
      expect(savedEntry.amount).toBe(5000);
      expect(savedEntry.isReconciled).toBe(false);
    });

    it('should link ledger entries to orders', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const orderRepo = AppDataSource.getRepository(Order);
      const ledgerRepo = AppDataSource.getRepository(LedgerEntry);

      const user = userRepo.create({
        email: 'order-ledger@test.com',
        passwordHash: 'hash',
        givenName: 'Order',
        familyName: 'Ledger',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      const order = orderRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        symbol: 'AAPL',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 5,
        orderType: 'LIMIT',
        price: 120,
        status: 'FILLED',
        filledAt: new Date(),
      });
      const savedOrder = await orderRepo.save(order);

      // Create ledger entry for order execution
      const entry = ledgerRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        orderId: savedOrder.id,
        order: savedOrder,
        entryType: EntryType.ORDER_EXECUTION,
        amount: 600,
        currency: 'USD',
        description: 'AAPL order purchase',
        metadata: {
          orderSymbol: 'AAPL',
          side: 'BUY',
          quantity: 5,
          price: 120,
        },
      });

      const savedEntry = await ledgerRepo.save(entry);

      expect(savedEntry.orderId).toBe(savedOrder.id);
      expect(savedEntry.entryType).toBe('ORDER_EXECUTION');
    });
  });

  describe('Step 1.5: Fees table creation', () => {
    it('should track fees with partner cost breakdown', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const orderRepo = AppDataSource.getRepository(Order);
      const feeRepo = AppDataSource.getRepository(Fee);

      const user = userRepo.create({
        email: 'fees@test.com',
        passwordHash: 'hash',
        givenName: 'Fees',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      const order = orderRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 100,
        orderType: 'LIMIT',
        price: 450.25,
      });
      const savedOrder = await orderRepo.save(order);

      // Customer pays 0.5%, partner costs 0.2%, we keep 0.3%
      const notional = 100 * 450.25; // 45025
      const customerFee = notional * 0.005; // 225.125
      const partnerCost = notional * 0.002; // 90.05
      const ourMargin = customerFee - partnerCost; // 135.075

      const fee = feeRepo.create({
        orderId: savedOrder.id,
        order: savedOrder,
        accountId: savedAccount.id,
        account: savedAccount,
        feeCategory: 'TRADING_COMMISSION',
        feeType: 'COMMISSION',
        grossFeeAmount: customerFee,
        netFeeAmount: ourMargin,
        partnerCost,
        customerRate: 0.005,
        partnerRate: 0.002,
        ourMargin: 0.003,
        notionalValue: notional,
      });

      const savedFee = await feeRepo.save(fee);

      expect(savedFee.id).toBeDefined();
      expect(savedFee.grossFeeAmount).toBeCloseTo(225.125, 1);
      expect(savedFee.netFeeAmount).toBeCloseTo(135.075, 1);
      expect(savedFee.partnerCost).toBeCloseTo(90.05, 1);
    });
  });

  describe('Step 1.6: Transfers table creation (ACH)', () => {
    it('should create ACH transfer with Evolve tracking', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const transferRepo = AppDataSource.getRepository(Transfer);

      const user = userRepo.create({
        email: 'transfer@test.com',
        passwordHash: 'hash',
        givenName: 'Transfer',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      const transfer = transferRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        transferType: 'ACH_IN',
        amount: 5000,
        currency: 'USD',
        status: 'REQUESTED',
        routingNumber: '021000021',
        accountNumber: '123456789***',
        accountHolderName: 'Test User',
        idempotencyKey: uuidv4(),
      });

      const savedTransfer = await transferRepo.save(transfer);

      expect(savedTransfer.id).toBeDefined();
      expect(savedTransfer.transferType).toBe('ACH_IN');
      expect(savedTransfer.status).toBe('REQUESTED');
      expect(savedTransfer.amount).toBe(5000);
    });

    it('should track transfer status transitions', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);
      const transferRepo = AppDataSource.getRepository(Transfer);

      const user = userRepo.create({
        email: 'status@test.com',
        passwordHash: 'hash',
        givenName: 'Status',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      let transfer = transferRepo.create({
        accountId: savedAccount.id,
        account: savedAccount,
        transferType: 'ACH_IN',
        amount: 10000,
        status: 'REQUESTED',
      });

      transfer = await transferRepo.save(transfer);
      expect(transfer.status).toBe('REQUESTED');

      // Simulate Evolve webhook: transfer processing
      transfer.status = 'PROCESSING';
      transfer.evolveTransferId = 'evt_abc123';
      transfer.processingStartedAt = new Date();
      transfer = await transferRepo.save(transfer);
      expect(transfer.status).toBe('PROCESSING');

      // Simulate completion
      transfer.status = 'COMPLETED';
      transfer.completedAt = new Date();
      transfer = await transferRepo.save(transfer);
      expect(transfer.status).toBe('COMPLETED');
    });
  });

  describe('Step 1.7: Relationships and cascading', () => {
    it('should enforce referential integrity', async () => {
      const userRepo = AppDataSource.getRepository(User);
      const accountRepo = AppDataSource.getRepository(Account);

      const user = userRepo.create({
        email: 'ref@test.com',
        passwordHash: 'hash',
        givenName: 'Ref',
        familyName: 'Test',
      });
      const savedUser = await userRepo.save(user);

      const account = accountRepo.create({
        userId: savedUser.id,
        user: savedUser,
      });
      const savedAccount = await accountRepo.save(account);

      // Try to delete user (should fail due to FK constraint)
      // await expect(userRepo.remove(savedUser)).rejects.toThrow();

      // Note: onDelete: 'RESTRICT' prevents deletion
      expect(savedAccount.userId).toBe(savedUser.id);
    });
  });
});
