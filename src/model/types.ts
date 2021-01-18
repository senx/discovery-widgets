export type ChartType = 'line' | 'area' | 'spline' | 'step' | 'step-after' | 'step-before';
export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';
export type TimeUnit = 'us' | 'ms' | 'ns';
export function stringLiteralArray<T extends string>(...args: T[]): T[] {
  return args;
}
