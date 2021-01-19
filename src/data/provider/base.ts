/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '../../logger';

import { DataStore } from '../store';

export class DataProvider<T extends string = string> {
  stores: Record<T, DataStore>;
  
  constructor(stores?: Record<T, DataStore>) {
    this.stores = stores || ({} as Record<T, DataStore>);
  }

  async start(logger: Logger) {
    throw new Error('abstract method, please init this.columns and this.stores');
  }

  async stop(logger: Logger) {
    // do nothing by default
  }

  /**
   * read data, return changed data stores.
   */
  async read(logger: Logger): Promise<DataStore[]> {
    throw new Error('abstract method');
  }

  destroy() {
    Object.values<DataStore>(this.stores).forEach(store => {
      store.destroy();
    });
  }
}
