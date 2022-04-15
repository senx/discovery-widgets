/*
 *   Copyright 2022  SenX S.A.S.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from "@stencil/core";
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import html2canvas from 'html2canvas';

@Component({
  tag: 'discovery-tabular',
  styleUrl: 'discovery-tabular.scss',
  shadow: true,
})
export class DiscoveryTabular {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = {...new Param(), timeMode: 'date'};
  @Prop({mutable: true}) width: number;
  @Prop({mutable: true}) height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() tabularData: { name: string, values: any[], headers: string[] }[] = [];

  private LOG: Logger;
  private divider: number = 1000;
  private pngWrapper: HTMLDivElement;

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


  // noinspection JSUnusedLocalSymbols
  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return (await html2canvas(this.pngWrapper)).toDataURL();
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
  }

  private static getHeaderParam(data: DataModel, i: number, j: number, key: string, def: string): string {
    return data.params && data.params[i] && data.params[i][key] && data.params[i][key][j]
      ? data.params[i][key][j]
      : data.globalParams && data.globalParams[key] && data.globalParams[key][j]
        ? data.globalParams[key][j]
        : def;
  }

  private convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>({...new Param(), timeMode: 'date'}, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    let dataGrid: { name: string, values: any[], headers: string[] }[];
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
    this.LOG.debug(['parseCustomData', 'flatData'], flatData, dataModel);
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
        dataSet.name = ((dataModel.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(d);
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
    return (this.options as Param).timeMode === 'date'
      ? GTSLib.toISOString(date, this.divider, (this.options as Param).timeZone,
        (this.options as Param).fullDateDisplay ? (this.options as Param).timeFormat : undefined)
      : date.toString();
  }

  render() {
    this.draw.emit();
    return <div class="tabular-wrapper" ref={(el) => this.pngWrapper = el as HTMLDivElement}>
      <div class="tabular-wrapper-inner">
        {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
        {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
        {this.tabularData.map(d => <discovery-pageable data={d} options={this.options as Param} debug={this.debug}/>)}
      </div>
    </div>
  }
}
