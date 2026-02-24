"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const database_1 = require("../config/database");
const Order_1 = require("../entities/Order");
const Account_1 = require("../entities/Account");
const Position_1 = require("../entities/Position");
const Fee_1 = require("../entities/Fee");
const LedgerEntry_1 = require("../entities/LedgerEntry");
const decimal_js_1 = __importDefault(require("decimal.js"));
const uuid_1 = require("uuid");
class OrderService {
    constructor() {
        this.orderRepository = database_1.AppDataSource.getRepository(Order_1.Order);
        this.accountRepository = database_1.AppDataSource.getRepository(Account_1.Account);
        this.positionRepository = database_1.AppDataSource.getRepository(Position_1.Position);
        this.feeRepository = database_1.AppDataSource.getRepository(Fee_1.Fee);
        this.ledgerRepository = database_1.AppDataSource.getRepository(LedgerEntry_1.LedgerEntry);
    }
    /**
     * Submit a new order
     * - Validate account has sufficient balance
     * - Create order in PENDING status
     * - Send to partner broker via BrokerService
     * - Create fee records
     * - Reserve balance for BUY orders
     */
    async submitOrder(accountId, req, brokerService) {
        const { symbol, assetType, side, quantity, orderType, price, optionDetails, futureDetails } = req;
        // Fetch account
        const account = await this.accountRepository.findOne({
            where: { id: accountId },
        });
        if (!account) {
            throw new Error('Account not found');
        }
        if (account.accountStatus !== 'ACTIVE') {
            throw new Error('Account is not active');
        }
        // Estimate order cost (for validation)
        const orderPrice = price || 0; // MARKET orders estimated at 0 for now
        const estimatedCost = new decimal_js_1.default(quantity * orderPrice);
        // For SELL, we need to verify position exists
        if (side === 'SELL') {
            const position = await this.positionRepository.findOne({
                where: { accountId, symbol },
            });
            if (!position || position.quantity.lessThan(quantity)) {
                throw new Error('Insufficient position to sell');
            }
        }
        // For BUY, verify available balance
        if (side === 'BUY') {
            const available = account.getAvailableBalance();
            if (available.lessThan(estimatedCost)) {
                throw new Error('Insufficient balance');
            }
        }
        // Create order
        const order = this.orderRepository.create({
            accountId,
            symbol,
            assetType,
            side,
            quantity,
            orderType,
            price: price || null,
            timeInForce: req.timeInForce || 'DAY',
            optionDetails: optionDetails || null,
            futureDetails: futureDetails || null,
            status: 'PENDING',
            feeRate: 0.005, // 0.5% customer rate
            idempotencyKey: (0, uuid_1.v4)(),
        });
        // Save order
        const savedOrder = await this.orderRepository.save(order);
        // Send to partner broker
        try {
            const brokerResponse = await brokerService.submitOrder({
                orderId: savedOrder.id,
                symbol,
                assetType,
                side,
                quantity,
                orderType,
                price,
                optionDetails,
                futureDetails,
            });
            savedOrder.partnerOrderId = brokerResponse.brokerId;
        }
        catch (err) {
            // If broker API fails, mark order as REJECTED
            savedOrder.status = 'REJECTED';
            // property was named differently on the entity
            savedOrder.rejectionReason = `Broker API error: ${err.message}`;
            await this.orderRepository.save(savedOrder);
            throw err;
        }
        // Reserve balance for BUY orders
        if (side === 'BUY') {
            const reserved = estimatedCost;
            account.reservedBalance = account.reservedBalance.plus(reserved);
            await this.accountRepository.save(account);
        }
        // Create fee record
        const fee = this.feeRepository.create({
            orderId: savedOrder.id,
            accountId,
            feeCategory: 'TRADING_COMMISSION',
            feeType: 'COMMISSION',
            customerRate: 0.005,
            partnerRate: 0.002,
            ourMargin: 0.003,
            notionalValue: quantity * (price || 100), // Estimated
            grossFeeAmount: 0, // Will update on fill
            netFeeAmount: 0, // Will update on fill
            partnerCost: 0, // Will update on fill
        });
        await this.feeRepository.save(fee);
        return this.formatOrderResponse(savedOrder);
    }
    /**
     * Mark order as filled (called from broker webhook)
     * - Update order with fill details
     * - Calculate and post fees
     * - Create/update position
     * - Post ledger entry
     * - Adjust balance
     */
    async fillOrder(orderId, filledQuantity, filledPrice, brokerOrderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['account'],
        });
        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status !== 'PENDING') {
            throw new Error('Order is not in PENDING status');
        }
        // Update order
        order.status = 'FILLED';
        order.filledQuantity = filledQuantity;
        order.filledPrice = filledPrice;
        order.filledAt = new Date();
        if (brokerOrderId) {
            order.partnerOrderId = brokerOrderId;
        }
        const savedOrder = await this.orderRepository.save(order);
        const account = order.account;
        const totalCost = new decimal_js_1.default(filledQuantity * filledPrice);
        // Calculate fees
        const grossFee = totalCost.times(0.005); // Customer pays 0.5%
        const partnerCost = totalCost.times(0.002); // Partner costs 0.2%
        const ourFee = grossFee.minus(partnerCost); // We keep 0.3%
        // Update fee record
        const fee = await this.feeRepository.findOne({
            where: { orderId },
        });
        if (fee) {
            fee.grossFeeAmount = grossFee.toNumber();
            fee.netFeeAmount = ourFee.toNumber();
            fee.partnerCost = partnerCost.toNumber();
            await this.feeRepository.save(fee);
        }
        // Create/update position
        let position = await this.positionRepository.findOne({
            where: { accountId: account.id, symbol: order.symbol },
        });
        if (!position) {
            position = this.positionRepository.create({
                accountId: account.id,
                account,
                symbol: order.symbol,
                quantity: new decimal_js_1.default(0),
                averageOpenPrice: 0,
            });
        }
        if (order.side === 'BUY') {
            // Update average open price (weighted average)
            const totalValue = position.quantity.times(new decimal_js_1.default(position.averageOpenPrice || 0)).plus(totalCost);
            const newQuantity = position.quantity.plus(filledQuantity);
            position.averageOpenPrice = totalValue.dividedBy(newQuantity);
            position.quantity = newQuantity;
        }
        else {
            // SELL
            position.quantity = position.quantity.minus(filledQuantity);
        }
        position.currentValue = position.quantity.times(new decimal_js_1.default(filledPrice));
        const updatedPosition = await this.positionRepository.save(position);
        // Post ledger entry
        const ledgerEntry = this.ledgerRepository.create({
            accountId: account.id,
            account,
            orderId: savedOrder.id,
            order: savedOrder,
            entryType: LedgerEntry_1.EntryType.ORDER_EXECUTION,
            amount: totalCost.toNumber(),
            currency: 'USD',
            description: `${order.side} ${filledQuantity} ${order.symbol} @ ${filledPrice}`,
            metadata: {
                orderSymbol: order.symbol,
                side: order.side,
                quantity: filledQuantity,
                price: filledPrice,
                fee: ourFee.toNumber(),
            },
        });
        await this.ledgerRepository.save(ledgerEntry);
        // Adjust account balance
        if (order.side === 'BUY') {
            // Debit cash and fee
            account.cashBalance = account.cashBalance.minus(totalCost).minus(ourFee);
            account.reservedBalance = account.reservedBalance.minus(totalCost);
        }
        else {
            // Credit cash minus fee
            account.cashBalance = account.cashBalance.plus(totalCost).minus(ourFee);
        }
        account.equity = account.cashBalance.plus(updatedPosition.currentValue);
        await this.accountRepository.save(account);
        return this.formatOrderResponse(savedOrder);
    }
    /**
     * Cancel an order (only if still PENDING)
     */
    async cancelOrder(orderId, brokerService) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['account'],
        });
        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status !== 'PENDING') {
            throw new Error('Can only cancel pending orders');
        }
        // Notify broker
        try {
            if (order.partnerOrderId) {
                await brokerService.cancelOrder(order.partnerOrderId);
            }
        }
        catch (err) {
            console.error(`Failed to cancel broker order ${order.partnerOrderId}:`, err);
        }
        // Update order
        order.status = 'CANCELLED';
        order.cancelledAt = new Date();
        const savedOrder = await this.orderRepository.save(order);
        // Release reserved balance
        const account = order.account;
        if (order.side === 'BUY') {
            const estimatedCost = new decimal_js_1.default(order.quantity * (order.price || 100));
            account.reservedBalance = account.reservedBalance.minus(estimatedCost);
            await this.accountRepository.save(account);
        }
        return this.formatOrderResponse(savedOrder);
    }
    /**
     * Get order history for account
     */
    async getOrderHistory(accountId, limit = 50) {
        const orders = await this.orderRepository.find({
            where: { accountId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return orders.map(this.formatOrderResponse);
    }
    /**
     * Get open orders for account
     */
    async getOpenOrders(accountId) {
        const orders = await this.orderRepository.find({
            where: { accountId, status: 'PENDING' },
        });
        return orders.map(this.formatOrderResponse);
    }
    formatOrderResponse(order) {
        return {
            orderId: order.id,
            symbol: order.symbol,
            status: order.status,
            quantity: order.quantity,
            filledQuantity: order.filledQuantity || 0,
            filledPrice: order.filledPrice,
            fee: {
                grossFee: 0,
                netFee: 0,
                partnerCost: 0,
            },
            createdAt: order.createdAt,
        };
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=OrderService.js.map