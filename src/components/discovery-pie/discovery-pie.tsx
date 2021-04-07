import {Component, Element, Event, EventEmitter, h, Prop, State, Watch} from '@stencil/core';
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

@Component({
  tag: 'discovery-pie',
  styleUrl: 'discovery-pie.scss',
  shadow: true,
})
export class DiscoveryPieComponent {
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
    this.chartOpts = this.convert(GTSLib.getData(this.result));
    setTimeout(() => this.myChart.setOption(this.chartOpts));
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryPieComponent, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.chartOpts = this.convert(this.result as DataModel || new DataModel())
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });
  }

  private getCommonSeriesParam() {
    return {
      type: 'pie',
      animation: true,
      large: true,
      clip: false,
      radius: this.type === 'pie' ? '90%' :this.type === 'rose'? ['30%', '90%'] : ['40%', '90%'],
      roseType: this.type === 'rose'? 'area': undefined,
      label: {
        color: Utils.getLabelColor(this.el)
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    } as SeriesOption
  }

  private getCommonDataParam(color: any) {
    return {
      lineStyle: {color},
      labelLine: {
        color: Utils.getGridColor(this.el)
      },
      itemStyle: {
        opacity: 0.8,
        borderColor: color,
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            {offset: 0, color: ColorLib.transparentize(color, 0.7)},
            {offset: 1, color: ColorLib.transparentize(color, 0.3)}
          ],
          global: false // false by default
        }
      }
    };
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    const series: any[] = [];
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
    this.LOG.debug(['convert'], {options: this.options, gtsList});
    const gtsCount = gtsList.length;
    const dataStruct = [];
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      const c = ColorLib.getColor(gts.id || i, this.options.scheme);
      const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const values = (gts.v || []);
        const val = values[values.length - 1] || [];
        let value = 0;
        if (val.length > 0) {
          value = val[val.length - 1];
        }
        dataStruct.push({
          ...this.getCommonDataParam(color),
          name: GTSLib.serializeGtsMetadata(gts),
          value
        });
      } else {
        if (gts.hasOwnProperty('key')) {
          dataStruct.push({
            ...this.getCommonDataParam(color),
            name: gts.key || '',
            value: gts.value || Number.MIN_VALUE
          });
        } else {
          Object.keys(gts).forEach((k, j) => {
            const c = ColorLib.getColor(j, (this.options as Param).scheme);
            const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
            dataStruct.push({
              ...this.getCommonDataParam(color),
              name: k,
              value: gts[k]
            });
          });
        }
      }

    }

    series.push({
      ...this.getCommonSeriesParam(),
      data: dataStruct
    } as SeriesOption);
    this.LOG.debug(['convert', 'series'], series);
    return {
      grid: {
        left: 10, top: 10, bottom: 10, right: 10,
        containLabel: true
      },
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
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
      series: series
    } as EChartsOption;
  }

  componentDidLoad() {
    this.height = Utils.getContentBounds(this.el.parentElement).h;
    this.parsing = false;
    this.rendering = true;
    this.myChart = echarts.init(this.graph, null, {
      renderer: 'svg',
      width: this.width,
      height: this.height ? this.height - 10 : undefined
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
    return <div style={{width: this.width + 'px', height: this.height + 'px'}}>
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      <div ref={(el) => this.graph = el as HTMLDivElement}/>
    </div>
  }
}
