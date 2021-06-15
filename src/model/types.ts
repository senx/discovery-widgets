import * as echarts from "echarts";

export type ChartType =
  'line' | 'area' | 'scatter' | 'spline-area' | 'spline' | 'step' | 'step-after' | 'step-before'
  | 'annotation'
  | 'bar'
  | 'display'
  | 'image'
  | 'map'
  | 'gauge' | 'linear-gauge' | 'circle'
  | 'pie'
  | 'plot'
  | 'doughnut'
  | 'rose'
  | 'tabular'
  | 'svg'
  | 'input:text' | 'input:list' | 'input:secret' | 'input:autocomplete' | 'input:slider' | 'input:date'
  | 'button';
export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';
export type TimeUnit = 'us' | 'ms' | 'ns';
export type ECharts = ReturnType<typeof echarts.init>;
export type MapParams = {
  tiles?: any[];
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
  maxNativeZoom?: number;
  maxZoom?: number;
};
