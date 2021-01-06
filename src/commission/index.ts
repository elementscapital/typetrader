export type CommissionOptions = {
  commission: number;
  min?: number;
}

export function innerCommissionFn(size: number, price: number, options: CommissionOptions) {
  return Math.min(options.min || 0, Math.abs(size) * price * options.commission);
}

export type CommissionFn = (size: number, price: number) => number;
