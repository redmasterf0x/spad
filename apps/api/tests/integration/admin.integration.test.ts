import { AdminService } from '../../src/services/AdminService';
import { OrderService } from '../../src/services/OrderService';
import { FeeService } from '../../src/services/FeeService';
import { BrokerService } from '../../src/services/BrokerService';
import { AppDataSource } from '../../src/config/database';
import { resetDatabase } from '../setup';
import { User } from '../../src/entities/User';
import { Account } from '../../src/entities/Account';
import { Order } from '../../src/entities/Order';
import Decimal from 'decimal.js';

describe('Step 5: Admin Service and Revenue Dashboard', () => {
  let adminService: AdminService;
  let orderService: OrderService;
  let feeService: FeeService;
  let brokerService: BrokerService;
  let userRepository: any;
  let accountRepository: any;
  let orderRepository: any;

  beforeEach(async () => {
    await resetDatabase();

    adminService = new AdminService();
    orderService = new OrderService();
    feeService = new FeeService();
    brokerService = new BrokerService();

    userRepository = AppDataSource.getRepository(User);
    accountRepository = AppDataSource.getRepository(Account);
    orderRepository = AppDataSource.getRepository(Order);
  });

  async function setupTestCustomer(): Promise<{ userId: string; accountId: string }> {
    const user = userRepository.create({
      email: `customer${Date.now()}@test.com`,
      passwordHash: 'hash',
      givenName: 'Customer',
      familyName: 'Test',
      kycStatus: 'VERIFIED',
    });
    const savedUser = await userRepository.save(user);

    const account = accountRepository.create({
      userId: savedUser.id,
      user: savedUser,
      accountType: 'TRADING',
      accountStatus: 'ACTIVE',
      cashBalance: new Decimal('100000.00'),
      equity: new Decimal('100000.00'),
    });
    const savedAccount = await accountRepository.save(account);

    return { userId: savedUser.id, accountId: savedAccount.id };
  }

  describe('Step 5.1: Daily Revenue Metrics', () => {
    it('should calculate daily revenue', async () => {
      const { accountId } = await setupTestCustomer();

      // Submit and fill order
      const order = await orderService.submitOrder(accountId, {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 100,
        orderType: 'MARKET',
      }, brokerService);

      const savedOrder = await orderRepository.findOne({
        where: { id: order.orderId },
      });

      await orderService.fillOrder(order.orderId, 100, 450, savedOrder.partnerOrderId);

      const today = new Date();
      const metrics = await adminService.getDailyRevenue(today);

      expect(metrics.totalCustomerFees.toNumber()).toBeGreaterThan(0);
      expect(metrics.totalPartnerCosts.toNumber()).toBeGreaterThan(0);
      expect(metrics.netRevenue.toNumber()).toBeGreaterThan(0);
      expect(metrics.orderCount).toBe(1);
      expect(metrics.notionalVolume.toNumber()).toBe(45000); // 100 * 450
    });

    it('should show correct revenue split (0.5% to customer fee, 0.2% cost, 0.3% ours)', async () => {
      const { accountId } = await setupTestCustomer();

      const order = await orderService.submitOrder(accountId, {
        symbol: 'QQQ',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 1000,
        orderType: 'MARKET',
      }, brokerService);

      const savedOrder = await orderRepository.findOne({
        where: { id: order.orderId },
      });

      const filledPrice = 300;
      await orderService.fillOrder(order.orderId, 1000, filledPrice, savedOrder.partnerOrderId);

      const metrics = await adminService.getDailyRevenue(new Date());

      const notional = 1000 * filledPrice; // 300,000
      const expectedCustomerFee = notional * 0.005; // 1,500
      const expectedPartnerCost = notional * 0.002; // 600
      const expectedNetRevenue = expectedCustomerFee - expectedPartnerCost; // 900

      expect(metrics.totalCustomerFees.toNumber()).toBeCloseTo(expectedCustomerFee, 1);
      expect(metrics.totalPartnerCosts.toNumber()).toBeCloseTo(expectedPartnerCost, 1);
      expect(metrics.netRevenue.toNumber()).toBeCloseTo(expectedNetRevenue, 1);
    });
  });

  describe('Step 5.2: Monthly Revenue Summary', () => {
    it('should calculate monthly revenue', async () => {
      const { accountId } = await setupTestCustomer();

      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        const order = await orderService.submitOrder(accountId, {
          symbol: `SPY${i}`,
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 50 + i * 10,
          orderType: 'MARKET',
        }, brokerService);

        const savedOrder = await orderRepository.findOne({
          where: { id: order.orderId },
        });

        await orderService.fillOrder(order.orderId, 50 + i * 10, 450 + i, savedOrder.partnerOrderId);
      }

      const today = new Date();
      const metrics = await adminService.getMonthlyRevenue(today.getFullYear(), today.getMonth() + 1);

      expect(metrics.orderCount).toBe(5);
      expect(metrics.totalCustomerFees.toNumber()).toBeGreaterThan(0);
      expect(metrics.averageFeePerOrder.toNumber()).toBeGreaterThan(0);
    });
  });

  describe('Step 5.3: Top Customers Analytics', () => {
    it('should rank customers by trading volume', async () => {
      // Create 3 customers with different volumes
      for (let c = 0; c < 3; c++) {
        const { accountId } = await setupTestCustomer();
        const volume = (c + 1) * 100; // First: 100, Second: 200, Third: 300

        for (let i = 0; i < volume / 50; i++) {
          const order = await orderService.submitOrder(accountId, {
            symbol: 'SPY',
            assetType: 'OPTION',
            side: 'BUY',
            quantity: 50,
            orderType: 'MARKET',
          }, brokerService);

          const savedOrder = await orderRepository.findOne({
            where: { id: order.orderId },
          });

          await orderService.fillOrder(order.orderId, 50, 450, savedOrder.partnerOrderId);
        }
      }

      const topCustomers = await adminService.getTopCustomersByVolume(10);

      expect(topCustomers.length).toBe(3);
      expect(topCustomers[0].totalVolume.toNumber()).toBeGreaterThanOrEqual(
        topCustomers[1].totalVolume.toNumber()
      );
    });

    it('should show customer metrics (volume, fees, avg order size)', async () => {
      const { accountId } = await setupTestCustomer();

      for (let i = 0; i < 3; i++) {
        const order = await orderService.submitOrder(accountId, {
          symbol: 'QQQ',
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 100 + i * 50,
          orderType: 'MARKET',
        }, brokerService);

        const savedOrder = await orderRepository.findOne({
          where: { id: order.orderId },
        });

        await orderService.fillOrder(order.orderId, 100 + i * 50, 300, savedOrder.partnerOrderId);
      }

      const topCustomers = await adminService.getTopCustomersByVolume(1);

      expect(topCustomers[0].orderCount).toBe(3);
      expect(topCustomers[0].totalVolume.toNumber()).toBeGreaterThan(0);
      expect(topCustomers[0].totalFeesPaid.toNumber()).toBeGreaterThan(0);
      expect(topCustomers[0].averageOrderSize.toNumber()).toBeGreaterThan(0);
    });
  });

  describe('Step 5.4: Platform KPIs', () => {
    it('should calculate platform-wide metrics', async () => {
      // Create 2 customers
      for (let c = 0; c < 2; c++) {
        const { accountId } = await setupTestCustomer();

        for (let i = 0; i < 3; i++) {
          const order = await orderService.submitOrder(accountId, {
            symbol: 'SPY',
            assetType: 'OPTION',
            side: 'BUY',
            quantity: 100,
            orderType: 'MARKET',
          }, brokerService);

          const savedOrder = await orderRepository.findOne({
            where: { id: order.orderId },
          });

          await orderService.fillOrder(order.orderId, 100, 450, savedOrder.partnerOrderId);
        }
      }

      const metrics = await adminService.getPlatformMetrics();

      expect(metrics.totalCustomers).toBe(2);
      expect(metrics.totalOrders).toBe(6);
      expect(metrics.totalTraded.toNumber()).toBeGreaterThan(0);
      expect(metrics.totalPlainFormRevenue.toNumber()).toBeGreaterThan(0);
      expect(metrics.avgOrderSize.toNumber()).toBeGreaterThan(0);
    });

    it('should calculate monthly ARPU (avg revenue per user)', async () => {
      const { accountId: accountId1 } = await setupTestCustomer();
      const { accountId: accountId2 } = await setupTestCustomer();

      // Customer 1: $50k volume
      for (let i = 0; i < 5; i++) {
        const order = await orderService.submitOrder(accountId1, {
          symbol: 'SPY',
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 100,
          orderType: 'MARKET',
        }, brokerService);

        const savedOrder = await orderRepository.findOne({
          where: { id: order.orderId },
        });

        await orderService.fillOrder(order.orderId, 100, 500, savedOrder.partnerOrderId);
      }

      // Customer 2: $100k volume
      for (let i = 0; i < 10; i++) {
        const order = await orderService.submitOrder(accountId2, {
          symbol: 'QQQ',
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 100,
          orderType: 'MARKET',
        }, brokerService);

        const savedOrder = await orderRepository.findOne({
          where: { id: order.orderId },
        });

        await orderService.fillOrder(order.orderId, 100, 500, savedOrder.partnerOrderId);
      }

      const metrics = await adminService.getPlatformMetrics();

      const totalVolume = 50000 + 100000; // 150k
      const totalRevenue = totalVolume * 0.003; // 450
      const expectedArpu = totalRevenue / 2; // 225

      expect(metrics.monthlyArpu.toNumber()).toBeCloseTo(expectedArpu, 0);
    });
  });

  describe('Step 5.5: Revenue vs Cost Analysis', () => {
    it('should calculate margin breakdown', async () => {
      const { accountId } = await setupTestCustomer();

      const order = await orderService.submitOrder(accountId, {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 1000,
        orderType: 'MARKET',
      }, brokerService);

      const savedOrder = await orderRepository.findOne({
        where: { id: order.orderId },
      });

      const notional = 1000 * 450; // 450,000
      await orderService.fillOrder(order.orderId, 1000, 450, savedOrder.partnerOrderId);

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const analysis = await adminService.getRevenueCostComparison(startDate, endDate);

      expect(analysis.totalCustomerFees.toNumber()).toBeCloseTo(notional * 0.005, 1); // 2,250
      expect(analysis.totalPartnerCosts.toNumber()).toBeCloseTo(notional * 0.002, 1); // 900
      expect(analysis.grossMargin.toNumber()).toBeCloseTo(notional * 0.003, 1); // 1,350
      expect(analysis.marginPercentage).toBeCloseTo(60, 0); // 60% of customer fee is our margin
    });
  });

  describe('Step 5.6: Order Statistics', () => {
    it('should calculate order fill rate and stats', async () => {
      const { accountId } = await setupTestCustomer();

      // Create 5 orders: 3 filled, 2 pending (not filled)
      for (let i = 0; i < 5; i++) {
        const order = await orderService.submitOrder(accountId, {
          symbol: `SPY${i}`,
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 50,
          orderType: 'MARKET',
        }, brokerService);

        if (i < 3) {
          // Fill first 3 orders
          const savedOrder = await orderRepository.findOne({
            where: { id: order.orderId },
          });

          await orderService.fillOrder(order.orderId, 50, 450, savedOrder.partnerOrderId);
        }
      }

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const stats = await adminService.getOrderStats(startDate, endDate);

      expect(stats.totalOrders).toBe(5);
      expect(stats.filledOrders).toBe(3);
      expect(stats.fillRate).toBeCloseTo(60, 0); // 60%
      expect(stats.buySideVolume.toNumber()).toBeGreaterThan(0);
    });
  });

  describe('Step 5.7: Audit Reports', () => {
    it('should generate audit trail for date range', async () => {
      const { accountId } = await setupTestCustomer();

      for (let i = 0; i < 3; i++) {
        const order = await orderService.submitOrder(accountId, {
          symbol: `SPY${i}`,
          assetType: 'OPTION',
          side: 'BUY',
          quantity: 100,
          orderType: 'MARKET',
        }, brokerService);

        const savedOrder = await orderRepository.findOne({
          where: { id: order.orderId },
        });

        await orderService.fillOrder(order.orderId, 100, 450, savedOrder.partnerOrderId);
      }

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const report = await adminService.getAuditReport(startDate, endDate);

      expect(report.accountsAffected).toBe(1);
      expect(report.totalOrderVolume.toNumber()).toBeGreaterThan(0);
      expect(report.totalFees.toNumber()).toBeGreaterThan(0);
    });
  });

  describe('Step 5.8: Revenue Target Tracking', () => {
    it('should track progress toward monthly revenue target ($500k)', async () => {
      // Target: $500k/month revenue
      // Revenue model: 0.3% of notional volume
      // To hit $500k: need $166.67M notional volume

      const { accountId } = await setupTestCustomer();

      // Simulate $10M in one day (very large order)
      const order = await orderService.submitOrder(accountId, {
        symbol: 'SPY',
        assetType: 'OPTION',
        side: 'BUY',
        quantity: 20000,
        orderType: 'MARKET',
      }, brokerService);

      const savedOrder = await orderRepository.findOne({
        where: { id: order.orderId },
      });

      await orderService.fillOrder(order.orderId, 20000, 500, savedOrder.partnerOrderId);

      const metrics = await adminService.getDailyRevenue(new Date());

      // Revenue: 20000 * 500 * 0.003 = $30,000
      expect(metrics.netRevenue.toNumber()).toBeCloseTo(30000, 0);

      // To hit $500k/month you need ~16.67 days like this
      const daysNeededTo500k = 500000 / 30000;
      expect(daysNeededTo500k).toBeCloseTo(16.67, 1);
    });
  });
});
