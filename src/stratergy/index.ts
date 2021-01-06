/* eslint-disable @typescript-eslint/no-unused-vars */
import { Order, OrderOptions } from '../order';
import { Broker } from '../broker';
import { DataStore } from '../data';
import { Logger } from '../logger';

type StratOrderOptions = Exclude<OrderOptions, 'product'>;

export class Strategy {
  readonly data: DataStore;
  /**
   * @internal
   */
  _broker: Broker;

  constructor(data: DataStore) {
    this.data = data;
    this._broker = null; // will be initialized by engine
  }

  get broker() {
    return this._broker;
  }

  getPosition(data?: DataStore) {
    return this._broker.getPosition(data || this.data);
  }

  async start(logger: Logger): Promise<void> {
    // do nothing
  }

  async next(logger: Logger): Promise<void> {
    throw new Error('abstract method');
  }

  buy(options?: StratOrderOptions): Promise<Order> {
    return this._broker.buy({
      ...options,
      product: this.data
    });
  }

  sell(options?: StratOrderOptions): Promise<Order> {
    return this._broker.sell({
      ...options,
      product: this.data
    });
  }
}