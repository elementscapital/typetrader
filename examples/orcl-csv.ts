/* eslint-disable no-console */
import path from 'path';

import {
  Typetrader, CSVData, Strategy,
  SimpleMovingAverage,
  DataStore,
  DataColumnLine
} from '../src';

class TestStrategy extends Strategy {
  // ema: SimpleMovingAverage;
  dataclose: DataColumnLine;

  constructor(data: DataStore) {
    super(data);
    this.dataclose = data.close;
    // this.ema = new SimpleMovingAverage({
    //   data: this.data.close,
    //   period: 4 
    // });
  }

  async next() {
    console.log(
      new Date(this.data.timestamp.at(0)).toISOString().substr(0, 10)
        + ', Close,',
      this.dataclose.at(0).toFixed(2)
    );
    // current close less than previous close
    if (this.dataclose.at(0) < this.dataclose.at(-1)) {
      // previous close less than the previous close
      // BUY, BUY, BUY!!! (with all possible default parameters)
      if (this.dataclose.at(-1) < this.dataclose.at(-2)) {
        console.log('BUY CREATE,', this.dataclose.at(0).toFixed(2));
        console.log(this.broker.cash);
        this.sell();
      }
    }
  }
}

(async function() {
  const data = new CSVData({
    source: {
      file: path.join(process.cwd(), 'examples', 'orcl-tmp.csv'),
      symbol: 'ORCL'
    },
    // fields: {
    //   close: 'Adj Close'
    // },
    timestamp: {
      type: 'date',
      column: 'Date',
      filter(ts) {
        // only pass date between 2000-01-01 ~ 2000-12-31
        return ts >= 946684800000 && ts <= 978307199999;
      }
    }
  });

  const engine = new Typetrader({
    data,
    strategy: [
      new TestStrategy(data.stores.ORCL)
    ]
  });
  console.log('Starting Portfolio Value:', engine.broker.value);
  await engine.run();
  console.log(engine.broker.cash);
  console.log('' + engine.broker.getPosition(data.stores.ORCL));
  console.log('Final Portfolio Value:', engine.broker.value);
})().catch(err => {
  console.error(err);
  process.exit(-1);
});
