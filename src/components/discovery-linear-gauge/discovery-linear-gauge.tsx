import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from '@stencil/core';
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
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private divider: number = 1000;
  private myChart: ECharts;

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.drawChart();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLinearGauge, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      chartOpts: this.chartOpts
    });
  }

  private getCommonSeriesParam(color) {
    const isHorizontal = !!(this.options as Param).gauge && !!(this.options as Param).gauge.horizontal;
    return {
      type: 'bar',
      animation: true,
      large: true,
      clip: false,
      lineStyle: {color},
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
    const isHorizontal = !!(this.options as Param).gauge && !!(this.options as Param).gauge.horizontal;
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
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
    this.LOG.debug(['convert'], {options: this.options, gtsList});
    const gtsCount = gtsList.length;
    let overallMax = this.options.maxValue || Number.MIN_VALUE;
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
        dataStruct.push({key: GTSLib.serializeGtsMetadata(gts), value, max, min});
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
      const c = ColorLib.getColor(i, (this.options as Param).scheme);
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
        min: isHorizontal ? (this.options as Param).minValue || 0 : undefined,
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
        min: !isHorizontal ? (this.options as Param).minValue || 0 : undefined,
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
          formatter: '{c}' + (this.unit || ''),
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
        min: this.options.minValue || 0,
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
      series: series
    } as EChartsOption;
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    this.myChart = echarts.init(this.graph, null, {
      renderer: 'svg',
      width: undefined,
      height: this.height
    });
    this.myChart.on('rendered', () => {
      this.rendering = false;
      this.drawn();
    });
    this.drawChart();
  }

  render() {
    return <div style={{height: this.height + 'px'}}>
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
      {this.parsing ? <div class="discovery-chart-spinner">
        <discovery-spinner>Parsing data...</discovery-spinner>
      </div> : ''}
      {this.rendering ? <div class="discovery-chart-spinner">
        <discovery-spinner>Rendering data...</discovery-spinner>
      </div> : ''}
    </div>
  }

  private drawChart() {
    const series = [];
    setTimeout(() => {
      this.LOG.debug(['drawChart'], {chartOpts: this.chartOpts});
      this.myChart.setOption(this.chartOpts)
    });
  }

  private drawn() {
    this.draw.emit();
  }
}
