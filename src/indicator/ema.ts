import { SingleDataIdicator, SingleDataIdicatorOptions } from './base';
import { EMA  } from 'talib-binding';

export class ExponentialMovingAverage extends SingleDataIdicator  {
  private _pfixed: boolean;
  private _alpha: number;
  private _alpha1: number;
  private _c: number;

  constructor(options: SingleDataIdicatorOptions & {
    periodFixed?: boolean;
  }) {
    super(options);
    this._pfixed = options.periodFixed;
    this._alpha =  2.0 / (1.0 + this.period);
    this._alpha1 = 1.0 - this._alpha;
    this._c = 1 / (1 - Math.pow((1 - this._alpha), this.period));
  }

  _calc(points: number[]): number[] {
    
    let result: number[];
    if (!this._pfixed) {
      result = EMA(points, this.period);
    } else {
      result = [];
      let s = 0;
      for(let i = 0; i < this.period; i++) {
        s += points[i] * Math.pow(this._alpha1, this.period - 1 - i);
      }
      let prev = s * this._alpha * this._c;
      result.push(prev);
      for(let i = this.period; i < points.length; i++) {
        const v = (
          prev * this._alpha1 + points[i] * this._alpha * this._c
          - points[i - this.period] * this._c * this._alpha * Math.pow(this._alpha1, this.period) 
        );
        result.push(v);
        prev = v;
      }
      // console.log(result);
    }
    // console.log(this.period, result.slice(result.length - 5).join(','));
    return result;
  }
}