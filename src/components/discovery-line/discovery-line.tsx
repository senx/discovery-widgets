/*
 *   Copyright 2022-2023  SenX S.A.S.
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams, EChartsOption, init} from 'echarts';
import {GTSLib} from '../../utils/gts.lib';
import {SeriesOption} from 'echarts/lib/util/types';
import {ColorLib} from '../../utils/color-lib';
import {Utils} from '../../utils/utils';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {ChartType, DataModel, ECharts} from '../../model/types';
import {CartesianAxisOption} from 'echarts/lib/coord/cartesian/AxisModel';
import {GridOption} from 'echarts/lib/coord/cartesian/GridModel';
import 'moment/min/locales.js';
import _ from 'lodash';

@Component({
  tag: 'discovery-line',
  styleUrl: 'discovery-line.scss',
  shadow: true,
})
export class DiscoveryLineComponent {

  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = {...new Param(), timeMode: 'date'};
  @State() @Prop() width: number;
  @State() @Prop() height: number;
  @Prop() debug = false;
  @Prop() unit = '';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start?: number, end?: number, min?: number, max?: number, type?: string }>;
  @Event() leftMarginComputed: EventEmitter<number>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;
  @Event() timeBounds: EventEmitter;

  @State() parsing = false;
  @State() rendering = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private wrap: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = {...new Param(), timeMode: 'date', xCursor: true, yCursor: false};
  private LOG: Logger;
  private divider = 1000;
  private myChart: ECharts;
  private leftMargin = 0;
  private hasFocus = false;
  private bounds: { min: number; max: number };
  private zoom: { start?: number; end?: number };

  @Watch('type')
  updateType(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.chartOpts = this.convert(this.result as DataModel || new DataModel());
      this.setOpts();
    }
  }

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.result = GTSLib.getData(this.result);
      this.chartOpts = this.convert(this.result || new DataModel());
      this.setOpts(true);
    }
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      if (!!this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        this.setOpts(true);
      }
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLineComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
    });
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.chartOpts = this.convert(this.result || new DataModel());
    this.setOpts();
  }

  setOpts(notMerge = false) {
    if ((this.chartOpts.series as SeriesOption[]).length === 0) {
      this.chartOpts.title = {
        show: true,
        textStyle: {color: Utils.getLabelColor(this.el), fontSize: 20},
        text: this.innerOptions.noDataLabel || '',
        left: 'center',
        top: 'center'
      };
      this.chartOpts.xAxis = {show: false};
      this.chartOpts.yAxis = {show: false};
      this.chartOpts.dataZoom = {show: false};
      this.chartOpts.tooltip = {show: false};
    } else {
      this.chartOpts.title = {...this.chartOpts.title || {}, show: false};
    }
    setTimeout(() => {
      if (this.myChart) {
        this.myChart.setOption(this.chartOpts || {}, notMerge, true);
      }
    });
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = {...options};
    this.innerOptions.timeMode = this.innerOptions.timeMode || 'date';
    let gtsList;
    if (GTSLib.isArray(data.data)) {
      data.data = GTSLib.flatDeep(data.data as any[]);
      this.LOG?.debug(['convert', 'isArray']);
      if (data.data.length > 0 && GTSLib.isGts(data.data[0])) {
        this.LOG?.debug(['convert', 'isArray 2']);
        gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
      } else {
        this.LOG?.debug(['convert', 'isArray 3']);
        gtsList = data.data as any[];
      }
    } else {
      this.LOG?.debug(['convert', 'not array']);
      gtsList = [data.data];
    }
    this.LOG?.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let multiY = false;
    let multiX = false;
    const opts: EChartsOption = {
      animation: false,
      grid: {
        left: (!!this.innerOptions.leftMargin && this.innerOptions.leftMargin > this.leftMargin)
          ? this.innerOptions.leftMargin - this.leftMargin + 10
          : 10,
        top: !!(this.unit || this.innerOptions.unit) ? 30 : 10,
        bottom: (!!this.innerOptions.showLegend ? 30 : 10) + (!!this.innerOptions.showRangeSelector ? 40 : 0),
        right: 10,
        containLabel: true,
      },
      responsive: true,
      throttle: 70,
      tooltip: {
        transitionDuration: 0,
        trigger: 'axis',
        formatter: (params) => {
          return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
            this.innerOptions.timeMode === 'timestamp'
              ? params[0].value[0]
              : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].value[0], 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined) || '')
                .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}</div>
               ${params.map(s => `${s.marker} <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${s.seriesName}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${s.value[1]}</span>`
          ).join('<br>')}`;
        },
        axisPointer: {
          type: !!this.innerOptions.yCursor && !!this.innerOptions.xCursor ? 'cross' : !!this.innerOptions.yCursor || !!this.innerOptions.xCursor ? 'line' : 'none',
          axis: !!this.innerOptions.yCursor ? 'y' : 'x',
          animation: false,
          lineStyle: !this.innerOptions.yCursor && !this.innerOptions.xCursor
            ? undefined
            : {
              color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red')
            },
          crossStyle: !!this.innerOptions.yCursor
            ? {
              color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red')
            }
            : undefined
        },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay || 100,
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']},
          restore: {show: true},
        }
      },
      legend: {
        bottom: 0, left: 'center', show: !!this.innerOptions.showLegend, height: 30, type: 'scroll',
        textStyle: {color: Utils.getLabelColor(this.el)},
      },
      dataZoom: [
        {
          type: 'inside',
          filterMode: 'none',
          orient: 'horizontal',
          zoomOnMouseWheel: true,
        },
        {
          type: 'slider',
          height: '20px',
          show: !!this.innerOptions.showRangeSelector,
          bottom: !!this.innerOptions.showLegend ? 30 : 20,
          filterMode: 'none'
        },
        {
          type: 'inside',
          filterMode: 'none',
          orient: 'vertical',
          zoomOnMouseWheel: 'ctrl',
        }
      ],
      visualMap: new Array(gtsCount),
      series: [],
      ...this.innerOptions?.extra?.chartOpts || {}
    };
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let hasTimeBounds = false;

    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts)) {
        min = Math.min(min, ...gts.v.map(v => v[0]));
        max = Math.max(max, ...gts.v.map(v => v[0]));
      }
    }
    if (max <= 1000 && min >= -1000 && min !== Number.MAX_SAFE_INTEGER && max !== Number.MIN_SAFE_INTEGER) {
      this.innerOptions.timeMode = 'timestamp';
    }
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts)) {
        const c = ColorLib.getColor(gts.id, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        const type = ((data.params || [])[i] || {type: this.type}).type || this.type;
        if (!!data.params && !!data.params[i] && (data.params[i].pieces || []).length > 0) {
          (opts.visualMap as any[])[i] = {
            show: false,
            seriesIndex: i,
            dimension: !!data.params[i].xpieces ? 0 : 1,
            pieces: GTSLib.flatDeep((data.params[i].pieces || []).map(t => {
              return [
                {color, lte: t.gte},
                {color: t.color || '#D81B60', lte: t.lte, gte: t.gte},
                {color, gte: t.lte},
              ]
            }))
          };
        }
        hasTimeBounds = true;
        const s = {
          type: type === 'scatter' || gts.v.length <= 1 ? 'scatter' : ['scatter', 'line', 'bar'].includes(type) ? type : 'line',
          name: ((data.params ?? [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [
            this.innerOptions.timeMode === 'date'
              ? GTSLib.utcToZonedTime(d[0], this.divider, this.innerOptions.timeZone)
              : d[0]
            , d[d.length - 1]
          ]),
          id: gts.id,
          animation: false,
          large: true,
          showSymbol: this.type === 'scatter' || this.innerOptions.showDots || this.innerOptions.showValues,
          symbolSize: this.innerOptions.dotSize ?? 10,
          smooth: type === 'spline' || type === 'spline-area' ? 0.2 : undefined,
          clip: true,
          step: DiscoveryLineComponent.getStepShape(type),
          areaStyle: type === 'area' || type === 'step-area' || type === 'spline-area' ? {
            opacity: 0.8,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                {offset: 0, color: ColorLib.transparentize(color, 0.7)},
                {offset: 1, color: ColorLib.transparentize(color, 0.1)}
              ],
              global: false // false by default
            }
          } : undefined,
          showAllSymbol: false,
          label: {
            show: !!this.innerOptions.showValues,
            position: 'top',
            textStyle: {color: Utils.getLabelColor(this.el), fontSize: 14},
          },
          lineStyle: {
            color: !opts.visualMap[i] ? color : undefined,
            width: this.innerOptions.strokeWidth ?? 2
          },
          itemStyle: type === 'bar' ? {
            opacity: 0.8,
            borderColor: color,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                {offset: 0, color: ColorLib.transparentize(color, 0.7)},
                {offset: 1, color: ColorLib.transparentize(color, 0.3)}
              ]
            }
          } : {color}
        } as SeriesOption;
        if (!!data.params) {
          // multi Y
          if (!!data.params[i] && data.params[i].yAxis !== undefined) {
            multiY = true;
            if (data.params[i].yAxis > 0) {
              (s as any).yAxisIndex = data.params[i].yAxis;
              const y = this.getYAxis(color, data.params[i].unit);
              (y as any).position = 'right';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[data.params[i].yAxis] = y;
            } else {
              const y = this.getYAxis(color, data.params[i].unit);
              (y as any).position = 'left';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[0] = y;
            }
          } else if (multiY) {
            const y = this.getYAxis(undefined, data.params[i].unit);
            (y as any).position = 'left';
            if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
            (opts.yAxis as any)[0] = y;
          }

          // multi X
          if (!!data.params[i] && data.params[i].xAxis !== undefined) {
            multiX = true;
            if (data.params[i].xAxis > 0) {
              (s as any).xAxisIndex = data.params[i].xAxis;
              const x = this.getXAxis(color);
              (x as any).position = 'top';
              if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
              (opts.xAxis as CartesianAxisOption)[data.params[i].xAxis] = x;
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
        const c = ColorLib.getColor(i, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        const smax = Math.max(...gts.values.map(l => l[2] || 1)) || 1;
        const smin = Math.min(...gts.values.map(l => l[2] || 0)) || 0;
        const isBubble = smax !== smin;
        const s = {
          type: this.type,
          name: gts.label,
          id: gts.id,
          data: gts.values[0] && gts.values[0].length === 3
            ? (gts.values ?? []).map(v => ({
              value: [GTSLib.utcToZonedTime(v[0], 1, this.innerOptions.timeZone), v[1]],
              symbolSize: isBubble ? (50 * v[2] / (smax - smin)) || this.innerOptions.dotSize || 10 : this.innerOptions.dotSize || 10
            }))
            : gts.values,
          animation: false,
          large: true,
          showSymbol: true,
          label: {
            show: !!this.innerOptions.showValues,
            position: 'top',
            textStyle: {color: Utils.getLabelColor(this.el), fontSize: 14},
          },
          itemStyle: isBubble || this.innerOptions.dotSize > 10 ? {
            opacity: 0.8,
            borderColor: color,
            borderWidth: this.innerOptions.strokeWidth,
            color: gts.values[0] && gts.values[0].length === 3
              ? {
                type: 'radial', x: 0.5, y: 0.5, x2: 1, y2: 1,
                colorStops: [
                  {offset: 0, color: ColorLib.transparentize(color, 0.3)},
                  {offset: 1, color: ColorLib.transparentize(color, 0.7)}
                ]
              }
              : color,
          } : {color}
        } as SeriesOption;
        if (!!data.params) {
          // multi Y
          if (!!data.params[i] && data.params[i].yAxis !== undefined) {
            multiY = true;
            if (data.params[i].yAxis > 0) {
              (s as any).yAxisIndex = data.params[i].yAxis;
              const y = this.getYAxis(color, data.params[i].unit);
              (y as any).position = 'right';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[data.params[i].yAxis] = y;
            } else {
              const y = this.getYAxis(color, data.params[i].unit);
              (y as any).position = 'left';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[0] = y;
            }
          } else if (multiY) {
            const y = this.getYAxis(undefined, data.params[i].unit);
            (y as any).position = 'left';
            if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
            (opts.yAxis as any)[0] = y;
          }

          // multi X
          if (!!data.params[i] && data.params[i].xAxis !== undefined) {
            multiX = true;
            if (data.data[i].length > 0) {
              if (data.params[i].xAxis > 0) {
                (s as any).xAxisIndex = data.params[i].xAxis;
                const x = this.getXAxis(color);
                (x as any).position = 'top';
                if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
                (opts.xAxis as CartesianAxisOption)[data.params[i].xAxis] = x;
              } else {
                const x = this.getXAxis(color);
                (x as any).position = 'bottom';
                if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
                (opts.xAxis as CartesianAxisOption)[0] = x;
              }
            }
          } else if (multiX) {
            if (data.params[i].xAxis > 0) {
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
    (this.innerOptions.polygons || []).forEach((polygon, i) => {
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
            shape: {points: polygon.shape.map(p => api.coord(p))},
            style: api.style({fill: !!polygon.fill ? ColorLib.transparentize(color) : undefined, stroke: color})
          };
        },
        clip: true,
        data: polygon.shape
      };
      (opts.series as any[]).push(s);
    });
    if (hasTimeBounds) {
      this.timeBounds.emit({min, max});
      this.bounds = {min, max};
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
    this.LOG?.debug(['convert', 'opts'], {opts});
    const markArea = [...(this.innerOptions.thresholds || [])
      .filter(t => !!t.fill)
      .map(t => {
        return [{
          itemStyle: {
            color: ColorLib.transparentize(t.color || '#D81B60', !!t.fill ? 0.5 : 0),
            borderType: t.type || 'dashed',
            name: t.name || t.value || 0,
          },
          yAxis: t.value || 0
        }, {yAxis: 0}];
      }),
      ...(this.innerOptions.markers || [])
        .filter(t => !!t.fill)
        .map(t => {
          return [{
            itemStyle: {
              color: ColorLib.transparentize(t.color || '#D81B60', !!t.fill ? t.alpha || 0.5 : 0),
              borderType: t.type || 'dashed'
            },
            label: {color: t.color || '#D81B60', position: 'insideTop', distance: 5, show: !!t.name},
            name: t.name || t.value || 0,
            xAxis: ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0)
          },
            {
              itemStyle: {
                color: ColorLib.transparentize(t.color || '#D81B60', !!t.fill ? t.alpha || 0.5 : 0),
                borderType: t.type || 'dashed'
              },
              xAxis: ((t.start / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0)
            }];
        })
    ];

    const markLine = [
      ...(this.innerOptions.thresholds || []).map(t => {
        return {
          name: t.name || t.value || 0,
          label: {color: t.color || '#D81B60', position: 'insideEndTop', formatter: '{b}'},
          lineStyle: {color: t.color || '#D81B60', type: t.type || 'dashed'},
          yAxis: t.value || 0
        }
      }),
      ...(this.innerOptions.markers || [])
        .filter(t => !t.fill)
        .map(t => {
          return {
            name: t.name || t.value || 0,
            label: {color: t.color || '#D81B60', position: 'insideEndTop', formatter: '{b}', show: !!t.name},
            lineStyle: {color: t.color || '#D81B60', type: t.type || 'dashed'},
            xAxis: ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0)
          }
        })];
    if (markArea.length > 0 || markLine.length > 0) {
      (opts.series as SeriesOption[]).push({
        name: '',
        type: 'line',
        symbolSize: 0,
        data: [],
        markArea: {data: markArea},
        markLine: {
          emphasis: {lineStyle: {width: 1}},
          symbol: ['none', 'none'],
          data: markLine
        }
      });
    }
    return opts;
  }

  private getYAxis(color?: string, unit?: string): CartesianAxisOption {
    if (!!(unit || this.unit || this.innerOptions.unit) && !!this.myChart) {
      const opts = {...this.chartOpts};
      if (opts.grid) {
        if ('top' in opts.grid) {
          opts.grid.top = 30;
        }
        setTimeout(() => this.myChart.setOption(opts as EChartsOption, true, false));
      }
    }
    return {
      type: this.innerOptions.yLabelsMapping ? 'category' : 'value',
      name: unit || this.unit || this.innerOptions.unit,
      show: !this.innerOptions.hideYAxis,
      nameTextStyle: {color: color || Utils.getLabelColor(this.el)},
      splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
      axisLine: {show: true, lineStyle: {color: color || Utils.getGridColor(this.el)}},
      axisLabel: {color: color || Utils.getLabelColor(this.el), show: !this.innerOptions.hideYAxis,},
      axisTick: {show: true, lineStyle: {color: color || Utils.getGridColor(this.el)}},
      data: this.innerOptions.yLabelsMapping ? Object.keys(this.innerOptions.yLabelsMapping).map(k => this.innerOptions.yLabelsMapping[k]) : undefined,
      scale: !(this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0),
      min: this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[0] : undefined,
      max: this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[1] : undefined,
    }
  }

  private getXAxis(color?: string): CartesianAxisOption {
    return {
      type: this.innerOptions.timeMode === 'date' ? 'time' : 'value',
      show: !this.innerOptions.hideXAxis,
      splitNumber: this.innerOptions.timeMode === 'date' ? undefined : Math.max(Math.floor(Utils.getContentBounds(this.el.parentElement).w / 200) - 1, 1),
      splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
      axisLine: {lineStyle: {color: color || Utils.getGridColor(this.el)}},
      axisLabel: {
        show: !this.innerOptions.hideXAxis,
        color: color || Utils.getLabelColor(this.el),
        formatter: this.innerOptions.fullDateDisplay
          ? value => GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
            .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
          : undefined
      },
      axisTick: {lineStyle: {color: color || Utils.getGridColor(this.el)}},
      scale: !(this.innerOptions.bounds && (!!this.innerOptions.bounds.minDate || !!this.innerOptions.bounds.maxDate)),
      min: this.innerOptions.bounds?.minDate !== undefined
        ? this.innerOptions.timeMode === 'date'
          ? GTSLib.utcToZonedTime(this.innerOptions.bounds.minDate, this.divider, this.innerOptions.timeZone)
          : this.innerOptions.bounds.minDate
        : undefined,
      max: this.innerOptions.bounds?.maxDate !== undefined
        ? this.innerOptions.timeMode === 'date'
          ? GTSLib.utcToZonedTime(this.innerOptions.bounds.maxDate, this.divider, this.innerOptions.timeZone)
          : this.innerOptions.bounds.maxDate
        : undefined,
    }
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

  private zoomHandler(start, end) {
    this.dataZoom.emit({
      start,
      end,
      min: this.innerOptions.bounds?.minDate || this.bounds?.min,
      max: this.innerOptions.bounds?.maxDate || this.bounds?.max
    });
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    const zoomHandler = _.throttle((start: number, end: number) => this.zoomHandler(start, end),
      16, {leading: true, trailing: true});

    const focusHandler = _.throttle((type: string, event: any) => {
        if (this.hasFocus) {
          switch (type) {
            case 'mouseover':
              const c = event.data.coord || event.data;
              this.dataPointSelected.emit({date: c[0], name: event.seriesName, value: c[1], meta: {}})
              break;
            case 'highlight':
              let ts;
              (event.batch || []).forEach(b => {
                const s = (this.myChart.getOption() as EChartsOption).series[b.seriesIndex];
                ts = s.data[b.dataIndex][0];
                ts = this.innerOptions.timeMode === 'date'
                  ? GTSLib.zonedTimeToUtc(ts * this.divider, this.divider, this.innerOptions.timeZone || 'UTC') * this.divider
                  : ts;
              });
              if (ts !== undefined) {
                this.dataPointOver.emit({date: ts, name: '.*', meta: {}});
              }
              break;
            default:
              break;
          }
        }
      },
      100, {leading: true, trailing: true});

    setTimeout(() => {
      this.parsing = false
      this.rendering = true;
      this.myChart = init(this.graph, {locale: this.innerOptions.timeZone || 'UTC'});
      let initial = false;
      this.myChart.on('rendered', () => {
        this.rendering = false;
        let found = false;
        let x = 0;
        setTimeout(() => {
          while (!found && x < 1024) {
            found = this.myChart.containPixel({gridIndex: 0}, [x, this.myChart.getHeight() / 2]);
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
      this.myChart.on('dataZoom', (event: any) => {
        let start;
        let end;
        if (!!event.batch) {
          const batch = (event.batch || [])[0] || {};
          start = batch.start || batch.startValue;
          end = batch.end || batch.endValue;
          this.zoomHandler(start, end);
        } else if (event.start !== undefined && event.end !== undefined) {
          start = event.start;
          end = event.end;
          zoomHandler(start, end)
        }
      });
      this.myChart.on('restore', () => {
        this.dataZoom.emit({type: 'restore', start: 0, end: 100})
      });
      this.el.addEventListener('dblclick', () => this.myChart.dispatchAction({type: 'restore'}));
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
        this.dataPointSelected.emit({date: c[0], name: event.seriesName, value: c[1], meta: {}});
      });
      this.myChart.setOption(this.chartOpts || {}, true, false);
      initial = true;
    });
  }

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
    return Promise.resolve();
  }

  @Method()
  async setZoom(dataZoom: { start?: number, end?: number }) {
    if (!!this.myChart) {
      dataZoom.start = dataZoom.start || 0;
      if (this.zoom?.start !== dataZoom.start || this.zoom?.end !== dataZoom.end) {
        this.zoom = dataZoom;
        this.myChart.dispatchAction({type: 'dataZoom', ...dataZoom, dataZoomIndex: 0});
      }
    }
    return Promise.resolve();
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png'): Promise<string> {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined);
  }

  @Method()
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  @Method()
  async hideById(id: number | string) {
    if (this.myChart) {
      this.myChart.dispatchAction({
        type: 'legendUnSelect',
        batch: (this.myChart.getOption().series as any[])
          .filter((s, i) => new RegExp(id.toString()).test((s.id || i).toString()))
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
          .filter((s, i) => new RegExp(id.toString()).test((s.id || i).toString()))
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
    if (!!regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(s.name))
        .forEach(s => {
          const data = s.data.filter(d => d[0] === date);
          if (data && data.length > 0 && data[0]) {
            seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
            dataIndex = s.data.indexOf(data[0])
            s.markPoint = {
              symbol: 'circle', data: [{
                symbolSize: 5,
                name: s.name,
                itemStyle: {
                  color: '#fff',
                  borderColor: s.lineStyle.color,
                },
                yAxis: data[0][1],
                xAxis: date
              }]
            };
          }
        });
    }
    if (GTSLib.isArray(this.chartOpts.xAxis)) {
      (this.chartOpts.xAxis as any[])
        .forEach(a => a.axisPointer = {...a.axisPointer || {}, value: date, status: 'show'});
    } else {
      (this.chartOpts.xAxis as any).axisPointer = {
        ...(this.chartOpts.xAxis as any).axisPointer || {},
        value: date,
        status: 'show'
      };
    }
    if (GTSLib.isArray(this.chartOpts.yAxis)) {
      (this.chartOpts.yAxis as any[])
        .forEach(a => a.axisPointer = {...a.axisPointer || {}, value: value || 0, status: 'show'});
    } else {
      (this.chartOpts.yAxis as any).axisPointer = {
        ...(this.chartOpts.yAxis as any).axisPointer || {},
        value: value || 0,
        status: 'show'
      };
    }
    (this.chartOpts.tooltip as any).show = true;
    this.myChart.dispatchAction({type: 'showTip', seriesIndex, dataIndex});
    this.setOpts();
    return Promise.resolve();
  }

  @Method()
  async unFocus() {
    if (!this.myChart || this.hasFocus) return;
    (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
    if (GTSLib.isArray(this.chartOpts.xAxis)) {
      (this.chartOpts.xAxis as any[])
        .forEach(a => a.axisPointer = {...a.axisPointer || {}, status: 'hide'});
    } else {
      (this.chartOpts.xAxis as any).axisPointer = {
        ...(this.chartOpts.xAxis as any).axisPointer || {},
        status: 'hide'
      };
    }
    if (GTSLib.isArray(this.chartOpts.yAxis)) {
      (this.chartOpts.yAxis as any[])
        .forEach(a => a.axisPointer = {...a.axisPointer || {}, status: 'hide'});
    } else {
      (this.chartOpts.yAxis as any).axisPointer = {
        ...(this.chartOpts.yAxis as any).axisPointer || {},
        status: 'hide'
      };
    }
    this.myChart.dispatchAction({type: 'hideTip'});
    this.setOpts();
    return Promise.resolve();
  }

  private hideMarkers() {
    if (!!this.myChart && (this.chartOpts.series as any[]).some(s => !!s.markPoint)) {
      (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
      this.setOpts();
    }
  }

  render() {
    return <div style={{width: '100%', height: '100%'}} ref={(el) => this.wrap = el}>
      {this.parsing && !!this.innerOptions?.showLoader ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el} onMouseOver={() => this.hideMarkers()}></div>
    </div>;
  }
}
