import { OrderService, SubmitOrderRequest } from '../../src/services/OrderService';
import { BrokerService } from '../../src/services/BrokerService';
import { AppDataSource } from '../../src/config/database';
import { resetDatabase } from '../setup';
import { testUsers, testAccounts } from '../fixtures/users';
import { User } from '../../src/entities/User';
import { Account } from '../../src/entities/Account';
import { Order } from '../../src/entities/Order';
import { Position } from '../../src/entities/Position';
import { Fee } from '../../src/entities/Fee';
import Decimal from 'decimal.js';

describe('Step 3: Order Service and Broker Integration', () => {
  let orderService: OrderService;
  let brokerService: BrokerService;
  let userRepository: any;
  let accountRepository: any;
  let orderRepository: any;
  let positionRepository: any;
  let feeRepository: any;

  let testUserId: string;
  let testAccountId: string;

  beforeEach(async () => {
    await resetDatabase();

    orderService = new OrderService();
    brokerService = new BrokerService();

    userRepository = AppDataSource.getRepository(User);
    accountRepository = AppDataSource.getRepository(Account);
    orderRepository = AppDataSource.getRepository(Order);
    positionRepository = AppDataSource.getRepository(Position);
    feeRepository = AppDataSource.getRepository(Fee);

    // Setup test user and account
    const user = userRepository.create({
      email: 'orders@test.com',
      passwordHash: 'hash',
      givenName: 'Orders',
      familyName: 'Test',
      kycStatus: 'VERIFIED',
    });
    const savedUser = await userRepository.save(user);
    testUserId = savedUser.id;

    const account = accountRepository.create({
      userId: savedUser.id,
      user: savedUser,
      accountType: 'TRADING',
      accountStatus: 'ACTIVE',
      cashBalance: new Decimal('100000.00'),
      reservedBalance: new Decimal('0.00'),
      equity: new Decimal('100000.00'),
    });
    const savedAccount = await accountRepository.save(account);
    testAccountId = savedAccount.id;
  });

  describe('Step 3.1: Submit Buy Order', () => {
    it('should submit a buy order with LIMIT type', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
        optionDetails: {
          expiryDate: '2026-03-20',
          strikePrice: 450,
          contractType: 'CALL',
          multiplier: 100,
        },
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);

      expect(result.orderId).toBeDefined();
      expect(result.symbol).toBe('SPY');
      expect(result.quantity).toBe(10);
      expect(result.status).toBe('PENDING');
    });

    it('should reserve balance for BUY orders', async () => {
      const account = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      const initialCash = account.cashBalance;
      const initialReserved = account.reservedBalance;

      const orderReq: SubmitOrderRequest = {
        symbol: 'QQQ',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 5,
        orderType: 'LIMIT',
        price: 300,
      };

      await orderService.submitOrder(testAccountId, orderReq, brokerService);

      const updatedAccount = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      const expectedReserved = new Decimal(5 * 300);
      expect(updatedAccount.reservedBalance).toEqual(initialReserved.plus(expectedReserved));
      expect(updatedAccount.cashBalance).toEqual(initialCash);
    });

    it('should reject BUY order if insufficient balance', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 1000,
        orderType: 'LIMIT',
        price: 500, // 1000 * 500 = 500,000 > 100,000 balance
      };

      await expect(
        orderService.submitOrder(testAccountId, orderReq, brokerService)
      ).rejects.toThrow('Insufficient balance');
    });

    it('should create fee record on order submission', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'IWM',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 20,
        orderType: 'LIMIT',
        price: 200,
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);

      const fee = await feeRepository.findOne({
        where: { orderId: result.orderId },
      });

      expect(fee).toBeDefined();
      expect(fee.feeCategory).toBe('TRADING_COMMISSION');
      expect(fee.customerRate).toBe(0.005);
      expect(fee.partnerRate).toBe(0.002);
      expect(fee.ourMargin).toBe(0.003);
    });

    it('should send order to broker', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'MARKET',
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);
      const order = await orderRepository.findOne({
        where: { id: result.orderId },
      });

      expect(order.partnerOrderId).toBeDefined();
      expect(order.partnerOrderId).toMatch(/MOCK_/);
    });
  });

  describe('Step 3.2: Submit Sell Order', () => {
    beforeEach(async () => {
      // Create a position first
      const position = positionRepository.create({
        accountId: testAccountId,
        symbol: 'AAPL',
        quantity: new Decimal('100'),
        averageOpenPrice: 150,
        currentValue: new Decimal('15000'),
      });
      await positionRepository.save(position);
    });

    it('should submit a sell order', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'AAPL',
        assetType: 'OPTION',
        side: 'SELL',
        quantity: 50,
        orderType: 'MARKET',
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);

      expect(result.symbol).toBe('AAPL');
      expect(result.quantity).toBe(50);
      expect(result.status).toBe('PENDING');
    });

    it('should reject SELL order if insufficient position', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'AAPL',
        assetType: 'OPTION',
        side: 'SELL',
        quantity: 200, // We only have 100
        orderType: 'MARKET',
      };

      await expect(
        orderService.submitOrder(testAccountId, orderReq, brokerService)
      ).rejects.toThrow('Insufficient position to sell');
    });

    it('should not reserve balance for SELL orders', async () => {
      const account = await accountRepository.findOne({
        where: { id: testAccountId },
      });
      const initialReserved = account.reservedBalance;

      const orderReq: SubmitOrderRequest = {
        symbol: 'AAPL',
        assetType: 'OPTION',
        side: 'SELL',
        quantity: 50,
        orderType: 'MARKET',
      };

      await orderService.submitOrder(testAccountId, orderReq, brokerService);

      const updatedAccount = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      expect(updatedAccount.reservedBalance).toEqual(initialReserved);
    });
  });

  describe('Step 3.3: Order Fills and Position Updates', () => {
    let orderId: string;
    let brokerId: string;

    beforeEach(async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);
      orderId = result.orderId;

      const order = await orderRepository.findOne({ where: { id: orderId } });
      brokerId = order.partnerOrderId;
    });

    it('should mark order as FILLED', async () => {
      await orderService.fillOrder(orderId, 10, 450.25, brokerId);

      const order = await orderRepository.findOne({ where: { id: orderId } });

      expect(order.status).toBe('FILLED');
      expect(order.filledQuantity).toBe(10);
      expect(order.filledPrice).toBe(450.25);
      expect(order.filledAt).toBeDefined();
    });

    it('should create position on first buy', async () => {
      await orderService.fillOrder(orderId, 10, 450.25, brokerId);

      const position = await positionRepository.findOne({
        where: { accountId: testAccountId, symbol: 'SPY' },
      });

      expect(position).toBeDefined();
      expect(position.quantity).toEqual(new Decimal('10'));
      expect(position.averageOpenPrice).toBe(450.25);
    });

    it('should calculate fees on fill', async () => {
      const notional = 10 * 450.25; // 4502.5
      const customerFee = notional * 0.005; // 22.5125
      const partnerCost = notional * 0.002; // 9.005
      const ourFee = customerFee - partnerCost; // 13.5075

      await orderService.fillOrder(orderId, 10, 450.25, brokerId);

      const fee = await feeRepository.findOne({
        where: { orderId },
      });

      expect(fee.grossFeeAmount).toBeCloseTo(customerFee, 1);
      expect(fee.netFeeAmount).toBeCloseTo(ourFee, 1);
      expect(fee.partnerCost).toBeCloseTo(partnerCost, 1);
    });

    it('should debit cash and fees from account on BUY fill', async () => {
      const accountBefore = await accountRepository.findOne({
        where: { id: testAccountId },
      });
      const cashBefore = accountBefore.cashBalance;

      const notional = 10 * 450.25;
      const fee = notional * 0.003; // Our 0.3%

      await orderService.fillOrder(orderId, 10, 450.25, brokerId);

      const accountAfter = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      const expectedCash = cashBefore.minus(notional).minus(fee);
      expect(accountAfter.cashBalance).toEqual(expectedCash);
      expect(accountAfter.reservedBalance).toEqual(new Decimal('0'));
    });
  });

  describe('Step 3.4: Sell Order Execution', () => {
    beforeEach(async () => {
      // Create position
      const position = positionRepository.create({
        accountId: testAccountId,
        symbol: 'TSLA',
        quantity: new Decimal('50'),
        averageOpenPrice: 200,
        currentValue: new Decimal('10000'),
      });
      await positionRepository.save(position);
    });

    it('should reduce position quantity on SELL', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'TSLA',
        assetType: 'OPTION',
        side: 'SELL',
        quantity: 20,
        orderType: 'MARKET',
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);

      const order = await orderRepository.findOne({
        where: { id: result.orderId },
      });
      const brokerId = order.partnerOrderId;

      await orderService.fillOrder(result.orderId, 20, 210, brokerId);

      const position = await positionRepository.findOne({
        where: { accountId: testAccountId, symbol: 'TSLA' },
      });

      expect(position.quantity).toEqual(new Decimal('30'));
    });

    it('should credit cash on SELL fill', async () => {
      const accountBefore = await accountRepository.findOne({
        where: { id: testAccountId },
      });
      const cashBefore = accountBefore.cashBalance;

      const orderReq: SubmitOrderRequest = {
        symbol: 'TSLA',
        assetType: 'OPTION',
        side: 'SELL',
        quantity: 20,
        orderType: 'MARKET',
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);
      const order = await orderRepository.findOne({
        where: { id: result.orderId },
      });

      const notional = 20 * 210;
      const fee = notional * 0.003;

      await orderService.fillOrder(result.orderId, 20, 210, order.partnerOrderId);

      const accountAfter = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      const expectedCash = cashBefore.plus(notional).minus(fee);
      expect(accountAfter.cashBalance).toEqual(expectedCash);
    });
  });

  describe('Step 3.5: Cancel Order', () => {
    it('should cancel a pending order', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);

      await orderService.cancelOrder(result.orderId, brokerService);

      const order = await orderRepository.findOne({
        where: { id: result.orderId },
      });

      expect(order.status).toBe('CANCELLED');
      expect(order.cancelledAt).toBeDefined();
    });

    it('should release reserved balance when canceled', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);

      const accountBefore = await accountRepository.findOne({
        where: { id: testAccountId },
      });
      const reservedBefore = accountBefore.reservedBalance;

      await orderService.cancelOrder(result.orderId, brokerService);

      const accountAfter = await accountRepository.findOne({
        where: { id: testAccountId },
      });

      expect(accountAfter.reservedBalance.toNumber()).toBeLessThan(reservedBefore.toNumber());
    });

    it('should not allow canceling filled orders', async () => {
      const orderReq: SubmitOrderRequest = {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 10,
        orderType: 'LIMIT',
        price: 450.25,
      };

      const result = await orderService.submitOrder(testAccountId, orderReq, brokerService);
      const order = await orderRepository.findOne({
        where: { id: result.orderId },
      });

      await orderService.fillOrder(result.orderId, 10, 450.25, order.partnerOrderId);

      await expect(
        orderService.cancelOrder(result.orderId, brokerService)
      ).rejects.toThrow('Can only cancel pending orders');
    });
  });

  describe('Step 3.6: Order History and Status', () => {
    it('should retrieve order history', async () => {
      for (let i = 0; i < 3; i++) {
        const orderReq: SubmitOrderRequest = {
          symbol: `SPY${i}`,
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 5,
          orderType: 'MARKET',
        };
        await orderService.submitOrder(testAccountId, orderReq, brokerService);
      }

      const history = await orderService.getOrderHistory(testAccountId, 10);

      expect(history.length).toBe(3);
      expect(history[0].symbol).toMatch(/SPY/);
    });

    it('should retrieve open orders only', async () => {
      // Create 3 orders
      for (let i = 0; i < 3; i++) {
        const orderReq: SubmitOrderRequest = {
          symbol: `QQQ${i}`,
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 5,
          orderType: 'MARKET',
        };
        await orderService.submitOrder(testAccountId, orderReq, brokerService);
      }

      // Fill one order
      const orders = await orderRepository.find({
        where: { accountId: testAccountId },
      });
      const orderToFill = orders[0];
      await orderService.fillOrder(orderToFill.id, 5, 100, orderToFill.partnerOrderId);

      const openOrders = await orderService.getOpenOrders(testAccountId);

      expect(openOrders.length).toBe(2);
      expect(openOrders.every((o) => o.status === 'PENDING')).toBe(true);
    });
  });
});
