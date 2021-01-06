/* eslint-disable no-console */
import path from 'path';

import {
  Typetrader, CSVData, Strategy,
  SimpleMovingAverage,
  DataStore
} from '../src';

class TestStrategy extends Strategy {
  ema: SimpleMovingAverage;

  constructor(data: DataStore) {
    super(data);

    this.ema = new SimpleMovingAverage({
      data: this.data.close,
      period: 4 
    });
  }

  async next() {
    console.log(
      'tick next:',
      new Date(this.data.timestamp.at(0)).toISOString(),
      this.data.open.at(0)
    );
  }
}

(async function() {
  const data = new CSVData({
    source: {
      file: path.join(process.cwd(), 'examples', 'AUDUSD-interactivebrokers-1hour-20210104.csv'),
      symbol: 'AUDUSD'
    },
    timestamp: {
      type: 'second', column: 'Epoch Time',
      /**
       * timestamp of data downloaded through interactivebrokers api is open time. Convert it to close time
       */
      convert: (v) => Math.floor(v / 3600000 + 1) * 3600000
    }
  });

  console.log('Backtesting start.');
  const engine = new Typetrader({
    data,
    strategy: [
      new TestStrategy(data.stores.AUDUSD)
    ]
  });
  await engine.run();
  console.log('Backtesting finished.');
})().catch(err => {
  console.error(err);
  process.exit(-1);
});
