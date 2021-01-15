/* eslint-disable no-console */
import path from 'path';

import {
  Typetrader, CSVData, Strategy, Trade,
  SimpleMovingAverage, Order, DataStore,
  DataColumnLine, OrderStatus, TradeStatus
} from '../src';

class TestStrategy extends Strategy {
  sma: SimpleMovingAverage;
  dataclose: DataColumnLine;
  datetime: DataColumnLine;
  order: Order;
  size = 10;
  pnlcomm: number;

  constructor(data: DataStore) {
    super(data);
    this.dataclose = data.close;
    this.datetime = data.timestamp;
    this.order = null;
    this.pnlcomm = 0;
    this.sma = new SimpleMovingAverage({
      data: this.data.close,
      period: 15,
      precision: 6
    });
  }

  log(msg: string, ts?: number) {
    const dt = new Date(ts || this.datetime.at(0));
    console.log(dt.toISOString().substr(0, 10) + ',', msg);
  }

  onTrade(trade: Trade) {
    if (trade.status !== TradeStatus.Closed) {
      return;
    }
    this.pnlcomm += trade.pnlcomm;
    this.log(`OPERATION PROFIT, GROSS ${trade.pnl.toFixed(2)}, NET ${trade.pnlcomm.toFixed(2)}`);
  }

  onOrder(order: Order) {
    if (order.status === OrderStatus.Submitted || order.status === OrderStatus.Accepted) {
      return;
    }
    if (order.status === OrderStatus.Completed) {
      this.log(`${order.isBuy ? 'BUY' : 'SELL'} EXECUTED, ${order.price.toFixed(2)}`);
    }
    this.order = null;
  }

  async next() {
    if (this.order) {
      return;
    }
   
    if (!this.position) {
      if (this.dataclose.at(0) > this.sma.at(0)) {
        this.log('BUY CREATE, ' + this.dataclose.at(0).toFixed(2));
        this.order = await this.buy(this.size);
      }
    } else {
      if (this.dataclose.at(0) < this.sma.at(0)) {
        this.log('SELL CREATE, ' + this.dataclose.at(0).toFixed(2));
        this.order = await this.sell(this.size);
      }
    }
  }
}

(async function() {
  const data = new CSVData({
    source: {
      file: path.join(process.cwd(), 'examples', 'orcl-1995-2014.csv'),
      symbol: 'ORCL'
    },
    timestamp: {
      type: 'date',
      column: 'Date',
      // filter(ts) {
        // only pass date between 2000-01-01 ~ 2000-12-31
        // return ts >= 946684800000 && ts <= 978307199999;
      // }
    }
  });

  const engine = new Typetrader({
    broker: {
      commission: 0.001
    },
    data,
    strategy: [
      new TestStrategy(data.stores.ORCL)
    ]
  });
  const st = Date.now();
  console.log('Starting Portfolio Value:', engine.broker.value);
  await engine.run();
  console.log('Final cash:', engine.broker.cash);
  console.log(engine.broker.getPosition(data.stores.ORCL));
  console.log('Final pnlmm:', (engine.strats[0] as TestStrategy).pnlcomm);
  console.log('Final Portfolio Value:', engine.broker.value);
  console.log('Final cost time:', Date.now() - st);
})().catch(err => {
  console.error(err);
  process.exit(-1);
});
