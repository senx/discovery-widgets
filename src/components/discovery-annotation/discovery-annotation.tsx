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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, ECharts } from '../../model/types';
import { Param } from '../../model/param';
import { CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams, EChartsOption, graphic, init } from 'echarts';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import { ColorLib } from '../../utils/color-lib';
import { SeriesOption } from 'echarts/lib/util/types';
import { v4 } from 'uuid';
import _ from 'lodash';

@Component({
  tag: 'discovery-annotation',
  styleUrl: 'discovery-annotation.scss',
  shadow: true,
})
export class DiscoveryAnnotation {
  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @State() @Prop() height: number;
  @Prop() debug = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start?: number, end?: number, min?: number, max?: number, type?: string }>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;
  @Event() timeBounds: EventEmitter;
  @Event() leftMarginComputed: EventEmitter<number>;
  @Event() poi: EventEmitter;

  @State() parsing = false;
  @State() rendering = false;
  @State() chartOpts: EChartsOption;
  @State() expanded = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private defOptions: Param = { ...new Param(), timeMode: 'date' };
  private LOG: Logger;
  private displayExpander = false;
  private myChart: ECharts;
  private divider = 1000;
  private hasFocus = false;
  private gtsList = [];
  private focusDate: number;
  private bounds: { min: number; max: number };
  private leftMargin = 0;
  private MAX_MARGIN = 1024;
  private pois: any[] = [];
  private innerWidth: number = 0;

  private static renderItem(params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) {
    const y = +api.value(0);
    const start = api.coord([+api.value(1), y]);
    const height = api.size([0, 1])[1];
    const width = 1;
    const coordSys = params.coordSys as any;
    const rectShape = graphic.clipRectByRect(
      { x: start[0], y: start[1] - height / 2, width, height },
      { x: coordSys.x, y: coordSys.y, width: coordSys.width, height: coordSys.height },
    );
    return (
      rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: rectShape,
        style: api.style(),
      });
  };

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    setTimeout(() => {
      if (!!this.myChart) {
        this.myChart.resize({ width: this.width, height: this.height });
        this.setOpts(true);
      }
    });
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
      if (!!this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel ?? new DataModel());
        this.setOpts(true);
      }
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue }, this.chartOpts);
    }
  }

  @Method()
  async resize() {
    const width = Utils.getContentBounds(this.el.parentElement).w - 4;
    if (this.myChart && this.innerWidth !== width) {
      this.innerWidth = width;
      this.myChart.resize({ width, silent: true });
    }
    return Promise.resolve();
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

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryAnnotation, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.expanded = !!this.innerOptions.expandAnnotation;
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.LOG?.debug(['componentWillLoad'], { type: this.type, options: this.innerOptions });
    this.chartOpts = this.convert(this.result || new DataModel());
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
      this.chartOpts.title = { ...this.chartOpts.title ?? {}, show: false };
    }
    setTimeout(() => {
      if (this.myChart) {
        this.myChart.setOption(this.chartOpts || {}, notMerge, true);
      }
    });
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions ?? {});
    options = Utils.mergeDeep<Param>(options, data.globalParams ?? {});
    this.innerOptions = Utils.clone({ ...options, leftMargin: this.innerOptions.leftMargin });
    this.innerOptions.timeMode = this.innerOptions.timeMode ?? 'date';
    const series: any[] = [];
    const categories: any[] = [];
    const gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
    this.gtsList = [];
    this.LOG?.debug(['convert'], { options: this.innerOptions, gtsList });
    const gtsCount = gtsList.length;
    let linesCount = 1;
    let catId = 0;
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let hasTimeBounds = false;
    if (max <= 1000 && min >= -1000 && min !== Number.MAX_SAFE_INTEGER && max !== Number.MIN_SAFE_INTEGER) {
      this.innerOptions.timeMode = 'timestamp';
    }
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToAnnotate(gts) && !!gts.v) {
        this.gtsList.push(gts);
        const dataSet = [];
        for (let v = 0; v < (gts.v ?? []).length; v++) {
          const tuple = gts.v[v];
          const ts = tuple[0];
          const val = tuple[tuple.length - 1];
          if (ts > max) max = ts;
          if (ts < min) min = ts;
          let startTS = ts;
          startTS = this.innerOptions.timeMode === 'date'
            ? GTSLib.utcToZonedTime(startTS, this.divider, this.innerOptions.timeZone)
            : startTS;
          dataSet.push([catId, startTS, val]);
        }
        const c = ColorLib.getColor(gts.id, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || { datasetColor: c }).datasetColor || c;
        const name = ((data.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(gts);
        if (this.expanded) {
          linesCount++;
          categories.push(name);
        }
        hasTimeBounds = true;
        series.push({
          type: 'custom',
          name: GTSLib.setName(gts.id, name),
          data: dataSet,
          animation: false,
          id: gts.id,
          large: true,
          clip: false,
          showAllSymbol: false,
          renderItem: DiscoveryAnnotation.renderItem.bind(this),
          itemStyle: { color },
          encode: { x: 1, y: 0 },
        } as SeriesOption);
        if (this.expanded) catId++;
      }
    }
    this.displayExpander = series.length > 1 && !!this.innerOptions.displayExpander;
    if (hasTimeBounds) {
      this.timeBounds.emit({ min, max });
      this.bounds = { min, max };
    }

    this.height = 50 + (linesCount * (this.expanded ? 26 : 30)) + (!!this.innerOptions.showLegend ? 30 : 0) + (this.innerOptions.fullDateDisplay ? 50 : 0);
    this.LOG?.debug(['convert'], {
      expanded: this.expanded,
      height: this.height,
      linesCount,
      opts: this.innerOptions,
    });
    return {
      animation: false,
      grid: {
        height: this.height - (!!this.innerOptions.showLegend ? 60 : 30) - (this.innerOptions.fullDateDisplay ? 40 : 0),
        right: 10,
        top: 20,
        bottom: (!!this.innerOptions.showLegend ? 30 : 10) + (this.innerOptions.fullDateDisplay ? 0 : 0),
        left: (this.innerOptions.leftMargin !== undefined && this.innerOptions.leftMargin > this.leftMargin)
          ? this.innerOptions.leftMargin
          : this.leftMargin || 10,
        containLabel: true,
      },
      throttle: 70,
      tooltip: {
        trigger: 'axis',
        transitionDuration: 0,
        formatter: (params) => {
          return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
            this.innerOptions.timeMode !== 'date'
              ? params[0].value[1]
              : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].value[1], 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                this.innerOptions.timeFormat) || '')
                .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}</div>
               ${params.map(s => {
            return `${s.marker} <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${GTSLib.getName(s.seriesName)}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${s.value[2]}</span>`;
          }).join('<br>')}`;
        },
        axisPointer: {
          axis: 'x',
          type: 'line',
          animation: false,
          lineStyle: {
            color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red'),
          },
        },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay || 100,
        position: (pos, params, el, elRect, size) => {
          const obj = { top: 10 };
          if (this.hasFocus) {
            const date = this.innerOptions.timeMode === 'date'
              ? GTSLib.zonedTimeToUtc(params[0]?.axisValue || 0, 1, this.innerOptions.timeZone) * this.divider
              : params[0]?.axisValue || 0;
            const regexp = '(' + (params as any[]).map(s => s.seriesName).join('|') + ')';
            if (this.focusDate !== date) {
              this.dataPointOver.emit({ date, name: regexp, value: (params as any).map(p => p.value[2]), meta: {} });
              this.focusDate = date;
            }
          }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
          return obj;
        },
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: { type: 'png', excludeComponents: ['toolbox'] },
          restore: { show: true },
        },
      },
      xAxis: {
        type: this.innerOptions.timeMode === 'date' ? 'time' : 'value',
        splitNumber: Math.max(Math.floor(Utils.getContentBounds(this.el.parentElement).w / 100) - 1, 1),
        splitLine: { show: false, lineStyle: { color: Utils.getGridColor(this.el) } },
        axisLine: { lineStyle: { color: Utils.getGridColor(this.el) } },
        axisLabel: {
          hideOverlap: true,
          color: Utils.getLabelColor(this.el),
          formatter: this.innerOptions.fullDateDisplay ? value =>
              GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
            : undefined,
        },
        axisTick: { show: true, lineStyle: { color: Utils.getGridColor(this.el) } },
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
      },
      yAxis: {
        show: true,
        axisTick: { show: false },
        axisLabel: {
          hideOverlap: true,
          show: false
        },
        type: 'category',
        data: categories.length === 0 ? ['-'] : categories,
        splitNumber: Math.max(categories.length, 1),
        interval: 1,
        boundaryGap: [0, 0],
        splitLine: { show: true, lineStyle: { color: Utils.getGridColor(this.el) } },
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el),
          },
        },
      },
      legend: {
        bottom: 0, left: 'center', show: !!this.innerOptions.showLegend, height: 30, type: 'scroll',
        textStyle: { color: Utils.getLabelColor(this.el) },
        formatter: n => GTSLib.getName(n),
      },
      dataZoom: [
        this.innerOptions.showRangeSelector ? {
          type: 'slider',
          height: '20px',
          filterMode: 'none',
        } : undefined,
        {
          type: 'inside',
          filterMode: 'none',
        },
      ],
      series,
      ...this.innerOptions?.extra?.chartOpts || {},
    } as EChartsOption;
  }

  private zoomHandler(start, end) {
    this.dataZoom.emit({
      start,
      end,
      min: this.innerOptions.bounds?.minDate || this.bounds?.min,
      max: this.innerOptions.bounds?.maxDate || this.bounds?.max,
    });
  }

  restoreZoomHandler = _.throttle(() => {
    this.dataZoom.emit({ type: 'restore' });
  }, 100, { 'trailing': false });

  componentDidLoad() {

    const zoomHandler = _.throttle((start: number, end: number) => this.zoomHandler(start, end),
      16, { leading: true, trailing: true });

    const focusHandler = _.throttle((type: string, event: any) => {
        if (this.hasFocus) {
          switch (type) {
            case 'mouseover':
              const c = event.data.coord || event.data;
              this.dataPointSelected.emit({
                date: c[0],
                name: GTSLib.getName(event.seriesName),
                value: c[1],
                meta: {},
              });
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
                this.dataPointOver.emit({ date: ts, name: '.*', meta: {} });
              }
              break;
            default:
              break;
          }
        }
      },
      100, { leading: true, trailing: true });
    this.parsing = false;
    this.rendering = true;
    let initial = false;
    this.myChart = init(this.graph, null, {
      width: this.width,
      height: this.height,
      renderer: 'canvas',
    });
    this.myChart.on('rendered', () => {
      this.rendering = false;
      let found = false;
      let x = 0;
      setTimeout(() => {
        while (!found && x < 1024) {
          found = this.myChart.containPixel({ gridIndex: 0 }, [x, this.myChart.getHeight() / 2]);
          x++;
        }
        if (this.leftMargin !== x && x < this.innerOptions.leftMargin || this.MAX_MARGIN) {
          setTimeout(() => {
            if (x !== this.MAX_MARGIN) {
              this.leftMarginComputed.emit(x);
              this.leftMargin = x;
            }
          });
        }
        if (initial) setTimeout(() => this.draw.emit());
        initial = false;
      });
    });
    this.myChart.on('highlight', (event: any) => {
      let ts;
      let v;
      const series = [];
      (event.batch || []).forEach(b => {
        const s = (this.myChart.getOption() as EChartsOption).series[b.seriesIndex];
        ts = s.data[b.dataIndex][0];
        ts = this.innerOptions.timeMode === 'date'
          ? GTSLib.zonedTimeToUtc(ts * this.divider, this.divider, this.innerOptions.timeZone || 'UTC') * this.divider
          : ts;
        v = s.data[b.dataIndex][1];
        series.push(GTSLib.getName(s.name));
      });
      if (ts !== undefined) {
        this.dataPointOver.emit({ date: ts, name: '(' + series.join('|') + ')', value: v, meta: {} });
      }
    });
    this.myChart.on('click', (event: any) => {
      const c = event.data.coord || event.data;
      const date = this.innerOptions.timeMode === 'date'
        ? GTSLib.zonedTimeToUtc(c[0], 1, this.innerOptions.timeZone) * this.divider
        : c[0];
      if (event.componentType !== 'markLine') {
        this.dataPointSelected.emit({ date, name: GTSLib.getName(event.seriesName), value: c[2], meta: {} });
      }
      if (this.innerOptions.poi) {
        if (this.pois.find(p => p.date === c[1])) {
          this.pois = this.pois.filter(p => p.date !== c[1]);
        } else if (event.componentType !== 'markLine') {
          this.pois.push({ date, name: GTSLib.getName(event.seriesName), value: c[2], meta: {}, uid: v4() });
        }
        this.chartOpts.series = (this.chartOpts.series as SeriesOption[]).filter(s => 'poi' !== s.id);
        this.poi.emit(this.pois);
        (this.chartOpts.series as SeriesOption[]).push({
          id: 'poi',
          name: '',
          type: 'line',
          data: [],
          markLine: {
            emphasis: { lineStyle: { width: 1 } },
            symbol: ['none', 'pin'],
            symbolSize: 20,
            symbolKeepAspect: true,
            data: this.pois.map(p => ({
              name: 'poi-' + p.uid,
              label: { show: false },
              lineStyle: { color: this.innerOptions.poiColor, type: this.innerOptions.poiLine },
              xAxis: this.innerOptions.timeMode === 'date'
                ? GTSLib.utcToZonedTime(p.date / this.divider, 1, this.innerOptions.timeZone)
                : p.date,
            })),
          },
        });
        setTimeout(() => this.myChart.setOption(this.chartOpts ?? {}, true, false));
      }
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
    this.myChart.on('restore', () => this.restoreZoomHandler());
    this.myChart.on('mouseout', () => {
      this.dataPointOver.emit({});
    });
    this.myChart.on('mouseover', (event: any) => focusHandler('mouseover', event));
    this.myChart.on('highlight', (event: any) => focusHandler('highlight', event));
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
    initial = true;
    this.setOpts();
  }

  @Method()
  async setZoom(dataZoom: { start?: number, end?: number, type?: string }) {
    if (this.myChart) {
      if ('restore' === dataZoom.type) {
        this.myChart.dispatchAction({ type: 'restore' });
      } else {
        this.myChart.dispatchAction({ type: 'dataZoom', ...dataZoom, dataZoomIndex: 1 });
      }
    }
    return Promise.resolve();
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({
      type,
      excludeComponents: ['toolbox'],
    }) : undefined);
  }

  @Method()
  async setFocus(regexp: string, ts: number) {
    if (!this.myChart || this.gtsList.length === 0 || this.hasFocus) return;
    if (typeof ts === 'string') ts = parseInt(ts, 10);
    let ttp = [];
    const date = this.innerOptions.timeMode === 'date'
      ? GTSLib.utcToZonedTime(ts || 0, this.divider, this.innerOptions.timeZone)
      : ts || 0;
    let seriesIndex = 0;
    let dataIndex = 0;
    if (!!regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(GTSLib.getName(s.name)))
        .forEach(s => {
          seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
          const data = s.data.filter(d => d[1] === date);
          if (data && data[0]) {
            dataIndex = s.data.indexOf(data[0]);
            s.markPoint = {
              symbol: 'rect',
              symbolSize: [4, 30],
              data: [{
                name: s.name,
                itemStyle: {
                  color: '#fff',
                  borderColor: s.itemStyle.color,
                },
                yAxis: data[0][0],
                xAxis: date,
              }],
            };
            ttp = [date, data[0][0]];
          }
        });
      this.myChart.dispatchAction({
        type: 'highlight',
        seriesName: (this.chartOpts.series as any[])
          .filter(s => new RegExp(regexp).test(GTSLib.getName(s.name)))
          .map(s => GTSLib.getName(s.name)),
      });
    }
    (this.chartOpts.xAxis as any).axisPointer = {
      ...(this.chartOpts.xAxis as any).axisPointer || {},
      value: date,
      status: 'show',
    };
    (this.chartOpts.tooltip as any).show = true;
    if (ttp.length > 0) {
      this.myChart.dispatchAction({ type: 'showTip', dataIndex, seriesIndex });
    } else {
      this.myChart.dispatchAction({ type: 'hideTip' });
    }
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

  private hideMarkers() {
    if (!this.myChart) return;
    (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
    this.setOpts();
  }

  render() {
    return <Host style={{ width: `${this.width}px`, height: `${(this.height + (this.expanded ? 50 : 0))}px` }}>
      {this.displayExpander
        ?
        <button class="expander" onClick={() => this.toggle()} title="collapse/expand">+/-</button>
        : ''}
      <div class="chart-area"
           style={{
             width: `${this.width}px`,
             height: `${(this.height + (!!this.innerOptions.showLegend ? 50 : 0) + (!!this.innerOptions.fullDateDisplay ? 50 : 0))}px`,
           }}>
        {this.parsing ? <div class="discovery-chart-spinner">
          <discovery-spinner>Parsing data...</discovery-spinner>
        </div> : ''}
        {this.rendering ? <div class="discovery-chart-spinner">
          <discovery-spinner>Rendering data...</discovery-spinner>
        </div> : ''}
        <div ref={(el) => this.graph = el} onMouseOver={() => this.hideMarkers()} />
      </div>
    </Host>;
  }

  private toggle() {
    this.expanded = !this.expanded;
    this.chartOpts = this.convert(this.result as DataModel || new DataModel());
    setTimeout(() => {
      this.myChart.resize({
        width: this.width,
        height: this.height,
      });
      this.setOpts();
    });
  }
}
