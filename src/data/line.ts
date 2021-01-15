import { DataColumn, getLoopIndex } from './common';
import { DataStore } from './store';
import { Indicator } from '../indicator/base';

export interface Line {
  at(offset: number): number;
}

export class DataLine<T> {
  /**
   * @internal
   */
  _array: T[];
  /**
   * @internal
   */
  _index: number;

  constructor() {
    this._array = [];
    this._index = 0;
  }

  get length() {
    return this._array.length;
  }

  at(offset = 0): T {
    return this._array[getLoopIndex(this._index + offset, this._array.length)];
  }
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
}
