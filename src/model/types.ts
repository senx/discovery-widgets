import * as echarts from "echarts";

export type ChartType = 'line' | 'area' | 'spline-area' | 'spline' | 'step' | 'step-after' | 'step-before' | 'annotation' | 'bar' | 'display' | 'image' | 'map' | 'button';
export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';
export type TimeUnit = 'us' | 'ms' | 'ns';
export type ECharts = ReturnType<typeof echarts.init>;
