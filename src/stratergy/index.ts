/* eslint-disable @typescript-eslint/no-unused-vars */
import { Order, OrderOptions } from '../order';
import { Broker } from '../broker';
import { DataStore } from '../data';
import { Logger } from '../logger';
import { Trade } from 'src/broker/trade';

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

  get length() {
    return this.data._index + 1;
  }

  get position() {
    return this._broker.getPosition(this.data);
  }

  onTrade(trade: Trade) {
    // do nothing
  }

  onOrder(order: Order) {
    // do nothing
  }

  async start(logger: Logger): Promise<void> {
    // do nothing
  }

  async next(logger: Logger): Promise<void> {
    throw new Error('abstract method');
  }

  private _submit(sizeOrOptions: number | StratOrderOptions, isBuy: boolean): Promise<Order> {
    const order = new Order({
      ...(typeof sizeOrOptions === 'number' ? { size: sizeOrOptions } : sizeOrOptions),
      product: this.data
    }, isBuy);
    order.on('status-change', () => {
      this.onOrder(order);
    });
    return this._broker.submitOrder(order);
  }

  buy(size: number): Promise<Order>;
  buy(options?: StratOrderOptions): Promise<Order>;
  buy(sizeOrOptions?: number | StratOrderOptions): Promise<Order> {
    return this._submit(sizeOrOptions, true);
  }

  sell(size: number): Promise<Order>;
  sell(options?: StratOrderOptions): Promise<Order>;
  sell(sizeOrOptions?: number | StratOrderOptions): Promise<Order> {
    return this._submit(sizeOrOptions, false);
  }
}