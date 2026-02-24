export interface BrokerOrderRequest {
    orderId: string;
    symbol: string;
    assetType: 'OPTION' | 'FUTURE';
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    price?: number;
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
export interface BrokerOrderResponse {
    brokerId: string;
    status: 'accepted' | 'rejected';
    message?: string;
}
export interface BrokerWebhookPayload {
    eventType: 'ORDER_FILLED' | 'ORDER_REJECTED' | 'ORDER_CANCELLED' | 'ORDER_PARTIALLY_FILLED';
    orderId: string;
    brokerOrderId: string;
    filledQuantity?: number;
    filledPrice?: number;
    rejectReason?: string;
}
/**
 * BrokerService: Wrapper around partner broker API
 *
 * The partner broker is a real US options/futures broker (e.g., Interactive Brokers, Charles Schwab)
 * that routes our orders. In production, this would be live API calls with proper auth.
 *
 * For MVP testing, implements a "mock" mode for local development.
 */
export declare class BrokerService {
    private apiClient?;
    private brokerApiUrl;
    private brokerApiKey;
    private brokerApiSecret;
    private mockMode;
    constructor();
    /**
     * Submit an order to the broker
     * In production: POST /orders with full order details
     * In mock mode: Generate broker order ID, return immediately
     */
    submitOrder(req: BrokerOrderRequest): Promise<BrokerOrderResponse>;
    /**
     * Cancel an order with the broker
     * In production: DELETE /orders/{brokerId}
     * In mock mode: Simulate cancellation
     */
    cancelOrder(brokerId: string): Promise<void>;
    /**
     * Get order status from broker
     * In production: GET /orders/{brokerId}
     * In mock mode: Return FILLED status after delay
     */
    getOrderStatus(brokerId: string): Promise<any>;
    /**
     * Verify webhook signature from broker
     * Prevents replay attacks
     */
    verifWebhookSignature(payload: string, signature: string): boolean;
    private submitOrderMock;
    /**
     * Simulate broker webhook event
     * In production, this would be called by broker's servers
     * For testing, we manually trigger this
     */
    simulateOrderFill(ourOrderId: string, brokerId: string, filledQuantity: number, filledPrice: number): BrokerWebhookPayload;
    simulateOrderRejection(ourOrderId: string, brokerId: string, reason: string): BrokerWebhookPayload;
}
export declare function getBrokerService(): BrokerService;
//# sourceMappingURL=BrokerService.d.ts.map