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

// eslint-disable-next-line max-classes-per-file
import * as echarts from 'echarts';
import {Param} from './param';

export const CHART_TYPES = [
  'line', 'area', 'scatter', 'step-area', 'spline-area', 'spline', 'step', 'step-after', 'step-before'
  , 'annotation'
  , 'bar', 'bar-polar'
  , 'display'
  , 'image'
  , 'map'
  , 'gauge', 'linear-gauge', 'circle', 'compass'
  , 'pie'
  , 'doughnut'
  , 'rose'
  , 'tabular'
  , 'svg'
  , 'input:text', 'input:list', 'input:secret', 'input:autocomplete', 'input:chips', 'input:chips-autocomplete', 'input:slider', 'input:date', 'input:date-range', 'input:multi', 'input:multi-cb'
  , 'button', 'button:radio'
  , 'hidden'
  , 'calendar', 'heatmap'
  , 'profile'
  , 'dashboard', 'dashboard:flex', 'dashboard:scada'
] as const;

export type ChartType = typeof CHART_TYPES[number]

export type TimeMode = 'timestamp' | 'date' | 'custom' | 'duration';

export type TimeUnit = 'us' | 'ms' | 'ns';

export type ECharts = ReturnType<typeof echarts.init>;

export class MapParams {
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
  render?: string;
  maxNativeZoom?: number;
  maxZoom?: number;
  track?: boolean;
  step?: number;
  delay?: number;
  tooltip?: any;
  iconSize?: number | number[];
}

export class Dataset {
  name: string;
  values: any[];
  headers: string[];
  isGTS: boolean;
  params: any;
}

export class Label {
  key: string;
  value: string;
}

export class Tile {
  type: string;
  w: number;
  h: number;
  x: number;
  y: number;
  z?: number;
  data?: string | DataModel;
  title?: string;
  macro?: string;
  endpoint?: string;
  unit?: string;
  options: Param = new Param();
  elem?: HTMLDiscoveryTileElement | HTMLDiscoveryTileResultElement;
  png?: string;
  uid?: string;
  bgColor?: string;
  vars?: any[] | string[];
}

export class GTS {
  c: string;
  l: Label[];
  a: Label[];
  v: any[][];
  id?: number;
}

export class DiscoveryEvent {
  tags: string[];
  type: 'popup' | 'xpath' | 'style' | 'data' | 'variable' | 'audio' | 'zoom' | 'focus' | 'margin'
    | 'bounds' | 'title' | 'description' | 'selected' | 'link' | 'poi';
  value: any;
  selector?: string;
  source: string;
}

export class DataModel {
  data: any;
  params?: Param[];
  globalParams?: Param;
  events?: DiscoveryEvent[];
  bounds?: {
    xmin?: number,
    xmax?: number,
    ymin?: number,
    ymax?: number
  };
}

export class Dashboard {
  title: string;
  type: 'dashboard' | 'scada' = 'dashboard';
  description: string;
  tiles: Tile[] | string = [];
  vars: { [key: string]: any; } = {};
  options?: Param;
  cols = 12;
  cellHeight = 220;
  bgColor = '#fff';
  fontColor = '#000';
}

export class ChartBounds {
  tsmin = 0;
  tsmax = 0;
  msmin = '';
  msmax = '';
  marginLeft = 0;
}
