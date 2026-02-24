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
exports.Fee = void 0;
const typeorm_1 = require("typeorm");
const decimalTransformer_1 = require("../utils/decimalTransformer");
const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
const Order_1 = require("./Order");
const Account_1 = require("./Account");
let Fee = class Fee {
};
exports.Fee = Fee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Fee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Fee.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Order_1.Order, order => order.fees, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'orderId' }),
    __metadata("design:type", Order_1.Order)
], Fee.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Fee.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, account => account.fees, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", Account_1.Account)
], Fee.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Fee.prototype, "feeCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Fee.prototype, "feeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "grossFeeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "netFeeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "partnerCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "customerRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "partnerRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "ourMargin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", Number)
], Fee.prototype, "notionalValue", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Fee.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Fee.prototype, "paidAt", void 0);
exports.Fee = Fee = __decorate([
    (0, typeorm_1.Entity)('fees'),
    (0, typeorm_1.Index)(['accountId']),
    (0, typeorm_1.Index)(['orderId']),
    (0, typeorm_1.Index)(['createdAt'])
], Fee);
//# sourceMappingURL=Fee.js.map