import * as echarts from "echarts";

export type ChartType = 'line' | 'area' | 'spline-area' | 'spline' | 'step' | 'step-after' | 'step-before' | 'annotation';
export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';
export type TimeUnit = 'us' | 'ms' | 'ns';
export type ECharts = ReturnType<typeof echarts.init>;
