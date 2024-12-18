/*
 *   Copyright 2022-2024 SenX S.A.S.
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, Dataset, DiscoveryEvent } from '../../model/types';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import html2canvas from 'html2canvas';
import streamSaver from 'streamsaver';

@Component({
  tag: 'discovery-tabular',
  styleUrl: 'discovery-tabular.scss',
  shadow: true,
})
export class DiscoveryTabular {
  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({ mutable: true }) options: Param | string = { ...new Param(), timeMode: 'date' };
  @Prop({ mutable: true }) width: number;
  @Prop({ mutable: true }) height: number;
  @Prop() debug = false;
  @Prop() unit: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;
  @Event({
    eventName: 'discoveryEvent',
    composed: true,
    cancelable: true,
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  @State() parsing = false;
  @State() rendering = false;
  @State() tabularData: Dataset[] = [];

  private LOG: Logger;
  private divider = 1000;
  private pngWrapper: HTMLDivElement;
  private params: Param[];
  private pageables: HTMLDiscoveryPageableElement[];

  @Watch('result')
  updateRes() {
    this.tabularData = this.convert(GTSLib.getData(this.result));
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    return Promise.resolve();
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(type: 'png' | 'svg' = 'png') {
    return (await html2canvas(this.pngWrapper, {
      allowTaint: true,
      backgroundColor: (this.options as Param).bgColor || Utils.getCSSColor(this.el, '--warp-view-tile-background', '#fff'),
    })).toDataURL();
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryTabular, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit ?? 'us');
    this.tabularData = this.convert(this.result ?? new DataModel());
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    this.el.addEventListener('mouseout', () => this.dataPointOver.emit({}));
  }

  private static getHeaderParam(data: DataModel, i: number, j: number, key: string, def: string): string {
    return data.params && data.params[i] && data.params[i][key] && data.params[i][key][j]
      ? data.params[i][key][j]
      : data.globalParams && data.globalParams[key] && data.globalParams[key][j]
        ? data.globalParams[key][j]
        : def;
  }

  private handleDataPointOver(event: CustomEvent) {
    event.stopImmediatePropagation();
    this.dataPointOver.emit(event.detail);
  }

  private handleDataPointSelected(event: CustomEvent) {
    event.stopImmediatePropagation();
    this.dataPointSelected.emit(event.detail);
  }

  private convert(data: DataModel): Dataset[] {
    let options = Utils.mergeDeep<Param>({ ...new Param(), timeMode: 'date' }, this.options ?? {});
    options = Utils.mergeDeep<Param>(options ?? {} as Param, data.globalParams);
    this.options = Utils.clone(options);
    this.params = data.params ?? [];
    let dataGrid: Dataset[];
    if (GTSLib.isArray(data.data)) {
      const dataList = GTSLib.flatDeep(data.data as any[]);
      this.LOG?.debug(['convert', 'isArray'], dataList, options);
      if (data.data.length > 0 && GTSLib.isGts(dataList[0])) {
        dataGrid = this.parseData(data, dataList);
      } else {
        dataGrid = this.parseCustomData(data, dataList);
      }
    } else {
      dataGrid = this.parseCustomData(data, [data.data]);
    }
    this.parsing = false;
    return dataGrid;
  }

  private parseCustomData(dataModel: DataModel, data: any[]): Dataset[] {
    const flatData: Dataset[] = [];
    data.forEach(d => {
      if (d !== null && d !== undefined) {
        const dataSet: Dataset = {
          name: d?.title ?? '',
          values: d?.rows ?? [],
          headers: d?.columns ?? [],
          isGTS: false,
          params: d?.params ?? [],
        };
        flatData.push(dataSet);
      }
    });
    this.LOG?.debug(['parseCustomData', 'flatData'], flatData, dataModel);
    return flatData;
  }

  private parseData(dataModel: DataModel, data: any[]): Dataset[] {
    const flatData: Dataset[] = [];
    this.LOG?.debug(['parseData'], data);
    data.forEach((d, i) => {
      const dataSet: Dataset = {
        name: '',
        values: [],
        headers: [],
        isGTS: false,
        params: this.params,
      };
      if (GTSLib.isGts(d)) {
        this.LOG?.debug(['parseData', 'isGts'], d);
        dataSet.name = ((dataModel.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(d);
        dataSet.values = d.v; // .map(v => [this.formatDate(v[0])].concat(v.slice(1, v.length)));
        dataSet.isGTS = true;
        dataSet.c = d.c;
        dataSet.l = d.l;
        dataSet.a = d.a;
      } else {
        this.LOG?.debug(['parseData', 'is not a Gts'], d);
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
    this.LOG?.debug(['parseData', 'flatData'], flatData, this.options);
    return flatData;
  }

  private addCSVHeader(headers: string[], k: string) {
    if (!headers.includes(k)) {
      headers.push(k);
    }
  }

  private addPageable(elem: HTMLDiscoveryPageableElement) {
    this.pageables.push(elem);
  }

  private async csvExport() {
    const headers: string[] = [];
    const csv: any[] = [];
    const tabularData = [];
    for (const p of this.pageables) {
      tabularData.push(await p.getData());
    }
    tabularData.forEach(t => {
      (t.headers ?? []).forEach((h: string) => this.addCSVHeader(headers, h));
      for (const v of t.data) {
        csv.push(v);
      }
    });
    const csvTxt = headers.join(';') + '\n' +
      csv.map(line => headers.map(h => line[h] ?? '').join(';')).join('\n');
    const uInt8 = new TextEncoder().encode(csvTxt);
    const fileStream = streamSaver.createWriteStream(((this.options as Param).title ?? 'export') + '.csv', {
      size: uInt8.byteLength, // (optional filesize) Will show progress
      writableStrategy: undefined, // (optional)
      readableStrategy: undefined,  // (optional)
    });
    const writer = fileStream.getWriter();
    writer.write(uInt8);
    writer.close();
  }

  render() {
    this.draw.emit();
    this.pageables = [];
    return [
      (this.options as Param).showControls ? <div class="tabular-action-button">
          <button class="tabular-export-csv" title="CSV Export" onClick={() => void this.csvExport()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path
                d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
              <path
                d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
            </svg>
          </button>
        </div>
        : '',

      <div class="tabular-wrapper" ref={(el) => this.pngWrapper = el}>
        <div class="tabular-wrapper-inner">
          {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
          {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
          {this.tabularData.map(d =>
            <discovery-pageable data={d}
                                onDataPointOver={event => this.handleDataPointOver(event)}
                                onDataPointSelected={event => this.handleDataPointSelected(event)}
                                divider={this.divider}
                                options={this.options as Param}
                                ref={elem => this.addPageable(elem)}
                                debug={this.debug}
            />)}
        </div>
      </div>,
    ];
  }
}
