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
import elementResizeEvent from "element-resize-event";

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

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryGauge, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel())
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      chartOpts: this.chartOpts
    });
    elementResizeEvent(this.el.parentElement, () => this.resize());
  }

  disconnectedCallback() {
    elementResizeEvent.unbind(this.el.parentElement);
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
      pointer: {show: false},
      title: {
        fontSize: 12,
        offsetCenter: [0, 10],
        color: Utils.getLabelColor(this.el)
      },
      toolbox: {
        show: (this.options as Param).showControls,
        feature: {
          saveAsImage: { type: 'png' }
        }
      },
      splitLine: {show: false},
      axisLabel: {show: false},
      splitNumber: 4, // The number of split segments on the axis
      axisTick: {
        distance: 0,
        splitNumber: 4,
        lineStyle: {width: 1, color: Utils.getGridColor(this.el)}
      },
      axisLine: {roundCap: false, lineStyle: {width: 20}},
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
    const radius = Math.round(100 / Math.ceil(gtsCount / 2)) * 0.8;
    let floor = 1;
    dataStruct.forEach((d, i) => {
      if (i % 2 === 0) {
        floor++;
      }
      const c = ColorLib.getColor(i, (this.options as Param).scheme);
      const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
      series.push({
        ...this.getCommonSeriesParam(color),
        name: d.key,
        min: d.min,
        max: Math.max(d.max, overallMax),
        startAngle: this.type === 'gauge' ? 180 : 270,
        endAngle: this.type === 'gauge' ? 0 : -90,
        progress: {show: true, roundCap: false, width: 20},
        data: [{value: d.value, name: d.key}],
        radius: radius + '%',
        detail: {
          formatter: '{value}' + (this.unit || ''),
          fontSize: 12,
          offsetCenter: [0, this.type === 'gauge' ? '-20%' : 0],
          color: Utils.getLabelColor(this.el)
        },
        center: [
          (gtsCount === 1 ? '50' : i % 2 === 0 ? '25' : '75') + '%',
          (gtsCount === 1 ? (this.type === 'gauge' ? '65' : '50') : (radius * (floor - 1) - radius / 2 + 10)) + '%'
        ]
      })
    });
    return {
      grid: {
        left: 10, top: 10, bottom: 10, right: 10,
        containLabel: true
      },
      legend: {
        bottom: 10,
        left: 'center',
        show: false
      },
      series
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

  @Method()
  async export(type: 'png'|'svg' = 'png') {
    return this.myChart? this.myChart.getDataURL({type}): undefined;
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

  private drawChart() {
    const series = [];
    setTimeout(() => {
      (this.chartOpts.series as SeriesOption[]).forEach(s => {
        s.detail.fontSize = this.autoFontSize((this.chartOpts.series as SeriesOption[]).length);
        series.push(s);
      })
      this.chartOpts.series = series;
      this.myChart.setOption(this.chartOpts || {})
    });
  }

  private drawn() {
    this.draw.emit();
  }
}
