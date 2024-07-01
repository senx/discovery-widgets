/*
 *   Copyright 2023-2024 SenX S.A.S.
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
import { Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, ECharts } from '../../model/types';
import { Param } from '../../model/param';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import { ColorLib } from '../../utils/color-lib';
import { SeriesOption } from 'echarts/lib/util/types';
import _, { isEqual } from 'lodash';

@Component({
  tag: 'discovery-bar-polar',
  styleUrl: 'discovery-bar-polar.scss',
  shadow: true,
})
export class DiscoveryBarPolarComponent {
  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = { ...new Param(), timeMode: 'date' };
  @Prop() width: number;
  @Prop({ mutable: true }) height: number;
  @Prop() debug = false;
  @Prop() unit: string;

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
  private categories: string[];

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
    if (!isEqual(opts, this.innerOptions)) {
      this.innerOptions = { ...opts };
      if (!!this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        this.setOpts(true);
      }
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue }, this.chartOpts);
    }
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
        this.myChart.dispatchAction({ type: 'dataZoom', ...dataZoom, dataZoomIndex: 0 });
      }
    }
    return Promise.resolve();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryBarPolarComponent, this.debug);
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
      this.chartOpts.title = { ...this.chartOpts.title || {}, show: false };
    }
    setTimeout(() => {
      if (this.myChart) {
        this.myChart.setOption(this.chartOpts || {}, notMerge, true);
      }
    });
  }

  private getCommonSeriesParam(color) {
    const datasetNoAlpha = this.innerOptions.datasetNoAlpha;
    return {
      coordinateSystem: 'polar',
      animation: !!this.innerOptions?.bar?.animate,
      large: true,
      clip: false,
      emphasis: {
        focus: 'series',
        itemStyle: {
          opacity: 1,
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
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
              { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
            ],
          },
        },
      },
      label: {
        show: !!this.innerOptions.showValues,
        position: 'top',
        textStyle: { color: Utils.getLabelColor(this.el), fontSize: 14 },
      },
      lineStyle: { color },
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
            { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
          ],
        },
      },
    } as SeriesOption;
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = { ...options };
    const series: any[] = [];
    let gtsList;
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
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let hasTimeBounds = false;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        this.isGTS = true;
        const c = ColorLib.getColor(gts.id || i, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || { datasetColor: c }).datasetColor || c;
        min = Math.min(min, ...gts.v.map(v => v[0]));
        max = Math.max(max, ...gts.v.map(v => v[0]));
        hasTimeBounds = true;
        let type = ((data.params || [])[i] || { type: 'bar' }).type || 'bar';
        const datasetNoAlpha = (data.params ?? [])[i]?.datasetNoAlpha ?? this.innerOptions.datasetNoAlpha;
        let areaStyle: any;
        if (type === 'area') {
          type = 'line';
          areaStyle = {
            opacity: 0.8,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
                { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.1) },
              ],
              global: false, // false by default
            },
          };
        }
        const sortedGTS = gts.v.sort((a: number[], b: number[]) => a[0] < b[0] ? -1 : 1);
        const s = {
          ...this.getCommonSeriesParam(color),
          type, areaStyle,
          id: gts.id,
          name: GTSLib.setName(gts.id, (((data.params || [])[i] ?? { key: undefined }).key ?? GTSLib.serializeGtsMetadata(gts))),
          data: sortedGTS.map(d => {
            const ts = this.innerOptions.timeMode === 'date'
              ? GTSLib.utcToZonedTime(d[0], this.divider, this.innerOptions.timeZone)
              : d[0];
            return [d[d.length - 1], ts];
          }),
        } as SeriesOption;
        const isStacked = (data.params || [])[i]?.stacked !== undefined
          ? (data.params || [])[i]?.stacked
          : this.innerOptions?.bar?.stacked ?? this.innerOptions?.stacked;
        if (type === 'bar' && isStacked) {
          s.stack = 'a';
          s.stackStrategy = 'all';
        }
        if (type === 'line' && this.innerOptions.bar?.fillGap) {
          s.data.push(s.data[0]);
        }
        series.push(s);
      } else if (!gts.v) {
        this.innerOptions.timeMode = 'custom';
        this.LOG?.debug(['convert', 'gts'], gts);
        this.categories = gts.columns;
        (gts.rows || []).forEach((row: any[], index: number) => {
          const c = ColorLib.getColor(gts.id || index, this.innerOptions.scheme);
          const color = ((data.params || [])[index] || { datasetColor: c }).datasetColor || c;
          let type = ((data.params || [])[index] || { type: 'bar' }).type || 'bar';
          const datasetNoAlpha = (data.params ?? [])[index]?.datasetNoAlpha ?? this.innerOptions.datasetNoAlpha;
          let areaStyle;
          if (type === 'area') {
            type = 'line';
            areaStyle = {
              opacity: 0.8,
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
                  { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.1) },
                ],
                global: false, // false by default
              },
            };
          }
          const s = {
            ...this.getCommonSeriesParam(color),
            type, areaStyle,
            name: row[0],
            data: row.splice(1),
          } as SeriesOption;
          const isStacked = (data.params || [])[index]?.stacked !== undefined
            ? (data.params || [])[index]?.stacked
            : this.innerOptions?.bar?.stacked ?? this.innerOptions?.stacked;
          if (type === 'bar' && isStacked) {
            s.stack = 'a';
            s.stackStrategy = 'all';
          }
          if (type === 'line') {
            s.data.push(s.data[0]);
          }
          series.push(s);
        });
      }
    }
    if (hasTimeBounds) {
      this.timeBounds.emit({ min, max });
      this.bounds = { min, max };
    }
    this.LOG?.debug(['convert', 'series'], series);
    const opts = {
      animation: !!this.innerOptions?.bar?.animate,
      grid: {
        left: (!!this.innerOptions.leftMargin && this.innerOptions.leftMargin > this.leftMargin)
          ? this.innerOptions.leftMargin - this.leftMargin + 10
          : 10,
        top: !!(this.unit || this.innerOptions.unit) ? 30 : 10,
        bottom: !!this.innerOptions.showLegend ? 30 : 10,
        right: 10,
        containLabel: true,
      },
      polar: {},
      angleAxis: {
        startAngle: !!this.innerOptions.bar?.startAngle ? this.innerOptions.bar?.startAngle : this.isGTS ? 0 : (360 / Math.max((this.categories || []).length, 1)) * -1.5 + 180,
        type: this.isGTS ? this.innerOptions.timeMode === 'date' ? 'time' : 'value' : 'category',
        data: this.isGTS ? undefined : this.categories,

        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el),
          },
        },
        axisLabel: {
          show: !this.innerOptions.hideXAxis,
          color: Utils.getLabelColor(this.el),
          formatter: this.innerOptions.timeMode === 'date'
            ? this.innerOptions.fullDateDisplay ? value =>
                GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                  .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
              : undefined
            : undefined,
        },
        axisTick: {
          lineStyle: {
            color: Utils.getGridColor(this.el),
          },
        },
        emphasis: {
          focus: 'series',
        },
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

      },
      tooltip: {
        trigger: 'axis',
        transitionDuration: 0,
        axisPointer: {
          type: !!this.innerOptions.yCursor && !!this.innerOptions.xCursor ? 'cross' : !!this.innerOptions.yCursor || !!this.innerOptions.xCursor ? 'line' : 'none',
          axis: !!this.innerOptions.yAxisFocus ? 'y' : 'x',
          animation: false,
          lineStyle: !this.innerOptions.yCursor && !this.innerOptions.xCursor
            ? undefined
            : {
              color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red'),
            },
          crossStyle: !!this.innerOptions.yCursor
            ? {
              color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red'),
            }
            : undefined,
        },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay || 100,
        formatter: (params) => {
          return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
            this.innerOptions.timeMode !== 'date'
              ? params[0].axisValue
              : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].axisValue, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined) || '')
                .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}</div>
               ${params.map(s => `${s.marker} <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${GTSLib.getName(s.seriesName)}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${s.value}</span>`,
          ).join('<br>')}`;
        },
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: { type: 'png', excludeComponents: ['toolbox'] },
        },
      },
      legend: {
        bottom: 0, left: 'center', show: !!this.innerOptions.showLegend, height: 30, type: 'scroll',
        textStyle: { color: Utils.getLabelColor(this.el) },
      },
      radiusAxis: {
        name: this.unit || this.innerOptions.unit,
        show: !this.innerOptions.hideYAxis,
        type: 'value',
        nameTextStyle: { color: Utils.getLabelColor(this.el) },
        splitLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el),
          },
        },
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el),
          },
        },
        axisLabel: {
          color: Utils.getLabelColor(this.el),
        },
        axisTick: {
          lineStyle: {
            color: Utils.getGridColor(this.el),
          },
        },
      },
      series,
      ...this.innerOptions?.extra?.chartOpts || {},
    } as EChartsOption;
    this.parsing = false;
    return opts;
  }

  private zoomHandler(start, end) {
    this.dataZoom.emit({
      start,
      end,
      min: this.innerOptions.bounds?.minDate || this.bounds?.min,
      max: this.innerOptions.bounds?.maxDate || this.bounds?.max,
    });
  }

  componentDidLoad() {
    const zoomHandler = _.throttle((start: number, end: number) => this.zoomHandler(start, end),
      16, { leading: true, trailing: true });

    const focusHandler = _.throttle((type: string, event: any) => {
        if (this.hasFocus) {
          switch (type) {
            case 'mouseover':
              const c = event.data.coord || event.data;
              this.dataPointOver.emit({ date: c[0], name: GTSLib.getName(event.seriesName), value: c[1], meta: {} });
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
        if (!!event.batch) {
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
        this.dataPointSelected.emit({
          date: event.value[0],
          name: GTSLib.getName(event.seriesName),
          value: event.value[1],
          meta: {},
        });
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
      batch: (this.myChart.getOption().series as any[]).filter(s => new RegExp(regexp).test(GTSLib.getName(s.name))),
    });
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => new RegExp(regexp).test(GTSLib.getName(s.name))),
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
    if (!!regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(s.name))
        .forEach(s => {
          const data = s.data.filter(d => d[0] === date);
          if (data && data.length > 0 && data[0]) {
            seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
            dataIndex = s.data.indexOf(data[0]);
          }
        });
    }
    if (GTSLib.isArray(this.chartOpts.angleAxis)) {
      (this.chartOpts.angleAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer || {}, value: date, status: 'show' });
    } else {
      (this.chartOpts.angleAxis as any).axisPointer = {
        ...(this.chartOpts.angleAxis as any).axisPointer || {},
        value: date,
        status: 'show',
      };
    }
    if (GTSLib.isArray(this.chartOpts.radiusAxis)) {
      (this.chartOpts.radiusAxis as any[])
        .forEach(a => a.axisPointer = { ...a.axisPointer || {}, value: value || 0, status: 'show' });
    } else {
      (this.chartOpts.radiusAxis as any).axisPointer = {
        ...(this.chartOpts.radiusAxis as any).axisPointer || {},
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
    (this.chartOpts.angleAxis as any).axisPointer = {
      ...(this.chartOpts.angleAxis as any).axisPointer || {},
      status: 'hide',
    };
    (this.chartOpts.radiusAxis as any).axisPointer = {
      ...(this.chartOpts.radiusAxis as any).axisPointer || {},
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
