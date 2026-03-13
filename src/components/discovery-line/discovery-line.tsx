/*
 *   Copyright 2022-2025 SenX S.A.S.
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

import { Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams, EChartsOption, init } from 'echarts';
import { GTSLib } from '../../utils/gts.lib';
import { SeriesOption } from 'echarts/lib/util/types';
import { ColorLib } from '../../utils/color-lib';
import { Utils } from '../../utils/utils';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { ChartType, DataModel, DiscoveryEvent, ECharts } from '../../model/types';
import { CartesianAxisOption } from 'echarts/lib/coord/cartesian/AxisModel';
import { GridOption } from 'echarts/lib/coord/cartesian/GridModel';
import 'moment/min/locales.js';
import { throttle, uniq } from 'lodash';
import { v4 } from 'uuid';

@Component({
  tag: 'discovery-line',
  styleUrl: 'discovery-line.scss',
  shadow: true,
})
export class DiscoveryLineComponent {

  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = { ...new Param(), timeMode: 'date' };
  @State() @Prop() width: number;
  @State() @Prop() height: number;
  @Prop() debug = false;
  @Prop() unit = '';
  @Prop() url: string;
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() vars = '{}';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{
    start?: number,
    end?: number,
    min?: number,
    max?: number,
    orientation?: string,
    type?: string
  }>;
  @Event() dataZoomY: EventEmitter<{
    start?: number,
    end?: number,
    min?: number,
    max?: number,
    orientation?: string,
    type?: string
  }>;
  @Event() leftMarginComputed: EventEmitter<number>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;
  @Event() poi: EventEmitter;
  @Event() timeBounds: EventEmitter;
  @Event({
    eventName: 'discoveryEvent',
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;
  @Event() execError: EventEmitter;

  @State() parsing = false;
  @State() rendering = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = { ...new Param(), timeMode: 'date', xCursor: true, yCursor: false };
  private LOG: Logger;
  private divider = 1000;
  private myChart: ECharts;
  private leftMargin = 0;
  private hasFocus = false;
  private bounds: { min: number; max: number };
  private zoom: { start?: number; end?: number };
  private pois: any[] = [];
  private innerWidth: number = 0;
  private innerHeight: number = 0;
  private zoomXInfo: any = {};
  private zoomYInfo: any = {};
  private innerVars: any = {};

  @Watch('type')
  updateType(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.type = newValue;
      this.chartOpts = this.convert(this.result as DataModel ?? new DataModel());
      this.setOpts();
    }
  }

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.result = GTSLib.getData(this.result);
      const options = Utils.mergeDeep<Param>(this.innerOptions, this.result.globalParams ?? {});
      this.innerOptions = { ...this.defOptions, ...options };
      this.chartOpts = this.convert(this.result || new DataModel());
      this.setOpts(true);
    }
  }

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = { ...this.defOptions, ...opts };
      if (this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        this.setOpts(true);
      }
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue }, this.chartOpts);
    }
  }

  @Watch('vars')
  varsUpdate(newValue: any, oldValue: any) {
    let vars = this.vars;
    if (!!this.vars && typeof this.vars === 'string') {
      vars = JSON.parse(this.vars);
    }
    if (!Utils.deepEqual(vars, this.innerVars)) {
      this.innerVars = Utils.clone(vars as any);
    }
    this.LOG?.debug(['varsUpdate'], { vars: this.vars, newValue, oldValue });
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLineComponent, this.debug);
    this.result = GTSLib.getData(this.result);
    if (typeof this.options === 'string') {
      this.innerOptions = { ...this.defOptions, ...JSON.parse(this.options) };
    } else {
      this.innerOptions = { ...this.defOptions, ...this.options };
    }
    this.LOG?.debug(['componentWillLoad'], { type: this.type, options: this.innerOptions });
    this.chartOpts = this.convert(this.result ?? new DataModel());
    this.setOpts();
  }

  setOpts(notMerge = false) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    } else if (this.vars) {
      this.innerVars = this.vars;
    }
    if ((this.chartOpts.series as SeriesOption[]).length === 0) {
      this.chartOpts.title = {
        show: true,
        textStyle: { color: Utils.getLabelColor(this.el), fontSize: 20 },
        text: this.innerOptions.noDataLabel ?? '',
        left: 'center',
        top: 'center',
      };
      this.chartOpts.xAxis = { show: false };
      this.chartOpts.yAxis = { show: false };
      this.chartOpts.dataZoom = { show: false };
      this.chartOpts.tooltip = { show: false };
    } else {
      this.chartOpts.title = { ...this.chartOpts.title ?? {}, show: false };
    }
    if (this.myChart) {
      setTimeout(() => {
        this.myChart.setOption(this.chartOpts ?? {}, notMerge, true);
        const batch = [];
        if (this.zoomXInfo.start !== undefined) {
          batch.push({
            start: this.zoomXInfo.start,
            end: this.zoomXInfo.end,
            dataZoomIndex: 0,
          });
        }
        if (this.zoomYInfo.start !== undefined) {
          batch.push({
            start: this.zoomYInfo.start,
            end: this.zoomYInfo.end,
            dataZoomIndex: 1,
          });
        }
        if (batch.length > 0) {
          this.myChart.dispatchAction({ type: 'dataZoom', batch });
        }
      });
    }
  }

  convert(data: DataModel) {
    this.innerOptions.timeMode = this.innerOptions.timeMode ?? 'date';
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit ?? 'us');
    const gtsList = [
      ...GTSLib.flattenGtsIdArray(GTSLib.flatDeep([data.data] as any[]), 0).res,
      ...GTSLib.flatDeep([data.data] as any[]).filter(g => !!g && g.values && g.label),
    ];
    const gtsCount = gtsList.length;
    const opts: EChartsOption = {
      animation: false,
      grid: {
        left: ((!!this.innerOptions.leftMargin && this.innerOptions.leftMargin > this.leftMargin)
          ? this.innerOptions.leftMargin - this.leftMargin + 10
          : 10) + (this.innerOptions.unitPosition === 'middle' ? 40 : 0),
        top: 30,
        bottom: (this.innerOptions.showLegend ? 30 : 10) + (this.innerOptions.showRangeSelector ? 40 : 0) + (this.innerOptions.xUnit ? 40 : 0),
        right: 10 + (this.innerOptions.showYRangeSelector ? 40 : 0),
        containLabel: true,
      },
      responsive: true,
      throttle: 40,
      tooltip: {
        transitionDuration: 0,
        trigger: 'axis',
        animation: false,
        snap: false,
        position: (pos, _params, _dom, _rect, size) => {
          const obj = { top: 10 };
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
          return obj;
        },
        formatter: (params: any[]) => {
          if (this.innerOptions.hideTooltip === true) {
            return '';
          }
          const tooltipWidth = Math.floor(this.innerWidth / 2);
          const contentWidth = tooltipWidth - 40; // Account for padding and margins
          let maxTxtSize = 0;
          params.forEach(s => {  // TODO: should not be done at each tooltip rendering
            maxTxtSize = Math.max(GTSLib.getName(s.seriesName).length, maxTxtSize);
          });
          return `
            <style>
              @keyframes scrollText {
                0% { margin-left: 0; }
                10% { margin-left: 0; }
                90% { margin-left: -95%; }
                100% { margin-left: -95%; }
                
              }
              .tooltip-scroll {
                white-space: nowrap;
                overflow: hidden;
                display: inline-block;
                
                vertical-align: middle;
              }
              .tooltip-marker {
                flex-shrink: 0; 
              }
              .tooltip-value {
                flex-shrink: 0;
                text-align: right;
                margin-left:auto;
                font-weight:900;
                padding-left:10px;
              }
              .tooltip-scroll-container {
                overflow:hidden;
              }
              .tooltip-scroll div {
                ${maxTxtSize > 100 ? "animation: scrollText 15s linear infinite alternate;" : ""}                
                display: inline-block;
                width: fit-content;
              }
            </style>
            <div style="max-width:${tooltipWidth}px;overflow:hidden;">
              <div style="font-size:14px;color:#666;font-weight:400;line-height:1.4;padding:8px;white-space:nowrap;">
                ${this.innerOptions.timeMode !== 'date' 
                  ? params[0].value[0] 
                  : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].value[0], 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                    this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined) || '')
                      .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}
              </div>
              ${params.map(s => `
                <div style="display:flex;align-items:center;padding:1px 8px;line-height:1.4;">
                  <span class="tooltip-marker">${s.marker}</span>
                  <div class="tooltip-scroll-container">
                    <div class="tooltip-scroll" >
                      <div>${GTSLib.formatLabel(GTSLib.getName(s.seriesName))}</div>
                    </div>
                  </div>
                  <div class="tooltip-value">
                    ${s.value[1]}
                  </div>
                </div>`
              ).join('')}
            </div>`
        },
        axisPointer: {
          type: !!this.innerOptions.yCursor && !!this.innerOptions.xCursor
            ? 'cross'
            : !!this.innerOptions.yCursor || !!this.innerOptions.xCursor
              ? 'line'
              : 'none',
          axis: this.innerOptions.yAxisFocus ? 'y' : 'x',
          animation: false,
          lineStyle: !this.innerOptions.yCursor && !this.innerOptions.xCursor
            ? undefined
            : {
              color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red'),
            },
          crossStyle: this.innerOptions.yCursor
            ? {
              color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red'),
            }
            : undefined,
        },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay ?? 100,
      },
      toolbox: {
        show: typeof this.innerOptions.showControls === 'boolean'
          ? this.innerOptions.showControls
          : (this.innerOptions.showControls.saveAsImage ?? false) || (this.innerOptions.showControls.saveAsCSV ?? false) || (this.innerOptions.showControls.restore ?? false) || (this.innerOptions.showControls.dataZoom ?? false) || (typeof this.innerOptions.showControls.dataView === 'boolean' ? this.innerOptions.showControls.dataView : this.innerOptions.showControls.dataView?.show ?? false),
        feature: {
          saveAsImage: {
            type: 'png',
            excludeComponents: ['toolbox'],
            show: typeof this.innerOptions.showControls === 'boolean'
              ? this.innerOptions.showControls
              : this.innerOptions.showControls.saveAsImage ?? false
          },
          myCsvExport: {
            name: 'myCsvExport',
            show: typeof this.innerOptions.showControls === 'boolean'
              ? this.innerOptions.showControls
              : this.innerOptions.showControls.saveAsCSV ?? false,
            title: 'Export CSV',
            icon: 'path://M15.29 1H3v11h1V2h10v6h6v14H4v-3H3v4h18V6.709zM20 7h-5V2h.2L20 6.8zm-4.96 11l2.126-5H16.08l-1.568 3.688L12.966 13h-1.084l2.095 5zM7 14.349v.302A1.35 1.35 0 0 0 8.349 16H9.65a.349.349 0 0 1 .349.349v.302A.349.349 0 0 1 9.65 17H7v1h2.651A1.35 1.35 0 0 0 11 16.651v-.302A1.35 1.35 0 0 0 9.651 15H8.35a.349.349 0 0 1-.35-.349v-.302A.349.349 0 0 1 8.349 14H11v-1H8.349A1.35 1.35 0 0 0 7 14.349zm-5 .692v.918A2.044 2.044 0 0 0 4.041 18H6v-1H4.041A1.042 1.042 0 0 1 3 15.959v-.918A1.042 1.042 0 0 1 4.041 14H6v-1H4.041A2.044 2.044 0 0 0 2 15.041z',
            iconStyle: {
              borderWidth: 0.5
            },
            onclick: () => {
              const csv = this.dataToCSV(data);
              const blob = new Blob([csv], {type: 'text/csv'});
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = (this.innerOptions.title ? this.innerOptions.title : 'export') + '.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            }
          },
          restore: {
            show: typeof this.innerOptions.showControls === 'boolean'
              ? this.innerOptions.showControls
              : this.innerOptions.showControls.restore ?? false
          },
          dataZoom: {
            show: typeof this.innerOptions.showControls === 'boolean'
              ? this.innerOptions.showControls
              : this.innerOptions.showControls.dataZoom ?? false
          },
          dataView: {
            show: typeof this.innerOptions.showControls === 'boolean'
              ? this.innerOptions.showControls
              : typeof this.innerOptions.showControls.dataView === 'boolean'
                ? this.innerOptions.showControls.dataView
                : this.innerOptions.showControls.dataView?.show ?? false,
            lang: typeof this.innerOptions.showControls === 'object' && typeof this.innerOptions.showControls.dataView === 'object' && this.innerOptions.showControls.dataView?.lang
              ? this.innerOptions.showControls.dataView.lang
              : ['Data view', 'Close', 'Refresh'],
            optionToContent: () => this.dataToHTMLTable(data),
            textColor: Utils.getCSSColor(this.el, '--warp-view-data-view-text-color', 'white'),
            backgroundColor: Utils.getCSSColor(this.el, '--warp-view-data-view-bg-color', 'white'),
            buttonColor: Utils.getCSSColor(this.el, '--warp-view-data-view-button-color', 'rgb(194, 53, 49)'),
            buttonTextColor: Utils.getCSSColor(this.el, '--warp-view-data-view-button-text-color', 'black'),
          }
        },
      },
      legend: {
        bottom: 0, left: 'center', show: !!this.innerOptions.showLegend, height: 30, type: 'scroll',
        textStyle: { color: Utils.getLabelColor(this.el) },
        formatter: n => GTSLib.getName(n),
      },
      dataZoom: [
        {
          type: 'inside',
          realtime: true,
          filterMode: 'none',
          orient: 'horizontal',
          zoomOnMouseWheel: true,
        },
        {
          type: 'inside',
          realtime: true,
          filterMode: 'none',
          orient: 'vertical',
          zoomOnMouseWheel: 'ctrl',
        },
        {
          type: 'slider',
          height: '20px',
          show: !!this.innerOptions.showRangeSelector,
          bottom: this.innerOptions.showLegend ? 30 : 20,
          xAxisIndex: [0],
          filterMode: 'none',
        },
        {
          type: 'slider',
          width: '20px',
          show: !!this.innerOptions.showYRangeSelector,
          yAxisIndex: [0],
          filterMode: 'none',
        },
      ],
      visualMap: new Array(gtsCount),
      series: [],
      ...this.innerOptions?.extra?.chartOpts ?? {},
    };
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let hasTimeBounds = false;
    (this.innerOptions.actions ?? []).forEach((action) => {
      if (action.macro) {
        (opts.toolbox as any).feature['my' + v4().replaceAll('-', '')] = {
          title: action.title ?? '',
          show: true,
          icon: action.icon ?? Utils.DEFICON,
          onclick: () => Utils.execAction(action.macro, this),
        };
      }
    });

    const multiY = uniq((data.params ?? [])
      .filter(p => p.yAxis !== null && p.yAxis !== undefined)
      .map(p => p.yAxis)).length > 1;
    const multiX = uniq((data.params ?? [])
      .filter(p => p.xAxis !== null && p.xAxis !== undefined)
      .map(p => p.xAxis)).length > 1;

    for (let index = 0; index < gtsCount; index++) {
      const gts = gtsList[index];
      const datasetNoAlpha = (data.params ?? [])[index]?.datasetNoAlpha ?? this.innerOptions.datasetNoAlpha;
      if (GTSLib.isGtsToPlot(gts)) {
        const c = ColorLib.getColor(gts.id, this.innerOptions.scheme);
        const color = (data.params ?? [])[gts.id]?.datasetColor ?? c;
        const type = (data.params ?? [])[gts.id]?.type ?? this.type;
        if (!!data.params && !!data.params[gts.id] && (data.params[gts.id].pieces ?? []).length > 0) {
          (opts.visualMap as any[])[gts.id] = {
            show: false,
            seriesIndex: gts.id,
            dimension: data.params[gts.id].xpieces ? 0 : 1,
            pieces: data.params[gts.id].pieces.map(p => ({
              color: p.color ?? '#D81B60',
              lte: data.params[gts.id].xpieces
                ? this.innerOptions.timeMode === 'date' ? GTSLib.utcToZonedTime(p.lte, this.divider, this.innerOptions.timeZone) : p.lte
                : p.lte,
              gte: data.params[gts.id].xpieces
                ? this.innerOptions.timeMode === 'date' ? GTSLib.utcToZonedTime(p.gte, this.divider, this.innerOptions.timeZone) : p.gte
                : p.gte,
            })),
            outOfRange: { color },
          };
        }
        hasTimeBounds = true;
        const dataSet = [];
        for (let v = 0; v < (gts.v ?? []).length; v++) {
          const tuple = gts.v[v];
          const ts = tuple[0];
          const val = tuple[tuple.length - 1];
          if (ts > max) max = ts;
          if (ts < min) min = ts;
          dataSet.push([
            this.innerOptions.timeMode === 'date'
              ? GTSLib.utcToZonedTime(ts, this.divider, this.innerOptions.timeZone)
              : ts
            , val,
          ]);
        }

        const isStacked = (data.params ?? [])[gts.id]?.stacked !== undefined
          ? (data.params ?? [])[gts.id]?.stacked
          : this.innerOptions?.stacked;
        const s = {
          type: type === 'scatter' || gts.v.length <= 1 ? 'scatter' : ['scatter', 'line', 'bar'].includes(type) ? type : 'line',
          name: GTSLib.setName(gts.id, (((data.params ?? [])[gts.id] ?? { key: undefined }).key ?? GTSLib.serializeGtsMetadata(gts))),
          data: dataSet,
          id: gts.id,
          animation: false,
          large: true,
          connectNulls: !this.innerOptions.discontinue,
          showSymbol: this.type === 'scatter' || this.innerOptions.showDots || this.innerOptions.showValues,
          symbolSize: this.innerOptions.dotSize ?? 10,
          smooth: type === 'spline' || type === 'spline-area' ? 0.2 : undefined,
          clip: true,
          stack: 'scatter' !== type && isStacked ? 'total' : undefined,
          stackStrategy: 'scatter' !== type && isStacked ? 'all' : undefined,
          step: DiscoveryLineComponent.getStepShape(type),
          areaStyle: type === 'area' || type === 'step-area' || type === 'spline-area' ? {
            opacity: 0.8,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
                { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.1) },
              ],
              global: false, // false by default
            },
          } : undefined,
          showAllSymbol: false,
          label: {
            show: !!this.innerOptions.showValues,
            position: 'top',
            textStyle: { color: Utils.getLabelColor(this.el), fontSize: 14 },
          },
          lineStyle: {
            cap: 'round',
            join: 'miter',
            color: !opts.visualMap[gts.id] ? color : undefined,
            width: (data.params ?? [])[gts.id]?.strokeWidth ?? this.innerOptions.strokeWidth ?? 2,
          },
          itemStyle: type === 'bar' ? {
            opacity: 0.8,
            borderColor: color,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
                { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
              ],
            },
          } : { color },
        } as SeriesOption;
        if (data.params) {
          // multi Y
          if (data.params[gts.id]?.yAxis !== undefined && multiY) {
            const y: CartesianAxisOption = this.getYAxis(color, data.params[gts.id].unit);
            if (data.params[gts.id].yAxis > 0) {
              s.yAxisIndex = data.params[gts.id].yAxis;
              y.position = 'right';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[data.params[gts.id].yAxis] = y;
            } else {
              (y as any).position = 'left';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[0] = y;
            }
          } else if (multiY) {
            const y = this.getYAxis(undefined, data.params[gts.id].unit);
            (y as any).position = 'left';
            if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
            (opts.yAxis as any)[0] = y;
          }

          // multi X
          if (data.params[gts.id]?.xAxis !== undefined && multiX) {
            if (data.params[gts.id].xAxis > 0) {
              (s as any).xAxisIndex = data.params[gts.id].xAxis;
              const x = this.getXAxis(color);
              (x as any).position = 'top';
              if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
              (opts.xAxis as CartesianAxisOption)[data.params[gts.id].xAxis] = x;
            } else {
              const x = this.getXAxis(color);
              (x as any).position = 'bottom';
              if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
              (opts.xAxis as CartesianAxisOption)[0] = x;
            }
          } else if (multiX) {
            const x = this.getXAxis();
            (x as any).position = 'bottom';
            if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
            (opts.xAxis as CartesianAxisOption)[0] = x;
          }

        }
        (opts.series as any[]).push(s);
      } else if (['scatter', 'line'].includes(this.type) && gts.label && gts.values) {
        // Custom data for scatter
        this.innerOptions.timeMode = 'custom';
        const id = gts?.id ?? index;
        const color = (data.params ?? [])[id]?.datasetColor ?? ColorLib.getColor(id, this.innerOptions.scheme);
        const sMax = Math.max(...gts.values.map((l: any[]) => l[2] || 1)) || 1;
        const sMin = Math.min(...gts.values.map((l: any[]) => l[2] || 0)) || 0;
        const isBubble = sMax !== sMin;
        const s = {
          type: this.type,
          name: GTSLib.setName(id, gts.label),
          id: gts.id,
          data: gts.values[0] && gts.values[0].length === 3
            ? (gts.values ?? []).map((v: any[]) => ({
              value: [GTSLib.utcToZonedTime(v[0], 1, this.innerOptions.timeZone), v[1]],
              symbolSize: isBubble ? (50 * v[2] / (sMax - sMin)) || this.innerOptions.dotSize || 10 : this.innerOptions.dotSize || 10,
            }))
            : gts.values,
          animation: false,
          large: true,
          showSymbol: true,
          label: {
            show: !!this.innerOptions.showValues,
            position: 'top',
            textStyle: { color: Utils.getLabelColor(this.el), fontSize: 14 },
            formatter: function (d) {
              return d.data.length === 4 ? d.data[3] : '';
            }
          },
          labelLayout: {
            hideOverlap: this.innerOptions.hideOverlap ?? false
          },
          itemStyle: isBubble || this.innerOptions.dotSize > 10 ? {
            opacity: 0.8,
            borderColor: color,
            borderWidth: ((data.params ?? [])[gts.id] ?? { strokeWidth: undefined }).strokeWidth ?? this.innerOptions.strokeWidth,
            color: gts.values[0] && gts.values[0].length === 3
              ? {
                type: 'radial', x: 0.5, y: 0.5, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
                  { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
                ],
              }
              : color,
          } : { color },
        } as SeriesOption;
        if (data.params) {
          // multi Y
          if (data.params[gts.id]?.yAxis !== undefined && multiY) {
            const y: CartesianAxisOption = this.getYAxis(color, data.params[gts.id].unit);
            if (data.params[gts.id].yAxis > 0) {
              s.yAxisIndex = data.params[gts.id].yAxis;
              y.position = 'right';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[data.params[gts.id].yAxis] = y;
            } else {
              y.position = 'left';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[0] = y;
            }
          } else if (multiY) {
            const y = this.getYAxis(undefined, data.params[gts.id].unit);
            (y as any).position = 'left';
            if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
            (opts.yAxis as any)[0] = y;
          }

          // multi X
          if (data.params[gts.id]?.xAxis !== undefined && multiX) {
            if (data.data[gts.id].length > 0) {
              if (data.params[gts.id].xAxis > 0) {
                (s as any).xAxisIndex = data.params[gts.id].xAxis;
                const x = this.getXAxis(color);
                (x as any).position = 'top';
                if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
                (opts.xAxis as CartesianAxisOption)[data.params[gts.id].xAxis] = x;
              } else {
                const x = this.getXAxis(color);
                (x as any).position = 'bottom';
                if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
                (opts.xAxis as CartesianAxisOption)[0] = x;
              }
            }
          } else if (multiX) {
            if (data.params[gts.id].xAxis > 0) {
              const x = this.getXAxis();
              (x as any).position = 'bottom';
              if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
              (opts.xAxis as CartesianAxisOption)[0] = x;
            }
          }

        }
        (opts.series as any[]).push(s);
      }
    }

    (this.innerOptions.polygons ?? []).forEach((polygon, i) => {
      const s: SeriesOption = {
        type: 'custom', renderItem: (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
          if (params.context.rendered) {
            return;
          }
          params.context.rendered = true;
          const color = polygon.color || ColorLib.getColor(i, this.innerOptions.scheme);
          return {
            type: 'polygon',
            transition: ['shape'],
            shape: {
              points: polygon.shape.map(p => api.coord([
                this.innerOptions.timeMode === 'date'
                  ? GTSLib.utcToZonedTime(p[0], this.divider, this.innerOptions.timeZone)
                  : p[0], p[1]])),
            },
            style: api.style({
              fill: polygon.fill ? ColorLib.transparentize(color) : undefined,
              stroke: color,
            }),
          };
        },
        clip: true,
        data: polygon.shape,
      };
      (opts.series as any[]).push(s);
    });
    if (hasTimeBounds) {
      this.timeBounds.emit({ min, max });
      this.bounds = { min, max };
    }
    // multi Y
    if (!multiY) {
      opts.yAxis = this.getYAxis();
    } else {
      const yAxis = [...GTSLib.cleanArray(opts.yAxis as any[])];
      opts.yAxis = [];
      let i = 0;
      yAxis.forEach((y: CartesianAxisOption) => {
        if (y.position === 'right') {
          y.offset = 80 * i;
          i++;
        }
        (opts.yAxis as any).push(y);
      });
      (opts.grid as GridOption).right = 80 * (i - 1);
    }
    // multi X
    if (!multiX) {
      opts.xAxis = this.getXAxis();
    } else {
      const xAxis = [...GTSLib.cleanArray(opts.xAxis as any[])];
      opts.xAxis = [];
      let i = 0;
      xAxis.forEach((x: CartesianAxisOption) => {
        if (x.position === 'top') {
          x.offset = 30 * (i + 1);
          i++;
        }
        (opts.xAxis as any).push(x);
      });
      (opts.grid as GridOption).top = Math.max(30, 30 * i);
    }
    this.LOG?.debug(['convert', 'opts'], { opts });
    const markArea = [...(this.innerOptions.thresholds || [])
      .filter(t => !!t.fill)
      .map(t => {
        return [{
          itemStyle: {
            color: ColorLib.transparentize(t.color || '#D81B60', t.fill ? 0.5 : 0),
            borderType: t.type || 'dashed',
            name: t.name || t.value || 0,
          },
          yAxis: t.value || 0,
        }, {
          itemStyle: t.from ? {
            color: ColorLib.transparentize(t.color || '#D81B60', t.fill ? 0.5 : 0),
            borderType: t.type || 'dashed',
            name: t.name || t.value || 0,
          } : undefined,
          yAxis: t.from || 0,
        }];
      }),
      ...(this.innerOptions.markers || [])
        .filter(t => !!t.fill)
        .map(t => {
          return [{
            itemStyle: {
              color: ColorLib.transparentize(t.color || '#D81B60', t.fill ? t.alpha || 0.5 : 0),
              borderType: t.type || 'dashed',
            },
            label: { color: t.color || '#D81B60', position: 'insideTop', distance: 5, show: !!t.name },
            name: t.name || t.value || 0,
            xAxis: ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0),
          },
            {
              itemStyle: {
                color: ColorLib.transparentize(t.color || '#D81B60', t.fill ? t.alpha || 0.5 : 0),
                borderType: t.type || 'dashed',
              },
              xAxis: ((t.start / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0),
            }];
        }),
    ];

    const markLine = [
      ...(this.innerOptions.thresholds || []).map(t => {
        return {
          name: t.name || t.value || 0,
          label: { color: t.color || '#D81B60', position: 'insideEndTop', formatter: '{b}' },
          lineStyle: { color: t.color || '#D81B60', type: t.type || 'dashed' },
          yAxis: t.value || 0,
        };
      }),
      ...(this.innerOptions.markers || [])
        .filter(t => !t.fill)
        .map((t, i) => {
          return {
            name: t.name || t.value || 'mark-' + i,
            label: {
              color: t.color || '#D81B60',
              position: 'insideEndTop',
              formatter: '{b}',
              show: !!t.name,
            },
            lineStyle: { color: t.color || '#D81B60', type: t.type || 'dashed' },
            xAxis: ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0),
          };
        })];
    if (markArea.length > 0 || markLine.length > 0) {
      (opts.series as SeriesOption[]).push({
        name: '',
        type: 'line',
        symbolSize: 0,
        data: [],
        markArea: { data: markArea },
        markLine: {
          emphasis: { lineStyle: { width: 1 } },
          symbol: ['none', 'none'],
          data: markLine,
        },
      });
    }
    return opts;
  }

  private getYAxis(color?: string, unit?: string): CartesianAxisOption {
    if (!!(unit || this.unit || this.innerOptions.unit) && !!this.myChart) {
      const opts = { ...this.chartOpts };
      if (opts.grid) {
        if ('top' in opts.grid) {
          opts.grid.top = 30;
        }
        setTimeout(() => this.myChart.setOption(opts as EChartsOption, true, false));
      }
    }
    return {
      type: this.innerOptions.yLabelsMapping ? 'category' : 'value',
      name: unit ?? (this.unit !== undefined && this.unit !== '' ? this.unit : this.innerOptions.unit),
      show: !this.innerOptions.hideYAxis,
      nameTextStyle: {
        color: color ?? Utils.getLabelColor(this.el),
        fontSize: this.innerOptions.unitFontSize
      },
      splitLine: { show: false, lineStyle: { color: Utils.getGridColor(this.el) } },
      axisLine: { show: true, lineStyle: { color: color ?? Utils.getGridColor(this.el) } },
      axisLabel: {
        hideOverlap: true,
        color: color ?? Utils.getLabelColor(this.el),
        show: !this.innerOptions.hideYAxis,
        formatter: (x) => {
          // very close to echarts addCommas() source, but with a thin space
          if (typeof x === 'string') {
            return x;
          }
          var parts = (x + '').split('.');
          return parts[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1 ') + (parts.length > 1 ? '.' + parts[1] : '');
        }
      },
      axisTick: { show: true, lineStyle: { color: color ?? Utils.getGridColor(this.el) } },
      data: this.innerOptions.yLabelsMapping ? Object.keys(this.innerOptions.yLabelsMapping).map(k => this.innerOptions.yLabelsMapping[k]) : undefined,
      scale: !(this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0),
      min: (this.innerOptions?.bounds?.yRanges ?? [])[0],
      max: (this.innerOptions?.bounds?.yRanges ?? [])[1],
      ...(this.innerOptions.unitPosition === 'middle' ? {
        nameLocation: "middle",
        nameRotate: 90,
        nameGap: 30,
      } : {})
    };
  }

  private getXAxis(color?: string): CartesianAxisOption {
    return {
      name: this.innerOptions.xUnit ?? '',
      nameTextStyle: {
        color: color ?? Utils.getLabelColor(this.el),
        fontSize: this.innerOptions.xUnitFontSize
      },
      type: this.innerOptions.timeMode === 'date' ? 'time' : 'value',
      show: !this.innerOptions.hideXAxis,
      splitNumber: this.innerOptions.timeMode === 'date' ? undefined : Math.max(Math.floor(Utils.getContentBounds(this.el.parentElement).w / 200) - 1, 1),
      splitLine: { show: false, lineStyle: { color: Utils.getGridColor(this.el) } },
      axisLine: { lineStyle: { color: color ?? Utils.getGridColor(this.el) } },
      axisLabel: {
        hideOverlap: true,
        show: !this.innerOptions.hideXAxis,
        color: color ?? Utils.getLabelColor(this.el),
        formatter: this.innerOptions.fullDateDisplay
          ? (value: number) => GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
            .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
          : undefined,
      },
      axisTick: { lineStyle: { color: color ?? Utils.getGridColor(this.el) } },
      scale: !(this.innerOptions.bounds && (this.innerOptions.bounds.minDate || this.innerOptions.bounds.maxDate)),
      min: this.innerOptions?.bounds?.xRanges && Array.isArray(this.innerOptions?.bounds?.xRanges) && this.innerOptions?.bounds?.xRanges.length === 2
        ? this.innerOptions?.bounds?.xRanges[0]
        : this.innerOptions.bounds?.minDate !== undefined
          ? this.innerOptions.timeMode === 'date'
            ? GTSLib.utcToZonedTime(this.innerOptions.bounds.minDate, this.divider, this.innerOptions.timeZone)
            : this.innerOptions.bounds.minDate
          : undefined,
      max: this.innerOptions?.bounds?.xRanges && Array.isArray(this.innerOptions?.bounds?.xRanges) && this.innerOptions?.bounds?.xRanges.length === 2
        ? this.innerOptions?.bounds?.xRanges[1]
        : this.innerOptions.bounds?.maxDate !== undefined
          ? this.innerOptions.timeMode === 'date'
            ? GTSLib.utcToZonedTime(this.innerOptions.bounds.maxDate, this.divider, this.innerOptions.timeZone)
            : this.innerOptions.bounds.maxDate
          : undefined,
      ...(this.innerOptions.xUnit ? {
        nameLocation: "middle",
        nameGap: 30,
      } : {})
    };
  }

  static getStepShape(type: ChartType) {
    switch (type) {
      case 'line':
      case 'area':
      case 'spline':
        return undefined;
      case 'step':
      case 'step-area':
        return 'end';
      case 'step-before':
        return 'start';
      case 'step-after':
        return 'end';
    }
  }

  private zoomHandler(start: number, end: number) {
    this.zoomXInfo = {
      start,
      end,
      min: this.innerOptions.bounds?.minDate ?? this.bounds?.min,
      max: this.innerOptions.bounds?.maxDate ?? this.bounds?.max,
      orientation: 'x',
    };
    this.dataZoom.emit(this.zoomXInfo);
  }

  private zoomYHandler(start: number, end: number) {
    this.zoomYInfo = {
      start,
      end,
      min: this.innerOptions.bounds?.minDate ?? this.bounds?.min,
      max: this.innerOptions.bounds?.maxDate ?? this.bounds?.max,
      orientation: 'y',
    };
    this.dataZoomY.emit(this.zoomYInfo);
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    const zoomHandler = throttle((start: number, end: number) => this.zoomHandler(start, end),
      16, { leading: true, trailing: true });
    const zoomYHandler = throttle((start: number, end: number) => this.zoomYHandler(start, end),
      16, { leading: true, trailing: true });

    const focusHandler = throttle((type: string, event: any) => {
        if (this.hasFocus) {
          switch (type) {
            case 'mouseover':
              const c = event.data.coord || event.data;
              this.dataPointOver.emit({ date: c[0], name: event.seriesName, value: c[1], meta: {} });
              break;
            case 'highlight':
              let ts: number;
              for (const b of (event.batch ?? [])) {
                const s = (this.myChart.getOption() as EChartsOption).series[b.seriesIndex];
                ts = s.data[b.dataIndex][0];
                ts = this.innerOptions.timeMode === 'date'
                  ? GTSLib.zonedTimeToUtc(ts * this.divider, this.divider, this.innerOptions.timeZone || 'UTC') * this.divider
                  : ts;
              }
              if (ts !== undefined) {
                this.dataPointOver.emit({ date: ts, name: '.*', meta: {} });
              }
              break;
            default:
              break;
          }
        }
      },
      200, { leading: true, trailing: true });

    setTimeout(() => {
      this.parsing = false;
      this.rendering = true;
      this.myChart = init(this.graph, null, { renderer: 'canvas' });
      let initial = false;
      this.myChart.on('rendered', () => {
        this.rendering = false;
        let found = false;
        let x = 0;
        setTimeout(() => {
          while (!found && x < 1024) {
            found = this.myChart.containPixel({ gridIndex: 0 }, [x, this.myChart.getHeight() / 2]);
            x++;
          }
          if (this.leftMargin !== x && x < 1024) {
            setTimeout(() => {
              this.leftMarginComputed.emit(x);
              this.leftMargin = x;
            });
          }
          if (initial) setTimeout(() => this.draw.emit());
          initial = false;
        });
      });
      this.myChart.on('dataZoom', () => {
        const option = this.myChart.getOption();
        const sliders = (option.dataZoom as any[] ?? []).filter(z => z.type === 'inside');
        sliders.forEach(s => {
          if (s.orient === 'horizontal') {
            zoomHandler(s.start, s.end);
          } else {
            zoomYHandler(s.start, s.end);
          }
        });
      });
      this.myChart.on('restore', () => {
        this.dataZoom.emit({ type: 'restore', start: 0, end: 100 });
      });
      this.el.addEventListener('dblclick', () => this.myChart.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100,
      }));
      this.el.addEventListener('mouseover', () => this.hasFocus = true);
      this.el.addEventListener('mouseout', () => {
        this.hasFocus = false;
        this.dataPointOver.emit({});
      });
      this.myChart.on('mouseout', () => {
        this.dataPointOver.emit({});
      });
      this.myChart.on('mouseover', (event: any) => focusHandler('mouseover', event));
      this.myChart.on('highlight', (event: any) => focusHandler('highlight', event));
      this.myChart.on('click', (event: any) => {
        const c = event.data.coord || event.data;
        const date = this.innerOptions.timeMode === 'date'
          ? GTSLib.zonedTimeToUtc(c[0], 1, this.innerOptions.timeZone) * this.divider
          : c[0];
        if (event.componentType !== 'markLine') {
          this.dataPointSelected.emit({ date, name: GTSLib.getName(event.seriesName), value: c[1], meta: {} });
        }
        if (this.innerOptions.poi) {
          if (this.pois.find(p => p.date === date)) {
            this.pois = this.pois.filter(p => p.date !== date);
          } else if (event.componentType !== 'markLine') {
            this.pois.push({
              date,
              name: GTSLib.getName(event.seriesName),
              value: c[1],
              meta: {},
              uid: v4(),
            });
          }
          this.chartOpts.series = (this.chartOpts.series as SeriesOption[]).filter(s => 'poi' !== s.id);
          this.poi.emit(this.pois);
          (this.chartOpts.series as SeriesOption[]).push({
            name: '',
            id: 'poi',
            type: 'line',
            data: [],
            markLine: {
              emphasis: { lineStyle: { width: 1 } },
              symbol: ['none', 'pin'],
              symbolSize: 20,
              symbolKeepAspect: true,
              data: this.pois.map(p => {
                return {
                  name: 'poi-' + p.uid,
                  label: { show: false },
                  lineStyle: { color: this.innerOptions.poiColor, type: this.innerOptions.poiLine },
                  xAxis: this.innerOptions.timeMode === 'date'
                    ? GTSLib.utcToZonedTime(p.date / this.divider, 1, this.innerOptions.timeZone)
                    : p.date,
                };
              }),
            },
          });
          setTimeout(() => this.myChart.setOption(this.chartOpts ?? {}, true, false));
        }
      });
      setTimeout(() => this.myChart.setOption(this.chartOpts ?? {}, true, false));
      initial = true;
    });
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    const width = dims.w - 4;
    const height = dims.h;
    if (this.myChart && (this.innerWidth !== width || this.innerHeight !== dims.h)) {
      this.innerWidth = width;
      this.innerHeight = this.innerHeight !== dims.h ? height - this.el.parentElement.offsetTop : this.innerHeight;
      this.myChart.resize({ width: this.innerWidth, height: this.innerHeight, silent: true });
    }
    return Promise.resolve();
  }

  @Method()
  async setZoom(dataZoom: { start?: number, end?: number }) {
    if (this.myChart) {
      dataZoom.start = dataZoom.start ?? 0;
      if (this.zoom?.start !== dataZoom.start || this.zoom?.end !== dataZoom.end) {
        this.zoom = dataZoom;
        this.myChart.dispatchAction({ type: 'dataZoom', ...dataZoom, dataZoomIndex: 0 });
      }
    }
    return Promise.resolve();
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png'): Promise<string> {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({
      type,
      excludeComponents: ['toolbox'],
    }) : undefined);
  }

  @Method()
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[])
        .filter(s => new RegExp(regexp).test(GTSLib.getName(s.name))),
    });
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[])
        .filter(s => new RegExp(regexp).test(GTSLib.getName(s.name))),
    });
    return Promise.resolve();
  }

  @Method()
  async hideById(id: number | string) {
    if (this.myChart) {
      this.myChart.dispatchAction({
        type: 'legendUnSelect',
        batch: (this.myChart.getOption().series as any[])
          .filter((s, i) => new RegExp(id.toString()).test((s.id || i).toString())),
      });
    }
    return Promise.resolve();
  }

  @Method()
  async showById(id: number | string) {
    if (this.myChart) {
      this.myChart.dispatchAction({
        type: 'legendSelect',
        batch: (this.myChart.getOption().series as any[])
          .filter((s, i) => new RegExp(id.toString()).test((s.id || i).toString())),
      });
    }
    return Promise.resolve();
  }

  @Method()
  async setFocus(regexp: string, ts: number, value?: number) {
    if (!this.myChart || this.hasFocus) return;
    const date = this.innerOptions.timeMode === 'date'
      ? GTSLib.utcToZonedTime(ts || 0, this.divider, this.innerOptions.timeZone)
      : ts || 0;
    let seriesIndex = 0;
    let dataIndex = 0;
    if (regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(s.name))
        .forEach(s => {
          const data = s.data.filter((d: number[]) => d[0] === date);
          if (data && data.length > 0 && data[0]) {
            seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
            dataIndex = s.data.indexOf(data[0]);
            s.markPoint = {
              symbol: 'circle', data: [{
                symbolSize: 5,
                name: s.name,
                itemStyle: { color: '#fff', borderColor: s.lineStyle.color },
                yAxis: data[0][1],
                xAxis: date,
              }],
            };
          }
        });
    }
    if (GTSLib.isArray(this.chartOpts.xAxis)) {
      (this.chartOpts.xAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer || {}, value: date, status: 'show' });
    } else {
      (this.chartOpts.xAxis as any).axisPointer = {
        ...(this.chartOpts.xAxis as any).axisPointer || {},
        value: date,
        status: 'show',
      };
    }
    if (GTSLib.isArray(this.chartOpts.yAxis)) {
      (this.chartOpts.yAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer || {}, value: value || 0, status: 'show' });
    } else {
      (this.chartOpts.yAxis as any).axisPointer = {
        ...(this.chartOpts.yAxis as any).axisPointer || {},
        value: value || 0,
        status: 'show',
      };
    }
    (this.chartOpts.tooltip as any).show = true;
    this.myChart.dispatchAction({ type: 'showTip', seriesIndex, dataIndex });
    this.setOpts();
    return Promise.resolve();
  }

  @Method()
  async unFocus() {
    if (!this.myChart || this.hasFocus) return;
    (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
    if (GTSLib.isArray(this.chartOpts.xAxis)) {
      (this.chartOpts.xAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer || {}, status: 'hide' });
    } else {
      (this.chartOpts.xAxis as any).axisPointer = {
        ...(this.chartOpts.xAxis as any).axisPointer || {},
        status: 'hide',
      };
    }
    if (GTSLib.isArray(this.chartOpts.yAxis)) {
      (this.chartOpts.yAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer || {}, status: 'hide' });
    } else {
      (this.chartOpts.yAxis as any).axisPointer = {
        ...(this.chartOpts.yAxis as any).axisPointer || {},
        status: 'hide',
      };
    }
    this.myChart.dispatchAction({ type: 'hideTip' });
    this.setOpts();
    return Promise.resolve();
  }

  private hideMarkers() {
    if (!!this.myChart && ((this.chartOpts?.series ?? []) as any[]).some(s => !!s.markPoint)) {
      ((this.chartOpts?.series ?? []) as any[]).forEach(s => s.markPoint = undefined);
      this.setOpts();
    }
  }

  render() {
    return <div>
      {this.parsing && !!this.innerOptions?.showLoader ?
        <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el} onMouseOver={() => this.hideMarkers()}></div>
    </div>;
  }

  private buildSeriesData(data: DataModel): {
    series: any[],
    categories: string[],
    unit: string,
    isColumnsFormat: boolean,
    columns?: string[],
    rows?: any[][]
  } {
    const series = [];
    const unit = this.unit || this.innerOptions?.unit || "";

    if (!Array.isArray(data.data)) {
      return {series: [], categories: [], unit, isColumnsFormat: false};
    }

    if (data.data[0] && data.data[0].columns) {
      return {
        series: [],
        categories: [],
        unit,
        isColumnsFormat: true,
        columns: data.data[0].columns,
        rows: data.data[0].rows
      };
    }

    const gtsList = [
      ...GTSLib.flattenGtsIdArray(GTSLib.flatDeep([data.data] as any[]), 0).res,
      ...GTSLib.flatDeep([data.data] as any[]).filter(g => !!g && g.values && g.label),
    ];

    gtsList.forEach((gts) => {
      let name = 'Série';
      if (data.params && data.params[gts.id] && data.params[gts.id].key) {
        name = data.params[gts.id].key;
      } else if (gts.l && Object.keys(gts.l).length > 0 && gts.c) {
        const labels = Object.entries(gts.l).map(([k, v]) => `${k}=${v}`).join(',');
        name = `${gts.c}{${labels}}`;
      } else if (gts.c) {
        name = gts.c;
      } else if (gts.id !== undefined && gts.id !== null) {
        name = `Série ${gts.id}`;
      }
      const dataMap = {};
      (gts.v || []).forEach((point) => {
        const ts = point[0];
        dataMap[ts] = point[point.length - 1];
      });
      series.push({name, dataMap});
    });

    if (series.length === 0) {
      return {series: [], categories: [], unit, isColumnsFormat: false};
    }

    const categoriesSet = new Set<string>();
    series.forEach((s) => {
      for (const ts in s.dataMap) {
        if (s.dataMap.hasOwnProperty(ts)) {
          categoriesSet.add(ts);
        }
      }
    });

    const categories = Array.from(categoriesSet).sort((a, b) => {
      return Number(a) - Number(b);
    });

    return {series, categories, unit, isColumnsFormat: false};
  }

  dataToCSV(data: DataModel): string {
    let csv = "";
    const {series, categories, unit, isColumnsFormat, columns, rows} = this.buildSeriesData(data);

    if (isColumnsFormat && columns && rows) {
      csv += ";";
      columns.forEach((column) => {
        csv += column + (unit ? ' (' + unit + ')' : '') + ";";
      });
      csv += "\n";
      rows.forEach((row) => {
        row.forEach((cell) => {
          if (typeof cell === "number") {
            csv += cell.toString().replace(".", ",") + ";";
          } else {
            csv += cell + ";";
          }
        });
        csv += "\n";
      });
      return csv;
    }

    csv = ";";

    if (series.length === 0) {
      return csv;
    }

    series.forEach((s) => {
      csv += s.name + (unit ? ' (' + unit + ')' : '') + ";";
    });
    csv += "\n";

    categories.forEach((category) => {
      const ts = Number(category);
      const formattedDate = this.innerOptions.timeMode === 'date'
        ? GTSLib.toISOString(ts, this.divider, this.innerOptions.timeZone)
        : category;
      csv += formattedDate + ";";
      series.forEach((s) => {
        const value = s.dataMap[category];
        if (typeof value === "number") {
          csv += value.toString().replace(".", ",") + ";";
        } else if (value !== null && value !== undefined) {
          csv += value + ";";
        } else {
          csv += ";";
        }
      });
      csv += "\n";
    });

    return csv;
  }

  dataToHTMLTable(data: DataModel): string {
    const {series, categories, unit, isColumnsFormat, columns, rows} = this.buildSeriesData(data);

    const textColor = Utils.getCSSColor(this.el, '--warp-view-data-view-text-color', 'black');
    const textAreaColor = Utils.getCSSColor(this.el, '--warp-view-data-view-text-area-color', 'white');
    const textAreaBorderColor = Utils.getCSSColor(this.el, '--warp-view-data-view-text-area-border-color', '#ccc');

    let table = `<div style="padding: 16px;"><table style="width:100%; border-collapse: collapse; color: ${textColor}; background-color: ${textAreaColor};">`;
    table += `<thead><tr style="border-bottom: 2px solid ${textAreaBorderColor};">`;

    if (isColumnsFormat && columns && rows) {
      table += `<th style="text-align:left; padding: 12px 16px; color: ${textColor};"></th>`;
      columns.forEach((column) => {
        table += `<th style="text-align:left; padding: 12px 16px; color: ${textColor};">${column}${unit ? ' (' + unit + ')' : ''}</th>`;
      });
      table += '</tr></thead><tbody>';

      rows.forEach((row) => {
        table += `<tr style="border-bottom: 1px solid ${textAreaBorderColor};">`;
        row.forEach((cell) => {
          let formatted = '';
          if (typeof cell === 'number') {
            formatted = cell.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 2});
          } else {
            formatted = String(cell);
          }
          table += `<td style="text-align:left; padding: 12px 16px; color: ${textColor};">${formatted}</td>`;
        });
        table += '</tr>';
      });

      table += '</tbody></table></div>';
      return table;
    }

    if (series.length === 0) {
      return '<p>Aucune donnée à afficher</p>';
    }

    table += `<th style="text-align:left; padding: 12px 16px; color: ${textColor};">Timestamp</th>`;

    series.forEach((s) => {
      table += `<th style="text-align:right; padding: 12px 16px; color: ${textColor};">${s.name}${unit ? ' (' + unit + ')' : ''}</th>`;
    });
    table += '</tr></thead><tbody>';

    categories.forEach((category) => {
      const ts = Number(category);
      const formattedDate = this.innerOptions.timeMode === 'date'
        ? (GTSLib.toISOString(ts, this.divider, this.innerOptions.timeZone,
          this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined) ?? '')
          .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
        : category;
      table += `<tr style="border-bottom: 1px solid ${textAreaBorderColor};">`;
      table += `<td style="text-align:left; padding: 12px 16px; white-space: nowrap; color: ${textColor};">${formattedDate}</td>`;

      series.forEach((s) => {
        const value = s.dataMap[category];
        let formatted = '';
        if (typeof value === 'number') {
          formatted = value.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 2});
        } else if (value !== null && value !== undefined) {
          formatted = String(value);
        }
        table += `<td style="text-align:right; padding: 12px 16px; color: ${textColor};">${formatted}</td>`;
      });
      table += '</tr>';
    });

    table += '</tbody></table></div>';
    return table;
  }
}
