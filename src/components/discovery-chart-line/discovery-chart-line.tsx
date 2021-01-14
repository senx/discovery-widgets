import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from '@stencil/core';
import * as echarts from 'echarts';
import {EChartsOption} from 'echarts';
import {GTSLib} from '../../utils/gts.lib';
import {GTS} from "../../model/GTS";
import {SeriesOption} from "echarts/lib/util/types";
import {ColorLib} from "../../utils/color-lib";
import {Utils} from "../../utils/utils";

type ECharts = ReturnType<typeof echarts.init>;

@Component({
  tag: 'discovery-chart-line',
  styleUrl: 'discovery-chart-line.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() result: string;
  @Element() el: HTMLElement;
  @Event() draw: EventEmitter<void>;

  @Prop() width: number;
  @Prop() height: number;
  data = [];

  graph: HTMLDivElement;
  private options: EChartsOption;

  @Watch('result')
  updateRes() {
    console.log('updateRes', this.result)

  }
  componentWillLoad() {
    this.options = this.convert(this.result || '[]')
  }

  componentDidLoad() {
    const myChart = echarts.init(this.graph, null, {
      renderer: 'svg',
      width: this.width,
      height: this.height
    });
    myChart.on('finished', () => {
      this.drawn();
    });
    setTimeout(() => myChart.setOption(this.options));
  }

  private drawn() {
    this.draw.emit();
  }


  convert(data: string) {
    const gtsList = GTSLib.getData(data);
    const series: any[] = [];
    GTSLib.flatDeep((gtsList.data as unknown as GTS[]))
      .filter(gts => !!gts.v)
      .forEach((gts, i) => {
        series.push(
          {
            type: 'line',
            name: GTSLib.serializeGtsMetadata(gts),
            data: gts.v.map(d => [d[0] / 1000, d[d.length - 1]]),
            animation: false,
            polyline: true,
            large: true,
            showSymbol: false,
            symbolSize: 1,
            clip: false,
            showAllSymbol: false,
            // coordinateSystem: 'cartesian2d',
            color: Utils.getColor(i),
            emphasis: {
              focus: 'series'
            },
            /* emphasis: {
               focus: 'series',
               blurScope: 'coordinateSystem'
             },
            lineStyle: {
              color: Utils.getColor(i),
              opacity: 0.3
            }*/
          } as SeriesOption);
      });
    return {
      progressive: 20000,
      title: {
        //  text: 'ECharts entry example'
      },
      throttle: 70,
      color: ColorLib.color.WARP10,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        position: function (pos, params, el, elRect, size) {
          var obj = {top: 10};
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
          return obj;
        }
      },
      toolbox: {
        feature: {
          saveAsImage: {}
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
          show: false
        },
        {
          type: 'inside'
        }
      ],
      series: series
    } as EChartsOption;
  }

  render() {
    return <div style={{width: this.width + 'px', height: this.height + 'px'}}>
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
    </div>;
  }
}
