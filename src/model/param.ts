/*
 *  Copyright 2020  SenX S.A.S.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
import {ChartType, MapParams, TimeMode, TimeUnit} from "./types";

export class Param {
  scheme = 'WARP10';
  bgColor?: string;
  datasetColor?: string;
  fillColor?: string;
  fontColor?: string;
  timeZone = 'UTC';
  unit?: string;
  type?: ChartType;
  showRangeSelector?: boolean;
  timeMode?: TimeMode;
  showDots = false;
  timeUnit: TimeUnit = 'us';
  borderColor?: string;
  minColorValue?: string;
  maxColorValue?: string;
  startColor?: string;
  endColor?: string;
  numColorSteps?: number;
  maxValue: number;
  minValue: number;
  key?: string;
  properties?: any;
  yAxis?: number;
  xAxis?: number;
  showlegend = false;
  responsive?: boolean;
  autoRefresh?: number;
  showControls = true;
  showErrors = true;
  showStatus = true;
  expandAnnotation = false;
  showGTSTree?: boolean;
  foldGTSTree?: boolean;
  delta?: number;
  split?: 'Y' | 'M' | 'D' | 'h' | 'm' | 's';
  popupButtonValidateClass?: string;
  popupButtonValidateLabel?: string;
  bounds?: {
    minDate?: number;
    maxDate?: number;
    yRanges?: [number, number];
  };
  isRefresh?: boolean;
  elemsCount?: number;
  windowed?: number;
  eventHandler?: string;
  customStyles?: { [key: string]: string; };


// components specific params
  bar?: {
    horizontal: boolean,
    stacked: boolean,
  };
  button?: {
    label: string
  };
  gauge?:{
    horizontal: boolean
  };
  map?: MapParams;
  histo?: {
    histnorm: 'percent' | 'probability' | 'density' | 'probability density';
    histfunc: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
}
