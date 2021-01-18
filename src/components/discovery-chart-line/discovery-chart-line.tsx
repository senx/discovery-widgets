import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from '@stencil/core';
import * as echarts from 'echarts';
import {EChartsOption} from 'echarts';
import {GTSLib} from '../../utils/gts.lib';
import {GTS} from "../../model/GTS";
import {SeriesOption} from "echarts/lib/util/types";
import {ColorLib} from "../../utils/color-lib";
import {Utils} from "../../utils/utils";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {ChartType, ECharts} from "../../model/types";

@Component({
  tag: 'discovery-chart-line',
  styleUrl: 'discovery-chart-line.scss',
  shadow: true,
})
export class DiscoveryLineChartComponent {

  @Prop() result: string;
  @Prop() type: ChartType;
  @Prop() options: Param = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;

  @Element() el: HTMLElement;
  @Event() draw: EventEmitter<void>;
  @State() parsing: boolean = false;
  @State() rendering: boolean = false;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;

  @Watch('result')
  updateRes() {
    console.log('updateRes', this.result)
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLineChartComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });
    this.chartOpts = this.convert(this.result || '[]')
  }

  convert(dataStr: string) {
    const data = GTSLib.getData(dataStr);
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    const series: any[] = [];
    const gtsList = GTSLib.flatDeep((data.data as unknown as GTS[]));
    this.LOG.debug(['convert'], {options: this.options, gtsList});
    const gtsCount = gtsList.length;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const color = ColorLib.getColor(i, this.options.scheme);
        series.push({
          type: 'line',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [d[0] / 1000, d[d.length - 1]]),
          animation: false,
          polyline: false,
          large: true,
          showSymbol: false,
          symbolSize: 1,
          smooth: this.type === 'spline' ? 0.6 : undefined,
          clip: false,
          step: this.getStepShape(),
          areaStyle: this.type === 'area' ? {
            opacity: 0.8,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {offset: 0, color},
                {offset: 1, color: ColorLib.transparentize(color, 0.1)}
              ],
              global: false // false by default
            }
          } : undefined,
          showAllSymbol: false,
          lineStyle: {color},
          itemStyle: {color},
          // emphasis: {focus: 'series'},
          emphasis: {
            focus: 'series',
            blurScope: 'coordinateSystem'
          },
        } as SeriesOption);
      }
    }
    return {
      progressive: 20000,
      title: {
        //  text: 'ECharts entry example'
      },
      throttle: 70,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        position:  (pos, params, el, elRect, size) => {
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
      legend: {
        bottom: 10,
        left: 'center',
        show: false
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {},
      dataZoom: [
        {
          type: 'slider',
          height: '20px',
          show: !!this.options.showRangeSelector
        },
        {
          type: 'inside'
        }
      ],
      series: series
    } as EChartsOption;
  }

  private getStepShape() {
    switch (this.type) {
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
