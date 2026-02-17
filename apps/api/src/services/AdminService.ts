import { AppDataSource } from '../config/database';
import { Account } from '../entities/Account';
import { Fee } from '../entities/Fee';
import { Order } from '../entities/Order';
import { LedgerEntry } from '../entities/LedgerEntry';
import Decimal from 'decimal.js';

/**
 * AdminService: Revenue reporting and platform analytics
 *
 * Provides dashboards for:
 * - Daily/monthly revenue
 * - Customer metrics (AUM, trading volume, fees paid)
 * - Partner metrics (costs, margins)
 * - Operational metrics (orders/day, fill rate, etc.)
 */
export class AdminService {
  private accountRepository = AppDataSource.getRepository(Account);
  private feeRepository = AppDataSource.getRepository(Fee);
  private orderRepository = AppDataSource.getRepository(Order);
  private ledgerRepository = AppDataSource.getRepository(LedgerEntry);

  /**
   * Get daily revenue for a specific date
   */
  async getDailyRevenue(date: Date): Promise<{
    date: Date;
    totalCustomerFees: Decimal;
    totalPartnerCosts: Decimal;
    netRevenue: Decimal;
    orderCount: number;
    notionalVolume: Decimal;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const fees = await this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.createdAt >= :startOfDay', { startOfDay })
      .andWhere('fee.createdAt <= :endOfDay', { endOfDay })
      .getMany();

    let totalCustomerFees = new Decimal(0);
    let totalPartnerCosts = new Decimal(0);
    let notionalVolume = new Decimal(0);

    fees.forEach((fee) => {
      totalCustomerFees = totalCustomerFees.plus(fee.grossFeeAmount || 0);
      totalPartnerCosts = totalPartnerCosts.plus(fee.partnerCost || 0);
      notionalVolume = notionalVolume.plus(fee.notionalValue || 0);
    });

    const netRevenue = totalCustomerFees.minus(totalPartnerCosts);

    return {
      date,
      totalCustomerFees,
      totalPartnerCosts,
      netRevenue,
      orderCount: fees.length,
      notionalVolume,
    };
  }

  /**
   * Get monthly revenue summary
   */
  async getMonthlyRevenue(year: number, month: number): Promise<{
    month: string;
    totalCustomerFees: Decimal;
    totalPartnerCosts: Decimal;
    netRevenue: Decimal;
    orderCount: number;
    notionalVolume: Decimal;
    averageFeePerOrder: Decimal;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const fees = await this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.createdAt >= :startDate', { startDate })
      .andWhere('fee.createdAt <= :endDate', { endDate })
      .getMany();

    let totalCustomerFees = new Decimal(0);
    let totalPartnerCosts = new Decimal(0);
    let notionalVolume = new Decimal(0);

    fees.forEach((fee) => {
      totalCustomerFees = totalCustomerFees.plus(fee.grossFeeAmount || 0);
      totalPartnerCosts = totalPartnerCosts.plus(fee.partnerCost || 0);
      notionalVolume = notionalVolume.plus(fee.notionalValue || 0);
    });

    const netRevenue = totalCustomerFees.minus(totalPartnerCosts);
    const averageFeePerOrder = fees.length > 0 ? netRevenue.dividedBy(fees.length) : new Decimal(0);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    return {
      month: monthName,
      totalCustomerFees,
      totalPartnerCosts,
      netRevenue,
      orderCount: fees.length,
      notionalVolume,
      averageFeePerOrder,
    };
  }

  /**
   * Get top customers by volume
   */
  async getTopCustomersByVolume(limit: number = 10): Promise<
    Array<{
      accountId: string;
      userId: string;
      email: string;
      totalVolume: Decimal;
      totalFeesPaid: Decimal;
      orderCount: number;
      averageOrderSize: Decimal;
    }>
  > {
    const accounts = await this.accountRepository.find({ relations: ['user'] });

    const customerMetrics = await Promise.all(
      accounts.map(async (account) => {
        const fees = await this.feeRepository.find({
          where: { accountId: account.id },
        });

        let totalVolume = new Decimal(0);
        let totalFeesPaid = new Decimal(0);

        fees.forEach((fee) => {
          totalVolume = totalVolume.plus(fee.notionalValue || 0);
          totalFeesPaid = totalFeesPaid.plus(fee.grossFeeAmount || 0);
        });

        const averageOrderSize = fees.length > 0 ? totalVolume.dividedBy(fees.length) : new Decimal(0);

        return {
          accountId: account.id,
          userId: account.userId,
          email: account.user.email,
          totalVolume,
          totalFeesPaid,
          orderCount: fees.length,
          averageOrderSize,
        };
      })
    );

    return customerMetrics.sort((a, b) => b.totalVolume.toNumber() - a.totalVolume.toNumber()).slice(0, limit);
  }

  /**
   * Get platform metrics (KPIs)
   */
  async getPlatformMetrics(): Promise<{
    totalCustomers: number;
    totalAUM: Decimal; // Assets Under Management
    totalTraded: Decimal; // Lifetime volume
    totalOrders: number;
    totalPlainFormRevenue: Decimal; // Lifetime net revenue
    monthlyArpu: Decimal; // Monthly Average Revenue Per User
    avgOrderSize: Decimal;
  }> {
    const totalCustomers = await this.accountRepository.count();
    const accounts = await this.accountRepository.find();

    let totalAUM = new Decimal(0);
    accounts.forEach((account) => {
      totalAUM = totalAUM.plus(account.equity || 0);
    });

    const orders = await this.orderRepository.find();
    const totalOrders = orders.length;

    const fees = await this.feeRepository.find();
    let totalTraded = new Decimal(0);
    let totalPlainFormRevenue = new Decimal(0);

    fees.forEach((fee) => {
      totalTraded = totalTraded.plus(fee.notionalValue || 0);
      totalPlainFormRevenue = totalPlainFormRevenue.plus(fee.netFeeAmount || 0);
    });

    const avgOrderSize = totalOrders > 0 ? totalTraded.dividedBy(totalOrders) : new Decimal(0);
    const monthlyArpu = totalCustomers > 0 ? totalPlainFormRevenue.dividedBy(totalCustomers) : new Decimal(0);

    return {
      totalCustomers,
      totalAUM,
      totalTraded,
      totalOrders,
      totalPlainFormRevenue,
      monthlyArpu,
      avgOrderSize,
    };
  }

  /**
   * Get revenue vs cost comparison
   */
  async getRevenueCostComparison(startDate: Date, endDate: Date): Promise<{
    period: { startDate: Date; endDate: Date };
    totalCustomerFees: Decimal;
    totalPartnerCosts: Decimal;
    grossMargin: Decimal;
    marginPercentage: number;
    marginPercentageBreakdown: {
      customer: number;
      partner: number;
      ours: number;
    };
  }> {
    const fees = await this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.createdAt >= :startDate', { startDate })
      .andWhere('fee.createdAt <= :endDate', { endDate })
      .getMany();

    let totalCustomerFees = new Decimal(0);
    let totalPartnerCosts = new Decimal(0);

    fees.forEach((fee) => {
      totalCustomerFees = totalCustomerFees.plus(fee.grossFeeAmount || 0);
      totalPartnerCosts = totalPartnerCosts.plus(fee.partnerCost || 0);
    });

    const grossMargin = totalCustomerFees.minus(totalPartnerCosts);
    const marginPercentage = totalCustomerFees.greaterThan(0)
      ? grossMargin.dividedBy(totalCustomerFees).times(100).toNumber()
      : 0;

    return {
      period: { startDate, endDate },
      totalCustomerFees,
      totalPartnerCosts,
      grossMargin,
      marginPercentage,
      marginPercentageBreakdown: {
        customer: 0.5, // 0.5%
        partner: 0.2, // 0.2%
        ours: 0.3, // 0.3%
      },
    };
  }

  /**
   * Get order stats
   */
  async getOrderStats(startDate: Date, endDate: Date): Promise<{
    totalOrders: number;
    filledOrders: number;
    cancelledOrders: number;
    rejectedOrders: number;
    fillRate: number;
    avgTimeToFill: number; // in milliseconds
    buySideVolume: Decimal;
    sellSideVolume: Decimal;
  }> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .getMany();

    let filledOrders = 0;
    let cancelledOrders = 0;
    let rejectedOrders = 0;
    let totalTimeToFill = 0;
    let timeToFillCount = 0;
    let buySideVolume = new Decimal(0);
    let sellSideVolume = new Decimal(0);

    orders.forEach((order) => {
      if (order.status === 'FILLED') {
        filledOrders++;
        if (order.filledAt && order.createdAt) {
          const timeToFill = order.filledAt.getTime() - order.createdAt.getTime();
          totalTimeToFill += timeToFill;
          timeToFillCount++;
        }
      } else if (order.status === 'CANCELLED') {
        cancelledOrders++;
      } else if (order.status === 'REJECTED') {
        rejectedOrders++;
      }

      const volume = new Decimal(order.quantity * (order.filledPrice || order.price || 0));
      if (order.side === 'BUY') {
        buySideVolume = buySideVolume.plus(volume);
      } else {
        sellSideVolume = sellSideVolume.plus(volume);
      }
    });

    const fillRate = orders.length > 0 ? (filledOrders / orders.length) * 100 : 0;
    const avgTimeToFill = timeToFillCount > 0 ? totalTimeToFill / timeToFillCount : 0;

    return {
      totalOrders: orders.length,
      filledOrders,
      cancelledOrders,
      rejectedOrders,
      fillRate,
      avgTimeToFill,
      buySideVolume,
      sellSideVolume,
    };
  }

  /**
   * Get trail balance audit report
   */
  async getAuditReport(startDate: Date, endDate: Date): Promise<{
    period: { startDate: Date; endDate: Date };
    totalDeposits: Decimal;
    totalWithdrawals: Decimal;
    totalFees: Decimal;
    netCashFlow: Decimal;
    totalOrderVolume: Decimal;
    accountsAffected: number;
  }> {
    const ledgers = await this.ledgerRepository
      .createQueryBuilder('entry')
      .where('entry.createdAt >= :startDate', { startDate })
      .andWhere('entry.createdAt <= :endDate', { endDate })
      .getMany();

    const accounts = new Set<string>();
    let totalDeposits = new Decimal(0);
    let totalWithdrawals = new Decimal(0);
    let totalFees = new Decimal(0);
    let totalOrderVolume = new Decimal(0);

    ledgers.forEach((entry) => {
      accounts.add(entry.accountId);

      const amount = new Decimal(entry.amount);

      if (entry.entryType === 'DEPOSIT') {
        totalDeposits = totalDeposits.plus(amount);
      } else if (entry.entryType === 'WITHDRAWAL') {
        totalWithdrawals = totalWithdrawals.plus(amount);
      } else if (entry.entryType === 'FEE') {
        totalFees = totalFees.plus(amount);
      } else if (entry.entryType === 'ORDER_EXECUTION') {
        totalOrderVolume = totalOrderVolume.plus(amount);
      }
    });

    const netCashFlow = totalDeposits.minus(totalWithdrawals).minus(totalFees);

    return {
      period: { startDate, endDate },
      totalDeposits,
      totalWithdrawals,
      totalFees,
      netCashFlow,
      totalOrderVolume,
      accountsAffected: accounts.size,
    };
  }
}
