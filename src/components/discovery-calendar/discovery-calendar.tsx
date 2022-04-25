import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType, ECharts} from "../../model/types";
import {Param} from "../../model/param";
import * as echarts from "echarts";
import {EChartsOption, SeriesOption} from "echarts";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import {ColorLib} from "../../utils/color-lib";

@Component({
  tag: 'discovery-calendar',
  styleUrl: 'discovery-calendar.scss',
  shadow: true,
})
export class DiscoveryCalendar {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private divider: number = 1000;
  private myChart: ECharts;
  private CAL_SIZE = 150;

  @Watch('type')
  updateType(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.chartOpts = this.convert(GTSLib.getData(this.result));
      setTimeout(() => {
        this.myChart.setOption(this.chartOpts || {}, true, false);
        this.myChart.resize({height: this.height});
      });
    }
  }

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result));
    setTimeout(() => {
      this.myChart.setOption(this.chartOpts || {}, true, false);
      this.myChart.resize({height: this.height});
    });
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
        setTimeout(() => {
          this.myChart.setOption(this.chartOpts || {}, true, false);
          this.myChart.resize({height: this.height});
        });
      }
      if (this.LOG) {
        this.LOG.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
  }

  @Method()
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryCalendar, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.chartOpts = this.convert(this.result as DataModel || new DataModel());
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts
    });
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.innerOptions = {...options};
    const series: any[] = [];
    const calendar: any[] = [];
    const titles: any[] = [];
    const visualMap: any[] = [];
    let gtsList;
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
    this.LOG.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let cal = 0;
    let seriesIndex = 0;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      let dataStruct = {};
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        // add title
        titles.push({
          text: ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts),
          left: 'center',
          textStyle: {
            height: 20, fontSize: 12,
            color: Utils.getLabelColor(this.el)
          },
          top: this.CAL_SIZE * cal + seriesIndex * 20,
        });
        // Find min/max
        (gts.v || []).forEach(v => {
          const value = v[v.length - 1];
          const d = GTSLib.toISOString(v[0], this.divider, this.innerOptions.timeZone, undefined);
          const y = d.split('-')[0];
          dataStruct[y] = dataStruct[y] || {}
          // Aggregation
          dataStruct[y][d] = dataStruct[y][d] + value || value;
          min = Math.min(min, dataStruct[y][d]);
          max = Math.max(max, dataStruct[y][d]);
        });
        Object.keys(dataStruct).forEach(currentRange => {
          // Add VisualMap and Calendar
          visualMap.push({
            min, max, show: false,
            seriesIndex: cal,
            color: ColorLib.getHeatMap(((data.params || [])[i] || {}).scheme || this.innerOptions.scheme)
          });
          calendar.push({
            top: this.CAL_SIZE * cal + (seriesIndex + 1) * 20 + 20,
            range: currentRange,
            cellSize: ['auto', 15],
            itemStyle: {
              color: 'transparent',
              borderWidth: 1,
              borderColor: ColorLib.transparentize(Utils.getGridColor(this.el), 0.5)
            },
            splitLine: {lineStyle: {width: 2, color: Utils.getGridColor(this.el)}},
            dayLabel: {
              firstDay: this.innerOptions.calendar?.firstDay || 0,
              nameMap: this.innerOptions.calendar?.dayLabel,
              color: Utils.getLabelColor(this.el)
            },
            monthLabel: {
              nameMap: this.innerOptions.calendar?.monthLabel,
              color: Utils.getLabelColor(this.el)
            },
            yearLabel: {color: Utils.getLabelColor(this.el)}
          });
          series.push({
            type: 'heatmap',
            coordinateSystem: 'calendar',
            calendarIndex: cal,
            data: Object.keys(dataStruct[currentRange]).map(d => [d, dataStruct[currentRange][d]])
          } as SeriesOption);
          cal++;
        });
        seriesIndex++;
      }
    }
    this.height = this.CAL_SIZE * cal + titles.length * 20 + 40;
    this.LOG.debug(['convert', 'series'], {series, calendar, visualMap, titles});
    return {
      title: titles,
      grid: {
        left: 10, top: 10, bottom: 10, right: 10,
        containLabel: true
      },
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        formatter: (params) => {
          return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
            GTSLib.toISOString(
              GTSLib.toTimestamp(params.value[0], this.divider, this.innerOptions.timeZone),
              this.divider, this.innerOptions.timeZone,
              this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined
            ).replace('T', ' ').replace('Z', '')}</div>
            ${params.marker}
            <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${params.seriesName}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">
            ${params.value[1]}</span>`;
        }
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']}
        }
      },
      legend: {bottom: 10, left: 'center', show: false},
      visualMap,
      series,
      calendar
    } as EChartsOption;
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined;
  }

  componentDidLoad() {
    setTimeout(() => {
      this.parsing = false;
      this.rendering = true;
      let initial = false;
      this.myChart = echarts.init(this.graph, null, {
        width: this.width,
        height: this.height ? this.height - 10 : undefined
      });
      this.myChart.on('rendered', () => {
        this.rendering = false;
        if (initial) {
          setTimeout(() => this.draw.emit());
          initial = false;
        }
      });
      this.myChart.on('mouseover', (event: any) => {
        this.dataPointOver.emit({date: event.value[0], name: event.seriesName, value: event.value[1], meta: {}});
      });
      this.myChart.setOption(this.chartOpts || {}, true, false);
      initial = true;
    });
  }

  render() {
    return <div class="calendar-wrapper">
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
    </div>
  }
}
