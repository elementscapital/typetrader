import { SingleDataIdicator } from './base';
import { LINEARREG_SLOPE } from 'talib-binding';

export class LineArregSlope extends SingleDataIdicator  {
  _calc(points: number[]): number[] {
    return LINEARREG_SLOPE(points, this.period);
  }
}