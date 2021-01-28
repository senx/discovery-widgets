import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from '@stencil/core';
import * as echarts from 'echarts';
import {EChartsOption} from 'echarts';
import {GTSLib} from '../../utils/gts.lib';
import {SeriesOption} from "echarts/lib/util/types";
import {ColorLib} from "../../utils/color-lib";
import {Utils} from "../../utils/utils";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {ChartType, ECharts} from "../../model/types";
import {DataModel} from "../../model/dataModel";
import {CartesianAxisOption} from "echarts/lib/coord/cartesian/AxisModel";
import {GridOption} from "echarts/lib/coord/cartesian/GridModel";

@Component({
  tag: 'discovery-line',
  styleUrl: 'discovery-line.scss',
  shadow: true,
})
export class DiscoveryLineComponent {

  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private divider: number = 1000;

  @Watch('result')
  updateRes() {
    console.log('updateRes', this.result)
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLineComponent, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.chartOpts = this.convert(this.result as DataModel || new DataModel());
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    const gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
    this.LOG.debug(['convert'], {options: this.options, gtsList});
    const gtsCount = gtsList.length;
    let multiY = false;
    const opts: EChartsOption = {
      progressive: 20000,
      grid: {
        left: 0, top: 10, bottom: 0, right: 0,
        containLabel: true
      },
      title: {
        //  text: 'ECharts entry example'
      },
      throttle: 70,
      tooltip: {
        trigger: 'axis',
        axisPointer: {type: 'cross'},
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        position: (pos, params, el, elRect, size) => {
          const obj = {top: 10};
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
          return obj;
        }
      },
      toolbox: {
        feature: {
          //  saveAsImage: {}
        }
      },
      legend: {bottom: 10, left: 'center', show: false},
      xAxis: {
        type: 'time',
        axisLine: {lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLabel: {color: Utils.getLabelColor(this.el)},
        axisTick: {lineStyle: {color: Utils.getGridColor(this.el)}},
      },
      dataZoom: [
        {type: 'slider', height: '20px', show: !!this.options.showRangeSelector},
        {type: 'inside'}
      ],
      series: []
    };

    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id, this.options.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        const type = ((data.params || [])[i] || {type: this.type}).type || this.type;
        const s = {
          type: this.type === 'scatter' || gts.v.length <= 1 ? 'scatter': 'line',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [d[0] / this.divider, d[d.length - 1]]),
          animation: false,
          large: true,
          showSymbol: this.type === 'scatter' || this.options.showDots,
          smooth: type === 'spline' || type === 'spline-area' ? 0.4 : undefined,
          clip: false,
          step: DiscoveryLineComponent.getStepShape(type),
          areaStyle: type === 'area' || type === 'spline-area' ? {
            opacity: 0.8,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                {offset: 0, color},
                {offset: 1, color: ColorLib.transparentize(color, 0.1)}
              ],
              global: false // false by default
            }
          } : undefined,
          showAllSymbol: false,
          lineStyle: {color},
          itemStyle: {color}
        } as SeriesOption;
        if (!!data.params) {
          if (!!data.params[i] && data.params[i].yAxis !== undefined) {
            multiY = true;
            console.log('data.params[i].yAxis', data.params[i].yAxis)
            if (data.params[i].yAxis > 0) {
              (s as any).yAxisIndex = data.params[i].yAxis;
              const y = this.getYAxis(color);
              (y as any).position = 'right';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[data.params[i].yAxis] = y;
            } else {
              const y = this.getYAxis(color);
              (y as any).position = 'left';
              if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
              (opts.yAxis as any)[0] = y;
            }
            console.log('opts.yAxis', opts.yAxis)
          } else if (multiY) {
            const y = this.getYAxis();
            (y as any).position = 'left';
            if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
            (opts.yAxis as any)[0] = y;
          }
        }
        (opts.series as any[]).push(s);
      }
    }
    if (!multiY) {
      opts.yAxis = this.getYAxis();
    } else {
      const yAxis = [...GTSLib.cleanArray(opts.yAxis as any[])];
      opts.yAxis = [];
      let i = 0;
      yAxis.forEach((y: CartesianAxisOption) => {
        if (y.position === 'right') {
          y.offset = 80 * i;
          i++;
        }
        (opts.yAxis as any).push(y);
      });
      (opts.grid as GridOption).right = 80 * (i -1);
    }
    this.LOG.debug(['convert'], {opts});
    return opts as EChartsOption;
  }

  private getYAxis(color?: string): CartesianAxisOption {
    return {
      type: 'value',
      splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
      axisLine: {show: true, lineStyle: {color: color || Utils.getGridColor(this.el)}},
      axisLabel: {color: color || Utils.getLabelColor(this.el)},
      axisTick: {show: true, lineStyle: {color: color || Utils.getGridColor(this.el)}}
    }
  }

  private static getStepShape(type: ChartType) {
    switch (type) {
      case "line":
      case "area":
      case "spline":
        return undefined;
      case "step":
        return 'middle';
      case "step-before":
        return 'start';
      case "step-after":
        return 'end';
    }
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    const myChart: ECharts = echarts.init(this.graph, null, {
      renderer: 'svg',
      width: this.width,
      height: this.height
    });
    myChart.on('finished', () => {
      this.rendering = false;
      this.drawn();
    });
    setTimeout(() => myChart.setOption(this.chartOpts));
  }

  private drawn() {
    this.draw.emit();
  }

  render() {
    return <div style={{width: this.width + 'px', height: this.height + 'px'}}>
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
    </div>
  }
}
