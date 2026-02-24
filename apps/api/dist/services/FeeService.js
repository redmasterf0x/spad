"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeService = void 0;
const database_1 = require("../config/database");
const Fee_1 = require("../entities/Fee");
const Order_1 = require("../entities/Order");
const decimal_js_1 = __importDefault(require("decimal.js"));
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
class FeeService {
    constructor() {
        this.feeRepository = database_1.AppDataSource.getRepository(Fee_1.Fee);
        this.orderRepository = database_1.AppDataSource.getRepository(Order_1.Order);
    }
    /**
     * Calculate fees for an order based on notional value
     */
    calculateFees(notionalValue) {
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
    async recordFee(orderId, accountId, filledQuantity, filledPrice, feeRecord) {
        const notionalValue = new decimal_js_1.default(filledQuantity * filledPrice);
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
    async getAccountFees(accountId) {
        return this.feeRepository.find({
            where: { accountId },
            relations: ['order'],
            order: { createdAt: 'DESC' },
        });
    }
    /**
     * Calculate total fees for account
     */
    async getAccountFeesSummary(accountId) {
        const fees = await this.getAccountFees(accountId);
        let totalGrossFees = new decimal_js_1.default(0);
        let totalNetFees = new decimal_js_1.default(0);
        let totalPartnerCosts = new decimal_js_1.default(0);
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
    async getFeesByDateRange(accountId, startDate, endDate) {
        const fees = await this.feeRepository
            .createQueryBuilder('fee')
            .where('fee.accountId = :accountId', { accountId })
            .andWhere('fee.createdAt >= :startDate', { startDate })
            .andWhere('fee.createdAt <= :endDate', { endDate })
            .orderBy('fee.createdAt', 'DESC')
            .getMany();
        let totalGrossFees = new decimal_js_1.default(0);
        let totalNetFees = new decimal_js_1.default(0);
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
    async getPlatformMetrics(startDate, endDate) {
        const fees = await this.feeRepository
            .createQueryBuilder('fee')
            .where('fee.createdAt >= :startDate', { startDate })
            .andWhere('fee.createdAt <= :endDate', { endDate })
            .getMany();
        let totalNotionalVolume = new decimal_js_1.default(0);
        let totalCustomerFees = new decimal_js_1.default(0);
        let totalPartnerCosts = new decimal_js_1.default(0);
        fees.forEach((fee) => {
            totalNotionalVolume = totalNotionalVolume.plus(fee.notionalValue || 0);
            totalCustomerFees = totalCustomerFees.plus(fee.grossFeeAmount || 0);
            totalPartnerCosts = totalPartnerCosts.plus(fee.partnerCost || 0);
        });
        const totalPlatformRevenue = totalCustomerFees.minus(totalPartnerCosts);
        const revenuePer1MNotional = totalNotionalVolume.greaterThan(0)
            ? totalPlatformRevenue.times(1000000).dividedBy(totalNotionalVolume)
            : new decimal_js_1.default(0);
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
    async generateInvoice(accountId, startDate, endDate) {
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
exports.FeeService = FeeService;
//# sourceMappingURL=FeeService.js.map