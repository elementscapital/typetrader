import { Logger } from '../logger';
import { DataLine, DataColumnLine } from '../data/line';
import { getLoopIndex } from '../data/common';

export interface IndicatorOptions {
  period: number;
  data: DataColumnLine;
}

export class Indicator extends DataLine<number> {
  period: number;
  data: DataColumnLine;
  /**
   * @internal
   */
  _array: number[];

  constructor(options: IndicatorOptions) {
    if (options.period <= 0) {
      throw new Error('period of indicator must be greater than 0');
    }
    super();
    this.period = options.period;
    this.data = options.data;
    options.data._imp = Math.max(options.data._imp, this.period);
    options.data._ind.push(this);
  }

  at(offset = 0) {
    return this._array[getLoopIndex(this.data._line._index + offset, this._array.length)];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calc(logger: Logger): Promise<number[]> {
    throw new Error('abstract method');
  }
}
