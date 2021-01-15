/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '../logger';
import { DataColumnLine } from '../data/line';
import { getLoopIndex } from '../data/common';

export type IndicatorSource = DataColumnLine | Indicator;

export interface IndicatorOptions {
  data: IndicatorSource | IndicatorSource[];
  period?: number;
  /**
   * round precisionn of calculated value, default is 0, means do not round
   */
  precision?: number;
}

export class Indicator {
  readonly period: number;
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

  get maxPeriod(): number {
    if (!this._ind.length) return this.period;
    return Math.max(this.period, ...this._ind.map(ind => ind.maxPeriod));
  }

  constructor(options: IndicatorOptions) {
    this._ind = [];
    this.sources = Array.isArray(options.data) ? options.data: [options.data];
    this.period = 'period' in options ? options.period : Math.max(...this.sources.map(src => {
      return src instanceof DataColumnLine ? 1 : src.period;
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

  constructor(options: SingleDataIdicatorOptions) {
    if (options.period <= 1) throw new Error('period must be greater than 1');
    super({
      ...options,
      period: options.data instanceof DataColumnLine ? options.period : (options.data.period + options.period - 1)
    });
    this.precision = options.precision || 0;
  }

  _update(logger: Logger) {
    const data = this.sources[0];
    let results = this._calc(data.toArray(), logger);
    if (results.length === data.length - this.period + 1) {
      results = (new Array(this.period - 1).fill(null)).concat(results);
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
      if (i < this.period - 1) return null;
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
