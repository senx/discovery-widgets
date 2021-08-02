import {Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch} from '@stencil/core';
import {ChartType, ECharts} from "../../model/types";
import {Param} from "../../model/param";
import * as echarts from "echarts";
import {EChartsOption} from "echarts";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import {ColorLib} from "../../utils/color-lib";
import {SeriesOption} from "echarts/lib/util/types";
import {DataModel} from "../../model/dataModel";
import {DiscoveryLineComponent} from "../discovery-line/discovery-line";
import elementResizeEvent from "element-resize-event";

@Component({
  tag: 'discovery-plot',
  styleUrl: 'discovery-plot.scss',
  shadow: true,
})
export class DiscoveryPlot {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = {...new Param(), timeMode: 'date'};
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() chartOpts: EChartsOption;
  @State() expanded: boolean = false;

  private graph: HTMLDivElement;
  private defOptions: Param = {...new Param(), timeMode: 'date'};
  private LOG: Logger;
  private displayExpander: boolean = false;
  private myChart: ECharts;
  private divider: number = 1000;

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.LOG.debug(['updateRes'], {chartOpts: this.chartOpts});
    setTimeout(() => {
      this.myChart.setOption(this.chartOpts);
      const dims = Utils.getContentBounds(this.el.parentElement);
      this.width = dims.w;
      this.height = dims.h - 20;
      this.myChart.resize({
        width: this.width,
        height: this.height,
      });
    });
  }

  @Method()
  async resize() {
    if (this.myChart) {
      const dims = Utils.getContentBounds(this.el.parentElement);
      this.width = dims.w;
      this.height = dims.h - 20;
      this.myChart.resize({
        width: this.width,
        height: this.height,
      });
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryPlot, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h - 20;
    this.parsing = false;
    this.LOG.debug(['componentWillLoad'], {type: this.type, options: this.options});
    this.chartOpts = this.convert(this.result as DataModel || new DataModel())
    elementResizeEvent(this.el.parentElement, () => this.resize());
  }

  disconnectedCallback() {
    elementResizeEvent.unbind(this.el.parentElement);
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    const series: any[] = [];
    const gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
    this.LOG.debug(['convert'], {options: this.options, gtsList});
    const gtsCount = gtsList.length;
    let linesCount = 1;
    let annotationPosition = 0;
    const bounds = {min: Number.MAX_VALUE, max: Number.MIN_VALUE};
    for (let i = 0; i < gtsCount; i++) {
      const type = ((data.params || [])[i] || {type: this.type}).type || 'line';
      const gts = gtsList[i];
      GTSLib.gtsSort(gts);
      if (!!gts.v && gts.v.length > 0 && bounds.min > gts.v[0][0]) {
        bounds.min = gts.v[0][0];
      }
      if (!!gts.v && gts.v.length > 0 && bounds.max < gts.v[gts.v.length - 1][0]) {
        bounds.max = gts.v[gts.v.length - 1][0];
      }
      if (GTSLib.isGtsToAnnotate(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id, this.options.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        this.displayExpander = i > 1;
        if (this.expanded) {
          linesCount++;
        }
        series.push({
          type: 'scatter',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [(this.options as Param).timeMode === 'date' ? (d[0] / this.divider) : d[0], (this.expanded ? annotationPosition : 0) + 0.5]),
          animation: false,
          large: true,
          showSymbol: true,
          symbol: 'rect',
          symbolSize: [2, 30],
          clip: true,
          showAllSymbol: true,
          itemStyle: {color},
        } as SeriesOption);
        annotationPosition++;
      } else if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id, this.options.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        const t = ((data.params || [])[i] || {type: this.type}).type || this.type;
        series.push({
          type: t === 'scatter' ? 'scatter' : 'line',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [(this.options as Param).timeMode === 'date' ? (d[0] / this.divider) : d[0], d[d.length - 1]]),
          animation: false,
          large: true,
          showSymbol: type === 'scatter' || this.options.showDots,
          smooth: type === 'spline' || type === 'spline-area' ? 0.4 : undefined,
          clip: false,
          step: DiscoveryLineComponent.getStepShape(type),
          areaStyle: type === 'area' || type === 'spline-area' ? {
            opacity: 0.8,
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                {offset: 0, color: ColorLib.transparentize(color, 0.7)},
                {offset: 1, color: ColorLib.transparentize(color, 0.1)}
              ],
              global: false // false by default
            }
          } : undefined,
          showAllSymbol: false,
          lineStyle: {color},
          itemStyle: {color},
          xAxisIndex: 1,
          yAxisIndex: 1,
        } as SeriesOption);
      }
    }
    this.LOG.debug(['convert'], {height: this.height + '', linesCount});
    this.LOG.debug(['convert'], {expanded: this.expanded, series, height: this.height, linesCount});
    return {
      progressive: 20000,
      animation: false,
      grid:
        [{
          left: '10%',
          right: 10,
          top: 20,
          height: linesCount * 20 + 10,
        }, {
          left: '10%',
          right: 10,
          bottom: '10%',
          top: linesCount * 30 + 50,
        }],
      throttle: 70,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      },
      toolbox: {
        feature: {
          //  saveAsImage: {}
        }
      },
      xAxis: [{
        type: (this.options as Param).timeMode === 'date' ? 'time' : 'category',
        boundaryGap: false,
        onZero: false,
        min: bounds.min / this.divider,
        max: bounds.max / this.divider,
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
        axisLabel: {
          show: false,
          color: Utils.getLabelColor(this.el)
        },
        axisTick: {
          show: false,
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
      },
        {
          gridIndex: 1,
          boundaryGap: false,
          onZero: false,
          min: bounds.min / this.divider,
          max: bounds.max / this.divider,
          type: (this.options as Param).timeMode === 'date' ? 'time' : 'category',
          axisLine: {lineStyle: {color: Utils.getGridColor(this.el)}},
          axisLabel: {color: Utils.getLabelColor(this.el)},
          axisTick: {lineStyle: {color: Utils.getGridColor(this.el)}},
        }],
      yAxis: [{
        show: true,
        min: 0,
        axisTick: {show: false},
        axisLabel: {show: false},
        max: this.expanded ? linesCount - 1 : 1,
        type: 'value',
        splitNumber: linesCount,
        interval: 1,
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
      }, {
        gridIndex: 1,
        type: 'value',
        splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLine: {show: true, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLabel: {show: true, color: Utils.getLabelColor(this.el)},
        axisTick: {show: true, lineStyle: {color: Utils.getGridColor(this.el)}},
        scale: !(this.options.bounds && this.options.bounds.yRanges && this.options.bounds.yRanges.length > 0),
        min: this.options.bounds && this.options.bounds.yRanges && this.options.bounds.yRanges.length > 0 ? this.options.bounds.yRanges[0] : undefined,
        max: this.options.bounds && this.options.bounds.yRanges && this.options.bounds.yRanges.length > 0 ? this.options.bounds.yRanges[1] : undefined,
      }],
      axisPointer: {
        link: [{
          xAxisIndex: 'all'
        }]
      },
      dataZoom: [
        this.options.showRangeSelector ? {
          type: 'slider',
          xAxisIndex: [0, 1],
          height: '20px'
        } : undefined,
        {
          xAxisIndex: [0, 1],
          type: 'inside'
        }
      ],
      series
    } as EChartsOption;
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    this.myChart = echarts.init(this.graph, null, {renderer: 'svg'});
    this.myChart.on('rendered', () => {
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
        ?
        <button class="expander" onClick={() => this.toggle()} title="collapse/expand">+/-</button>
        : ''}
      <div class="chart-area" style={{width: '100%', height: '100%'}}>
        {this.parsing ? <div class="discovery-chart-spinner">
          <discovery-spinner>Parsing data...</discovery-spinner>
        </div> : ''}
        {this.rendering ? <div class="discovery-chart-spinner">
          <discovery-spinner>Rendering data...</discovery-spinner>
        </div> : ''}
        <div ref={(el) => this.graph = el as HTMLDivElement}/>
      </div>
    </Host>
  }

  private toggle() {
    this.expanded = !this.expanded;
    this.chartOpts = this.convert(this.result as DataModel || new DataModel())

    setTimeout(() => {
      this.myChart.resize({
        width: this.width,
        height: this.height,
      });
      this.myChart.setOption(this.chartOpts)
    });
  }
}
