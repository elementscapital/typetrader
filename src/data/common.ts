export type DataField = 'open' | 'high' | 'low' | 'close' | 'volumn' | 'openintrest';
export type DataColumn = 'timestamp' | DataField;
export const DATA_FIELDS: DataField[] = ['open', 'high', 'low', 'close', 'volumn', 'openintrest'];
export const DATA_COLUMNS: DataColumn[] = ['timestamp', ...DATA_FIELDS];

export type DataPoint = {
  timestamp: number;
} & Partial<Record<DataField, number>>;

export function getLoopIndex(index: number, length: number) {
  index = index % length;
  return index < 0 ? length + index : index;
}