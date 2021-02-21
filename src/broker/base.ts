/* eslint-disable @typescript-eslint/no-unused-vars */
import { Order, OrderStatus, OrderType } from '../order';
import { DataStore } from '../data';
import { Logger } from '../logger';
import { CommissionFn, CommissionOptions, innerCommissionFn } from '../commission';
import { isFunction, isNumber } from '../util';
import { Position } from './position';
import { Strategy } from '../stratergy';
import { Typetrader } from '../engine/index';
import { Trade, TradeStatus } from './trade';

function assertCash(cash: number) {
  if (cash <= 0) throw new Error('cash must be greater than zero');
}

export interface BrokerOptions {
  /**
   * initialize cash of broker, default is 100000
   */
  cash?: number;
  commission?: number | CommissionOptions | CommissionFn;
  /**
   * initialize positions
   */
  positions?: Map<DataStore, Position>
}

export interface ProductInfo {
  position: Position;
  trade: Trade;
}

export class Broker {
  protected _commFn: CommissionFn;
  protected _cash: number;
  /**
   * @internal
   */
  _engine: Typetrader;
  
  get cash() {
    return this._cash;
  }
  
  protected _products: Map<DataStore, ProductInfo>;

  constructor(options?: BrokerOptions) {
    this._cash = options?.cash || 1000;
    let comm = options.commission;
    if (isNumber(comm)) {
      comm = { comm } as CommissionOptions;
    }
    if (isFunction(comm)) {
      this._commFn = comm as CommissionFn;
    } else if (comm) {
      this._commFn = function(size: number, price: number) {
        return innerCommissionFn(size, price, comm as CommissionOptions);
      };
    } else {
      this._commFn = null;
    }
    this._products = new Map();
    options.positions && this.initPositions(options.positions);
  }

  protected initPositions(positions: Map<DataStore, Position>) {
    positions.forEach((position, data) => {
      if (position.size === 0) return;
      this._products.set(data, this.initProductInfo(position));
    });
  }

  protected initProductInfo(position: Position = null): ProductInfo {
    return {
      position, trade: position ? new Trade({
        pnl: Math.abs(position.size) * position.price,
        pnlcomm: this._commFn ? this._commFn(Math.abs(position.size), position.price) : 0
      }) : null
    };
  }

  addCash(cash: number) {
    assertCash(cash);
    this._cash += cash;
  }

  reduceCash(cash: number) {
    assertCash(cash);
    if (cash > this._cash) {
      throw new Error('cash is not enough to reduce');
    }
    this._cash -= cash;
  }

  next(product: DataStore, strategies: Strategy[], logger: Logger) {
    // do nothing by default
  }

  protected completeOrder(order: Order, productInfo: ProductInfo, strats: Strategy[]) {
    if (order.type !== OrderType.Market) {
      throw new Error('not implement');
    }
    let { position, trade } = productInfo;
    const { exePrice, exeSize } = order;
    const dealSize = order.isBuy ? exeSize : -exeSize;
    order.cost = dealSize * exePrice;
    this._cash -= order.cost;
    if (this._commFn) {
      order.comm = this._commFn(exeSize, exePrice);
      this._cash -= order.comm;
    }
    const preS = position ? position.size : 0;
    if (!position) {
      position = productInfo.position = new Position({
        size: dealSize,
        price: exePrice
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
        position.price = (preS * position.price + dealSize * exePrice) / (preS + dealSize);
      } else {
        // close and open position
        position.price = exePrice;
        position.originPrice = exePrice;
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
  }

  getPosition(data: DataStore): Position {
    return this._products.get(data)?.position;
  }

  get value() {
    let value = this._cash;
    this._products.forEach((productInfo, product) => {
      if (!productInfo.position) return;
      value += productInfo.position.size * product.close.at(-1);
    });
    return value;
  }

  submitOrder(order: Order): Order {
    if (order.size === 0) {
      throw new Error('order size cant not be zero');
    }
    let product = this._products.get(order.product);
    if (!product) {
      product = this.initProductInfo();
      this._products.set(order.product, product);
    }
    order.status = OrderStatus.Submitted;
    order.status = OrderStatus.Accepted;
    return order;
  }

  destroy() {
    this._products.clear();
    this._commFn = null;
  }
}