/* eslint-disable @typescript-eslint/no-unused-vars */
import { Order, OrderOptions, OrderType } from '../order';
import { DataStore } from '../data';
import { Logger } from '../logger';
import { CommissionFn, CommissionOptions, innerCommissionFn } from '../commission';
import { isFunction } from '../util';
import { Position } from './position';

function assertCash(cash: number) {
  if (cash <= 0) throw new Error('cash must be greater than zero');
}

export interface BrokerOptions {
  cash?: number;
  commission?: CommissionOptions | CommissionFn;
}

export class Broker {
  protected _commFn: CommissionFn;
  protected _cash: number;
  get cash() {
    return this._cash;
  }
  
  protected _positions: Map<DataStore, Position>;

  constructor(options?: BrokerOptions) {
    this._cash = options?.cash || 0;
    const comm = options.commission;
    if (isFunction(comm)) {
      this._commFn = comm as CommissionFn;
    } else if (comm) {
      this._commFn = function(size: number, price: number) {
        return innerCommissionFn(size, price, comm as CommissionOptions);
      };
    } else {
      this._commFn = null;
    }
    this._positions = new Map();
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

  next(product: DataStore, logger: Logger) {
    // do nothing by default
  }

  getPosition(data: DataStore): Position {
    return this._positions.get(data);
  }

  get value() {
    let value = this._cash;
    this._positions.forEach(position => {
      value += position.value;
    });
    return value;
  }

  async buy(options: OrderOptions): Promise<Order> {
    throw new Error('abstract method');
  }

  async sell(options: OrderOptions): Promise<Order> {
    throw new Error('abstract method');
  }

  async submit(order: Order): Promise<void> {
    throw new Error('abstract method');
  }
}