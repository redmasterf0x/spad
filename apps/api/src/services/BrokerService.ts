import axios, { AxiosInstance } from 'axios';

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
  brokerId: string; // Order ID from partner broker
  status: 'accepted' | 'rejected';
  message?: string;
}

export interface BrokerWebhookPayload {
  eventType: 'ORDER_FILLED' | 'ORDER_REJECTED' | 'ORDER_CANCELLED' | 'ORDER_PARTIALLY_FILLED';
  orderId: string; // Our internal order ID (should have been sent by us)
  brokerOrderId: string; // Broker's order ID
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
export class BrokerService {
  private apiClient?: AxiosInstance;
  private brokerApiUrl: string;
  private brokerApiKey: string;
  private brokerApiSecret: string;
  private mockMode: boolean;

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
      this.apiClient = axios.create({
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

      this.apiClient.interceptors.response.use(
        (response) => {
          console.log(`[Broker API] Response: ${response.status}`);
          return response;
        },
        (error) => {
          console.error(`[Broker API] Error: ${error.response?.status} ${error.message}`);
          throw error;
        }
      );
    }
  }

  /**
   * Submit an order to the broker
   * In production: POST /orders with full order details
   * In mock mode: Generate broker order ID, return immediately
   */
  async submitOrder(req: BrokerOrderRequest): Promise<BrokerOrderResponse> {
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
    } catch (error) {
      console.error('Failed to submit order to broker:', error);
      throw new Error(`Broker API error: ${(error as Error).message}`);
    }
  }

  /**
   * Cancel an order with the broker
   * In production: DELETE /orders/{brokerId}
   * In mock mode: Simulate cancellation
   */
  async cancelOrder(brokerId: string): Promise<void> {
    if (this.mockMode) {
      console.log(`[Mock] Cancelling broker order ${brokerId}`);
      return;
    }

    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      await this.apiClient.delete(`/orders/${brokerId}`);
    } catch (error) {
      console.error(`Failed to cancel broker order ${brokerId}:`, error);
      throw new Error(`Broker API error: ${(error as Error).message}`);
    }
  }

  /**
   * Get order status from broker
   * In production: GET /orders/{brokerId}
   * In mock mode: Return FILLED status after delay
   */
  async getOrderStatus(brokerId: string): Promise<any> {
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
    } catch (error) {
      console.error(`Failed to get order status from broker:`, error);
      throw new Error(`Broker API error: ${(error as Error).message}`);
    }
  }

  /**
   * Verify webhook signature from broker
   * Prevents replay attacks
   */
  verifWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.brokerApiSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  // ==================== MOCK MODE IMPLEMENTATIONS ====================

  private submitOrderMock(req: BrokerOrderRequest): BrokerOrderResponse {
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
  simulateOrderFill(
    ourOrderId: string,
    brokerId: string,
    filledQuantity: number,
    filledPrice: number
  ): BrokerWebhookPayload {
    return {
      eventType: 'ORDER_FILLED',
      orderId: ourOrderId,
      brokerOrderId: brokerId,
      filledQuantity,
      filledPrice,
    };
  }

  simulateOrderRejection(ourOrderId: string, brokerId: string, reason: string): BrokerWebhookPayload {
    return {
      eventType: 'ORDER_REJECTED',
      orderId: ourOrderId,
      brokerOrderId: brokerId,
      rejectReason: reason,
    };
  }
}

// Singleton instance
let brokerServiceInstance: BrokerService;

export function getBrokerService(): BrokerService {
  if (!brokerServiceInstance) {
    brokerServiceInstance = new BrokerService();
  }
  return brokerServiceInstance;
}
