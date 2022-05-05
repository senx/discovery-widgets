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

import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType, ECharts} from "../../model/types";
import {Param} from "../../model/param";
import * as echarts from "echarts";
import {EChartsOption} from "echarts";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {ColorLib} from "../../utils/color-lib";
import {Utils} from "../../utils/utils";
import {SeriesOption} from "echarts/lib/util/types";

@Component({
  tag: 'discovery-linear-gauge',
  styleUrl: 'discovery-linear-gauge.scss',
  shadow: true,
})
export class DiscoveryLinearGauge {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private divider: number = 1000;
  private myChart: ECharts;

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.setOpts(true);
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG.debug(['optionsUpdate'], newValue, oldValue);
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
        this.LOG.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
  }

  @Method()
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLinearGauge, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts
    });
  }

  private setOpts(notMerge = false) {
    if ((this.chartOpts?.series as any[] || []).length === 0) {
      this.chartOpts.title = {
        show: true,
        textStyle: {color: Utils.getLabelColor(this.el), fontSize: 20},
        text: this.innerOptions.noDataLabel || '',
        left: 'center',
        top: 'center'
      };
      this.chartOpts.xAxis = {show: false};
      this.chartOpts.yAxis = {show: false};
      this.chartOpts.tooltip = {show: false};
    } else {
      this.chartOpts.title = {...this.chartOpts.title || {}, show: false};
    }
    setTimeout(() => {
      this.myChart.setOption(this.chartOpts || {}, notMerge, true);
    });
  }

  private getCommonSeriesParam(color) {
    const isHorizontal = !!this.innerOptions.gauge && !!this.innerOptions.gauge.horizontal;
    return {
      type: 'bar',
      animation: true,
      large: true,
      clip: false,
      lineStyle: {color},
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']}
        }
      },
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: isHorizontal ? 1 : 0, y: 0, x2: 0, y2: isHorizontal ? 0 : 1,
          colorStops: [
            {offset: 0, color: ColorLib.transparentize(color, 0.7)},
            {offset: 1, color: ColorLib.transparentize(color, 0.3)}
          ],
          global: false // false by default
        }
      }
    } as SeriesOption
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.innerOptions = {...options};
    const isHorizontal = !!this.innerOptions.gauge && !!this.innerOptions.gauge.horizontal;
    const series: any[] = [];
    // noinspection JSUnusedAssignment
    let gtsList = [];
    if (GTSLib.isArray(data.data)) {
      data.data = GTSLib.flatDeep(data.data as any[]);
      this.LOG.debug(['convert', 'isArray']);
      if (data.data.length > 0 && GTSLib.isGts(data.data[0])) {
        this.LOG.debug(['convert', 'isArray 2']);
        gtsList = GTSLib.flattenGtsIdArray(data.data as any[], 0).res;
      } else {
        this.LOG.debug(['convert', 'isArray 3']);
        gtsList = data.data as any[];
      }
    } else {
      this.LOG.debug(['convert', 'not array']);
      gtsList = [data.data];
    }
    this.LOG.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let overallMax = this.innerOptions.maxValue || Number.MIN_VALUE;
    const dataStruct = [];
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGts(gts)) {
        let max: number = Number.MIN_VALUE;
        const values = (gts.v || []);
        const val = values[values.length - 1] || [];
        let value = 0;
        if (val.length > 0) {
          value = val[val.length - 1];
        }
        if (!!data.params && !!data.params[i] && !!data.params[i].maxValue) {
          max = data.params[i].maxValue;
        } else {
          if (overallMax < value) {
            overallMax = value;
          }
        }
        let min: number = 0;
        if (!!data.params && !!data.params[i] && !!data.params[i].minValue) {
          min = data.params[i].minValue;
        }
        dataStruct.push({key: ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts), value, max, min});
      } else {
        // custom data format
        let max: number = Number.MIN_VALUE;
        if (!!data.params && !!data.params[i] && !!data.params[i].maxValue) {
          max = data.params[i].maxValue;
        } else {
          if (overallMax < gts.value || Number.MIN_VALUE) {
            overallMax = gts.value || Number.MIN_VALUE;
          }
        }
        let min: number = 0;
        if (!!data.params && !!data.params[i] && !!data.params[i].minValue) {
          min = data.params[i].minValue;
        }
        if (gts.hasOwnProperty('value')) {
          dataStruct.push({key: gts.key || '', value: gts.value || 0, max, min});
        } else {
          dataStruct.push({key: '', value: gts || 0, max, min});
        }
      }
    }
    let floor = 1;

    this.LOG.debug(['convert', 'dataStruct'], dataStruct);
    const grid = [];
    const xAxis = [];
    const yAxis = [];
    const title = [];
    dataStruct.forEach((d, i) => {
      if (i % 2 === 0) {
        floor++;
      }
      const c = ColorLib.getColor(i, this.innerOptions.scheme);
      const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
      overallMax = Math.max(d.max, overallMax)
      title.push({
        textAlign: 'left',
        show: isHorizontal,
        text: d.key,
        top: 100 * i,
        textStyle: {
          fontWeight: 'normal',
          color: Utils.getLabelColor(this.el),
          fontSize: 14,
        },
        padding: [5, 10, 5, 10]
      })
      xAxis.push({
        gridIndex: i,
        boundaryGap: false,
        onZero: false,
        min: isHorizontal ? this.innerOptions.minValue || 0 : undefined,
        max: isHorizontal ? overallMax : undefined,
        type: isHorizontal ? 'value' : 'category',
        axisLine: {
          distance: 0,
          splitNumber: 4, show: false, lineStyle: {color: Utils.getGridColor(this.el)}
        },
        axisLabel: {show: false, color: Utils.getLabelColor(this.el)},
        axisTick: {
          distance: 0,
          splitNumber: 4, show: isHorizontal, lineStyle: {color: Utils.getGridColor(this.el)}
        }
      })
      yAxis.push({
        type: isHorizontal ? 'category' : 'value',
        gridIndex: i,
        min: !isHorizontal ? this.innerOptions.minValue || 0 : undefined,
        max: !isHorizontal ? overallMax : undefined,
        name: isHorizontal ? undefined : d.key,
        nameGap: isHorizontal ? undefined : -55,
        nameLocation: isHorizontal ? undefined : 'middle',
        position: isHorizontal ? 'left' : 'right',
        splitLine: {
          distance: 0,
          splitNumber: 4,
          show: false, lineStyle: {color: Utils.getGridColor(this.el)}
        },
        axisLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLabel: {
          distance: 0,
          splitNumber: 4,
          show: false, rotate: isHorizontal ? undefined : 90, color: Utils.getLabelColor(this.el)
        },
        axisTick: {
          distance: 0,
          splitNumber: 4, show: !isHorizontal, lineStyle: {color: Utils.getGridColor(this.el)}
        }
      })
      grid.push({
        height: isHorizontal ? 60 : undefined,
        width: isHorizontal ? 'auto' : 40,
        top: isHorizontal ? 100 * i + 25 : 10,
        left: isHorizontal ? 10 : 100 * i + 25,
        containLabel: true
      });
      series.push({
        ...this.getCommonSeriesParam(color),
        name: d.key,
        xAxisIndex: i,
        yAxisIndex: i,
        showBackground: true,
        backgroundStyle: {color: 'rgba(180, 180, 180, 0.2)'},
        data: [d.value],
        label: {
          position: isHorizontal ? 'insideRight' : 'insideTop',
          align: isHorizontal ? undefined : 'right',
          verticalAlign: isHorizontal ? undefined : 'middle',
          formatter: '{c}' + (this.unit || this.innerOptions.unit || ''),
          rotate: isHorizontal ? undefined : 90,
          show: true,
          color: '#fff'
        },
      })
    });
    return {
      grid: grid.length > 0 ? grid : undefined,
      title: title.length > 0 ? title : undefined,
      legend: {bottom: 10, left: 'center', show: false},
      tooltip: {},
      xAxis: xAxis.length > 0 ? xAxis : {
        min: this.innerOptions.minValue || 0,
        max: overallMax,
        type: isHorizontal ? 'value' : 'category',
        splitLine: {show: false},
        axisLine: {show: false},
        axisLabel: {show: false},
        axisTick: {show: false}
      },
      yAxis: yAxis.length > 0 ? yAxis : {
        type: isHorizontal ? 'category' : 'value',
        splitLine: {show: false},
        axisLine: {show: false},
        axisLabel: {show: false},
        axisTick: {show: false}
      },
      series
    } as EChartsOption;
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    let initial = false;
    this.myChart = echarts.init(this.graph, null, {
      width: undefined,
      height: this.height
    });
    this.myChart.on('rendered', () => {
      this.rendering = false;
      if (initial) {
        setTimeout(() => this.draw.emit());
        initial = false;
      }
    });
    this.myChart.on('mouseover', (event: any) => {
      this.dataPointOver.emit({date: event.value[0], name: event.seriesName, value: event.value[1], meta: {}});
    });
    this.setOpts();
    initial = true;
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined;
  }

  render() {
    return <div style={{width: '100%', height: '100%'}}>
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
      {this.parsing ? <div class="discovery-chart-spinner">
        <discovery-spinner>Parsing data...</discovery-spinner>
      </div> : ''}
      {this.rendering ? <div class="discovery-chart-spinner">
        <discovery-spinner>Rendering data...</discovery-spinner>
      </div> : ''}
    </div>
  }
}
