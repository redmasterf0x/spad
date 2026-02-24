import Decimal from 'decimal.js';

export const DecimalTransformer = {
  to: (value: Decimal | null): string | null => {
    if (value === null || value === undefined) {
      return value as any;
    }
    return value.toString();
  },
  from: (value: string | number | null): Decimal | null => {
    if (value === null || value === undefined) {
      return value as any;
    }
    return new Decimal(value as any);
  },
};
