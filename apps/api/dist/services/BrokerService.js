"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrokerService = void 0;
exports.getBrokerService = getBrokerService;
const axios_1 = __importDefault(require("axios"));
/**
 * BrokerService: Wrapper around partner broker API
 *
 * The partner broker is a real US options/futures broker (e.g., Interactive Brokers, Charles Schwab)
 * that routes our orders. In production, this would be live API calls with proper auth.
 *
 * For MVP testing, implements a "mock" mode for local development.
 */
class BrokerService {
    constructor() {
        this.brokerApiUrl = process.env.BROKER_API_URL || '';
        this.brokerApiKey = process.env.BROKER_API_KEY || '';
        this.brokerApiSecret = process.env.BROKER_API_SECRET || '';
        this.mockMode = process.env.BROKER_MOCK_MODE === 'true';
        if (!this.mockMode && !this.brokerApiUrl) {
            console.warn('BROKER_API_URL not configured, using mock mode');
            this.mockMode = true;
        }
        if (!this.mockMode) {
            // Initialize Axios client with broker auth headers
            this.apiClient = axios_1.default.create({
                baseURL: this.brokerApiUrl,
                timeout: 30000,
                headers: {
                    'X-API-Key': this.brokerApiKey,
                    'X-API-Secret': this.brokerApiSecret,
                    'Content-Type': 'application/json',
                },
            });
            // Add request/response interceptors for logging
            this.apiClient.interceptors.request.use((config) => {
                console.log(`[Broker API] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            });
            this.apiClient.interceptors.response.use((response) => {
                console.log(`[Broker API] Response: ${response.status}`);
                return response;
            }, (error) => {
                console.error(`[Broker API] Error: ${error.response?.status} ${error.message}`);
                throw error;
            });
        }
    }
    /**
     * Submit an order to the broker
     * In production: POST /orders with full order details
     * In mock mode: Generate broker order ID, return immediately
     */
    async submitOrder(req) {
        if (this.mockMode) {
            return this.submitOrderMock(req);
        }
        try {
            if (!this.apiClient) {
                throw new Error('API client not initialized');
            }
            const response = await this.apiClient.post('/orders', {
                externalOrderId: req.orderId,
                symbol: req.symbol,
                assetType: req.assetType,
                side: req.side,
                quantity: req.quantity,
                orderType: req.orderType,
                price: req.price,
                optionDetails: req.optionDetails,
                futureDetails: req.futureDetails,
            });
            return {
                brokerId: response.data.orderId,
                status: response.data.status,
                message: response.data.message,
            };
        }
        catch (error) {
            console.error('Failed to submit order to broker:', error);
            throw new Error(`Broker API error: ${error.message}`);
        }
    }
    /**
     * Cancel an order with the broker
     * In production: DELETE /orders/{brokerId}
     * In mock mode: Simulate cancellation
     */
    async cancelOrder(brokerId) {
        if (this.mockMode) {
            console.log(`[Mock] Cancelling broker order ${brokerId}`);
            return;
        }
        try {
            if (!this.apiClient) {
                throw new Error('API client not initialized');
            }
            await this.apiClient.delete(`/orders/${brokerId}`);
        }
        catch (error) {
            console.error(`Failed to cancel broker order ${brokerId}:`, error);
            throw new Error(`Broker API error: ${error.message}`);
        }
    }
    /**
     * Get order status from broker
     * In production: GET /orders/{brokerId}
     * In mock mode: Return FILLED status after delay
     */
    async getOrderStatus(brokerId) {
        if (this.mockMode) {
            return {
                brokerId,
                status: 'FILLED',
                filledQuantity: 1,
                filledPrice: 450.0,
            };
        }
        try {
            if (!this.apiClient) {
                throw new Error('API client not initialized');
            }
            const response = await this.apiClient.get(`/orders/${brokerId}`);
            return response.data;
        }
        catch (error) {
            console.error(`Failed to get order status from broker:`, error);
            throw new Error(`Broker API error: ${error.message}`);
        }
    }
    /**
     * Verify webhook signature from broker
     * Prevents replay attacks
     */
    verifWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.brokerApiSecret)
            .update(payload)
            .digest('hex');
        return expectedSignature === signature;
    }
    // ==================== MOCK MODE IMPLEMENTATIONS ====================
    submitOrderMock(req) {
        // Generate mock broker order ID
        const brokerId = `MOCK_${req.orderId.substring(0, 8).toUpperCase()}_${Date.now()}`;
        console.log(`[Mock] Submitted order to broker: ${brokerId}`);
        console.log(`  Symbol: ${req.symbol}`);
        console.log(`  Side: ${req.side}`);
        console.log(`  Quantity: ${req.quantity}`);
        console.log(`  OrderType: ${req.orderType}`);
        if (req.price) {
            console.log(`  Price: ${req.price}`);
        }
        return {
            brokerId,
            status: 'accepted',
            message: 'Order accepted by broker (mock)',
        };
    }
    /**
     * Simulate broker webhook event
     * In production, this would be called by broker's servers
     * For testing, we manually trigger this
     */
    simulateOrderFill(ourOrderId, brokerId, filledQuantity, filledPrice) {
        return {
            eventType: 'ORDER_FILLED',
            orderId: ourOrderId,
            brokerOrderId: brokerId,
            filledQuantity,
            filledPrice,
        };
    }
    simulateOrderRejection(ourOrderId, brokerId, reason) {
        return {
            eventType: 'ORDER_REJECTED',
            orderId: ourOrderId,
            brokerOrderId: brokerId,
            rejectReason: reason,
        };
    }
}
exports.BrokerService = BrokerService;
// Singleton instance
let brokerServiceInstance;
function getBrokerService() {
    if (!brokerServiceInstance) {
        brokerServiceInstance = new BrokerService();
    }
    return brokerServiceInstance;
}
//# sourceMappingURL=BrokerService.js.map