export function isNumber(v: unknown) {
  return typeof v === 'number';
}

export function isFunction(v: unknown) {
  return typeof v === 'function';
}

export function isString(v: unknown) {
  return typeof v === 'string';
}

export function isInteger(v: unknown) {
  return isNumber(v) && Number.isInteger(v);
}