import { DataColumn } from './common';
import { DataStore } from './store';
import { Indicator } from '../indicator/base';

export interface Line {
  at(offset: number): number;
}

export class DataColumnLine {
  /**
   * @internal
   */
  _line: DataStore;
  /**
   * @internal
   * indicators use this data store
   */
  _ind: Indicator[];
  
  readonly column: DataColumn;

  constructor(line: DataStore, column: DataColumn) {
    this._ind = [];
    this._line = line;
    this.column = column;
  }

  at(offset = 0) {
    return this._line.at(offset)[this.column];
  }

  get index() {
    return this._line._index;
  }

  get length() {
    return this._line.length;
  }

  toArray() {
    return this._line._array.map(v => v[this.column]);
  }

  destroy() {
    this._line = null;
    this._ind.forEach(ind => {
      ind.destroy();
    });
    this._ind.length = 0;
  }
}
