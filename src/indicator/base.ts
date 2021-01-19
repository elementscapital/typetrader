/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '../logger';
import { DataColumnLine } from '../data/line';
import { getLoopIndex } from '../data/common';

export type IndicatorSource = DataColumnLine | Indicator;

export interface IndicatorOptions {
  data: IndicatorSource | IndicatorSource[];
  /**
   * period offset
   */
  poffset?: number;
  /**
   * round precisionn of calculated value, default is 0, means do not round
   */
  precision?: number;
}

export class Indicator {
  /**
   * index of first element to trigger next() after period offset
   */
  readonly poffset: number;
  readonly sources: IndicatorSource[];
  /**
   * @internal
   */
  _array: number[];
  /**
   * @internal
   * indicators which use this indicator as data source
   */
  _ind: Indicator[];

  /**
   * index of first element to trigger next() after period offset 
   */
  get periodOffset(): number {
    if (!this._ind.length) return this.poffset;
    return Math.max(this.poffset, ...this._ind.map(ind => ind.periodOffset));
  }

  constructor(options: IndicatorOptions) {
    this._ind = [];
    this.sources = Array.isArray(options.data) ? options.data: [options.data];
    this.poffset = 'poffset' in options ? options.poffset : Math.max(...this.sources.map(src => {
      return src instanceof DataColumnLine ? 0 : src.poffset;
    }));
    this.sources.forEach(src => src._ind.push(this));
  }

  get index(): number {
    return this.sources[0].index;
  }

  get length() {
    return this._array.length;
  }

  at(offset = 0) {
    return this._array[getLoopIndex(this.index + offset, this.length)];
  }

  toArray() {
    return this._array;
  }

  _update(logger: Logger) {
    throw new Error('abstract method');
  }

  destroy() {
    if (!this._ind) return; // already destroied
    this._ind.forEach(ind => ind.destroy());
    this._ind = null;
    this._array = null;
    this.sources.length = 0;
  }
}

export interface SingleDataIdicatorOptions {
  data: IndicatorSource,
  period: number;
  precision?: number;
}
/**
 * Single data-source indicator
 */
export class SingleDataIdicator extends Indicator {
  readonly period: number;
  readonly precision: number;
  /**
   * exclude last period element
   */
  private _elp: boolean;

  constructor(options: SingleDataIdicatorOptions, excludeLastPeriod = false) {
    if (options.period <= 1) throw new Error('period must be greater than 1');
    super({
      ...options,
      poffset: options.data instanceof DataColumnLine ? options.period - (excludeLastPeriod ? 0 : 1) : (options.data.poffset + options.period - (excludeLastPeriod ? 0 : 1))
    });
    this.period = options.period;
    this.precision = options.precision || 0;
  }

  _update(logger: Logger) {
    const data = this.sources[0];
    let points = data.toArray();
    if (!(data instanceof DataColumnLine) && data.poffset > 0) {
      points = points.slice(data.poffset);
    }
    let results = this._calc(points, logger);
    if (results.length === data.length - this.poffset) {
      results = (new Array(this.poffset).fill(null)).concat(results);
    } else if (results.length !== data.length) {
      logger.warn('[WARNING] Indicator: Length of results of _calc() may be incorrected');
    }
    if (this.precision > 0) {
      const R = Math.pow(10, this.precision);
      results.forEach((v, i) => {
        if (v === null || v === undefined || Number.isNaN(v)) {
          return;
        }
        results[i] = Math.round(v * R) / R;
      });
    }
    // logger.debug(results, results.length);
    this._array = results;
  }

  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _calc(points: number[], logger: Logger): number[] {
    throw new Error('abstract method');
  }
}

export type IndicatorLogicFn =  (index: number, ...indicators: Indicator[]) => number;

export class IndicatorLogic extends Indicator {
  logic: IndicatorLogicFn;
  constructor(options: {
    data: Indicator[];
    logic: IndicatorLogicFn;
  }) {
    super(options);
    this.logic = options.logic;
  }

  _update() {
    const maxLength = Math.max(...this.sources.map(src => src.length));
    this._array = new Array(maxLength).fill(0).map((n, i) => {
      if (i < this.poffset) return null;
      return this.logic(i, ...(this.sources as Indicator[]));
    });
  }
}


export type IndicatorFuncFn = (...args: number[]) => number;
export type IndicatorFuncOptions = {
  data: Indicator[];
  func: IndicatorFuncFn;
}
export class IndicatorFunc extends IndicatorLogic {

  constructor(options: IndicatorFuncOptions) {
    super({
      ...options,
      logic: (index, ...indicators) => {
        return options.func(...indicators.map(ind => ind._array[index]));
      }
    });
  }
}
