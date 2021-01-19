import { SingleDataIdicator, SingleDataIdicatorOptions } from './base';
import { MOM } from 'talib-binding';

export class Momentum extends SingleDataIdicator  {
  constructor(options: SingleDataIdicatorOptions) {
    super(options, true);
  }

  _calc(points: number[]): number[] {
    return MOM(points, this.period);
  }
}