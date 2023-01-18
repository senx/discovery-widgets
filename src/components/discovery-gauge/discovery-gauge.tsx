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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {ChartType, DataModel, ECharts} from '../../model/types';
import {Param} from '../../model/param';
import * as echarts from 'echarts';
import {EChartsOption} from 'echarts';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {ColorLib} from '../../utils/color-lib';
import {Utils} from '../../utils/utils';
import {SeriesOption} from 'echarts/lib/util/types';

@Component({
  tag: 'discovery-gauge',
  styleUrl: 'discovery-gauge.scss',
  shadow: true,
})
export class DiscoveryGauge {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = new Param();
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

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.setOpts(true);
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
  async hideById(id: number) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => s.id === id)
    });
    return Promise.resolve();
  }

  @Method()
  async showById(id: number) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).filter(s => s.id === id)
    });
    return Promise.resolve();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryGauge, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel())
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts
    });
  }

  private setOpts(notMerge = false) {
    const series = [];
    (this.chartOpts?.series as SeriesOption[]).forEach(s => {
      s.detail.fontSize = this.autoFontSize((this.chartOpts.series as SeriesOption[]).length);
      series.push(s);
    })
    this.chartOpts.series = series;
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
    return {
      type: 'gauge',
      animation: true,
      large: true,
      clip: false,
      startAngle: 180,
      endAngle: 0,
      lineStyle: {color},
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']}
        }
      },
      splitLine: {show: false},
      splitNumber: 4, // The number of split segments on the axis
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
          colorStops: [
            {offset: 0, color},
            {offset: 1, color: ColorLib.transparentize(color, 0.4)}
          ],
          global: false // false by default
        }
      }
    } as SeriesOption
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = {...options};
    const series: any[] = [];
    // noinspection JSUnusedAssignment
    let gtsList = [];
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
    this.LOG?.debug(['convert'], {options: this.innerOptions, gtsList});
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
        let min = 0;
        if (!!data.params && !!data.params[i] && !!data.params[i].minValue) {
          min = data.params[i].minValue;
        }
        dataStruct.push({
          id: gts.id,
          name: ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts),
          key: ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts),
          value,
          max,
          min
        });
      } else {
        // custom data format
        let max: number = this.innerOptions.maxValue || Number.MIN_VALUE;
        if (!!data.params && !!data.params[i] && !!data.params[i].maxValue) {
          max = data.params[i].maxValue;
          overallMax = Math.max(max, overallMax);
        } else {
          overallMax = Math.max((gts.hasOwnProperty('value') ? gts.value : gts) || Number.MIN_VALUE, overallMax);
        }
        let min = 0;
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
    const radius = Math.round(100 / Math.ceil(gtsCount / 2)) * (this.type === 'compass' ? 0.8 : 0.8);
    let floor = 1;
    dataStruct.forEach((d, i) => {
      if (i % 2 === 0) {
        floor++;
      }
      const c = ColorLib.getColor(i, this.innerOptions.scheme);
      const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
      const unit = ((data.params || [])[i] || {}).unit || this.innerOptions.unit || this.unit || '';
      const angles = DiscoveryGauge.getAngles(this.type)
      series.push({
        ...this.getCommonSeriesParam(color),
        name: d.key,
        min: d.min,
        id: d.id,
        max: d.max === Number.MIN_VALUE ? overallMax : d.max,
        startAngle: angles.s,
        endAngle: angles.e,
        tooltip: {
          backgroundColor: Utils.getCSSColor(this.el, '--warp-view-tooltip-bg-color', 'white'),
          hideDelay: this.innerOptions.tooltipDelay || 100,
          formatter: '{a} <br/>{b} : {c}%'
        },
        title: {
          fontSize: 12,
          offsetCenter: this.type === 'compass' ? [0, '110%'] : [0, 10],
          color: Utils.getLabelColor(this.el)
        },
        axisLine: this.type === 'compass' ? {
          lineStyle: {
            color: [[1, Utils.getGridColor(this.el)]],
            width: 1
          }
        } : {roundCap: false, lineStyle: {width: 20}},
        axisTick: this.type === 'compass' ? {
          distance: 0,
          length: 10,
          lineStyle: {color: Utils.getGridColor(this.el)}
        } : {
          distance: 0,
          splitNumber: 4,
          lineStyle: {width: 1, color: Utils.getGridColor(this.el)}
        },
        axisLabel: this.type === 'compass' ? {
          color: Utils.getLabelColor(this.el),
          distance: 0,
          formatter: value => value === d.max ? '' : `${value}`
        } : {show: false},
        progress: this.type === 'compass'
          ? {show: false}
          : {show: true, roundCap: false, width: 20},
        data: [{value: d.value, name: d.key}],
        anchor: this.type === 'compass' ? {
          show: true,
          size: 10,
          itemStyle: {borderColor: color, borderWidth: 10}
        } : {show: false},
        pointer: this.type === 'compass' ? {
          offsetCenter: [0, '40%'],
          length: '140%',
          itemStyle: {color}
        } : {show: false},
        radius: `${radius}%`,
        detail: {
          formatter: '{value}' + unit,
          fontSize: 12,
          offsetCenter: [0, this.type === 'gauge' ? '-20%' : this.type === 'compass' ? 40 : 0],
          color: Utils.getLabelColor(this.el)
        },
        center: [
          (gtsCount === 1 ? '50' : i % 2 === 0 ? '25' : '75') + '%',
          `${(gtsCount === 1
            ? (this.type === 'gauge' ? '65' : '50')
            : (radius * (floor - 1) - radius / 2 + (floor > 2 ? 15 : 5)))}%`
        ]
      });
    });
    return {
      grid: {
        left: 10, top: 10, bottom: 10, right: 10,
        containLabel: true
      },
      legend: {show: false},
      series,
      ...this.innerOptions?.extra?.chartOpts || {}
    } as EChartsOption;
  }

  autoFontSize(size: number) {
    if (this.el.getBoundingClientRect().height > 0) {
      const count = size > 1;
      return (this.el.getBoundingClientRect().height >= 700) ? 50 : (this.el.getBoundingClientRect().height / 10) / (count ? 4 : 1);
    } else {
      return 12;
    }
  };

  componentDidLoad() {
    setTimeout(() => {
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
      this.el.addEventListener('mouseout', () => this.dataPointOver.emit({}));
      this.myChart.on('click', (event: any) => {
        this.dataPointSelected.emit({date: event.value[0], name: event.seriesName, value: event.value[1], meta: {}});
      });
      this.setOpts();
      initial = true;
    });
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined);
  }

  render() {
    return <div style={{width: '100%', height: '100%'}}>
      <div ref={(el) => this.graph = el}/>
      {this.parsing ? <div class="discovery-chart-spinner">
        <discovery-spinner>Parsing data...</discovery-spinner>
      </div> : ''}
      {this.rendering ? <div class="discovery-chart-spinner">
        <discovery-spinner>Rendering data...</discovery-spinner>
      </div> : ''}
    </div>
  }

  private static getAngles(type: ChartType) {
    switch (type) {
      case 'compass':
        return {s: 90, e: -270};
      case 'gauge':
        return {s: 180, e: 0};
      default:
        return {s: 270, e: -90};
    }
  }
}
