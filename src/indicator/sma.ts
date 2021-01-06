import { Indicator } from './base';

export class SimpleMovingAverage extends Indicator  {
  async calc(): Promise<number[]> {
    return new Array(this.data.length).fill(0);
  }
}