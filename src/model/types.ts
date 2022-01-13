/*
 *   Copyright 2022  SenX S.A.S.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import * as echarts from "echarts";

export type ChartType =
  'line' | 'area' | 'scatter' | 'step-area' | 'spline-area' | 'spline' | 'step' | 'step-after' | 'step-before'
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
  | 'input:text' | 'input:list' | 'input:secret' | 'input:autocomplete' | 'input:slider' | 'input:date' | 'input:date-range'
  | 'button'
  | 'hidden'
  | 'calendar'
  ;
export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';
export type TimeUnit = 'us' | 'ms' | 'ns';
export type ECharts = ReturnType<typeof echarts.init>;
export type MapParams = {
  tiles?: any[];
  heatmap?: boolean;
  heatRadius?: number;
  heatBlur?: number;
  heatOpacity?: number;
  mapType?: string;
  startLat?: number;
  startLong?: number;
  startZoom?: number;
  animate?: boolean;
  marker?: string;
  maxNativeZoom?: number;
  maxZoom?: number;
  track?: boolean;
};
