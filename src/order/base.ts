import { OrderType } from './type';
import { OrderStatus } from './status';
import { DataStore } from '../data';

interface BaseOrderOptions {
  /**
   * which product to buy/sell
   */
  product: DataStore;
  /**
   * order request size, default is 1
   */
  size?: number;
  createdAt?: Date;
}

type MarketOrderOptions = BaseOrderOptions | ({
  type: OrderType.Market
} & BaseOrderOptions);

// type LimitOrderOptions = {
//   type: OrderType.Limit
// } & BaseOrderOptions
// export type OrderOptions = MarketOrderOptions | LimitOrderOptions;

export type OrderOptions = MarketOrderOptions;

export class Order {
  readonly type: OrderType;
  readonly createdAt: Date;
  status: OrderStatus;
  readonly isBuy: boolean;
  readonly size: number;
  readonly product: DataStore;

  /**
   * execution commission
   */
  comm: number;
  /**
   * execution price
   */
  price: number;
  /**
   * execution cost
   */
  cost: number;

  constructor(options: OrderOptions, isBuy: boolean) {
    if (options.size <= 0) throw new Error('order size must be greater than zero');
    this.type = (options as { type: OrderType }).type || OrderType.Market;
    this.product = options.product;
    this.size = options.size || 1;
    this.isBuy = isBuy;
    this.status = OrderStatus.Created;
    this.createdAt = options.createdAt || new Date();
    this.comm = 0;
    this.price = 0;
    this.cost = 0;
  }

  get alive() {
    return this.status === OrderStatus.Partial || this.status === OrderStatus.Accepted;
  }
}