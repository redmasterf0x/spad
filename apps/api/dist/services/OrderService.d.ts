export interface SubmitOrderRequest {
    symbol: string;
    assetType: 'OPTION' | 'FUTURE';
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    price?: number;
    timeInForce?: 'DAY' | 'GTC';
    optionDetails?: {
        expiryDate: string;
        strikePrice: number;
        contractType: 'CALL' | 'PUT';
        multiplier: number;
    };
    futureDetails?: {
        expiryDate: string;
        contractCode: string;
    };
}
export interface OrderResponse {
    orderId: string;
    symbol: string;
    status: string;
    quantity: number;
    filledQuantity: number;
    filledPrice: number | null;
    fee: {
        grossFee: number;
        netFee: number;
        partnerCost: number;
    };
    createdAt: Date;
}
export declare class OrderService {
    private orderRepository;
    private accountRepository;
    private positionRepository;
    private feeRepository;
    private ledgerRepository;
    /**
     * Submit a new order
     * - Validate account has sufficient balance
     * - Create order in PENDING status
     * - Send to partner broker via BrokerService
     * - Create fee records
     * - Reserve balance for BUY orders
     */
    submitOrder(accountId: string, req: SubmitOrderRequest, brokerService: any): Promise<OrderResponse>;
    /**
     * Mark order as filled (called from broker webhook)
     * - Update order with fill details
     * - Calculate and post fees
     * - Create/update position
     * - Post ledger entry
     * - Adjust balance
     */
    fillOrder(orderId: string, filledQuantity: number, filledPrice: number, brokerOrderId?: string): Promise<OrderResponse>;
    /**
     * Cancel an order (only if still PENDING)
     */
    cancelOrder(orderId: string, brokerService: any): Promise<OrderResponse>;
    /**
     * Get order history for account
     */
    getOrderHistory(accountId: string, limit?: number): Promise<OrderResponse[]>;
    /**
     * Get open orders for account
     */
    getOpenOrders(accountId: string): Promise<OrderResponse[]>;
    private formatOrderResponse;
}
//# sourceMappingURL=OrderService.d.ts.map