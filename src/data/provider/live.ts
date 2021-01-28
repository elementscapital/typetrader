import { DataStore, getMaxIndicatorPeriodOffset } from '../store';
import { DataPoint } from '../common';
import { DataProvider } from './base';

export interface LiveDataOptions<T extends string> {
  symbol: T;
  initdata: DataPoint[];
}


export class LiveData<T extends string = string> extends DataProvider<T> {
  private _initdata: DataPoint[];
  private _symbol: T;
  private _res: () => void;
  private _pro: Promise<void>;

  constructor(options: LiveDataOptions<T>) {
    super({
      [options.symbol]: new DataStore(options.symbol)
    } as Record<T, DataStore>);
    this._symbol = options.symbol;
    this._initdata = options.initdata;
    this._pro = null;
  }

  putData(data: DataPoint) {
    const store = this.stores[this._symbol];
    store._array.shift();
    store._array.push(data);
    store._index = store._array.length - 1;
    this._res && this._res();
  }

  async start() {
    const store = this.stores[this._symbol];
    const mipo = getMaxIndicatorPeriodOffset(store);
    if (this._initdata.length < mipo + 1) {
      throw new Error('no enough init data');
    }
    store._array = this._initdata.slice(this._initdata.length - mipo - 1);
    store._index = mipo;
  }

  async read() {
    const stores = [this.stores[this._symbol]];
    if (this._initdata) {
      // first tick
      this._initdata = null;
      return stores;
    }
    this._pro = new Promise(resolve => {
      this._res = resolve;
    });
    await this._pro;
    this._pro = this._res = null;
    return stores;
  }
}