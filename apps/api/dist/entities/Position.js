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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const typeorm_1 = require("typeorm");
const decimalTransformer_1 = require("../utils/decimalTransformer");
const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
const Account_1 = require("./Account");
const decimal_js_1 = __importDefault(require("decimal.js"));
let Position = class Position {
};
exports.Position = Position;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Position.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Position.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, account => account.positions, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", Account_1.Account)
], Position.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Position.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Position.prototype, "assetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Position.prototype, "optionDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Position.prototype, "side", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 4, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "averageOpenPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "totalOpenCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 4, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "currentPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "currentValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "unrealizedPl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 6, scale: 2, nullable: true, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "unrealizedPlPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "realizedPl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Position.prototype, "closedQuantity", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Position.prototype, "openedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Position.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Position.prototype, "currentPriceUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Position.prototype, "updatedAt", void 0);
exports.Position = Position = __decorate([
    (0, typeorm_1.Entity)('positions'),
    (0, typeorm_1.Index)(['accountId']),
    (0, typeorm_1.Index)(['symbol']),
    (0, typeorm_1.Index)(['openedAt'])
], Position);
//# sourceMappingURL=Position.js.map