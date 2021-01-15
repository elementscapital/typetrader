export interface PositionOptions {
  size: number;
  price: number;
}

export class Position {
  /**
   * position size
   */
  size: number;
  /**
   * position initial price, ie. price of first order to open position
   */
  originPrice: number;
  /**
   * average price
   */
  price: number;

  constructor(options: PositionOptions) {
    this.size = options.size;
    this.price = options.price;
    this.originPrice = options.price;
  }
}