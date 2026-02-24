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
export declare class AdminService {
    private accountRepository;
    private feeRepository;
    private orderRepository;
    private ledgerRepository;
    /**
     * Get daily revenue for a specific date
     */
    getDailyRevenue(date: Date): Promise<{
        date: Date;
        totalCustomerFees: Decimal;
        totalPartnerCosts: Decimal;
        netRevenue: Decimal;
        orderCount: number;
        notionalVolume: Decimal;
    }>;
    /**
     * Get monthly revenue summary
     */
    getMonthlyRevenue(year: number, month: number): Promise<{
        month: string;
        totalCustomerFees: Decimal;
        totalPartnerCosts: Decimal;
        netRevenue: Decimal;
        orderCount: number;
        notionalVolume: Decimal;
        averageFeePerOrder: Decimal;
    }>;
    /**
     * Get top customers by volume
     */
    getTopCustomersByVolume(limit?: number): Promise<Array<{
        accountId: string;
        userId: string;
        email: string;
        totalVolume: Decimal;
        totalFeesPaid: Decimal;
        orderCount: number;
        averageOrderSize: Decimal;
    }>>;
    /**
     * Get platform metrics (KPIs)
     */
    getPlatformMetrics(): Promise<{
        totalCustomers: number;
        totalAUM: Decimal;
        totalTraded: Decimal;
        totalOrders: number;
        totalPlainFormRevenue: Decimal;
        monthlyArpu: Decimal;
        avgOrderSize: Decimal;
    }>;
    /**
     * Get revenue vs cost comparison
     */
    getRevenueCostComparison(startDate: Date, endDate: Date): Promise<{
        period: {
            startDate: Date;
            endDate: Date;
        };
        totalCustomerFees: Decimal;
        totalPartnerCosts: Decimal;
        grossMargin: Decimal;
        marginPercentage: number;
        marginPercentageBreakdown: {
            customer: number;
            partner: number;
            ours: number;
        };
    }>;
    /**
     * Get order stats
     */
    getOrderStats(startDate: Date, endDate: Date): Promise<{
        totalOrders: number;
        filledOrders: number;
        cancelledOrders: number;
        rejectedOrders: number;
        fillRate: number;
        avgTimeToFill: number;
        buySideVolume: Decimal;
        sellSideVolume: Decimal;
    }>;
    /**
     * Get trail balance audit report
     */
    getAuditReport(startDate: Date, endDate: Date): Promise<{
        period: {
            startDate: Date;
            endDate: Date;
        };
        totalDeposits: Decimal;
        totalWithdrawals: Decimal;
        totalFees: Decimal;
        netCashFlow: Decimal;
        totalOrderVolume: Decimal;
        accountsAffected: number;
    }>;
}
//# sourceMappingURL=AdminService.d.ts.map