import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
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
import elementResizeEvent from "element-resize-event";

@Component({
  tag: 'discovery-line',
  styleUrl: 'discovery-line.scss',
  shadow: true,
})
export class DiscoveryLineComponent {

  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = {...new Param(), timeMode: 'date'};
  @State() @Prop() width: number;
  @State() @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start: number, end: number, min: number, max: number }>;
  @Event() leftMarginComputed: EventEmitter<number>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private wrap: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = {...new Param(), timeMode: 'date'};
  private LOG: Logger;
  private divider: number = 1000;
  private myChart: ECharts;

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.result = GTSLib.getData(this.result);
      this.chartOpts = this.convert(this.result as DataModel || new DataModel());
      setTimeout(() => this.myChart.setOption(this.chartOpts || {}));
    }
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      if (!!this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        setTimeout(() => this.myChart.setOption(this.chartOpts || {}));
      }
      if (this.LOG) {
        this.LOG.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLineComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
    });
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.chartOpts = this.convert(this.result as DataModel || new DataModel());
    elementResizeEvent(this.el.parentElement, () => this.resize());
  }

  disconnectedCallback() {
    elementResizeEvent.unbind(this.el.parentElement);
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.innerOptions = {...options};
    let gtsList;
    if (GTSLib.isArray(data.data)) {
      data.data = GTSLib.flatDeep(data.data as any[]);
      this.LOG.debug(['convert', 'isArray']);
      if (data.data.length > 0 && GTSLib.isGts(data.data[0])) {
        this.LOG.debug(['convert', 'isArray 2']);
        gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
      } else {
        this.LOG.debug(['convert', 'isArray 3']);
        gtsList = data.data as any[];
      }
    } else {
      this.LOG.debug(['convert', 'not array']);
      gtsList = [data.data];
    }
    this.LOG.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let multiY = false;
    let multiX = false;
    const opts: EChartsOption = {
      animation: false,
      grid: {
        left: 10, top: !!(this.unit || this.innerOptions.unit) ? 30 : 10, bottom: 10, right: 10,
        containLabel: true
      },
      responsive: true,
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
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']}
        }
      },
      legend: {bottom: 10, left: 'center', show: false},
      dataZoom: [
        {type: 'slider', height: '20px', show: !!this.innerOptions.showRangeSelector},
        {type: 'inside'}
      ],
      series: []
    };

    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts) && gts.v) {
        const c = ColorLib.getColor(gts.id, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        const type = ((data.params || [])[i] || {type: this.type}).type || this.type;
        const s = {
          type: this.type === 'scatter' || gts.v.length <= 1 ? 'scatter' : 'line',
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => [
            this.innerOptions.timeMode === 'date'
              ? d[0] / this.divider
              : d[0]
            , d[d.length - 1]
          ]),
          animation: false,
          large: true,
          showSymbol: this.type === 'scatter' || this.innerOptions.showDots,
          smooth: type === 'spline' || type === 'spline-area' ? 0.4 : undefined,
          clip: false,
          step: DiscoveryLineComponent.getStepShape(type),
          areaStyle: type === 'area' || type === 'step-area' || type === 'spline-area' ? {
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
          itemStyle: {color}
        } as SeriesOption;
        if (!!data.params) {
          // multi Y
          if (!!data.params[i] && data.params[i].yAxis !== undefined) {
            multiY = true;
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
          } else if (multiY) {
            const y = this.getYAxis();
            (y as any).position = 'left';
            if (!opts.yAxis) opts.yAxis = new Array(data.params.length);
            (opts.yAxis as any)[0] = y;
          }

          // multi X
          if (!!data.params[i] && data.params[i].xAxis !== undefined) {
            multiX = true;
            if (data.params[i].xAxis > 0) {
              (s as any).xAxisIndex = data.params[i].xAxis;
              const x = this.getXAxis(color);
              (x as any).position = 'top';
              if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
              (opts.xAxis as CartesianAxisOption)[data.params[i].xAxis] = x;
            } else {
              const x = this.getXAxis(color);
              (x as any).position = 'bottom';
              if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
              (opts.xAxis as CartesianAxisOption)[0] = x;
            }
          } else if (multiX) {
            const x = this.getXAxis();
            (x as any).position = 'bottom';
            if (!opts.xAxis) opts.xAxis = new Array(data.params.length);
            (opts.xAxis as CartesianAxisOption)[0] = x;
          }

        }
        (opts.series as any[]).push(s);
      } else {
        this.LOG.debug(['convert', 'gts'], gts);
        const c = ColorLib.getColor(gts.id || i, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        (opts.series as any[]).push({
          ...this.getCommonSeriesParam(color),
          name: gts.label || '' + i,
          data: (gts.values || []) // .sort((a, b) => a[0] < b[0] ? -1 : 1)
        } as SeriesOption);
      }
    }
    // multi Y
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
      (opts.grid as GridOption).right = 80 * (i - 1);
    }
    // multi X
    if (!multiX) {
      opts.xAxis = this.getXAxis();
    } else {
      const xAxis = [...GTSLib.cleanArray(opts.xAxis as any[])];
      opts.xAxis = [];
      let i = 0;
      xAxis.forEach((x: CartesianAxisOption) => {
        if (x.position === 'top') {
          x.offset = 30 * i;
          i++;
        }
        (opts.xAxis as any).push(x);
      });
      (opts.grid as GridOption).top = 30 * (i - 1);
    }
    this.LOG.debug(['convert', 'opts'], {opts});
    return opts as EChartsOption;
  }

  private getCommonSeriesParam(color) {
    return {
      type: this.type,
      animation: false,
      large: true,
      clip: false,
      lineStyle: {color},
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            {offset: 0, color: ColorLib.transparentize(color, 0.7)},
            {offset: 1, color: ColorLib.transparentize(color, 0.1)}
          ],
          global: false // false by default
        }
      }
    } as SeriesOption
  }

  private getYAxis(color?: string): CartesianAxisOption {
    return {
      type: 'value',
      name: this.unit || this.innerOptions.unit,
      show: !this.innerOptions.hideYAxis,
      nameTextStyle: {color: color || Utils.getLabelColor(this.el)},
      splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
      axisLine: {show: true, lineStyle: {color: color || Utils.getGridColor(this.el)}},
      axisLabel: {color: color || Utils.getLabelColor(this.el)},
      axisTick: {show: true, lineStyle: {color: color || Utils.getGridColor(this.el)}},
      scale: !(this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0),
      min: this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[0] : undefined,
      max: this.innerOptions.bounds && this.innerOptions.bounds.yRanges && this.innerOptions.bounds.yRanges.length > 0 ? this.innerOptions.bounds.yRanges[1] : undefined,
    }
  }

  private getXAxis(color?: string): CartesianAxisOption {
    return {
      type: this.innerOptions.timeMode === 'date' ? 'time' : 'value',
      show: !this.innerOptions.hideXAxis,
      splitNumber: Math.max(Math.floor(Utils.getContentBounds(this.el.parentElement).w / 100) - 1, 1),
      splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
      axisLine: {lineStyle: {color: color || Utils.getGridColor(this.el)}},
      axisLabel: {color: color || Utils.getLabelColor(this.el)},
      axisTick: {lineStyle: {color: color || Utils.getGridColor(this.el)}},
      scale: !(this.innerOptions.bounds && (!!this.innerOptions.bounds.minDate || !!this.innerOptions.bounds.maxDate)),
      min: !!this.innerOptions.bounds && !!this.innerOptions.bounds.minDate ? this.innerOptions.bounds.minDate / this.divider : undefined,
      max: !!this.innerOptions.bounds && !!this.innerOptions.bounds.maxDate ? this.innerOptions.bounds.maxDate / this.divider : undefined,
    }
  }

  static getStepShape(type: ChartType) {
    switch (type) {
      case "line":
      case "area":
      case "spline":
        return undefined;
      case "step":
      case "step-area":
        return 'middle';
      case "step-before":
        return 'start';
      case "step-after":
        return 'end';
    }
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    setTimeout(() => {
      this.parsing = false
      this.rendering = true;
      this.myChart = echarts.init(this.graph);
      let initial = false;
      this.myChart.on('finished', () => {
        this.rendering = false;
        if (initial) {
          setTimeout(() => this.draw.emit());
          initial = false;
          let found  =false;
          let x = 0;
          while(!found) {
            found = this.myChart.containPixel({gridIndex: 0}, [x, this.myChart.getHeight() / 2]);
            x++;
          }
          this.leftMarginComputed.emit(x);
        }
      });
      this.myChart.on('dataZoom', (event: any) => {
        const {start, end} = (event.batch || [])[0] || {};
        if (start && end) {
          const dataZoom = this.myChart.getOption().dataZoom[1];
          this.dataZoom.emit({start, end, min: dataZoom.startValue, max: dataZoom.endValue});
        }
      });
      this.myChart.setOption(this.chartOpts || {});
      initial = true;
    });
  }

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    if (!!this.myChart) {
      this.myChart.dispatchAction({type: 'dataZoom', ...dataZoom});
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined;
  }

  render() {
    return <div style={{width: '100%', height: '100%'}} ref={(el) => this.wrap = el as HTMLDivElement}>
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
    </div>
  }
}
