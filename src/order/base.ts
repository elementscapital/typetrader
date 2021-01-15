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

interface Waiting {
  resolve: () => void;
  statuses: Set<OrderStatus>;
}
export class Order extends EventEmitter {
  readonly type: OrderType;
  readonly createdAt: Date;
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

  private _status: OrderStatus;
  private _waitings: Waiting[];

  constructor(options: OrderOptions, isBuy: boolean) {
    if (options.size <= 0) throw new Error('order size must be greater than zero');
    super();
    this.type = (options as { type: OrderType }).type || OrderType.Market;
    this.product = options.product;
    this.size = options.size || 1;
    this.isBuy = isBuy;
    this._status = OrderStatus.Created;
    this._waitings = [];
    this.createdAt = options.createdAt || new Date();
    this.comm = 0;
    this.price = 0;
    this.cost = 0;
  }

  get status() {
    return this._status;
  }

  set status(v) {
    if (this._status === v) return;
    this._status = v;
    this.emit('status-change', v);
    for(let i = 0; i < this._waitings.length; i++) {
      const waiting = this._waitings[i];
      if (!waiting.statuses.has(v)) {
        continue;
      }
      waiting.resolve();
      waiting.resolve = waiting.statuses = null;
      this._waitings.splice(i, 1);
      i--;
    }
  }

  get alive() {
    return this.status === OrderStatus.Partial || this.status === OrderStatus.Accepted;
  }

  /**
   * wait until one of statuses
   */
  waitFor(statuses: OrderStatus[]): Promise<void>;
  /**
   * wait until status
   */
  waitFor(status: OrderStatus): Promise<void>;
  waitFor(sts: OrderStatus | OrderStatus[]): Promise<void> {
    if (!Array.isArray(sts)) sts = [sts];
    const waiting: Waiting = {
      statuses: new Set(sts),
      resolve: null
    };
    this._waitings.push(waiting);
    const promise = new Promise<void>((resolve) => {
      waiting.resolve = resolve;
    });
    return promise;
  }

  on(event: 'status-change', handler: () => void): this {
    return super.on('status-change', handler);
  }
}