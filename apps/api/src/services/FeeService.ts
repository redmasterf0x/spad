import { AppDataSource } from '../config/database';
import { Fee } from '../entities/Fee';
import { Order } from '../entities/Order';
import Decimal from 'decimal.js';

export interface FeeCalculation {
  notionalValue: Decimal;
  customerRate: number; // 0.005 = 0.5%
  partnerRate: number; // 0.002 = 0.2%
  grossFeeAmount: Decimal; // What customer pays
  partnerCost: Decimal; // What partner costs us
  ourMargin: Decimal; // What we keep (grossFee - partnerCost)
}

/**
 * FeeService: Calculates and tracks trading fees
 *
 * Revenue Model (MVP):
 * - Customer pays: 0.5% on notional value
 * - Partner costs: 0.2% on notional value
 * - Our margin: 0.3% on notional value
 *
 * Example: $100,000 notional
 * - Customer fee: $100,000 × 0.5% = $500
 * - Partner cost: $100,000 × 0.2% = $200
 * - Our margin: $500 - $200 = $300
 *
 * Daily revenue target: $500k/month ÷ 20 trading days = $25k/day
 * To hit $25k/day margin @ 0.3%: $25,000 ÷ 0.003 = $8.33M notional volume/day
 */
export class FeeService {
  private feeRepository = AppDataSource.getRepository(Fee);
  private orderRepository = AppDataSource.getRepository(Order);

  /**
   * Calculate fees for an order based on notional value
   */
  calculateFees(notionalValue: Decimal): FeeCalculation {
    const customerRate = 0.005; // 0.5%
    const partnerRate = 0.002; // 0.2%

    const grossFeeAmount = notionalValue.times(customerRate);
    const partnerCost = notionalValue.times(partnerRate);
    const ourMargin = grossFeeAmount.minus(partnerCost);

    return {
      notionalValue,
      customerRate,
      partnerRate,
      grossFeeAmount,
      partnerCost,
      ourMargin,
    };
  }

  /**
   * Track fee for an order (called on order fill)
   */
  async recordFee(
    orderId: string,
    accountId: string,
    filledQuantity: number,
    filledPrice: number,
    feeRecord?: Fee
  ): Promise<Fee> {
    const notionalValue = new Decimal(filledQuantity * filledPrice);
    const calc = this.calculateFees(notionalValue);

    if (feeRecord) {
      // Update existing fee record
      feeRecord.grossFeeAmount = calc.grossFeeAmount.toNumber();
      feeRecord.netFeeAmount = calc.ourMargin.toNumber();
      feeRecord.partnerCost = calc.partnerCost.toNumber();
      feeRecord.notionalValue = notionalValue.toNumber();

      return this.feeRepository.save(feeRecord);
    }

    // Create new fee record
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    const account = order?.account;

    const fee = this.feeRepository.create({
      orderId,
      order,
      accountId,
      account,
      feeCategory: 'TRADING_COMMISSION',
      feeType: 'COMMISSION',
      grossFeeAmount: calc.grossFeeAmount.toNumber(),
      netFeeAmount: calc.ourMargin.toNumber(),
      partnerCost: calc.partnerCost.toNumber(),
      customerRate: 0.005,
      partnerRate: 0.002,
      ourMargin: 0.003,
      notionalValue: notionalValue.toNumber(),
    });

    return this.feeRepository.save(fee);
  }

  /**
   * Get all fees for account
   */
  async getAccountFees(accountId: string): Promise<Fee[]> {
    return this.feeRepository.find({
      where: { accountId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Calculate total fees for account
   */
  async getAccountFeesSummary(
    accountId: string
  ): Promise<{
    totalGrossFees: Decimal;
    totalNetFees: Decimal;
    totalPartnerCosts: Decimal;
    feeCount: number;
  }> {
    const fees = await this.getAccountFees(accountId);

    let totalGrossFees = new Decimal(0);
    let totalNetFees = new Decimal(0);
    let totalPartnerCosts = new Decimal(0);

    fees.forEach((fee) => {
      totalGrossFees = totalGrossFees.plus(fee.grossFeeAmount || 0);
      totalNetFees = totalNetFees.plus(fee.netFeeAmount || 0);
      totalPartnerCosts = totalPartnerCosts.plus(fee.partnerCost || 0);
    });

    return {
      totalGrossFees,
      totalNetFees,
      totalPartnerCosts,
      feeCount: fees.length,
    };
  }

  /**
   * Get fees by date range
   */
  async getFeesByDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    fees: Fee[];
    totalGrossFees: Decimal;
    totalNetFees: Decimal;
  }> {
    const fees = await this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.accountId = :accountId', { accountId })
      .andWhere('fee.createdAt >= :startDate', { startDate })
      .andWhere('fee.createdAt <= :endDate', { endDate })
      .orderBy('fee.createdAt', 'DESC')
      .getMany();

    let totalGrossFees = new Decimal(0);
    let totalNetFees = new Decimal(0);

    fees.forEach((fee) => {
      totalGrossFees = totalGrossFees.plus(fee.grossFeeAmount || 0);
      totalNetFees = totalNetFees.plus(fee.netFeeAmount || 0);
    });

    return {
      fees,
      totalGrossFees,
      totalNetFees,
    };
  }

  /**
   * Calculate platform-wide revenue metrics
   */
  async getPlatformMetrics(startDate: Date, endDate: Date): Promise<{
    totalNotionalVolume: Decimal;
    totalCustomerFees: Decimal;
    totalPartnerCosts: Decimal;
    totalPlatformRevenue: Decimal;
    revenuePer1MNotional: Decimal;
    orderCount: number;
  }> {
    const fees = await this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.createdAt >= :startDate', { startDate })
      .andWhere('fee.createdAt <= :endDate', { endDate })
      .getMany();

    let totalNotionalVolume = new Decimal(0);
    let totalCustomerFees = new Decimal(0);
    let totalPartnerCosts = new Decimal(0);

    fees.forEach((fee) => {
      totalNotionalVolume = totalNotionalVolume.plus(fee.notionalValue || 0);
      totalCustomerFees = totalCustomerFees.plus(fee.grossFeeAmount || 0);
      totalPartnerCosts = totalPartnerCosts.plus(fee.partnerCost || 0);
    });

    const totalPlatformRevenue = totalCustomerFees.minus(totalPartnerCosts);
    const revenuePer1MNotional = totalNotionalVolume.greaterThan(0)
      ? totalPlatformRevenue.times(1000000).dividedBy(totalNotionalVolume)
      : new Decimal(0);

    return {
      totalNotionalVolume,
      totalCustomerFees,
      totalPartnerCosts,
      totalPlatformRevenue,
      revenuePer1MNotional,
      orderCount: fees.length,
    };
  }

  /**
   * Generate invoice for customer (collection of fees)
   */
  async generateInvoice(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    invoiceId: string;
    accountId: string;
    period: { startDate: Date; endDate: Date };
    fees: Fee[];
    totalAmount: Decimal;
    invoiceDate: Date;
  }> {
    const { fees, totalGrossFees } = await this.getFeesByDateRange(accountId, startDate, endDate);

    return {
      invoiceId: `INV_${accountId}_${Date.now()}`,
      accountId,
      period: { startDate, endDate },
      fees,
      totalAmount: totalGrossFees,
      invoiceDate: new Date(),
    };
  }
}
