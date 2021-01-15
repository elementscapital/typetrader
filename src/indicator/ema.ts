import { SingleDataIdicator } from './base';
import { EMA,  } from 'talib-binding';

export class ExponentialMovingAverage extends SingleDataIdicator  {
  _calc(points: number[]): number[] {
    return EMA(points, this.period);
  }
}