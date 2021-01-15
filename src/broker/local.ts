import { DataStore } from 'src/data';
import { Strategy } from 'src/stratergy';
import {
  Order, OrderStatus, OrderType
} from '../order';
import { Broker, BrokerOptions } from './base';
import { Position } from './position';
import { Trade, TradeStatus } from './trade';

/**
 * Simple local broker.
 * 
 * This is the default broker typetrader used.
 */
export class LocalBroker extends Broker {

  constructor(options?: BrokerOptions) {
    super({
      ...options,
      cash: 100000
    });
  }

  next(product: DataStore, strats: Strategy[]) {
    const productInfo = this._products.get(product);
    if (!productInfo?.orders.length) {
      return;
    }
   
    let { position, trade } = productInfo;

    productInfo.orders.forEach(order => {
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
      const preS = position ? position.size : 0;
      if (!position) {
        position = productInfo.position = new Position({
          size: dealSize,
          price: dealPrice
        });
      } else {
        position.size += dealSize;
      }
      
      const postS = position ? position.size : 0;
      if (postS === 0) {
        position = productInfo.position = null;
      } else if (preS !== 0) {
        if ((preS > 0 && postS > 0) || (preS < 0 && postS < 0)) {
          // calcuate average price
          position.price = (preS * position.price + dealSize * dealPrice) / (preS + dealSize);
        } else {
          // close and open position
          position.price = dealPrice;
          position.originPrice = dealPrice;
        }
      }
      order.status = OrderStatus.Completed;

      if (!trade && preS !== 0) throw new Error('unexpected');

      // https://zhuanlan.zhihu.com/p/299630905
      const cost = -order.cost;
      const commcost = cost - order.comm;
      if (!trade) {
        trade = productInfo.trade = new Trade({
          pnl: cost, pnlcomm: commcost
        });
        trade.on('status-change', (_trade: Trade) => {
          strats.forEach(strat => strat.onTrade(_trade));
        });
        trade.status = TradeStatus.Open;
      } else if (postS === 0) {
        if (!trade) throw new Error('unexpected');
        trade.pnl += cost;
        trade.pnlcomm += commcost;
        trade.status = TradeStatus.Closed;
        trade = productInfo.trade = null;
      } else if (preS > 0 && postS < 0 || preS < 0 && postS > 0) {
        if (!trade) throw new Error('unexpected');
        const prePercent = Math.abs(preS / (postS - preS));
        trade.pnl += cost * prePercent;
        trade.pnlcomm += commcost * prePercent;
        trade.status = TradeStatus.Closed;
        const postPercent = Math.abs(postS / (postS - preS));
        trade = productInfo.trade = new Trade({
          pnl: cost * postPercent,
          pnlcomm: commcost * postPercent
        });
        trade.on('status-change', (_trade: Trade) => {
          strats.forEach(strat => strat.onTrade(_trade));
        });
        trade.status = TradeStatus.Open;
      } else {
        trade.pnl += cost;
        trade.pnlcomm += commcost;
      }
    });
    productInfo.orders.length = 0; // clear completed orders
  }

  async submitOrder(order: Order): Promise<Order> {
    if (order.size === 0) {
      throw new Error('order size cant not be zero');
    }
    let product = this._products.get(order.product);
    if (!product) {
      product = {
        position: null,
        trade: null,
        orders: []
      };
      this._products.set(order.product, product);
    }
    product.orders.push(order);
    order.status = OrderStatus.Submitted;
    order.status = OrderStatus.Accepted;
    return order;
  }
}