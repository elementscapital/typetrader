import { ConsoleLogger, Logger } from '../logger';
import { DataProvider, DataStore, DATA_COLUMNS } from '../data';
import { Strategy } from '../stratergy';
import { Broker, BrokerOptions, LocalBroker } from '../broker';
import { Indicator } from '../indicator';

interface TypetraderOptions {
  logger?: Logger;
  data: DataProvider;
  strategy: Strategy | Strategy[];
  broker?: Broker | BrokerOptions;
}

export class Typetrader {
  readonly logger: Logger;
  readonly data: DataProvider;
  readonly strats: Strategy[];
  readonly broker: Broker;

  constructor(options: TypetraderOptions) {
    this.logger = options.logger || new ConsoleLogger();
    this.data = options.data;
    this.strats = Array.isArray(options.strategy) ? options.strategy : [options.strategy];
    const broker = options.broker instanceof Broker ? options.broker : new LocalBroker(options.broker);
    broker._engine = this;
    this.broker = broker;
    this.strats.forEach(strat => strat._broker = broker);
  }

  private async _run(store: DataStore, strats: Strategy[]) {
    for (const column of DATA_COLUMNS) {
      if (!store[column]._ind.length) continue;
      const queue = store[column]._ind.slice();
      const set: Set<Indicator> = new Set(queue);
      try {
        while(queue.length > 0) {
          const indi = queue.shift();
          indi._update(this.logger);
          indi._ind.forEach(dep => {
            if (!set.has(dep)) {
              queue.push(dep);
              set.add(dep);
            }
          });
        }
      } catch(ex) {
        this.logger.error(ex);
        return;
      }
    }

    while(store._index < store._array.length) {
      this.broker.next(store, strats, this.logger);
      try {
        for await(const strat of strats) {
          await strat.next(this.logger);
        }
      } catch(ex) {
        this.logger.debug('Please add try/catch in Stratety.next()');
        this.logger.error(ex);
      }
      store._index++;
    }
  }

  async run() {
    await this.data.start(this.logger);
    for await(const strat of this.strats) {
      await strat.start(this.logger);
    }

    // eslint-disable-next-line no-constant-condition
    while(true) {
      const changedStores = await this.data.read(this.logger);
      if (!changedStores?.length) break;
      for await(const store of changedStores) {
        if (store._index >= store._array.length) continue; // no data, skip
        await this._run(store, this.strats.filter(st => st.data === store));
      }
    }
  }

  destroy() {
    try {
      this.data.destroy();
    } catch(ex) {
      this.logger.error(ex);
    }
    this.strats.forEach(strat => {
      try {
        strat.destroy();
      } catch(ex) {
        this.logger.error(ex);
      }
    });
    this.strats.length = 0;
    try {
      this.broker.destroy();
    } catch(ex) {
      this.logger.error(ex);
    }
  }
}
