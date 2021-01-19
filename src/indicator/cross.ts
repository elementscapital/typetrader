import { Indicator } from './base';

export class CrossOver extends Indicator {
  /**
   * last non-zero diff
   */
  lnzd: number;

  constructor(options: {
    data: [Indicator, Indicator]
  }) {
    super({
      ...options,
      poffset: Math.max(options.data[0].poffset, options.data[1].poffset) + 1
    });
    this.lnzd = null;
  }

  _update() {
    const [data0, data1] = this.sources as Indicator[];
    const maxLen = Math.max(data0.length, data1.length);
    this._array = new Array(maxLen).fill(0).map((n, i) => {
      if (i < this.poffset) return null;
      const diff = data0._array[i] - data1._array[i];
      if (diff === 0) return 0;
      const lnzd = this.lnzd;
      this.lnzd = diff;
      if (lnzd === null) {
        return 0;
      } else if (lnzd < 0 && diff > 0) {
        return 1;
      } else if (lnzd > 0 && diff < 0) {
        return -1;
      } else {
        return 0;
      }
    });
  }
}