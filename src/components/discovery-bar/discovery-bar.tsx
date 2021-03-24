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
  tag: 'discovery-bar',
  styleUrl: 'discovery-bar.scss',
  shadow: true,
})
export class DiscoveryBarComponent {
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

  @Watch('result')
  updateRes() {
    this.result = GTSLib.getData(this.result);
    console.log('updateRes', this.result)
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryBarComponent, this.debug);
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

  private getCommonSeriesParam(color) {
    return {
      type: 'bar',
      stack: ((this.options as Param).bar || {stacked: false}).stacked ? 'total' : undefined,
      animation: false,
      large: true,
      clip: false,
      lineStyle: {color},
      itemStyle: {
        opacity: 0.8,
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
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
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts) && !!gts.v) {
        const c = ColorLib.getColor(gts.id | i, this.options.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        series.push({
          ...this.getCommonSeriesParam(color),
          name: GTSLib.serializeGtsMetadata(gts),
          data: gts.v.map(d => {
            let ts: number | string = Math.round(d[0] / this.divider);
            if ((this.options as Param).timeMode || 'date' === 'date') {
              ts = GTSLib.toISOString(ts, this.divider, (this.options as Param).timeZone);
            }
            if(!!((this.options as Param).bar || {horizontal: false}).horizontal) {
              return[d[d.length - 1], ts];
            } else {
              return [ts, d[d.length - 1]]
            }
          })
        } as SeriesOption);
      } else {
        this.options.timeMode = 'custom';
        this.LOG.debug(['convert', 'gts'], gts);
        (gts.columns || []).forEach((label, index) => {
          const c = ColorLib.getColor(gts.id | index, (this.options as Param).scheme);
          const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
          series.push({
            ...this.getCommonSeriesParam(color),
            name: label,
            data: gts.rows.map(r => {
              if(!!((this.options as Param).bar || {horizontal: false}).horizontal) {
                return [ r[index + 1], r[0]];
              } else {
                return [r[0], r[index + 1]]
              }
            })
          } as SeriesOption);
        });
      }
    }
    return {
      grid: {
        left: 0, top: 10, bottom: 0, right: 0,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
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
      legend: {
        bottom: 10,
        left: 'center',
        show: false
      },
      xAxis: {
        type: !!((this.options as Param).bar || {horizontal: false}).horizontal? 'value' : 'category',
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
        }
      },
      yAxis: {
        type: !!((this.options as Param).bar || {horizontal: false}).horizontal? 'category': 'value',
        splitLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        },
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
        }
      },
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
