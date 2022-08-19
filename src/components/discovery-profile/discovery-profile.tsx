// noinspection ES6UnusedImports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch} from '@stencil/core';
import {DataModel} from '../../model/dataModel';
import {ChartType, ECharts} from '../../model/types';
import {Param} from '../../model/param';
import {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
  graphic,
  init,
  SeriesOption
} from 'echarts';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {Utils} from '../../utils/utils';
import {ColorLib} from '../../utils/color-lib';

@Component({
  tag: 'discovery-profile',
  styleUrl: 'discovery-profile.scss',
  shadow: true,
})
export class DiscoveryProfile {

  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @State() @Prop() height: number;
  @Prop() debug = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataZoom: EventEmitter<{ start: number, end: number, min: number, max: number }>;
  @Event() dataPointOver: EventEmitter;
  @Event() timeBounds: EventEmitter;
  @Event() leftMarginComputed: EventEmitter<number>;

  @State() parsing = false;
  @State() rendering = false;
  @State() chartOpts: EChartsOption;
  @State() expanded = false;
  @State() innerOptions: Param;

  private graph: HTMLDivElement;
  private defOptions: Param = {...new Param(), timeMode: 'date'};
  private LOG: Logger;
  private displayExpander = false;
  private myChart: ECharts;
  private divider = 1000;
  private leftMargin: number;
  private hasFocus = false;
  private gtsList = [];
  private focusDate: number;
  private bounds: { min: number; max: number };

  private static renderItem(params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) {
    const y = +api.value(0);
    const start = api.coord([+api.value(1), y]);
    const width = api.coord([+api.value(2), y])[0] - start[0];
    const height = api.size([0, 1])[1];
    const coordSys = params.coordSys as any;
    const rectShape = graphic.clipRectByRect(
      {x: start[0], y: start[1] - height / 2, width, height},
      {x: coordSys.x, y: coordSys.y, width: coordSys.width, height: coordSys.height}
    );
    return (
      rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: rectShape,
        style: api.style({})
      });
  };

  @Watch('result')
  updateRes() {
    this.chartOpts = this.convert(GTSLib.getData(this.result) || new DataModel());
    this.LOG?.debug(['updateRes'], {chartOpts: this.chartOpts});
    setTimeout(() => {
      if (!!this.myChart) {
        this.myChart.resize({width: this.width, height: this.height});
        this.setOpts(true);
      }
    });
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      if (!!this.myChart) {
        this.chartOpts = this.convert(this.result as DataModel || new DataModel());
        this.setOpts(true);
      }
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue}, this.chartOpts);
      }
    }
  }

  @Method()
  async resize(): Promise<void> {
    if (this.myChart) {
      this.myChart.resize();
      return Promise.resolve();
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
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryProfile, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.expanded = !!this.innerOptions.expandAnnotation;
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.LOG?.debug(['componentWillLoad'], {type: this.type, options: this.innerOptions});
    this.chartOpts = this.convert(this.result || new DataModel())
  }

  private setOpts(notMerge = false) {
    if ((this.chartOpts?.series as any[] || []).length === 0) {
      this.chartOpts.title = {
        show: true,
        textStyle: {color: Utils.getLabelColor(this.el), fontSize: 20},
        text: this.innerOptions.noDataLabel || '',
        left: 'center',
        top: 'center'
      };
      this.chartOpts.xAxis = {show: false};
      this.chartOpts.yAxis = {show: false};
      this.chartOpts.tooltip = {show: false};
    } else {
      this.chartOpts.title = {...this.chartOpts.title || {}, show: false};
    }
    setTimeout(() => {
      this.myChart.setOption(this.chartOpts || {}, notMerge, true);
    });
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = {...options};
    this.innerOptions.timeMode = this.innerOptions.timeMode || 'date';
    const series: any[] = [];
    const categories: any[] = [];
    const gtsList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
    this.gtsList = [];
    this.LOG?.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let hasTimeBounds = false;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGtsToPlot(gts)) {
        min = Math.min(min, ...gts.v.map(v => v[0]));
        max = Math.max(max, ...gts.v.map(v => v[0]));
      }
    }
    if (max <= 1000 && min >= -1000 && min !== Number.MAX_SAFE_INTEGER && max !== Number.MIN_SAFE_INTEGER) {
      this.innerOptions.timeMode = 'timestamp';
    }
    let linesCount = 1;
    let catId = 0;
    for (let i = 0; i < gtsCount; i++) {
      const gts = gtsList[i];
      if (GTSLib.isGts(gts) && !!gts.v) {
        this.gtsList.push(gts);
        const name = ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts);
        const c = ColorLib.getColor(gts.id, this.innerOptions.scheme);
        const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
        if (this.expanded) {
          linesCount++;
          categories.push(name);
        }
        hasTimeBounds = true;
        series.push({
          type: 'custom',
          name,
          data: gts.v.map(d => {
            let startTS = +d[0];
            startTS = this.innerOptions.timeMode === 'date'
              ? GTSLib.utcToZonedTime(startTS, this.divider, this.innerOptions.timeZone)
              : startTS;
            let endTS = +d[0] + +d[d.length - 1];
            endTS = this.innerOptions.timeMode === 'date'
              ? GTSLib.utcToZonedTime(endTS, this.divider, this.innerOptions.timeZone)
              : endTS;
            return [catId, startTS, endTS, +d[d.length - 1]];
          }),
          animation: false,
          large: true,
          clip: true,
          showAllSymbol: true,
          renderItem: DiscoveryProfile.renderItem.bind(this),
          itemStyle: {
            opacity: 0.8,
            borderColor: color,
            borderWidth: 1,
            color: {
              type: 'linear', x: 1, y: 0, x2: 0, y2: 0,
              colorStops: [
                {offset: 0, color: ColorLib.transparentize(color, 0.7)},
                {offset: 1, color: ColorLib.transparentize(color, 0.3)}
              ]
            }
          },
          encode: {x: [1, 2], y: 0},
        } as SeriesOption);
        if (this.expanded) catId++;
      }
    }
    if (gtsList.length === 0) {
      // custom data
      (data.data || []).forEach(d => {
        const values = d.values || {};
        Object.keys(values).forEach((key, id) => {
          const c = ColorLib.getColor(id, this.innerOptions.scheme);
          if (this.expanded) {
            linesCount++;
            categories.push(key);
          }
          const color = ((values.params || [])[id] || {datasetColor: c}).datasetColor || c;
          series.push({
            type: 'custom',
            name: key,
            label: {
              show: !!this.innerOptions.showValues,
              position: 'inside',
              textStyle: {color: Utils.getLabelColor(this.el), fontSize: 14},
            },
            data: Object.keys(values[key]).map(ts => {
              let startTS = +ts;
              startTS = this.innerOptions.timeMode === 'date'
                ? GTSLib.utcToZonedTime(startTS, this.divider, this.innerOptions.timeZone)
                : startTS;
              let endTS = startTS + +values[key][ts];
              endTS = this.innerOptions.timeMode === 'date'
                ? GTSLib.utcToZonedTime(endTS, this.divider, this.innerOptions.timeZone)
                : endTS;
              return [catId, startTS, endTS, +values[key][ts]];
            }),
            animation: false,
            large: true,
            clip: true,
            showAllSymbol: true,
            renderItem: DiscoveryProfile.renderItem.bind(this),
            itemStyle: {
              opacity: 0.8,
              borderColor: color,
              borderWidth: 1,
              color: {
                type: 'linear', x: 1, y: 0, x2: 0, y2: 0,
                colorStops: [
                  {offset: 0, color: ColorLib.transparentize(color, 0.7)},
                  {offset: 1, color: ColorLib.transparentize(color, 0.3)}
                ]
              }
            },
            encode: {x: [1, 2], y: 0},
          } as SeriesOption);
          if (this.expanded) catId++;
        });
      });
    }
    this.displayExpander = series.length > 1;
    if (hasTimeBounds) {
      this.timeBounds.emit({min, max});
      this.bounds = {min, max};
    }

    this.height = 50 + (linesCount * (this.expanded ? 26 : 30)) + (!!this.innerOptions.showLegend ? 30 : 0) + (this.innerOptions.fullDateDisplay ? 50 : 0);
    this.LOG?.debug(['convert'], {
      expanded: this.expanded,
      series,
      height: this.height,
      linesCount,
      opts: this.innerOptions
    });
    return {
      animation: false,
      grid: {
        height: this.height - (!!this.innerOptions.showLegend ? 60 : 30) - (this.innerOptions.fullDateDisplay ? 40 : 0),
        right: 10,
        top: 20,
        bottom: (!!this.innerOptions.showLegend ? 30 : 10) + (this.innerOptions.fullDateDisplay ? 0 : 0),
        left: this.innerOptions.leftMargin || 10,
        containLabel: true
      },
      throttle: 70,
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if ('profile' === this.type) {
            return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">
            ${this.innerOptions.timeMode === 'timestamp'
              ? params[0].value[1]
              : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].value[1], 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                this.innerOptions.timeFormat) || '')
                .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}
           </div>
           ${params[0].marker}
           <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${params[0].seriesName}</span>
           <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${GTSLib.toDuration(params[0].value[3], this.divider)}</span>`;
          } else if ('annotation' === this.type) {
            return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
              this.innerOptions.timeMode === 'timestamp'
                ? params[0].value[0]
                : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(params[0].value[0], 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone,
                  this.innerOptions.timeFormat) || '')
                  .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')}</div>
               ${params.map(s => {
              const value = this.gtsList[s.seriesIndex].v[s.dataIndex];
              return `${s.marker} <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${s.seriesName}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${value[value.length - 1]}</span>`
            }).join('<br>')}`;
          }
        },
        axisPointer: {
          axis: 'x',
          type: 'line',
          animation: false,
          lineStyle: {
            color: Utils.getCSSColor(this.el, '--warp-view-bar-color', 'red')
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        position: (pos, params, el, elRect, size) => {
          const obj = {top: this.expanded ? pos[1] - 25 : 10};
          const p = params[0] as any;
          if (this.hasFocus) {
            const date = this.innerOptions.timeMode === 'date'
              ? GTSLib.zonedTimeToUtc(p.value[1], 1, this.innerOptions.timeZone) * this.divider
              : p.value[1];
            if (this.focusDate !== date) {
              this.dataPointOver.emit({date, name: p.seriesName, value: p.value[3], meta: {}});
              this.focusDate = date;
            }
          }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
          return obj;
        }
      },
      toolbox: {
        show: this.innerOptions.showControls,
        feature: {
          saveAsImage: {type: 'png', excludeComponents: ['toolbox']},
          dataZoom: {show: true, filterMode: 'none'},
          restore: {show: true},
        }
      },
      xAxis: {
        show: true,
        type: this.innerOptions.timeMode === 'date' ? 'time' : 'value',
        splitNumber: Math.max(Math.floor(Utils.getContentBounds(this.el.parentElement).w / 100) - 1, 1),
        splitLine: {show: false, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLine: {lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLabel: {
          color: Utils.getLabelColor(this.el),
          formatter: this.innerOptions.fullDateDisplay ? value =>
              GTSLib.toISOString(GTSLib.zonedTimeToUtc(value, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
                .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
            : undefined
        },
        axisTick: {show: true, lineStyle: {color: Utils.getGridColor(this.el)}},
        scale: !(this.innerOptions.bounds && (!!this.innerOptions.bounds.minDate || !!this.innerOptions.bounds.maxDate)),
        min: !!this.innerOptions.bounds && this.innerOptions.bounds.minDate !== undefined
          ? this.innerOptions.timeMode === 'date'
            ? GTSLib.utcToZonedTime(this.innerOptions.bounds.minDate, this.divider, this.innerOptions.timeZone)
            : this.innerOptions.bounds.minDate
          : undefined,
        max: !!this.innerOptions.bounds && this.innerOptions.bounds.maxDate !== undefined
          ? this.innerOptions.timeMode === 'date'
            ? GTSLib.utcToZonedTime(this.innerOptions.bounds.maxDate, this.divider, this.innerOptions.timeZone)
            : this.innerOptions.bounds.maxDate
          : undefined,
      },
      yAxis: {
        show: !this.innerOptions.hideYAxis,
        axisLabel: this.expanded ? {
          color: Utils.getLabelColor(this.el),
          show: !this.innerOptions.hideYAxis,
        } : {show: false},
        type: 'category',
        data: categories.length === 0 ? ['-'] : categories,
        splitNumber: Math.max(categories.length, 1),
        interval: 1,
        boundaryGap: [0, 0],
        splitLine: {show: true, lineStyle: {color: Utils.getGridColor(this.el)}},
        axisLine: {
          lineStyle: {
            color: Utils.getGridColor(this.el)
          }
        }
      },
      legend: {
        bottom: 0, left: 'center', show: !!this.innerOptions.showLegend, height: 30, type: 'scroll',
        textStyle: {color: Utils.getLabelColor(this.el)}
      },
      dataZoom: [
        this.innerOptions.showRangeSelector ? {
          type: 'slider',
          height: '20px',
          filterMode: 'none'
        } : undefined,
        {
          type: 'inside',
          filterMode: 'none'
        }
      ],
      series,
      ...this.innerOptions?.extra?.chartOpts || {}
    } as EChartsOption;
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    let initial = false;
    this.myChart = init(this.graph, null, {
      width: this.width,
      height: this.height
    });
    this.myChart.on('rendered', () => {
      this.rendering = false;
      let found = false;
      let x = 0;
      setTimeout(() => {
        while (!found && x < 1024) {
          found = this.myChart.containPixel({gridIndex: 0}, [x, this.myChart.getHeight() / 2]);
          x++;
        }
        if (this.leftMargin !== x && initial && x < 1024) {
          setTimeout(() => this.leftMarginComputed.emit(x));
          this.leftMargin = x;
        }
        if (initial) setTimeout(() => this.draw.emit());
        initial = false;
      });
    });
    this.myChart.on('dataZoom', (event: any) => {
      const {start, end} = (event.batch || [])[0] || {};
      if (start && end) {
        this.dataZoom.emit({
          start,
          end,
          min: this.innerOptions.bounds?.minDate || this.bounds?.min,
          max: this.innerOptions.bounds?.maxDate || this.bounds?.max
        });
      }
    });
    this.myChart.on('restore', () => {
      this.dataZoom.emit({
        start: 0,
        end: 100,
        min: this.innerOptions.bounds?.minDate || this.bounds?.min,
        max: this.innerOptions.bounds?.maxDate || this.bounds?.max
      });
    });
    this.el.addEventListener('dblclick', () => this.myChart.dispatchAction({type: 'restore'}));
    this.el.addEventListener('mouseover', () => this.hasFocus = true);
    this.el.addEventListener('mouseout', () => this.hasFocus = false);
    initial = true;
    this.setOpts();
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    if (this.myChart) {
      this.myChart.dispatchAction({type: 'dataZoom', ...dataZoom, dataZoomIndex: 1});
    }
    return Promise.resolve();
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return Promise.resolve(this.myChart ? this.myChart.getDataURL({type, excludeComponents: ['toolbox']}) : undefined);
  }

  @Method()
  async setFocus(regexp: string, ts: number) {
    if (!this.myChart || this.gtsList.length === 0) return;
    if (typeof ts === 'string') ts = parseInt(ts, 10);
    let ttp = [];
    const date = this.innerOptions.timeMode === 'date'
      ? GTSLib.utcToZonedTime(ts || 0, this.divider, this.innerOptions.timeZone)
      : ts || 0;
    let seriesIndex = 0;
    let dataIndex = 0;
    if (!!regexp) {
      (this.chartOpts.series as any[])
        .filter(s => new RegExp(regexp).test(s.name))
        .forEach(s => {
          seriesIndex = (this.chartOpts.series as any[]).indexOf(s);
          const data = s.data.filter(d => d[1] === date);
          if (data && data[0]) {
            dataIndex = s.data.indexOf(data[0]);
            s.markPoint = {
              symbol: 'rect',
              symbolSize: [4, 30],
              data: [{
                name: s.name,
                itemStyle: {
                  color: '#fff',
                  borderColor: s.itemStyle.color,
                },
                yAxis: data[0][0],
                xAxis: date
              }]
            }
            ttp = [date, data[0][0]]
          }
        });
      this.myChart.dispatchAction({
        type: 'highlight',
        seriesName: (this.chartOpts.series as any[]).filter(s => new RegExp(regexp).test(s.name)).map(s => s.name)
      });
    }
    (this.chartOpts.xAxis as any).axisPointer = {
      ...(this.chartOpts.xAxis as any).axisPointer || {},
      value: date,
      status: 'show'
    };
    (this.chartOpts.tooltip as any).show = true;
    if (ttp.length > 0) {
      this.myChart.dispatchAction({type: 'showTip', dataIndex, seriesIndex});
    } else {
      this.myChart.dispatchAction({type: 'hideTip'});
    }
    this.setOpts();
    return Promise.resolve();
  }

  @Method()
  async unFocus() {
    if (!this.myChart) return;
    (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
    (this.chartOpts.xAxis as any).axisPointer = {
      ...(this.chartOpts.xAxis as any).axisPointer || {},
      status: 'hide'
    };

    (this.chartOpts.yAxis as any).axisPointer = {
      ...(this.chartOpts.yAxis as any).axisPointer || {},
      status: 'hide'
    };
    this.myChart.dispatchAction({type: 'hideTip'});
    this.setOpts();
    return Promise.resolve();
  }

  private hideMarkers() {
    if (!this.myChart) return;
    (this.chartOpts.series as any[]).forEach(s => s.markPoint = undefined);
    this.setOpts();
  }

  render() {
    return <Host style={{
      width: `${this.width}
          px`, height: `${(this.height + (this.expanded ? 50 : 0))}
          px`
    }}>
      {this.displayExpander
        ?
        <button class="expander" onClick={() => this.toggle()} title="collapse/expand">+/-</button>
        : ''}
      <div class="chart-area"
           style={{
             width: `${this.width}
          px`,
             height: `${(this.height + (!!this.innerOptions.showLegend ? 50 : 0) + (!!this.innerOptions.fullDateDisplay ? 50 : 0))}
          px`
           }}>
        {this.parsing ? <div class="discovery-chart-spinner">
          <discovery-spinner>Parsing data...</discovery-spinner>
        </div> : ''}
        {this.rendering ? <div class="discovery-chart-spinner">
          <discovery-spinner>Rendering data...</discovery-spinner>
        </div> : ''}
        <div ref={(el) => this.graph = el} onMouseOver={() => this.hideMarkers()}/>
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
      this.setOpts();
    });
  }

}