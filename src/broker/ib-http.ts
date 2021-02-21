import {
  Order, IBHttpOrder, OrderStatus
} from '../order';
import { Broker, BrokerOptions } from './base';

export type SubmitOrderAPIFn = (action: 'BUY' | 'SELL', product: string, position: number) => Promise<{
  position: number; price: number;
}>;

export interface IBBrokerOptions extends BrokerOptions {
  submitOrderAPIFn: SubmitOrderAPIFn;
}

export class IBHttpBroker extends Broker {
  private _apiFn: SubmitOrderAPIFn;
  constructor(options: IBBrokerOptions) {
    super({
      cash: 100000,
      ...options,
    });
    this._apiFn = options.submitOrderAPIFn;
  }

  submitOrder(order: Order): Order {
    super.submitOrder(order);
    this._apiFn(order.isBuy ? 'BUY' : 'SELL', order.product.symbol, order.size).then(info => {
      order.exeSize = info.position;
      order.exePrice = info.price;
      const productInfo = this._products.get(order.product);
      super.completeOrder(order, productInfo, this._engine.strats.filter(st => st.data === order.product));
    }, err => {
      (order as IBHttpOrder).error = err;
      order.status = OrderStatus.Error;
    });
    return order;
  }
}