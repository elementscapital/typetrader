import { DataStore } from 'src/data';
import {
  Order, OrderOptions, OrderStatus, OrderType
} from '../order';
import { Broker, BrokerOptions } from './base';
import { Position } from './position';

/**
 * Simple local broker.
 * 
 * This is the default broker typetrader used.
 */
export class LocalBroker extends Broker {
  /**
   * active orders
   */
  private _orders: Map<DataStore, Order[]>;

  constructor(options?: BrokerOptions) {
    super({
      ...options,
      cash: 100000
    });
    this._orders = new Map();
  }

  next(product: DataStore) {
    const orders = this._orders.get(product);
    if (!orders?.length) return;

    orders.forEach(order => {
      if (order.type !== OrderType.Market) {
        throw new Error('not implement');
      }
      const dealPrice = order.product.open.at(0);
      order.price = dealPrice;
      const dealSize = order.isBuy ? order.size : -order.size;
      order.cost = dealSize * dealPrice;
      this._cash -= order.cost;
      if (this._commFn) {
        order.comm = this._commFn(order.size, dealPrice);
        this._cash -= order.comm;
      }
      let position = this._positions.get(order.product);
      if (!position) {
        position = new Position({
          product: order.product,
          size: dealSize,
          price: dealPrice
        });
        this._positions.set(order.product, position);
      } else {
        position.size += dealSize;
      }
      order.status = OrderStatus.Complete;
    });
    orders.length = 0; // clear completed orders

    this._positions.get(product).price = product.close.at(0);
  }

  async buy(options: OrderOptions): Promise<Order> {
    const order = new Order(options, true);
    await this.submit(order);
    return order;
  }

  async sell(options: OrderOptions): Promise<Order> {
    const order = new Order(options, false);
    await this.submit(order);
    return order;
  }

  async submit(order: Order): Promise<void> {
    let orders = this._orders.get(order.product);
    if (!orders) {
      orders = [];
      this._orders.set(order.product, orders);
    }
    orders.push(order);
    order.status = OrderStatus.Submitted;
    order.status = OrderStatus.Accepted;
  }
}