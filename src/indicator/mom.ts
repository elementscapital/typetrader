import { SingleDataIdicator } from './base';
import { MOM } from 'talib-binding';

export class Momentum extends SingleDataIdicator  {
  _calc(points: number[]): number[] {
    return MOM(points, this.period);
  }
}