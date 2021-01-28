import { DataPoint, DATA_COLUMNS, getLoopIndex } from './common';
import { DataColumnLine } from './line';

export function getMaxIndicatorPeriodOffset(store: DataStore): number {
  let mp = 0;
  DATA_COLUMNS.forEach(column => {
    store[column]._ind.forEach(ind => {
      mp = Math.max(mp, ind.periodOffset);
    });
  });
  if (mp < 0) throw new Error('unexpected');
  return mp;
}
export class DataStore {
  readonly timestamp: DataColumnLine;
  readonly open: DataColumnLine;
  readonly high: DataColumnLine;
  readonly low: DataColumnLine;
  readonly close: DataColumnLine;
  readonly volumn: DataColumnLine;
  readonly openintrest: DataColumnLine;
  readonly symbol: string;

   /**
   * @internal
   */
  _array: DataPoint[];
  /**
   * @internal
   */
  _index: number;

  constructor(symbol: string) {
    this.symbol = symbol;
    this._array = [];
    this._index = 0;

    for(const column of DATA_COLUMNS) {
      this[column] = new DataColumnLine(this, column);
    }
  }

  get length() {
    return this._array.length;
  }

  at(offset = 0): DataPoint {
    return this._array[getLoopIndex(this._index + offset, this._array.length)];
  }

  destroy() {
    this._array = null;
    for(const column of DATA_COLUMNS) {
      this[column].destroy();
    }
  }
}
