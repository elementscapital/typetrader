export type CommissionOptions = {
  comm: number;
  min?: number;
}

export function innerCommissionFn(size: number, price: number, options: CommissionOptions) {
  return Math.max(options.min || 0, Math.abs(size) * price * options.comm);
}

export type CommissionFn = (size: number, price: number) => number;
