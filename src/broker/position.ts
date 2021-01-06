import { DataStore } from '../data';

export interface PositionOptions {
  product: DataStore;
  size: number;
  price: number;
}

export class Position {
  product: DataStore;
  /**
   * position size
   */
  size: number;
  /**
   * current market price
   */
  price: number;
  /**
   * curent market value
   */
  get value() {
    return this.size * this.price;
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON() {
    return {
      product: this.product.symbol,
      size: this.size,
      price: this.price,
      value: this.value
    };
  }

  constructor(options: PositionOptions) {
    this.product = options.product;
    this.size = options.size;
    this.price = options.price;
  }
}