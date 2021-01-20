import {Component, Element, Event, EventEmitter, h, Host, Prop, State, Watch} from '@stencil/core';
import {ChartType, ECharts} from "../../model/types";
import {Param} from "../../model/param";
import * as echarts from "echarts";
import {EChartsOption} from "echarts";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import {ColorLib} from "../../utils/color-lib";
import {SeriesOption} from "echarts/lib/util/types";

@Component({
  tag: 'discovery-annotation',
  styleUrl: 'discovery-annotation.scss',
  shadow: true,
})
export class DiscoveryAnnotation {
  @Prop() result: string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @State()
  @Prop() height: number;
  @Prop() debug: boolean = false;

  @Element() el: HTMLElement;
  @Event() draw: EventEmitter<void>;
  @State() parsing: boolean = false;
  @State() rendering: boolean = false;

  private graph: HTMLDivElement;
  @State()
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private expanded: boolean = false;
  private displayExpander: boolean = false;
  private myChart: ECharts;

  @Watch('result')
  updateRes() {
    console.log('updateRes', this.result)
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(this, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.LOG.debug(['componentWillLoad'], {type: this.type, options: this.options});
    this.chartOpts = this.convert(this.result || '[]')
  }

  convert(dataStr: string) {
    const data = GTSLib.getData(dataStr);
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    const series: any[] = [];
    const gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
    this.LOG.debug(['convert'], {options: this.options, gtsList});
    const gtsCount = gtsList.length;
    let linesCount = 1;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (!GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id, this.options.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        this.displayExpander = i > 1;
        if (this.expanded) linesCount++;
        series.push({
          type: 'scatter',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [d[0] / 1000, (this.expanded ? i : 0) + 0.5]),
          animation: false,
          large: true,
          showSymbol: true,
          symbol: 'rect',
          symbolSize: [2, 30],
          clip: true,
          showAllSymbol: true,
          itemStyle: {color},
        } as SeriesOption);
      }
    }
    this.height = 50 + (linesCount * 30);
    this.LOG.debug(['convert'], {expanded: this.expanded, series, height: this.height, linesCount});
    return {
      progressive: 20000,
      title: {
        //  text: 'ECharts entry example'
      },
      grid: {
        height: this.height - 30,
        right: 0,
        top: 20,
        bottom: 10,
        left: 0,
        containLabel: true
      },
      throttle: 70,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        },
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
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        axisLabel: {
          color: Utils.getLabelColor(this.el)
        },
        axisTick: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
      },
      yAxis: {
        show: true,
        min: 0,
        axisTick: {show: false},
        axisLabel: {show: false},
        max: this.expanded ? linesCount - 1 : 1,
        type: 'value',
        splitNumber: linesCount,
        interval: 1,
        boundaryGap: [0, 0],
        splitLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        }
      },
      dataZoom: [
        this.options.showRangeSelector ? {
          type: 'slider',
          height: '20px'
        } : undefined,
        {
          type: 'inside'
        }
      ],
      series: series
    } as EChartsOption;
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    this.myChart = echarts.init(this.graph, null, {
      renderer: 'svg',
      width: this.width,
      height: this.height
    });
    this.myChart.on('finished', () => {
      this.rendering = false;
      this.drawn();
    });
    setTimeout(() => this.myChart.setOption(this.chartOpts));
  }

  private drawn() {
    this.draw.emit();
  }

  render() {
    return <Host>
      {this.displayExpander
        ? <button class="expander" onClick={e => this.toggle()} title="collapse/expand">+/-</button>
        : ''}
      <div style={{width: this.width + 'px', height: this.height + 'px'}}>
        {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
        {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
        <div ref={(el) => this.graph = el as HTMLDivElement}/>
      </div>
    </Host>
  }

  private toggle() {
    this.expanded = !this.expanded;
    this.chartOpts = this.convert(this.result || '[]')
    setTimeout(() => {
      this.myChart.resize({
        width: this.width,
        height: this.height,
      });
      this.myChart.setOption(this.chartOpts)
    });
  }
}
