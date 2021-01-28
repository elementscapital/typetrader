import { OrderType } from './type';
import { OrderStatus } from './status';
import { DataStore } from '../data';
import { EventEmitter } from 'events';

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

export class Order extends EventEmitter {
  readonly type: OrderType;
  readonly createdAt: Date;
  readonly isBuy: boolean;
  readonly size: number;
  readonly product: DataStore;

  /**
   * execution size
   */
  exeSize: number;

  /**
   * execution commission
   */
  comm: number;
  /**
   * execution price
   */
  exePrice: number;
  /**
   * execution cost
   */
  cost: number;

  private _status: OrderStatus;

  constructor(options: OrderOptions, isBuy: boolean) {
    if (options.size <= 0) throw new Error('order size must be greater than zero');
    super();
    this.type = (options as { type: OrderType }).type || OrderType.Market;
    this.product = options.product;
    this.size = options.size || 1;
    this.exeSize = 0;
    this.isBuy = isBuy;
    this._status = OrderStatus.Created;
    this.createdAt = options.createdAt || new Date();
    this.comm = 0;
    this.exePrice = 0;
    this.cost = 0;
  }

  get status() {
    return this._status;
  }

  set status(v) {
    if (this._status === v) return;
    this._status = v;
    this.emit('status-change', v);
  }

  get alive() {
    return this.status === OrderStatus.Partial || this.status === OrderStatus.Accepted;
  }

  on(event: 'status-change', handler: () => void): this {
    return super.on('status-change', handler);
  }
}