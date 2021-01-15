import { EventEmitter } from 'events';
export enum TradeStatus {
  Created = 'Created',
  Open = 'Open',
  Closed = 'Closed'
}

export interface TradeOptions {
  pnl: number;
  pnlcomm: number;
}

export class Trade extends EventEmitter {
  pnl: number;
  pnlcomm: number;
  private _status: TradeStatus;

  constructor(options: TradeOptions) {
    super();
    this.pnl = options.pnl;
    this.pnlcomm = options.pnlcomm;
    this._status = TradeStatus.Created;
  }

  get status() {
    return this._status;
  }

  set status(v) {
    if (this._status === v) return;
    this._status = v;
    this.emit('status-change', this);
  }

  on(event: 'status-change', handler: (_trade: this) => void): this {
    return super.on(event, handler);
  }
}