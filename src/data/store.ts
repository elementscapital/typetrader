import { DataPoint, DATA_COLUMNS } from './common';
import { DataColumnLine, DataLine } from './line';

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
export class DataStore extends DataLine<DataPoint> {
  readonly timestamp: DataColumnLine;
  readonly open: DataColumnLine;
  readonly high: DataColumnLine;
  readonly low: DataColumnLine;
  readonly close: DataColumnLine;
  readonly volumn: DataColumnLine;
  readonly openintrest: DataColumnLine;
  readonly symbol: string;

  constructor(symbol: string) {
    super();
    this.symbol = symbol;

    for(const column of DATA_COLUMNS) {
      this[column] = new DataColumnLine(this, column);
    }
  }

  destroy() {
    this._array = null;
    for(const column of DATA_COLUMNS) {
      this[column].destroy();
    }
  }
}
