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
import {ChartType, ECharts} from '../../model/types';
import {Param} from '../../model/param';
import * as echarts from 'echarts';
import {EChartsOption} from 'echarts';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {Utils} from '../../utils/utils';
import {ColorLib} from '../../utils/color-lib';
import {SeriesOption} from 'echarts/lib/util/types';
import {DataModel} from '../../model/dataModel';
import {XAXisOption} from 'echarts/types/dist/shared';

@Component({
  tag: 'discovery-bar',
  styleUrl: 'discovery-bar.scss',
  shadow: true,
})
export class DiscoveryBarComponent {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = {...new Param(), timeMode: 'date'};
  @Prop() width: number;
  @Prop({mutable: true}) height: number;
  @Prop() debug = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start: number, end: number, min: number, max: number }>;
  @Event() leftMarginComputed: EventEmitter<number>;
  @Event() dataPointOver: EventEmitter;
  @Event() timeBounds: EventEmitter;

  @State() parsing = false;
  @State() rendering = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = {...new Param(), timeMode: 'date'};
  private LOG: Logger;
  private divider = 1000;
  private myChart: ECharts;
  private leftMargin: number;
  private hasFocus = false;

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result));
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
  async setZoom(dataZoom: { start: number, end: number }) {
    if (this.myChart) {
      this.myChart.dispatchAction({type: 'dataZoom', ...dataZoom});
    }
    return Promise.resolve();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryBarComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.chartOpts = this.convert(this.result || new DataModel())
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts
    });
    this.LOG?.debug(['componentWillLoad'], this.el.parentElement.parentElement);
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
    const isHorizontal = !!this.innerOptions.bar && !!this.innerOptions.bar.horizontal;
    return {
      type: 'bar',
      stack: (this.innerOptions.bar || {stacked: false}).stacked ? 'total' : undefined,
      animation: !!this.innerOptions?.bar?.animate,
      large: true,
      clip: false,
      emphasis: {
        focus: 'series',
        itemStyle: {
          opacity: 1,
          borderColor: color,
          color: ColorLib.transparentize(color, 0.8)
        }
      },
      blur: {
        lineStyle: {color},
        itemStyle: {
          opacity: 0.8,
          borderColor: color,
          color: {
            type: 'linear', x: isHorizontal ? 1 : 0, y: 0, x2: 0, y2: isHorizontal ? 0 : 1,
            colorStops: [
              {offset: 0, color: ColorLib.transparentize(color, 0.7)},
              {offset: 1, color: ColorLib.transparentize(color, 0.3)}
            ]
          }
        }
      },
      lineStyle: {color},
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: isHorizontal ? 1 : 0, y: 0, x2: 0, y2: isHorizontal ? 0 : 1,
          colorStops: [
            {offset: 0, color: ColorLib.transparentize(color, 0.7)},
            {offset: 1, color: ColorLib.transparentize(color, 0.3)}
          ]
        }
      }
    } as SeriesOption
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = {...options};
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
    this.LOG?.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let hasTimeBounds = false;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id || i, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        min = Math.min(min, ...gts.v.map(v => v[0]));
        max = Math.max(max, ...gts.v.map(v => v[0]));
        hasTimeBounds = true;
        series.push({
          ...this.getCommonSeriesParam(color),
          name: ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts),
          data: gts.v.sort((a, b) => a[0] < b[0] ? -1 : 1).map(d => {
            const ts = this.innerOptions.timeMode === 'date'
              ? GTSLib.utcToZonedTime(d[0], this.divider, this.innerOptions.timeZone)
              : d[0];
            if (!!(this.innerOptions.bar || {horizontal: false}).horizontal) {
              return [d[d.length - 1], ts];
            } else {
              return [ts, d[d.length - 1]]
            }
          })
        } as SeriesOption);
      } else if (!gts.v) {
        this.innerOptions.timeMode = 'custom';
        this.LOG?.debug(['convert', 'gts'], gts);
        (gts.columns || []).forEach((label, index: number) => {
          const c = ColorLib.getColor(gts.id || index, this.innerOptions.scheme);
          const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
          series.push({
            ...this.getCommonSeriesParam(color),
            name: label,
            data: gts.rows.map(r => {
              if (!!(this.innerOptions.bar || {horizontal: false}).horizontal) {
                return [r[index + 1], r[0]];
              } else {
                return [r[0], r[index + 1]]
              }
            })
          } as SeriesOption);
        });
      }
    }
    if (hasTimeBounds) {
      this.timeBounds.emit({min, max});
    }
    this.LOG?.debug(['convert', 'series'], series);
    const opts = {
      animation: !!this.innerOptions?.bar?.animate,
      grid: {
        left: 10, top: !!(this.unit || this.innerOptions.unit) ? 30 : 10,
        bottom: !!this.innerOptions.showLegend ? 30 : 10,
        right: 10,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {type: 'shadow'},
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        formatter: (params) => {
          return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
            this.innerOptions.timeMode !== 'date'
              ? params[0].value[0]
              : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].value[0], 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined) || '')
                .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}</div>
               ${params.map(s => `${s.marker} <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${s.seriesName}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${s.value[1]}</span>`
          ).join('<br>')}`;
        },
        position: (pos, params, el, elRect, size) => {
          const obj = {top: 10};
          if (this.hasFocus) {
            const date = this.innerOptions.timeMode === 'date'
              ? GTSLib.zonedTimeToUtc(params[0]?.data[0] || 0, 1, this.innerOptions.timeZone) * this.divider
              : params[0]?.data[0] || 0;
            let value = 0;
            const regexp = '(' + (params as any[]).map(s => {
              const gts = this.chartOpts.series[s.seriesIndex]
              const coords = this.myChart.convertFromPixel({
                yAxisIndex: gts.yAxisIndex || 0,
                xAxisIndex: gts.xAxisIndex || 0
              }, pos) || [0, 0];
              value = coords[1];
              return s.seriesName;
            }).join('|') + ')';
            this.dataPointOver.emit({date, name: regexp, value, meta: {}});
          }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
          return obj;
        }
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']},
          dataZoom: {show: true, filterMode: 'none'},
          restore: {show: true},
        }
      },
      legend: {
        bottom: 0, left: 'center', show: !!this.innerOptions.showLegend, height: 30, type: 'scroll',
        textStyle: {color: Utils.getLabelColor(this.el)}
      },
      xAxis: {
        show: !this.innerOptions.hideXAxis,
        type: !!(this.innerOptions.bar || {horizontal: false}).horizontal ? 'value' : 'category',
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        axisLabel: {
          color: Utils.getLabelColor(this.el),
          formatter: value =>
            !!(this.innerOptions.bar || {horizontal: false}).horizontal
              ? value
              : this.innerOptions.timeMode === 'date'
                ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                  .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
                : value
        },
        axisTick: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        min:
          !!(this.innerOptions.bar || {horizontal: false}).horizontal
            ? this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[0] : undefined
            : !!this.innerOptions.bounds && this.innerOptions.bounds.minDate !== undefined
              ? this.innerOptions.timeMode === 'date'
                ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(this.innerOptions.bounds.minDate, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                  .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
                : this.innerOptions.bounds.minDate
              : undefined,
        max:
          !!(this.innerOptions.bar || {horizontal: false}).horizontal
            ? this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[1] : undefined
            : !!this.innerOptions.bounds && this.innerOptions.bounds.maxDate !== undefined
              ? this.innerOptions.timeMode === 'date'
                ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(this.innerOptions.bounds.maxDate, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                  .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
                : this.innerOptions.bounds.maxDate
              : undefined,
      },
      yAxis: {
        name: this.unit || this.innerOptions.unit,
        show: !this.innerOptions.hideYAxis,
        nameTextStyle: {color: Utils.getLabelColor(this.el)},
        type: !!(this.innerOptions.bar || {horizontal: false}).horizontal ? 'category' : 'value',
        splitLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        axisLabel: {
          color: Utils.getLabelColor(this.el),
          formatter: value =>
            !!(this.innerOptions.bar || {horizontal: false}).horizontal
              ? this.innerOptions.timeMode === 'date'
                ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                  .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
                : value
              : value
        },
        axisTick: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        min: !!(this.innerOptions.bar || {horizontal: false}).horizontal
          ? !!this.innerOptions.bounds && this.innerOptions.bounds.minDate !== undefined
            ? this.innerOptions.timeMode === 'date'
              ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(this.innerOptions.bounds.minDate, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
              : this.innerOptions.bounds.minDate
            : undefined
          : this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[0] : undefined,
        max: !!(this.innerOptions.bar || {horizontal: false}).horizontal
          ? !!this.innerOptions.bounds && this.innerOptions.bounds.maxDate !== undefined
            ? this.innerOptions.timeMode === 'date'
              ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(this.innerOptions.bounds.maxDate, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
              : this.innerOptions.bounds.maxDate
            : undefined
          : this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[1] : undefined,
      },
      dataZoom: [
        {
          type: 'slider',
          height: '20px',
          show: !!this.innerOptions.showRangeSelector,
          filterMode: 'none'
        },
        {
          type: 'inside',
          filterMode: 'none',
          orient: 'vertical',
          zoomOnMouseWheel: 'ctrl',
        },
        {
          type: 'inside',
          filterMode: 'none',
          orient: 'horizontal',
          zoomOnMouseWheel: true,
        }
      ],
      series
    } as EChartsOption;
    const markArea = (this.innerOptions.thresholds || [])
      .map(t => {
        const m = [{itemStyle: {color: ColorLib.transparentize(t.color || '#f44336', !!t.fill ? 0.3 : 0)}}, {}] as any[];
        if (!!(this.innerOptions.bar || {horizontal: false}).horizontal) {
          m[0].xAxis = t.value || 0;
          m[1].xAxis = 0;
          m[0].name = `${t.value || 0}`
          m[0].label = {color: t.color || '#f44336', position: 'insideTopRight'}
        } else {
          m[0].yAxis = t.value || 0;
          m[1].yAxis = 0;
        }
        return m;
      });

    const markLine = (this.innerOptions.thresholds || [])
      .map(t => {
        const m = {
          name: t.value || 0,
          label: {color: t.color || '#f44336', position: 'insideEndTop'},
          lineStyle: {color: t.color || '#f44336', type: 'dashed'}
        } as any;
        if (!!(this.innerOptions.bar || {horizontal: false}).horizontal) {
          m.xAxis = t.value || 0;
          m.label.show = false;
        } else {
          m.yAxis = t.value || 0;
        }
        return m;
      });
    (opts.series as SeriesOption[]).push({
      name: '',
      type: 'line',
      symbolSize: 0,
      data: [],
      markArea: {
        data: markArea
      },
      markLine: {
        emphasis: {lineStyle: {width: 1}},
        symbol: ['none', 'none'],
        data: markLine
      }
    });
    this.parsing = false;
    return opts;
  }

  componentDidLoad() {
    setTimeout(() => {
      this.height = Utils.getContentBounds(this.el.parentElement).h;
      this.parsing = false;
      this.rendering = true;
      let initial = false;
      this.myChart = echarts.init(this.graph);
      this.myChart.on('rendered', () => {
        this.rendering = false;
        if (initial) {
          setTimeout(() => this.draw.emit());
          initial = false;
        }
        let found = false;
        let x = 0;
        while (!found) {
          found = this.myChart.containPixel({gridIndex: 0}, [x, this.myChart.getHeight() / 2]);
          x++;
        }
        if (this.leftMargin !== x) {
          setTimeout(() => this.leftMarginComputed.emit(x));
          this.leftMargin = x;
        }
      });
      this.myChart.on('dataZoom', (event: any) => {
        const {start, end} = (event.batch || [])[0] || {};
        if (start && end) {
          const dataZoom = this.myChart.getOption().dataZoom[1];
          this.dataZoom.emit({start, end, min: dataZoom.startValue, max: dataZoom.endValue});
        }
      });
      this.myChart.on('restore', () => {
        const dataZoom = this.myChart.getOption().dataZoom[1];
        this.dataZoom.emit({
          start: dataZoom.startValue,
          end: dataZoom.endValue,
          min: dataZoom.startValue,
          max: dataZoom.endValue
        });
      });
      this.el.addEventListener('dblclick', () => this.myChart.dispatchAction({type: 'restore'}));
      this.el.addEventListener('mouseover', () => this.hasFocus = true);
      this.el.addEventListener('mouseout', () => this.hasFocus = false);
      this.setOpts();
      initial = true;
    });
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined);
  }

  @Method()
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  @Method()
  async setFocus(regexp: string, ts: number) {
    const date = this.innerOptions.timeMode === 'date'
      ? GTSLib.utcToZonedTime(ts || 0, this.divider, this.innerOptions.timeZone)
      : ts || 0;
    let seriesIndex = 0;
    let dataIndex = 0;
    if (!!regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(s.name))
        .forEach(s => {
          seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
          const data = s.data.filter(d => d[0] === date);
          if (data && data[0]) {
            dataIndex = s.data.indexOf(data[0]);
          }
        });
      this.myChart.dispatchAction({
        type: 'highlight',
        seriesName: (this.chartOpts.series as any[]).filter(s => new RegExp(regexp).test(s.name)).map(s => s.name)
      });
    }
    (this.chartOpts.xAxis as XAXisOption).axisPointer = {
      ...(this.chartOpts.xAxis as XAXisOption).axisPointer || {},
      value: dataIndex,
      status: 'show'
    };
    (this.chartOpts.tooltip as any).show = true;
    this.myChart.dispatchAction({type: 'showTip', seriesIndex, dataIndex});
    this.setOpts();
    return Promise.resolve();
  }

  @Method()
  async unFocus() {
    if (!this.myChart) return;
    (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
    (this.chartOpts.xAxis as any).axisPointer = {
      ...(this.chartOpts.xAxis as any).axisPointer || {},
      status: 'hide'
    };
    (this.chartOpts.yAxis as any).axisPointer = {
      ...(this.chartOpts.yAxis as any).axisPointer || {},
      status: 'hide'
    };
    this.myChart.dispatchAction({type: 'hideTip'});
    this.setOpts();
    return Promise.resolve();
  }


  render() {
    return <div style={{width: '100%', height: '100%'}}>
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el}/>
    </div>
  }

}
