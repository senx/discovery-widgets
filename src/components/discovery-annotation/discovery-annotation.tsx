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

import elementResizeEvent from "element-resize-event";

@Component({
  tag: 'discovery-annotation',
  styleUrl: 'discovery-annotation.scss',
  shadow: true,
})
export class DiscoveryAnnotation {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() width: number;
  @State() @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start: number, end: number, min: number, max: number }>;

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
      this.myChart.resize({width: this.width, height: this.height});
      this.myChart.setOption(this.chartOpts || {});
    });
  }

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryAnnotation, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
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
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToAnnotate(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id, this.options.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        this.displayExpander = i > 1;
        if (this.expanded) linesCount++;
        series.push({
          type: 'scatter',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [(this.options as Param).timeMode === 'date'
            ? GTSLib.toISOString(d[0], this.divider, (this.options as Param).timeZone)
            : d[0]
            , (this.expanded ? i : 0) + 0.5]),
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
    const opts = this.options as Param;
    this.LOG.debug(['convert'], {expanded: this.expanded, series, height: this.height, linesCount, opts});
    return {
      animation: false,
      grid: {
        height: this.height - 30,
        right: 10,
        top: 20,
        bottom: 10,
        left: 10,
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
        show: (this.options as Param).showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']}
        }
      },
      xAxis: {
        type: opts.timeMode === 'date' ? 'time' : 'category',
        splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLine: {show: true, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLabel: {color: Utils.getLabelColor(this.el)},
        axisTick: {show: true, lineStyle: {color: Utils.getGridColor(this.el)}},
        scale: !(opts.bounds && (!!opts.bounds.minDate || !!opts.bounds.maxDate)),
        min: !!opts.bounds && !!opts.bounds.minDate ? opts.bounds.minDate / this.divider : undefined,
        max: !!opts.bounds && !!opts.bounds.maxDate ? opts.bounds.maxDate / this.divider : undefined,
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
      series
    } as EChartsOption;
  }

  componentDidLoad() {
    setTimeout(() => {
      this.parsing = false;
      this.rendering = true;
      let initial = false;
      this.myChart = echarts.init(this.graph, null, {width: this.width, height: this.height});
      this.myChart.on('finished', () => {
        this.rendering = false;
        if (initial) {
          setTimeout(() => this.draw.emit());
          initial = false;
        }
      });
      this.myChart.on('dataZoom', (event: any) => {
        const {start, end} = (event.batch || [])[0] || {};
        if (start && end) {
          const dataZoom = this.myChart.getOption().dataZoom[1];
          this.dataZoom.emit({start, end, min: dataZoom.startValue, max: dataZoom.endValue});
        }
      });
      initial = true;
      this.myChart.setOption(this.chartOpts || {});
    });
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    if (this.myChart) {
      this.myChart.dispatchAction({type: 'dataZoom', ...dataZoom});
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined;
  }

  render() {
    return <Host style={{width: this.width + 'px', height: (this.height + (this.expanded ? 50 : 0)) + 'px'}}>
      {this.displayExpander
        ?
        <button class="expander" onClick={() => this.toggle()} title="collapse/expand">+/-</button>
        : ''}
      <div class="chart-area" style={{width: this.width + 'px', height: this.height + 'px'}}>
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
      this.myChart.setOption(this.chartOpts || {})
    });
  }
}
