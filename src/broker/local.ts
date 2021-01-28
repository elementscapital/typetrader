import { DataStore } from '../data';
import { Strategy } from '../stratergy';
import {
  Order, OrderStatus, OrderType
} from '../order';
import { Broker, BrokerOptions, ProductInfo } from './base';
import { Position } from './position';

export interface LocalProductInfo extends ProductInfo {
  orders: Order[];
}
/**
 * Simple local broker.
 * 
 * This is the default broker typetrader used.
 */
export class LocalBroker extends Broker {
  protected _products: Map<DataStore, LocalProductInfo>;

  constructor(options?: BrokerOptions) {
    super({
      cash: 100000,
      ...options,
    });
  }

  protected initProductInfo(position: Position): LocalProductInfo {
    return {
      ...super.initProductInfo(position),
      orders: []
    };
  }

  next(product: DataStore, strats: Strategy[]) {
    const productInfo = this._products.get(product);
    if (!productInfo?.orders.length) {
      return;
    }
   
    productInfo.orders.forEach(order => {
      order.exePrice = order.product.open.at(0);
      order.exeSize = order.size;
      this.completeOrder(order, productInfo, strats);
    });
    productInfo.orders.length = 0; // clear completed orders
  }

  submitOrder(order: Order): Order {
    super.submitOrder(order);
    const product = this._products.get(order.product);
    product.orders.push(order);
    return order;
  }
}