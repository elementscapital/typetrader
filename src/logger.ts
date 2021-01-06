/* eslint-disable no-console */

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  info: LogFn;
  debug: LogFn;
  error: LogFn;
  warn: LogFn;
}

export class ConsoleLogger implements Logger {
  info(...args: unknown[]) {
    console.info(...args);
  }

  error(...args: unknown[]) {
    console.error(...args);
  }

  debug(...args: unknown[]) {
    console.debug(...args);
  }

  warn(...args: unknown[]) {
    console.warn(...args);
  }
}
