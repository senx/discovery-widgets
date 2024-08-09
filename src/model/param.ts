/*
 *   Copyright 2022-2024 SenX S.A.S.
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

// noinspection JSUnusedGlobalSymbols

import {ChartType, DiscoveryEvent, MapParams, TimeMode, TimeUnit} from './types';
import {HeatMaps} from '../utils/color-lib';

export class Param {
  skippedVars?: string[];
  mutedVars?: string[];
  scheme = 'WARP10';
  bgColor?: string;
  datasetColor?: string;
  datasetNoAlpha?: boolean = false;
  fillColor?: string;
  fontColor?: string;
  timeZone = 'UTC';
  timeFormat?: string;
  unit?: string;
  title?: string;
  type?: ChartType;
  subType?: ChartType;
  showRangeSelector?: boolean = false;
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
  hideYAxis = false;
  hideXAxis = false;
  showLegend = false;
  showValues = false;
  fullDateDisplay = false;
  responsive?: boolean;
  autoRefresh?: number;
  showControls = false;
  thresholds?: {
    color?: string;
    fill?: boolean,
    value?: number;
    from?: number;
    name?: string,
    type?: 'solid' | 'dashed' | 'dotted'
  }[];
  markers?: {
    color?: string;
    value?: number;
    start?: number;
    fill?: boolean;
    name?: string,
    type?: 'solid' | 'dashed' | 'dotted',
    alpha?: number;
  }[];
  pieces?: { color?: string; lte?: number; gte?: number }[];
  yLabelsMapping?: { [key: number]: string };
  xpieces?: boolean;
  showErrors?: boolean;
  showStatus?: boolean;
  expandAnnotation = false;
  displayExpander = true;
  showGTSTree?: boolean;
  foldGTSTree?: boolean;
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
  httpHeaders?: { [key: string]: string; };
  leftMargin = 0;
  showLoader = false;
  noDataLabel = 'No data';
  tooltipDelay?: number;
  polygons?: { shape: number[][]; color?: string; name?: string; fill?: boolean }[];
  xCursor?: boolean;
  yCursor?: boolean;
  yAxisFocus?: boolean;
  poi?: boolean;
  poiColor: '#D81B60';
  poiLine: 'solid' | 'dashed' | 'dotted' = 'dotted';
  dotSize = 5;
  strokeWidth = 1;
  stacked?: boolean;
// components specific params
  bar?: {
    horizontal?: boolean,
    animate?: boolean,
    stacked?: boolean,
    startAngle?: number,
    fillGap?: boolean,
  };
  box?: {
    horizontal?: boolean
    animate?: boolean,
  };
  button?: {
    label: string
  };
  tabular?: {
    fixedWidth: boolean,
    sortable: boolean,
    filterable: boolean,
    onTop: boolean
  };
  gauge?: {
    horizontal: boolean,
    showTicks: false,
    decimals?: number,
    color?: any[][] | HeatMaps,
    pointer?: boolean,
    width?: number
  };
  display?: {
    showChart?: boolean,
    chartType?: ChartType,
    labelPosition?: 'n' | 's' | 'e' | 'w' | 'c' | 'ne' | 'se' | 'nw' | 'sw',
    decimals?: number,
    value?: string | number
  };
  input?: {
    showButton?: boolean,
    value?: string | number | number[],
    min?: number,
    max?: number,
    step?: number,
    stepCount?: number,
    horizontal?: boolean,
    progress?: boolean,
    showTicks?: boolean,
    showFilter?: boolean,
    immediate?: boolean,
    caseSensitive?: boolean,
    onlyFromAutocomplete?: boolean,
    locale?: string,
    fromLabel?: string,
    toLabel?: string
  }
  map?: MapParams;
  svg?: {
    handlers?: { selector?: string, event: DiscoveryEvent, hover: boolean, click: boolean }[],
  }
  calendar?: {
    horizontal?: boolean,
    firstDay?: number,
    dayLabel?: string[],
    monthLabel?: string[],
  };
  extra?: any;
}
