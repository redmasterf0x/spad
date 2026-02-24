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
exports.LedgerEntry = exports.EntryType = void 0;
const typeorm_1 = require("typeorm");
const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
const Account_1 = require("./Account");
const Order_1 = require("./Order");
// Types shared with services/tests
var EntryType;
(function (EntryType) {
    EntryType["DEPOSIT"] = "DEPOSIT";
    EntryType["WITHDRAWAL"] = "WITHDRAWAL";
    EntryType["ORDER_EXECUTION"] = "ORDER_EXECUTION";
    EntryType["FEE"] = "FEE";
    EntryType["DIVIDEND"] = "DIVIDEND";
    EntryType["INTEREST"] = "INTEREST";
    EntryType["ADJUSTMENT"] = "ADJUSTMENT";
    EntryType["TRANSFER"] = "TRANSFER";
    EntryType["CORRECTION"] = "CORRECTION";
})(EntryType || (exports.EntryType = EntryType = {}));
let LedgerEntry = class LedgerEntry {
};
exports.LedgerEntry = LedgerEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LedgerEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], LedgerEntry.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account, account => account.ledgerEntries, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", Account_1.Account)
], LedgerEntry.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "entryType", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Order_1.Order, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'orderId' }),
    __metadata("design:type", Order_1.Order)
], LedgerEntry.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "transferId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "reconciliationId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "debitAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "creditAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], LedgerEntry.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, default: 'USD' }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], LedgerEntry.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], LedgerEntry.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: TS }),
    __metadata("design:type", Date)
], LedgerEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], LedgerEntry.prototype, "isReconciled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: TS, nullable: true }),
    __metadata("design:type", Date)
], LedgerEntry.prototype, "reconciledAt", void 0);
exports.LedgerEntry = LedgerEntry = __decorate([
    (0, typeorm_1.Entity)('ledger_entries'),
    (0, typeorm_1.Index)(['accountId']),
    (0, typeorm_1.Index)(['orderId']),
    (0, typeorm_1.Index)(['entryType']),
    (0, typeorm_1.Index)(['createdAt'])
], LedgerEntry);
//# sourceMappingURL=LedgerEntry.js.map