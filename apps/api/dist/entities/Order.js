"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const typeorm_1 = require("typeorm");
const decimalTransformer_1 = require("../utils/decimalTransformer");
const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
const Account_1 = require("./Account");
const LedgerEntry_1 = require("./LedgerEntry");
const Fee_1 = require("./Fee");
let Order = class Order {
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, account => account.orders, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", Account_1.Account)
], Order.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Order.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Order.prototype, "assetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "optionDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "futureDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Order.prototype, "side", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Order.prototype, "orderType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "stopPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'DAY' }),
    __metadata("design:type", String)
], Order.prototype, "timeInForce", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'PENDING' }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "filledQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "filledPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "partnerOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "partnerStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "partnerRejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 4, default: 0.005, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "feeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "feeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'COMMISSION' }),
    __metadata("design:type", String)
], Order.prototype, "feeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true, nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "submittedToBrokerAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "filledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Fee_1.Fee, fee => fee.order),
    __metadata("design:type", Array)
], Order.prototype, "fees", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LedgerEntry_1.LedgerEntry, entry => entry.order),
    __metadata("design:type", Array)
], Order.prototype, "ledgerEntries", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['accountId']),
    (0, typeorm_1.Index)(['symbol']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['partnerOrderId']),
    (0, typeorm_1.Index)(['createdAt'])
], Order);
//# sourceMappingURL=Order.js.map