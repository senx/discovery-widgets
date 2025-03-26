/*
 *   Copyright 2023-2025 SenX S.A.S.
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
import { ChartType, DataModel, DiscoveryEvent, ECharts } from '../../model/types';
import { Param } from '../../model/param';
import * as echarts from 'echarts';
import { BoxplotSeriesOption, EChartsOption, SeriesOption } from 'echarts';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import { ColorLib } from '../../utils/color-lib';
import _ from 'lodash';
import { v4 } from 'uuid';

@Component({
  tag: 'discovery-boxplot',
  styleUrl: 'discovery-boxplot.scss',
  shadow: true,
})
export class DiscoveryBoxPlotComponent {
  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = { ...new Param(), timeMode: 'date' };
  @Prop() width: number;
  @Prop({ mutable: true }) height: number;
  @Prop() debug = false;
  @Prop() unit: string;
  @Prop() url: string;
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() vars = '{}';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start?: number, end?: number, min?: number, max?: number, type?: string }>;
  @Event() leftMarginComputed: EventEmitter<number>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;
  @Event() timeBounds: EventEmitter;
  @Event() poi: EventEmitter;
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
  private defOptions: Param = { ...new Param(), timeMode: 'date' };
  private LOG: Logger;
  private divider = 1000;
  private myChart: ECharts;
  private leftMargin: number;
  private hasFocus = false;
  private bounds: { min: number; max: number };
  private isGTS = false;
  private zoom: { start?: number; end?: number };
  private innerWidth: number = 0;
  private innerHeight: number = 0;
  private zoomXInfo: any = {};
  private innerVars: any = {};

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

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result));
    this.setOpts(true);
  }

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone(opts);
      if (this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        this.setOpts(true);
      }
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue }, this.chartOpts);
    }
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
      dataZoom.start = dataZoom.start || 0;
      if (this.zoom?.start !== dataZoom.start || this.zoom?.end !== dataZoom.end) {
        this.zoom = dataZoom;
        this.myChart.dispatchAction({ type: 'dataZoom', ...dataZoom, dataZoomIndex: 0 });
      }
    }
    return Promise.resolve();
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryBoxPlotComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.chartOpts = this.convert(this.result || new DataModel());
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts,
    });
    this.LOG?.debug(['componentWillLoad'], this.el.parentElement.parentElement);
    this.setOpts();
  }

  private setOpts(notMerge = false) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    } else if (this.vars) {
      this.innerVars = this.vars;
    }
    if ((this.chartOpts?.series as any[] || []).length === 0) {
      this.chartOpts.title = {
        show: true,
        textStyle: { color: Utils.getLabelColor(this.el), fontSize: 20 },
        text: this.innerOptions.noDataLabel || '',
        left: 'center',
        top: 'center',
      };
      this.chartOpts.xAxis = { show: false };
      this.chartOpts.yAxis = { show: false };
      this.chartOpts.tooltip = { show: false };
    } else {
      this.chartOpts.title = { ...this.chartOpts.title ?? {}, show: false };
    }
    setTimeout(() => {
      if (this.myChart) {
        this.myChart.setOption(this.chartOpts ?? {}, notMerge, true);
        if (this.zoomXInfo.start !== undefined) {
          this.myChart.dispatchAction({
            type: 'dataZoom', start: this.zoomXInfo.start,
            end: this.zoomXInfo.end,
            dataZoomIndex: 0,
          });
        }
      }
    });
  }

  private getCommonSeriesParam(color: string) {
    const isHorizontal = !!this.innerOptions.box?.horizontal;
    const datasetNoAlpha = this.innerOptions.datasetNoAlpha;
    return {
      emphasis: {
        focus: 'series',
        itemStyle: {
          opacity: 0.8,
          borderColor: color,
          color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.8),
        },
      },
      blur: {
        lineStyle: { color },
        itemStyle: {
          opacity: 0.8,
          borderColor: color,
          color: {
            type: 'linear', x: isHorizontal ? 1 : 0, y: 0, x2: 0, y2: isHorizontal ? 0 : 1,
            colorStops: [
              { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
              { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
            ],
          },
        },
      },
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: isHorizontal ? 1 : 0, y: 0, x2: 0, y2: isHorizontal ? 0 : 1,
          colorStops: [
            { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
            { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
          ],
        },
      },
    } as any;
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = Utils.clone(options);
    const series: any[] = [];
    let gtsList: any[];
    if (GTSLib.isArray(data.data)) {
      data.data = GTSLib.flatDeep(data.data as any[]);
      this.LOG?.debug(['convert', 'isArray']);
      if (data.data.length > 0 && GTSLib.isGts(data.data[0])) {
        this.LOG?.debug(['convert', 'isArray 2']);
        gtsList = GTSLib.flattenGtsIdArray(data.data as any[], 0).res;
      } else {
        this.LOG?.debug(['convert', 'isArray 3']);
        gtsList = data.data as any[];
      }
    } else {
      this.LOG?.debug(['convert', 'not array']);
      gtsList = [data.data];
    }
    this.LOG?.debug(['convert'], { options: this.innerOptions, gtsList });
    const gtsCount = gtsList.length;
    let hasTimeBounds = false;
    const axisLabels = [];
    const opts = {
      animation: !!this.innerOptions?.box?.animate,
      grid: {
        left: (!!this.innerOptions.leftMargin && this.innerOptions.leftMargin > this.leftMargin)
          ? this.innerOptions.leftMargin - this.leftMargin + 10
          : 10,
        top: !this.innerOptions.box?.horizontal && !!(this.unit || this.innerOptions.unit) ? 30 : 10,
        bottom: this.innerOptions.showLegend
          ? this.innerOptions.box?.horizontal && !!(this.unit || this.innerOptions.unit)
            ? 50
            : 30
          : this.innerOptions.box?.horizontal && !!(this.unit || this.innerOptions.unit)
            ? 20
            : 10,
        right: 10,
        containLabel: true,
      },
      visualMap: new Array(gtsCount),
      tooltip: {
        trigger: 'item',
        transitionDuration: 0,
        axisPointer: { type: 'shadow' },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay || 100,
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: { type: 'png', excludeComponents: ['toolbox'] },
          restore: { show: true },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          orient: 'vertical',
          zoomOnMouseWheel: 'ctrl',
        },
        {
          type: 'inside',
          orient: 'horizontal',
          zoomOnMouseWheel: true,
        },
      ],
      series: [],
      ...this.innerOptions?.extra?.chartOpts || {},
    } as EChartsOption;
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
    let minVal = Number.MAX_SAFE_INTEGER;
    let maxVal = Number.MIN_SAFE_INTEGER;
    let minTS = Number.MAX_SAFE_INTEGER;
    let maxTS = Number.MIN_SAFE_INTEGER;
    const seriesOpts: BoxplotSeriesOption = {
      type: 'boxplot',
      animation: !!this.innerOptions?.box?.animate,
      label: {
        show: !!this.innerOptions.showValues,
        position: 'top',
        color: Utils.getLabelColor(this.el),
        fontSize: 14,
      },
      data: [],
      // encode: !!this.innerOptions?.box?.horizontal ? {        x: ['min', 'Q1', 'median', 'Q3', 'max']      } : undefined
    };
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      const c = ColorLib.getColor(gts.id || i, this.innerOptions.scheme);
      const color = ((data.params || [])[i] || { datasetColor: c }).datasetColor || c;
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        this.isGTS = true;
        const bounds = GTSLib.getBounds(gts.v);
        minVal = Math.min(minVal, bounds.minVal);
        minTS = Math.min(minTS, bounds.minTS);
        maxVal = Math.max(maxVal, bounds.maxVal);
        maxTS = Math.max(maxTS, bounds.maxTS);
        hasTimeBounds = true;
        const name = GTSLib.setName(gts.id, (((data.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(gts)));
        axisLabels.push(GTSLib.getName(name));
        seriesOpts.data.push({
          ...this.getCommonSeriesParam(color),
          name: GTSLib.getName(name),
          id: gts.id,
          value: [
            bounds.minVal,
            this.quantile(bounds.rawVals, 0.25),
            this.quantile(bounds.rawVals, 0.5),
            this.quantile(bounds.rawVals, 0.75),
            bounds.maxVal,
          ],
        });
      } else if (!gts.v && gts.label && gts.values) {
        this.innerOptions.timeMode = 'custom';
        this.LOG?.debug(['convert', 'gts'], gts);
        axisLabels.push(gts.label);
        const bounds = GTSLib.getMinMax(gts.values);
        seriesOpts.data.push({
          ...this.getCommonSeriesParam(color),
          name: gts.label,
          id: i,
          value: [
            bounds.minVal,
            this.quantile(gts.values, 0.25),
            this.quantile(gts.values, 0.5),
            this.quantile(gts.values, 0.75),
            bounds.maxVal,
          ],
        });
      }
    }
    (opts.series as any[]).push(seriesOpts);
    opts.yAxis = {
      name: !this.innerOptions?.box?.horizontal ? this.unit || this.innerOptions.unit : undefined,
      data: !this.innerOptions?.box?.horizontal ? undefined : axisLabels,
      show: !this.innerOptions.hideYAxis,
      emphasis: { focus: 'series' },
      nameTextStyle: { color: Utils.getLabelColor(this.el) },
      type: this.innerOptions?.box?.horizontal ? 'category' : 'value',
      splitLine: { lineStyle: { color: Utils.getGridColor(this.el) } },
      axisLine: { lineStyle: { color: Utils.getGridColor(this.el) } },
      axisLabel: {
        hideOverlap: true,
        color: Utils.getLabelColor(this.el),
      },
      axisTick: { lineStyle: { color: Utils.getGridColor(this.el) } },
      min: this.innerOptions?.box?.horizontal
        ? undefined
        : this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[0] : undefined,
      max: this.innerOptions?.box?.horizontal
        ? undefined
        : this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[1] : undefined,
    } as any;

    opts.xAxis = {
      name: this.innerOptions?.box?.horizontal ? this.unit || this.innerOptions.unit : undefined,
      data: this.innerOptions?.box?.horizontal ? undefined : axisLabels,
      nameTextStyle: {
        padding: [0, 10, -35, 0],
        align: 'right',
        verticalAlign: 'bottom',
      },
      show: !this.innerOptions.hideXAxis,
      emphasis: { focus: 'series' },
      type: this.innerOptions?.box?.horizontal ? 'value' : 'category',
      axisLine: { lineStyle: { color: Utils.getGridColor(this.el) } },
      axisLabel: {
        hideOverlap: true,
        show: !this.innerOptions.hideXAxis,
        color: Utils.getLabelColor(this.el),
      },
      axisTick: { lineStyle: { color: Utils.getGridColor(this.el) } },
      min: this.innerOptions?.box?.horizontal
        ? this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[0] : undefined
        : undefined,
      max: this.innerOptions?.box?.horizontal
        ? this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[1] : undefined
        : undefined,
    } as any;
    if (hasTimeBounds) {
      this.timeBounds.emit({ min: minTS, max: maxTS });
      this.bounds = { min: minVal, max: maxVal };
    }
    this.LOG?.debug(['convert', 'series'], series);
    const markArea = [...(this.innerOptions.thresholds || [])
      .map(t => {
        const m = [{ itemStyle: { color: ColorLib.transparentize(t.color || '#f44336', t.fill ? 0.3 : 0) } }, {}] as any[];
        if (this.innerOptions.box?.horizontal) {
          m[0].xAxis = t.value || 0;
          m[1].xAxis = 0;
          m[0].name = `${t.value || 0}`;
          m[0].label = { color: t.color || '#f44336', position: 'insideTopRight' };
        } else {
          m[0].yAxis = t.value || 0;
          m[1].yAxis = 0;
        }
        return m;
      }),
      ...(this.innerOptions.markers || [])
        .filter(t => !!t.fill)
        .map(t => {
          return [{
            itemStyle: {
              color: ColorLib.transparentize(t.color || '#D81B60', t.fill ? t.alpha || 0.5 : 0),
              borderType: t.type || 'dashed',
            },
            label: { color: t.color || '#D81B60', position: 'insideTopRight', distance: 5, show: !!t.name },
            name: t.name || t.value || 0,
            yAxis: this.innerOptions.box?.horizontal ? ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0) : undefined,
            xAxis: !this.innerOptions.box?.horizontal ? ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0) : undefined,
          },
            {
              itemStyle: {
                color: ColorLib.transparentize(t.color || '#D81B60', t.fill ? t.alpha || 0.5 : 0),
                borderType: t.type || 'dashed',
              },
              yAxis: this.innerOptions.box?.horizontal ? ((t.start / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0) : undefined,
              xAxis: !this.innerOptions.box?.horizontal ? ((t.start / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0) : undefined,
            }];
        })];

    const markLine = [...(this.innerOptions.thresholds || [])
      .map(t => {
        const m = {
          name: t.value || 0,
          label: { color: t.color || '#f44336', position: 'insideEndTop' },
          lineStyle: { color: t.color || '#f44336', type: 'dashed' },
        } as any;
        if (this.innerOptions.box?.horizontal) {
          m.xAxis = t.value || 0;
          m.label.show = false;
        } else {
          m.yAxis = t.value || 0;
        }
        return m;
      }),
      ...(this.innerOptions.markers || [])
        .filter(t => !t.fill)
        .map(t => {
          return {
            name: t.name || t.value || 0,
            label: {
              color: t.color || '#D81B60',
              position: 'insideEndTop',
              formatter: '{b}',
              show: !!t.name,
            },
            lineStyle: { color: t.color || '#D81B60', type: t.type || 'dashed' },
            yAxis: this.innerOptions.box?.horizontal ? ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0) : undefined,
            xAxis: !this.innerOptions.box?.horizontal ? ((t.value / (this.innerOptions.timeMode === 'date' ? this.divider : 1)) || 0) : undefined,
          };
        })];
    if (markLine.length > 0) {
      (opts.series as SeriesOption[]).push({
        name: '',
        type: 'line',
        symbolSize: 0,
        data: [],
        markArea: {
          data: markArea,
        },
        markLine: {
          emphasis: { lineStyle: { width: 1 } },
          symbol: ['none', 'none'],
          data: markLine,
        },
      } as SeriesOption);
    }
    this.parsing = false;
    return opts;
  }

  private quantile(ascArr: number[], p: number): number {
    const H = (ascArr.length - 1) * p + 1;
    const h = Math.floor(H);
    const v = +ascArr[h - 1];
    const e = H - h;
    return e ? v + e * (ascArr[h] - v) : v;
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

  componentDidLoad() {
    const zoomHandler = _.throttle((start: number, end: number) => this.zoomHandler(start, end),
      16, { leading: true, trailing: true });

    const focusHandler = _.throttle((type: string, event: any) => {
        if (this.hasFocus) {
          switch (type) {
            case 'mouseover':
              this.dataPointOver.emit({
                date: undefined,
                name: GTSLib.getName(event.data.name),
                value: {
                  min: event.data.value[1],
                  Q1: event.data.value[2],
                  median: event.data.value[3],
                  Q3: event.data.value[4],
                  max: event.data.value[5],
                },
                meta: {},
              });
              break;
            case 'highlight':
              let ts;
              (event.batch || []).forEach((b: any) => {
                const s = (this.myChart.getOption() as EChartsOption).series[b.seriesIndex];
                ts = s.data[b.dataIndex][0];
                ts = this.innerOptions.timeMode === 'date'
                  ? GTSLib.zonedTimeToUtc(ts * this.divider, this.divider, this.innerOptions.timeZone || 'UTC') * this.divider
                  : ts;
              });
              if (ts !== undefined) {
                this.dataPointSelected.emit({ date: ts, name: '.*', meta: {} });
              }
              break;
            default:
              break;
          }
        }
      },
      100, { leading: true, trailing: true });

    setTimeout(() => {
      this.height = Utils.getContentBounds(this.el.parentElement).h;
      this.parsing = false;
      this.rendering = true;
      let initial = false;
      this.myChart = echarts.init(this.graph);
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
      this.myChart.on('dataZoom', (event: any) => {
        let start;
        let end;
        if (event.batch) {
          const batch = (event.batch || [])[0] || {};
          start = batch.start || batch.startValue;
          end = batch.end || batch.endValue;
          this.zoomHandler(start, end);
        } else if (event.start !== undefined && event.end !== undefined) {
          start = event.start;
          end = event.end;
          zoomHandler(start, end);
        }
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
        if (event.componentType !== 'markLine') {
          this.dataPointSelected.emit({
            date: undefined,
            name: GTSLib.getName(event.data.name),
            value: {
              min: event.data.value[1],
              Q1: event.data.value[2],
              median: event.data.value[3],
              Q3: event.data.value[4],
              max: event.data.value[5],
            },
            meta: {},
          });
        }
      });
      this.setOpts();
      initial = true;
    });
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
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
      : ts ?? 0;
    let seriesIndex = 0;
    let dataIndex = 0;
    if (regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(GTSLib.getName(s.name)))
        .forEach(s => {
          const data = s.data.filter(d => d[0] === date);
          if (data && data.length > 0 && data[0]) {
            seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
            dataIndex = s.data.indexOf(data[0]);
          }
        });
    }
    if (GTSLib.isArray(this.chartOpts.xAxis)) {
      (this.chartOpts.xAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer ?? {}, value: date, status: 'show' });
    } else {
      (this.chartOpts.xAxis as any).axisPointer = {
        ...(this.chartOpts.xAxis as any).axisPointer ?? {},
        value: date,
        status: 'show',
      };
    }
    if (GTSLib.isArray(this.chartOpts.yAxis)) {
      (this.chartOpts.yAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer ?? {}, value: value ?? 0, status: 'show' });
    } else {
      (this.chartOpts.yAxis as any).axisPointer = {
        ...(this.chartOpts.yAxis as any).axisPointer ?? {},
        value: value ?? 0,
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
    (this.chartOpts.xAxis as any).axisPointer = {
      ...(this.chartOpts.xAxis as any).axisPointer || {},
      status: 'hide',
    };
    (this.chartOpts.yAxis as any).axisPointer = {
      ...(this.chartOpts.yAxis as any).axisPointer || {},
      status: 'hide',
    };
    this.myChart.dispatchAction({ type: 'hideTip' });
    this.setOpts();
    return Promise.resolve();
  }


  render() {
    return <div style={{ width: '100%', height: '100%' }}>
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el} />
    </div>;
  }

}
