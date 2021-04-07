import * as echarts from "echarts";

export type ChartType =
  'line'
  | 'area'
  | 'scatter'
  | 'spline-area'
  | 'spline'
  | 'step'
  | 'step-after'
  | 'step-before'
  | 'annotation'
  | 'bar'
  | 'display'
  | 'image'
  | 'map'
  | 'gauge'
  | 'circle'
  | 'pie'
  | 'doughnut'
  | 'button';
export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';
export type TimeUnit = 'us' | 'ms' | 'ns';
export type ECharts = ReturnType<typeof echarts.init>;
export type MapParams = {
  tiles?: string[];
  heatRadius?: number;
  heatBlur?: number;
  heatOpacity?: number;
  heatControls?: boolean;
  mapType?: string;
  showTimeSlider?: boolean;
  showTimeRange?: boolean;
  timeSliderMin?: number;
  timeSliderMax?: number;
  timeSliderStep?: number;
  timeSliderMode?: 'timestamp' | 'date' | 'custom';
  timeStart?: number,
  timeSpan?: number,
  startLat?: number;
  startLong?: number;
  startZoom?: number;
  timeSpanList?: any[],
  animate?: boolean;
  marker?: string;
};
