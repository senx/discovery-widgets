import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from "@stencil/core";
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import elementResizeEvent from "element-resize-event";

@Component({
  tag: 'discovery-tabular',
  styleUrl: 'discovery-tabular.scss',
  shadow: true,
})
export class DiscoveryTabular {
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
  @State() tabularData: { name: string, values: any[], headers: string[] }[] = [];

  private LOG: Logger;
  private divider: number = 1000;

  @Watch('result')
  updateRes() {
    this.tabularData = this.convert(GTSLib.getData(this.result));
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
  }


  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryTabular, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.tabularData = this.convert(this.result as DataModel || new DataModel())
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    elementResizeEvent(this.el.parentElement, () => this.resize());
  }

  private static getHeaderParam(data: DataModel, i: number, j: number, key: string, def: string): string {
    return data.params && data.params[i] && data.params[i][key] && data.params[i][key][j]
      ? data.params[i][key][j]
      : data.globalParams && data.globalParams[key] && data.globalParams[key][j]
        ? data.globalParams[key][j]
        : def;
  }

  private convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>({...new Param(), timeMode: 'date'},this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    let dataGrid: { name: string, values: any[], headers: string[] }[] = [];
    if (GTSLib.isArray(data.data)) {
      const dataList = GTSLib.flatDeep(data.data as any[]);
      this.LOG.debug(['convert', 'isArray'], dataList, options);
      if (data.data.length > 0 && GTSLib.isGts(dataList[0])) {
        dataGrid = this.parseData(data, dataList);
      } else {
        dataGrid = this.parseCustomData(data, dataList);
      }
    } else {
      dataGrid = this.parseCustomData(data, [data.data as any]);
    }
    this.parsing = false;
    return dataGrid;
  }

  private parseCustomData(dataModel: DataModel, data: any[]): { name: string, values: any[], headers: string[] }[] {
    const flatData: { name: string, values: any[], headers: string[] }[] = [];
    data.forEach(d => {
      const dataSet: { name: string, values: any[], headers: string[] } = {
        name: d.title || '',
        values: d.rows,
        headers: d.columns,
      };
      flatData.push(dataSet);
    });
    this.LOG.debug(['parseCustomData', 'flatData'], flatData);
    return flatData;
  }

  private parseData(dataModel: DataModel, data: any[]): { name: string, values: any[], headers: string[] }[] {
    const flatData: { name: string, values: any[], headers: string[] }[] = [];
    this.LOG.debug(['parseData'], data);
    data.forEach((d, i) => {
      const dataSet: { name: string, values: any[], headers: string[] } = {
        name: '',
        values: [],
        headers: []
      };
      if (GTSLib.isGts(d)) {
        this.LOG.debug(['parseData', 'isGts'], d);
        dataSet.name = GTSLib.serializeGtsMetadata(d);
        dataSet.values = d.v.map(v => [this.formatDate(v[0])].concat(v.slice(1, v.length)));
      } else {
        this.LOG.debug(['parseData', 'is not a Gts'], d);
        dataSet.values = GTSLib.isArray(d) ? d : [d];
      }
      dataSet.headers = [DiscoveryTabular.getHeaderParam(dataModel, i, 0, 'headers', 'Date')];
      if (d.v && d.v.length > 0 && d.v[0].length > 2) {
        dataSet.headers.push(DiscoveryTabular.getHeaderParam(dataModel, i, 1, 'headers', 'Latitude'));
      }
      if (d.v && d.v.length > 0 && d.v[0].length > 3) {
        dataSet.headers.push(DiscoveryTabular.getHeaderParam(dataModel, i, 2, 'headers', 'Longitude'));
      }
      if (d.v && d.v.length > 0 && d.v[0].length > 4) {
        dataSet.headers.push(DiscoveryTabular.getHeaderParam(dataModel, i, 3, 'headers', 'Elevation'));
      }
      if (d.v && d.v.length > 0) {
        dataSet.headers.push(DiscoveryTabular.getHeaderParam(dataModel, i, d.v[0].length - 1, 'headers', 'Value'));
      }
      if (dataSet.values.length > 0) {
        flatData.push(dataSet);
      }
    });
    this.LOG.debug(['parseData', 'flatData'], flatData, this.options);
    return flatData;
  }

  formatDate(date: number): string {
    return (this.options as Param).timeMode === 'date' ? GTSLib.toISOString(date, this.divider, (this.options as Param).timeZone) : date.toString();
  }

  render() {
    this.draw.emit();
    return <div class="tabular-wrapper">
      {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
      {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
      {this.tabularData.map(d => <discovery-pageable data={d} options={this.options as Param} debug={this.debug} /> )}
    </div>
  }
}
