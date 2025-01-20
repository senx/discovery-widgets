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
import { Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, ECharts } from '../../model/types';
import { Param } from '../../model/param';
import * as echarts from 'echarts';
import { EChartsOption, SeriesOption } from 'echarts';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import { ColorLib } from '../../utils/color-lib';

@Component({
  tag: 'discovery-calendar',
  styleUrl: 'discovery-calendar.scss',
  shadow: true,
})
export class DiscoveryCalendar {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;

  @State() parsing = false;
  @State() rendering = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private divider = 1000;
  private myChart: ECharts;
  private CAL_SIZE = 150;
  private innerWidth: number = 0;
  private innerHeight: number = 0;

  @Watch('type')
  updateType(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.chartOpts = this.convert(GTSLib.getData(this.result));
      setTimeout(() => {
        this.myChart.setOption(this.chartOpts || {}, true, false);
        this.myChart.resize({ height: this.height });
        this.setOpts(true);
      });
    }
  }

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result));
    setTimeout(() => {
      this.myChart.setOption(this.chartOpts || {}, true, false);
      this.myChart.resize({ height: this.height });
      this.setOpts(true);
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
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        setTimeout(() => {
          this.myChart.setOption(this.chartOpts || {}, true, false);
          this.myChart.resize({ height: this.height });
          this.setOpts(true);
        });
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
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => new RegExp(regexp).test(s.name)),
    });
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => new RegExp(regexp).test(s.name)),
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
    this.LOG = new Logger(DiscoveryCalendar, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.chartOpts = this.convert(this.result || new DataModel());
    this.setOpts();
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts,
    });
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = { ...options };
    const series: any[] = [];
    const calendar: any[] = [];
    const titles: any[] = [];
    const visualMap: any[] = [];
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
    let cal = 0;
    let seriesIndex = 0;
    for (let i = 0; i < gtsCount; i++) {
      const datasetNoAlpha = (data.params ?? [])[i]?.datasetNoAlpha ?? this.innerOptions.datasetNoAlpha;
      const gts = gtsList[i];
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      const dataStruct = {};
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        // add title
        titles.push({
          text: ((data.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(gts),
          left: 'center',
          textStyle: {
            height: 20, fontSize: 12,
            color: Utils.getLabelColor(this.el),
          },
          top: this.CAL_SIZE * cal + seriesIndex * 20,
        });
        // Find min/max
        (gts.v || []).forEach((v: any[]) => {
          const value = v[v.length - 1];
          const d = GTSLib.toISOString(v[0], this.divider, this.innerOptions.timeZone, undefined);
          const y = d.split('-')[0];
          dataStruct[y] = dataStruct[y] || {};
          // Aggregation
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          dataStruct[y][d] = dataStruct[y][d] + value || value;
          min = Math.min(min, dataStruct[y][d]);
          max = Math.max(max, dataStruct[y][d]);
        });
        Object.keys(dataStruct).forEach(currentRange => {
          // Add VisualMap and Calendar
          visualMap.push({
            min, max, show: false,
            seriesIndex: cal,
            color: ColorLib.getHeatMap(((data.params || [])[i] || {}).scheme || this.innerOptions.scheme),
          });
          calendar.push({
            top: this.CAL_SIZE * cal + (seriesIndex + 1) * 20 + 20,
            range: currentRange,
            cellSize: ['auto', 15],
            itemStyle: {
              color: 'transparent',
              borderWidth: 1,
              borderColor: ColorLib.transparentize(Utils.getGridColor(this.el), datasetNoAlpha ? 1 : 0.5),
            },
            splitLine: { lineStyle: { width: 2, color: Utils.getGridColor(this.el) } },
            dayLabel: {
              firstDay: this.innerOptions.calendar?.firstDay || 0,
              nameMap: this.innerOptions.calendar?.dayLabel,
              color: Utils.getLabelColor(this.el),
            },
            monthLabel: {
              nameMap: this.innerOptions.calendar?.monthLabel,
              color: Utils.getLabelColor(this.el),
            },
            yearLabel: { color: Utils.getLabelColor(this.el) },
          });
          series.push({
            type: 'heatmap',
            coordinateSystem: 'calendar',
            name: ((data.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(gts),
            calendarIndex: cal,
            data: Object.keys(dataStruct[currentRange]).map(d => [d, dataStruct[currentRange][d]]),
          } as SeriesOption);
          cal++;
        });
        seriesIndex++;
      }
    }
    this.height = this.CAL_SIZE * cal + titles.length * 20 + 40;
    this.LOG?.debug(['convert', 'series'], { series, calendar, visualMap, titles });
    return {
      title: titles,
      grid: {
        left: 10, top: 10, bottom: 10, right: 10,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay || 100,
        formatter: (params: any) => {
          return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
            GTSLib.toISOString(
              GTSLib.toTimestamp(params.value[0], this.divider, this.innerOptions.timeZone),
              this.divider, this.innerOptions.timeZone,
              this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined,
            ).replace('T', ' ').replace('Z', '')}</div>
            ${params.marker}
            <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${params.seriesName}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">
            ${params.value[1]}</span>`;
        },
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: { type: 'png', excludeComponents: ['toolbox'] },
        },
      },
      legend: { bottom: 10, left: 'center', show: false },
      visualMap,
      series,
      calendar,
      ...this.innerOptions?.extra?.chartOpts || {},
    } as EChartsOption;
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({
      type,
      excludeComponents: ['toolbox'],
    }) : undefined);
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
        this.myChart.setOption(this.chartOpts ?? {}, notMerge, true);
      }
    });
  }

  componentDidLoad() {
    setTimeout(() => {
      this.parsing = false;
      this.rendering = true;
      let initial = false;
      this.myChart = echarts.init(this.graph, null, {
        width: this.width,
        height: this.height ? this.height - 10 : undefined,
      });
      this.myChart.on('rendered', () => {
        this.rendering = false;
        if (initial) {
          setTimeout(() => this.draw.emit());
          initial = false;
        }
      });
      this.myChart.on('mouseover', (event: any) => {
        this.dataPointOver.emit({ date: event.value[0], name: event.seriesName, value: event.value[1], meta: {} });
      });
      this.el.addEventListener('mouseout', () => this.dataPointOver.emit({}));
      this.myChart.on('click', (event: any) => {
        this.dataPointSelected.emit({ date: event.value[0], name: event.seriesName, value: event.value[1], meta: {} });
      });
      this.myChart.setOption(this.chartOpts || {}, true, false);
      initial = true;
    });
  }

  render() {
    return <div class="calendar-wrapper">
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el} />
    </div>;
  }
}
