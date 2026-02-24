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
exports.Account = void 0;
const typeorm_1 = require("typeorm");
const decimalTransformer_1 = require("../utils/decimalTransformer");
// timestamp type helper for sqlite tests
const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
const User_1 = require("./User");
const Order_1 = require("./Order");
const Position_1 = require("./Position");
const LedgerEntry_1 = require("./LedgerEntry");
const Fee_1 = require("./Fee");
const Transfer_1 = require("./Transfer");
const decimal_js_1 = __importDefault(require("decimal.js"));
let Account = class Account {
    // Helper methods
    // Convert values to Decimal in case the ORM returned plain numbers (e.g.
    // when running against SQLite in tests).
    getAvailableBalance() {
        const cash = new decimal_js_1.default(this.cashBalance);
        const reserved = new decimal_js_1.default(this.reservedBalance);
        return cash.minus(reserved);
    }
    getBuyingPower() {
        // No margin in MVP, buying power = available cash
        return this.getAvailableBalance();
    }
};
exports.Account = Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Account.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.accounts, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], Account.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'TRADING' }),
    __metadata("design:type", String)
], Account.prototype, "accountType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'ACTIVE' })
    // NOTE: 'SUSPENDED' added for compliance/account holds
    ,
    __metadata("design:type", String)
], Account.prototype, "accountStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, default: 'USD' }),
    __metadata("design:type", String)
], Account.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "suspensionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Account.prototype, "cashBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Account.prototype, "reservedBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Account.prototype, "marginAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "brokerAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "evolveAccountId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Account.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], Account.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], Account.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Account.prototype, "totalPositionsValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Account.prototype, "totalPl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: decimalTransformer_1.DecimalTransformer }),
    __metadata("design:type", decimal_js_1.default)
], Account.prototype, "equity", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Order_1.Order, order => order.account),
    __metadata("design:type", Array)
], Account.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Position_1.Position, position => position.account),
    __metadata("design:type", Array)
], Account.prototype, "positions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LedgerEntry_1.LedgerEntry, entry => entry.account),
    __metadata("design:type", Array)
], Account.prototype, "ledgerEntries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Fee_1.Fee, fee => fee.account),
    __metadata("design:type", Array)
], Account.prototype, "fees", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Transfer_1.Transfer, transfer => transfer.account),
    __metadata("design:type", Array)
], Account.prototype, "transfers", void 0);
exports.Account = Account = __decorate([
    (0, typeorm_1.Entity)('accounts'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['accountStatus']),
    (0, typeorm_1.Index)(['brokerAccountId'])
], Account);
//# sourceMappingURL=Account.js.map