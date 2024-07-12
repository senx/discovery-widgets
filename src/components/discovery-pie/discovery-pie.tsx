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
import { EChartsOption } from 'echarts';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import { ColorLib } from '../../utils/color-lib';
import { SeriesOption } from 'echarts/lib/util/types';

@Component({
  tag: 'discovery-pie',
  styleUrl: 'discovery-pie.scss',
  shadow: true,
})
export class DiscoveryPieComponent {
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

  @Watch('type')
  updateType(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.chartOpts = this.convert(GTSLib.getData(this.result));
      this.setOpts(true);
    }
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

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryPieComponent, this.debug);
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
    });
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

  private getCommonSeriesParam() {
    return {
      type: 'pie',
      animation: true,
      large: true,
      clip: false,
      radius: this.type === 'pie' ? '70%' : this.type === 'rose' ? ['30%', '90%'] : ['40%', '90%'],
      roseType: this.type === 'rose' ? 'area' : undefined,
      label: {
        position: 'outside',
        overflow: 'none',
        color: Utils.getLabelColor(this.el),
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    } as SeriesOption;
  }

  private getCommonDataParam(color: any) {
    const datasetNoAlpha = this.innerOptions.datasetNoAlpha;
    return {
      lineStyle: { color },
      labelLine: {
        color: Utils.getGridColor(this.el),
      },
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.7) },
            { offset: 1, color: ColorLib.transparentize(color, datasetNoAlpha ? 1 : 0.3) },
          ],
          global: false, // false by default
        },
      },
    };
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = { ...options };
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
    const dataStruct = [];
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      const c = ColorLib.getColor(gts.id || i, this.innerOptions.scheme);
      const color = ((data.params || [])[i] || { datasetColor: c }).datasetColor || c;
      if (GTSLib.isGtsToPlot(gts)) {
        const values = (gts.v || []);
        const val = values[values.length - 1] || [];
        let value = 0;
        if (val.length > 0) {
          value = val[val.length - 1];
        }
        dataStruct.push({
          ...this.getCommonDataParam(color),
          id: gts.id,
          name: ((data.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(gts),
          value,
        });
      } else if (!GTSLib.isGts(gts)) {
        if (gts.hasOwnProperty('key')) {
          dataStruct.push({
            ...this.getCommonDataParam(color),
            name: gts.key || '',
            value: gts.value || Number.MIN_VALUE,
          });
        } else {
          Object.keys(gts).forEach((k, j) => {
            const schemeColor = ColorLib.getColor(j, this.innerOptions.scheme);
            const datasetColor = ((data.params || [])[i] || { datasetColor: schemeColor }).datasetColor || schemeColor;
            dataStruct.push({
              ...this.getCommonDataParam(datasetColor),
              name: k,
              value: gts[k],
            });
          });
        }
      }
    }
    if (dataStruct.length > 0) {
      series.push({
        ...this.getCommonSeriesParam(),
        data: dataStruct,
      } as SeriesOption);
    }
    this.LOG?.debug(['convert', 'series'], series);
    return {
      grid: {
        left: 0, top: 0, bottom: 0, right: 0,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
        hideDelay: this.innerOptions.tooltipDelay || 100,
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: { type: 'png', excludeComponents: ['toolbox'] },
        },
      },
      legend: {
        bottom: 10,
        left: 'center',
        show: false,
      },
      series,
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

  componentDidLoad() {
    setTimeout(() => {
      this.height = Utils.getContentBounds(this.el.parentElement).h;
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
    return <div style={{ width: '100%', height: '100%' }}>
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el} />
    </div>;
  }
}
