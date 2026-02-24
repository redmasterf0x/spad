import { LedgerService, EntryType } from '../../src/services/LedgerService';
import { FeeService } from '../../src/services/FeeService';
import { AppDataSource } from '../../src/config/database';
import { resetDatabase } from '../setup';
import { User } from '../../src/entities/User';
import { Account } from '../../src/entities/Account';
import { Order } from '../../src/entities/Order';
import { LedgerEntry } from '../../src/entities/LedgerEntry';
import { Fee } from '../../src/entities/Fee';
import Decimal from 'decimal.js';

describe('Step 4: Ledger and Fee Services', () => {
  let ledgerService: LedgerService;
  let feeService: FeeService;
  let userRepository: any;
  let accountRepository: any;
  let orderRepository: any;
  let ledgerRepository: any;
  let feeRepository: any;

  let testAccountId: string;

  beforeEach(async () => {
    await resetDatabase();

    ledgerService = new LedgerService();
    feeService = new FeeService();

    userRepository = AppDataSource.getRepository(User);
    accountRepository = AppDataSource.getRepository(Account);
    orderRepository = AppDataSource.getRepository(Order);
    ledgerRepository = AppDataSource.getRepository(LedgerEntry);
    feeRepository = AppDataSource.getRepository(Fee);

    // Setup test user and account
    const user = userRepository.create({
      email: 'ledger@test.com',
      passwordHash: 'hash',
      givenName: 'Ledger',
      familyName: 'Test',
    });
    const savedUser = await userRepository.save(user);

    const account = accountRepository.create({
      userId: savedUser.id,
      user: savedUser,
      cashBalance: new Decimal('100000.00'),
      equity: new Decimal('100000.00'),
    });
    const savedAccount = await accountRepository.save(account);
    testAccountId = savedAccount.id;
  });

  describe('Step 4.1: Double-Entry Ledger Posting', () => {
    it('should post a deposit entry', async () => {
      const entry = await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.DEPOSIT,
        amount: new Decimal('5000.00'),
        currency: 'USD',
        description: 'ACH deposit',
      });

      expect(entry.id).toBeDefined();
      expect(entry.entryType).toBe('DEPOSIT');
      expect(entry.amount).toBe(5000);
      expect(entry.isReconciled).toBe(false);
    });

    it('should update account balance on deposit', async () => {
      const accountBefore = await accountRepository.findOne({
        where: { id: testAccountId },
      });
      const cashBefore = accountBefore.cashBalance;

      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.DEPOSIT,
        amount: new Decimal('5000.00'),
        currency: 'USD',
        description: 'ACH deposit',
      });

      const accountAfter = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      expect(accountAfter.cashBalance).toEqual(cashBefore.plus(5000));
    });

    it('should post a withdrawal entry', async () => {
      const entry = await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.WITHDRAWAL,
        amount: new Decimal('2000.00'),
        currency: 'USD',
        description: 'ACH withdrawal',
      });

      expect(entry.entryType).toBe('WITHDRAWAL');
      expect(entry.amount).toBe(2000);
    });

    it('should update account balance on withdrawal', async () => {
      const accountBefore = await accountRepository.findOne({
        where: { id: testAccountId },
      });
      const cashBefore = accountBefore.cashBalance;

      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.WITHDRAWAL,
        amount: new Decimal('2000.00'),
        currency: 'USD',
        description: 'ACH withdrawal',
      });

      const accountAfter = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      expect(accountAfter.cashBalance).toEqual(cashBefore.minus(2000));
    });

    it('should link ledger entry to order', async () => {
      // Create order
      const user = await userRepository.findOne({
        where: { id: (await accountRepository.findOne({ where: { id: testAccountId } })).userId },
      });
      const account = await accountRepository.findOne({ where: { id: testAccountId } });

      const order = orderRepository.create({
        accountId: testAccountId,
        account,
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
        status: 'FILLED',
      });
      const savedOrder = await orderRepository.save(order);

      // Post ledger entry linked to order
      const entry = await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.ORDER_EXECUTION,
        amount: new Decimal('4502.50'),
        currency: 'USD',
        description: 'BUY 10 SPY',
        orderId: savedOrder.id,
        metadata: {
          symbol: 'SPY',
          side: 'BUY',
          quantity: 10,
          price: 450.25,
        },
      });

      expect(entry.orderId).toBe(savedOrder.id);
    });
  });

  describe('Step 4.2: Ledger Querying', () => {
    beforeEach(async () => {
      // Post multiple entries
      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.DEPOSIT,
        amount: new Decimal('5000.00'),
        currency: 'USD',
        description: 'Deposit 1',
      });

      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.WITHDRAWAL,
        amount: new Decimal('1000.00'),
        currency: 'USD',
        description: 'Withdrawal 1',
      });

      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.FEE,
        amount: new Decimal('100.00'),
        currency: 'USD',
        description: 'Fee',
      });
    });

    it('should retrieve all entries for account', async () => {
      const { entries, total } = await ledgerService.getEntries(testAccountId);

      expect(total).toBe(3);
      expect(entries.length).toBe(3);
    });

    it('should support pagination', async () => {
      const { entries: page1 } = await ledgerService.getEntries(testAccountId, 2, 0);
      const { entries: page2 } = await ledgerService.getEntries(testAccountId, 2, 2);

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(1);
    });

    it('should filter by entry type', async () => {
      const { entries } = await ledgerService.getEntries(testAccountId, 50, 0, EntryType.DEPOSIT);

      expect(entries.length).toBe(1);
      expect(entries[0].entryType).toBe('DEPOSIT');
    });
  });

  describe('Step 4.3: Balance Calculations', () => {
    it('should calculate balance at date', async () => {
      const now = new Date();

      // Deposit $5000
      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.DEPOSIT,
        amount: new Decimal('5000.00'),
        currency: 'USD',
        description: 'Deposit',
      });

      // Withdraw $1000
      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.WITHDRAWAL,
        amount: new Decimal('1000.00'),
        currency: 'USD',
        description: 'Withdrawal',
      });

      const balance = await ledgerService.getBalanceAtDate(testAccountId, new Date());

      expect(balance.totalCredits).toEqual(new Decimal('5000'));
      expect(balance.totalDebits).toEqual(new Decimal('1000'));
      expect(balance.netBalance).toEqual(new Decimal('4000'));
    });

    it('should calculate trial balance', async () => {
      await ledgerService.postEntry({
        accountId: testAccountId,
        entryType: EntryType.DEPOSIT,
        amount: new Decimal('5000.00'),
        currency: 'USD',
        description: 'Deposit',
      });

      const trialBalance = await ledgerService.getTrialBalance(testAccountId);

      expect(trialBalance.totalCredits).toEqual(new Decimal('5000'));
      expect(trialBalance.totalDebits).toEqual(new Decimal('0'));
      expect(trialBalance.isBalanced).toBe(true);
    });
  });

  describe('Step 4.4: Fee Calculations', () => {
    it('should calculate fees from notional value', () => {
      const notional = new Decimal('100000.00');
      const calc = feeService.calculateFees(notional);

      expect(calc.customerRate).toBe(0.005);
      expect(calc.partnerRate).toBe(0.002);
      expect(calc.grossFeeAmount).toEqual(new Decimal('500.00')); // 0.5%
      expect(calc.partnerCost).toEqual(new Decimal('200.00')); // 0.2%
      expect(calc.ourMargin).toEqual(new Decimal('300.00')); // 0.3%
    });

    it('should maintain 0.3% margin', () => {
      const testCases = [
        new Decimal('1000'),
        new Decimal('10000'),
        new Decimal('100000'),
        new Decimal('1000000'),
      ];

      testCases.forEach((notional) => {
        const calc = feeService.calculateFees(notional);
        const marginPercent = calc.ourMargin.dividedBy(notional).times(100);

        expect(marginPercent.toNumber()).toBeCloseTo(0.3, 5);
      });
    });

    it('should record fee for order', async () => {
      const user = await userRepository.findOne({
        where: { id: (await accountRepository.findOne({ where: { id: testAccountId } })).userId },
      });
      const account = await accountRepository.findOne({ where: { id: testAccountId } });

      const order = orderRepository.create({
        accountId: testAccountId,
        account,
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
        status: 'FILLED',
      });
      const savedOrder = await orderRepository.save(order);

      const fee = await feeService.recordFee(savedOrder.id, testAccountId, 10, 450.25);

      expect(fee.orderId).toBe(savedOrder.id);
      expect(fee.grossFeeAmount).toBeCloseTo(22.51, 2); // 10 * 450.25 * 0.5%
      expect(fee.netFeeAmount).toBeCloseTo(13.51, 2); // 10 * 450.25 * 0.3%
      expect(fee.partnerCost).toBeCloseTo(9.00, 1); // 10 * 450.25 * 0.2%
    });

    it('should calculate account fees summary', async () => {
      // Create multiple orders and fees
      for (let i = 0; i < 3; i++) {
        const account = await accountRepository.findOne({ where: { id: testAccountId } });
        const order = orderRepository.create({
          accountId: testAccountId,
          account,
          symbol: `SPY${i}`,
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 10,
          orderType: 'MARKET',
          status: 'FILLED',
        });
        const savedOrder = await orderRepository.save(order);

        await feeService.recordFee(savedOrder.id, testAccountId, 10, 450.25 + i);
      }

      const summary = await feeService.getAccountFeesSummary(testAccountId);

      expect(summary.feeCount).toBe(3);
      expect(summary.totalNetFees.toNumber()).toBeGreaterThan(0);
      expect(summary.totalGrossFees.toNumber()).toBeGreaterThan(summary.totalNetFees.toNumber());
    });
  });

  describe('Step 4.5: Reconciliation', () => {
    let entryIds: string[];

    beforeEach(async () => {
      const entries = [];
      for (let i = 0; i < 3; i++) {
        const entry = await ledgerService.postEntry({
          accountId: testAccountId,
          entryType: EntryType.DEPOSIT,
          amount: new Decimal('1000.00'),
          currency: 'USD',
          description: `Deposit ${i}`,
        });
        entries.push(entry.id);
      }
      entryIds = entries;
    });

    it('should reconcile ledger entries', async () => {
      await ledgerService.reconcileEntries(entryIds, 'REC_202501_001');

      const entries = await ledgerRepository.find({ where: { id: entryIds as any } });

      entries.forEach((entry: LedgerEntry) => {
        expect(entry.isReconciled).toBe(true);
        expect(entry.reconciliationId).toBe('REC_202501_001');
        expect(entry.reconciledAt).toBeDefined();
      });
    });

    it('should get unreconciled entries', async () => {
      // Reconcile 2 entries
      await ledgerService.reconcileEntries(entryIds.slice(0, 2), 'REC_202501_001');

      const unreconciled = await ledgerService.getUnreconciledEntries(testAccountId);

      expect(unreconciled.length).toBe(1);
      expect(unreconciled[0].id).toBe(entryIds[2]);
    });
  });

  describe('Step 4.6: Account Statement', () => {
    beforeEach(async () => {
      // Create entries spanning multiple days
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        await ledgerService.postEntry({
          accountId: testAccountId,
          entryType: i % 2 === 0 ? EntryType.DEPOSIT : EntryType.WITHDRAWAL,
          amount: new Decimal('1000.00'),
          currency: 'USD',
          description: `Entry ${i}`,
        });
      }
    });

    it('should generate account statement for date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);

      const endDate = new Date();

      const statement = await ledgerService.getStatement(testAccountId, startDate, endDate);

      expect(statement.entries.length).toBe(5);
      expect(statement.totalInflows.toNumber()).toBeGreaterThan(0);
      expect(statement.totalOutflows.toNumber()).toBeGreaterThan(0);
    });
  });
});
