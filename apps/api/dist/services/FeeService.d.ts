import { Fee } from '../entities/Fee';
import Decimal from 'decimal.js';
export interface FeeCalculation {
    notionalValue: Decimal;
    customerRate: number;
    partnerRate: number;
    grossFeeAmount: Decimal;
    partnerCost: Decimal;
    ourMargin: Decimal;
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
export declare class FeeService {
    private feeRepository;
    private orderRepository;
    /**
     * Calculate fees for an order based on notional value
     */
    calculateFees(notionalValue: Decimal): FeeCalculation;
    /**
     * Track fee for an order (called on order fill)
     */
    recordFee(orderId: string, accountId: string, filledQuantity: number, filledPrice: number, feeRecord?: Fee): Promise<Fee>;
    /**
     * Get all fees for account
     */
    getAccountFees(accountId: string): Promise<Fee[]>;
    /**
     * Calculate total fees for account
     */
    getAccountFeesSummary(accountId: string): Promise<{
        totalGrossFees: Decimal;
        totalNetFees: Decimal;
        totalPartnerCosts: Decimal;
        feeCount: number;
    }>;
    /**
     * Get fees by date range
     */
    getFeesByDateRange(accountId: string, startDate: Date, endDate: Date): Promise<{
        fees: Fee[];
        totalGrossFees: Decimal;
        totalNetFees: Decimal;
    }>;
    /**
     * Calculate platform-wide revenue metrics
     */
    getPlatformMetrics(startDate: Date, endDate: Date): Promise<{
        totalNotionalVolume: Decimal;
        totalCustomerFees: Decimal;
        totalPartnerCosts: Decimal;
        totalPlatformRevenue: Decimal;
        revenuePer1MNotional: Decimal;
        orderCount: number;
    }>;
    /**
     * Generate invoice for customer (collection of fees)
     */
    generateInvoice(accountId: string, startDate: Date, endDate: Date): Promise<{
        invoiceId: string;
        accountId: string;
        period: {
            startDate: Date;
            endDate: Date;
        };
        fees: Fee[];
        totalAmount: Decimal;
        invoiceDate: Date;
    }>;
}
//# sourceMappingURL=FeeService.d.ts.map