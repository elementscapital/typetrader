import { SingleDataIdicator } from './base';
import { SMA } from 'talib-binding';

export class SimpleMovingAverage extends SingleDataIdicator  {
  _calc(points: number[]): number[] {
    return SMA(points, this.period);
  }
}