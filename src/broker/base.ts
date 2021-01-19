/* eslint-disable @typescript-eslint/no-unused-vars */
import { Order, OrderOptions, OrderType } from '../order';
import { DataStore } from '../data';
import { Logger } from '../logger';
import { CommissionFn, CommissionOptions, innerCommissionFn } from '../commission';
import { isFunction, isNumber } from '../util';
import { Position } from './position';
import { Trade } from './trade';
import { Strategy } from '../stratergy';

function assertCash(cash: number) {
  if (cash <= 0) throw new Error('cash must be greater than zero');
}

export interface BrokerOptions {
  /**
   * initialize cash of broker, default is 100000
   */
  cash?: number;
  commission?: number | CommissionOptions | CommissionFn;
}

export class Broker {
  protected _commFn: CommissionFn;
  protected _cash: number;
  get cash() {
    return this._cash;
  }
  
  protected _products: Map<DataStore, {
    position: Position;
    trade: Trade;
    orders: Order[];
  }>;

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
    throw new Error('abstract method');
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

  async submitOrder(order: Order): Promise<Order> {
    throw new Error('abstract method');
  }

  destroy() {
    this._products.clear();
    this._commFn = null;
  }
}