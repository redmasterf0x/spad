"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalTransformer = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
exports.DecimalTransformer = {
    to: (value) => {
        if (value === null || value === undefined) {
            return value;
        }
        return value.toString();
    },
    from: (value) => {
        if (value === null || value === undefined) {
            return value;
        }
        return new decimal_js_1.default(value);
    },
};
//# sourceMappingURL=decimalTransformer.js.map