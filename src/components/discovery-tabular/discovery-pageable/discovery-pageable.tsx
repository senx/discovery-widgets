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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Component, Event, EventEmitter, h, Prop, Watch} from '@stencil/core';
import {Logger} from '../../../utils/logger';
import {Param} from '../../../model/param';
import {GTSLib} from '../../../utils/gts.lib';
import {Utils} from '../../../utils/utils';
import {Dataset} from '../../../model/types';

@Component({
  tag: 'discovery-pageable',
  styleUrl: 'discovery-pageable.scss',
  shadow: true,
})
export class DiscoveryPageable {
  @Prop() debug = false;
  @Prop() divider: number;
  @Prop() data: Dataset;
  @Prop({mutable: true}) options: Param = new Param();
  @Prop({mutable: true}) params: Param[] = [];
  @Prop({mutable: true}) elemsCount = 15;
  @Prop({mutable: true}) windowed = 5;

  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;

  private LOG: Logger;
  private page = 0;
  private pages: number[] = [];
  private displayedValues: any[] = [];
  private sortAsc = false;
  private filters = {};
  private sortCol = 0;

  @Watch('data')
  updateData() {
    this.drawGridData();
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryPageable, this.debug);
    this.drawGridData();
  }

  private goto(page: number) {
    this.page = page;
    this.drawGridData();
  }

  private next() {
    this.page = Math.min(this.page + 1, this.data.values.length - 1);
    this.drawGridData();
  }

  private prev() {
    this.page = Math.max(this.page - 1, 0);
    this.drawGridData();
  }

  private drawGridData() {
    this.LOG?.debug(['drawGridData', '_options'], this.options);
    if (!this.data) {
      return;
    }
    const options = Utils.mergeDeep<Param>({...new Param(), timeMode: 'date'}, this.options || {});
    this.options = {...options};
    this.pages = [];
    for (let i = 0; i < (this.data.values || []).length / this.elemsCount; i++) {
      this.pages.push(i);
    }
    this.elemsCount = this.options.elemsCount || this.elemsCount;
    this.windowed = this.options.windowed || this.windowed;
    const dataset = (this.data.values || []).filter(d => {
      let found = Object.keys(this.filters).length === 0;
      Object.keys(this.filters).forEach(k => found = found || d[k].toString().startsWith(this.filters[k]));
      return found;
    });
    if (this.sortCol >= 0) {
      dataset.sort((a, b) => {
        if (a[this.sortCol] < b[this.sortCol]) return this.sortAsc ? 1 : -1;
        if (a[this.sortCol] > b[this.sortCol]) return this.sortAsc ? -1 : 1;
        return 0;
      });
    }
    this.displayedValues = dataset.slice(
      Math.max(0, this.elemsCount * this.page),
      Math.min(this.elemsCount * (this.page + 1), (this.data.values || []).length)
    );
    this.LOG?.debug(['drawGridData', 'data'], this.data, {
      windowed: this.windowed,
      elemsCount: this.elemsCount,
      displayedValues: this.displayedValues,
    });
  }

  private static formatLabel(name: string) {
    return GTSLib.formatLabel(name);
  }

  private setSelected(value: any) {
    this.dataPointSelected.emit({
        date: this.data.isGTS ? value[0] : undefined,
        name: this.data.name,
        value: value,
        meta: {header: this.data.headers}
      }
    );
  }

  private setOver(value: any) {
    this.dataPointOver.emit({
        date: this.data.isGTS ? value[0] : undefined,
        name: this.data.name,
        value: value,
        meta: {header: this.data.headers}
      }
    );
  }

  private sort(header) {
    if (this.options?.tabular?.sortable) {
      this.sortCol = header;
      this.sortAsc = !this.sortAsc;
      this.drawGridData();
    }
  }

  private filter(i, e) {
    this.filters[i] = e.srcElement.value;
    this.drawGridData();
  }

  private formatDate(date: number): string {
    const opts = this.options;
    return (opts.timeMode === 'timestamp' || !this.data.isGTS)
      ? date.toString()
      : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(date, this.divider, opts.timeZone), 1, opts.timeZone,
        opts.timeFormat) || '')
        .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '');
  }

  render() {
    return <div>
      <div class="heading" innerHTML={DiscoveryPageable.formatLabel(this.data.name)}/>
      {!!this.options?.tabular?.onTop ? this.getPagination() : ''}
      <table class="sortable">
        <thead>
        {this.data.headers.map((header, i) =>
          <th
            data-sort={i}
            class={this.options?.tabular?.sortable && this.sortCol === i ? 'sortable ' + (this.sortAsc ? 'asc' : 'desc') : ''}
            onClick={() => this.sort(i)}
            style={{
              width: this.options.tabular?.fixedWidth ? `${(100 / this.data.headers.length)}%` : 'auto'
            }}>{header}</th>)
        }
        </thead>
        <thead>
        {this.options?.tabular?.filterable ? this.data.headers.map((header, i) =>
            <th
              data-filter={i} style={{
              width: this.options.tabular?.fixedWidth ? `${(100 / this.data.headers.length)}%` : 'auto'
            }}><input type="text" class="discovery-input" onInput={e => this.filter(i, e)}/></th>)
          : ''
        }
        </thead>
        <tbody>
        {this.displayedValues.map((value, i) =>
          <tr class={i % 2 === 0 ? 'odd' : 'even'} onClick={() => this.setSelected(value)}
              onMouseOver={() => this.setOver(value)}
              style={this.getRowStyle(i)}
          >
            {value.map((v, j) => <td style={this.getCellStyle(i, j)}><span
              innerHTML={j === 0 ? this.formatDate(v) : v}/></td>)}
          </tr>
        )}
        </tbody>
      </table>
      {!this.options?.tabular?.onTop ? this.getPagination() : ''}
    </div>
  }

  private getRowStyle(row: number) {
    const h = this.data.values[row][0];
    const styles: any = {};
    if (this.data.params && this.data.params[h]) {
      if (!GTSLib.isArray(this.data.params[h])) {
        styles.backgroundColor = this.data.params[h].bgColor;
        styles.color = this.data.params[h].fontColor;
      }
    }
    return styles;
  }

  private getCellStyle(row: number, cell: number) {
    const h = this.data.values[row][0];
    const styles: any = {};
    if (this.data.params && this.data.params[h]) {
      if (GTSLib.isArray(this.data.params[h]) && this.data.params[h][cell]) {
        styles.backgroundColor = this.data.params[h][cell].bgColor;
        styles.color = this.data.params[h][cell].fontColor;
      }
    }
    return styles;
  }

  private getPagination() {
    return <div class="center">
      <div class="pagination">
        {this.page !== 0 ? <div class="prev hoverable" onClick={() => this.prev()}>&lt;</div> : ''}
        {this.page - this.windowed > 0 ? <div class="index disabled">...</div> : ''}
        {this.pages.length > 1
          ? this.pages.map(c => <span>
        {c >= this.page - this.windowed && c <= this.page + this.windowed
          ? <span class={{index: true, hoverable: this.page !== c, active: this.page === c}}
                  onClick={() => this.goto(c)}>{c}</span>
          : ''}
      </span>) : ''}
        {this.page + this.windowed < this.pages.length ? <div class="index disabled">...</div> : ''}
        {this.page + this.elemsCount < (this.data.values || []).length - 1 ?
          <div class="next hoverable" onClick={() => this.next()}>&gt;</div> : ''}
      </div>
    </div>;
  }
}
