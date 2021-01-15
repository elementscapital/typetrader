import {
  IndicatorFunc,
  IndicatorFuncOptions
} from './base';

export class Max extends IndicatorFunc {
  constructor(options: Omit<IndicatorFuncOptions, 'func'>) {
    super({
      ...options,
      func: Math.max
    });
  }
}

export class Min extends IndicatorFunc {
  constructor(options: Omit<IndicatorFuncOptions, 'func'>) {
    super({
      ...options,
      func: Math.min
    });
  }
}

