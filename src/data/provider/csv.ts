import { promises as fs } from 'fs';
import {
  DataPoint, DATA_FIELDS, DataField
} from '../common';
import { DataStore, getMaxIndicatorPeriod } from '../store';
import { DataProvider } from './base';

// type FilterFn = (dataPoint: DataPoint) => boolean;

export interface CSVDataOptions<T extends string> {
  source: {
    file: string; symbol: T;
  } | {
    file: string; symbol: T;
  }[],
  timestamp: {
    type: 'second' | 'millsecond' | 'date' | 'datetime';
    /**
     * timestamp header column name(ignored letter case), default is 'timestamp'
     */
    column?: string;
    convert?: (v: number) => number;
    /**
     * only pass rows with matched timestamp
     */
    filter?: (ts: number) => boolean;
  };
  /**
   * header columns name(ignored letter case) map
   */
  fields?: Partial<Record<DataField, string>>;
}

const timestampParsers = {
  second: (n: string) => Number(n) * 1000,
  millsecond: (n: string) => Number(n),
  date: (v: string) => new Date(v).getTime(),
  datetime: (v: string) => new Date(v).getTime()
};

/**
 * General CSV data provider. 
 * 
 * Please note that this provider will load all data into memory.
 * So it's not fit for huge file until next version.
 */
export class CSVData<T extends string> extends DataProvider<T> {
  private _options: CSVDataOptions<T>;
  private _end: boolean;

  constructor(options: CSVDataOptions<T>) {
    options.source = Array.isArray(options.source) ? options.source : [options.source];
    super(Object.fromEntries(options.source.map(src => [src.symbol, new DataStore(src.symbol)])) as Record<T, DataStore>);
    this._options = options;
    this._end = false;
  }

  async start() {
    const {
      source, timestamp, fields
    } = this._options;

    const sources = Array.isArray(source) ? source : [source];
    const columnsMap: Map<number, DataField> = new Map();
    const fieldNames = fields ? DATA_FIELDS.map(f => fields[f]?.toLocaleLowerCase() || f) : DATA_FIELDS;

    let headerLine;
    for await(const src of sources) {
      const lines = (await fs.readFile(src.file, 'utf-8')).split('\n');
      if (headerLine && lines[0] !== headerLine) {
        throw new Error('header columns must be same between csv source files');
      }
      headerLine = lines[0];
      if (!headerLine) {
        throw new Error('csv file header missing: ' + src.file);
      }
      const headerSegs = headerLine.split(',').map(v => v.trim().toLocaleLowerCase());
      const timeColumnIndex = headerSegs.indexOf((timestamp.column || 'timestamp').toLocaleLowerCase());
      if (timeColumnIndex < 0) {
        throw new Error('header of csv file miss timestamp column: ' + src.file);
      }
      headerSegs.forEach((hc: DataField, i) => {
        if (i === timeColumnIndex) return;
        hc = (hc as string).toLocaleLowerCase() as DataField;
        const fidx = fieldNames.indexOf(hc);
        if (fidx < 0) return;
        columnsMap.set(i, DATA_FIELDS[fidx]);
      });

      const store = this.stores[src.symbol];
      lines.slice(1).forEach((line, idx) => {
        line = line.trim();
        if (!line) return;  // skip empty lines
        const segs = line.trim().split(',');
        if (segs.length !== headerSegs.length) {
          throw new Error(`columns count of line ${idx + 2} is not same as header`);
        }
        const ts = timestampParsers[timestamp.type](segs[timeColumnIndex]);
        if (timestamp.filter && !timestamp.filter(ts)) {
          return;
        }
        const dp: DataPoint = {
          timestamp: timestamp.convert ? timestamp.convert(ts) : ts
        };
        segs.forEach((seg, si) => {
          if (columnsMap.has(si)) {
            dp[columnsMap.get(si)] = Number(seg);
          }
        });
        store._array.push(dp);
      });
      store._index = Math.max(0, getMaxIndicatorPeriod(store) - 1);
    }
  }

  async read() {
    if (this._end) return null;
    this._end = true;
    return Object.values(this.stores) as DataStore[];
  }
}