/*
 *   Copyright 2022-2024  SenX S.A.S.
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars,max-classes-per-file
import { Component, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { Logger } from '../../../utils/logger';
import { Param } from '../../../model/param';
import { GTSLib } from '../../../utils/gts.lib';
import { Utils } from '../../../utils/utils';
import { Dataset } from '../../../model/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
dayjs.extend(relativeTime);

class Cell {
  value: any;
  type: 'string' | 'number' | 'elapsed' | 'date' | 'duration';
  unit: string;
  display: string;
}

@Component({
  tag: 'discovery-pageable',
  styleUrl: 'discovery-pageable.scss',
  shadow: true,
})
export class DiscoveryPageable {
  @Prop() debug = false;
  @Prop() divider: number;
  @Prop() data: Dataset;
  @Prop() options: Param = new Param();
  @Prop({ mutable: true }) params: Param[] = [];
  @Prop({ mutable: true }) elemsCount = 15;
  @Prop({ mutable: true }) windowed = 5;

  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;

  @State() innerOptions: Param;

  private LOG: Logger;
  private page = 0;
  private pages: number[] = [];
  private displayedValues: Cell[][] = [];
  private sortAsc = true;
  private filters = {};
  private sortCol = -1;
  private updateCounter = 0;
  private filteredDataset: Cell[][];

  @Watch('data')
  updateData() {
    this.drawGridData();
  }

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone({ ...new Param(), ...opts });
      this.drawGridData();
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue });
    }
  }

  @Method()
  async getData() {
    const dataset = [];
    this.filteredDataset.forEach(row => {
      const d = {};
      this.data.headers.forEach((h: string, i: number) => d[h] = row[i]?.display ?? '');
      dataset.push(d);
    });
    return Promise.resolve({ data: dataset, headers: this.data.headers });
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.LOG = new Logger(DiscoveryPageable, this.debug);
    this.innerOptions = Utils.clone({ ...new Param(), ...this.options });
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
    this.LOG?.debug(['drawGridData', '_options'], this.innerOptions);
    if (!this.data) {
      return;
    }
    const options = Utils.mergeDeep<Param>({ ...new Param(), timeMode: 'date' }, this.innerOptions || {});
    this.pages = [];
    this.elemsCount = this.innerOptions.elemsCount || this.elemsCount;
    this.windowed = this.innerOptions.windowed || this.windowed;
    const dataset: Cell[][] = (this.data.values || [])
      .map(row => row.map((v: any, i: number) => i === 0 ? this.formatDate(v) : this.formatValue(v)))
      .filter(d => {
        if (Object.keys(this.filters).length === 0) {
          return true;
        }
        let found = true;
        Object.keys(this.filters).forEach(k => found = found && d[k]?.display.toLowerCase().search(this.filters[k].toLowerCase()) >= 0);
        return found;
      });
    if (this.sortCol >= 0) {
      dataset.sort((a, b) => {
        if (a[this.sortCol] == null || b[this.sortCol] == null) {
          return -1;
        }
        switch (a[this.sortCol].type) {
          case 'string':
            return this.sortAsc
              ? a[this.sortCol].display.localeCompare(b[this.sortCol].display)
              : b[this.sortCol].display.localeCompare(a[this.sortCol].display);
          default:
            return this.sortAsc
              ? a[this.sortCol].value - b[this.sortCol].value
              : b[this.sortCol].value - a[this.sortCol].value;
        }
      });
    }
    this.filteredDataset = dataset;
    for (let i = 0; i < dataset.length / this.elemsCount; i++) {
      this.pages.push(i);
    }
    this.displayedValues = dataset.slice(
      Math.max(0, this.elemsCount * this.page),
      Math.min(this.elemsCount * (this.page + 1), (this.data.values || []).length),
    );
    this.LOG?.debug(['drawGridData', 'data'], this.data, {
      windowed: this.windowed,
      elemsCount: this.elemsCount,
      displayedValues: this.displayedValues,
    });
    this.updateCounter++;
    this.innerOptions = Utils.clone({ ...options, extra: this.updateCounter }); // cleaner way to force a render ?
  }

  private static formatLabel(name: string) {
    return GTSLib.formatLabel(name);
  }

  private setSelected(value: Cell[]) {
    this.dataPointSelected.emit({
        date: this.data.isGTS ? value[0].value : undefined,
        name: this.data.name,
        value: value,
        meta: { header: this.data.headers },
      },
    );
  }

  private setOver(value: Cell[]) {
    this.dataPointOver.emit({
        date: this.data.isGTS ? value[0].value : undefined,
        name: this.data.name,
        value: value,
        meta: { header: this.data.headers },
      },
    );
  }

  private sort(header: number) {
    if (this.innerOptions?.tabular?.sortable) {
      this.sortAsc = this.sortCol !== header ? true : !this.sortAsc;
      this.sortCol = header;
      this.drawGridData();
    }
  }

  private filter(i: number, e: any) {
    if (e.srcElement.value !== '') {
      this.filters[i] = e.srcElement.value;
    } else {
      delete this.filters[i];
    }
    this.drawGridData();
  }

  private formatDate(v: any): Cell {
    if (this.data.isGTS) {
      return this.formatValue({ value: v, type: 'date' });
    } else {
      return this.formatValue(v);
    }
  }

  private formatValue(v: any): {
    value: any;
    type: 'string' | 'number' | 'elapsed' | 'date' | 'duration';
    unit: string;
    display: string
  } {
    if (typeof v !== 'object') {
      v = {
        value: v !== undefined ? v : '',
        type: typeof v,
        unit: '',
        display: v.toString() || '',
      };
    } else {
      v = {
        type: 'string',
        unit: '',
        ...v,
      };
    }
    let res = v.value !== undefined ? v.value : '';
    switch (v.type) {
      case 'elapsed':
        if (res !== undefined && !isNaN(parseInt(res, 10))) {
          res = dayjs().to(dayjs(GTSLib.toISOString(parseInt(res, 10), this.divider, this.innerOptions.timeZone,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined)));
        } else {
          res = '';
        }
        break;
      case 'date':
        if (res !== undefined && !isNaN(parseInt(res, 10))) {
          const format = v.format || (this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined);
          res = GTSLib.toISOString(parseInt(res, 10), this.divider, this.innerOptions.timeZone, format)
            .replace('T', ' ')
            .replace(/\+[0-9]{2}:[0-9]{2}$/gi, '');
        } else {
          res = '';
        }
        break;
      case 'duration':
        const format = v.format || (this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined);
        if (res !== undefined && !isNaN(parseInt(res, 10))) {
          res = dayjs.duration(parseInt(res, 10) / this.divider).format(format);
        } else {
          res = '';
        }
        break;
      case 'string':
      case 'number':
      default:
        res = res.toString();
    }
    v.display = res.toString();
    return v;
  }

  render() {
    return <div>
      <div class="heading" innerHTML={DiscoveryPageable.formatLabel(this.data.name)} />
      {!!this.innerOptions?.tabular?.onTop ? this.getPagination() : ''}
      <table class={!!this.innerOptions?.tabular?.stickyHeader ? 'sortable nospace' : 'sortable'}>
        <thead class={!!this.innerOptions?.tabular?.stickyHeader ? 'stickyHeader' : ''}>
        <tr>
          {this.data.headers.map((header, i) =>
            <th
              data-sort={i}
              class={this.getClasses(i)}
              onClick={() => this.sort(i)}
              style={{
                width: this.innerOptions.tabular?.fixedWidth ? `${(100 / this.data.headers.length)}%` : 'auto',
              }}>{header}</th>)
          }
        </tr>
        <tr>
          {this.innerOptions?.tabular?.filterable ? this.data.headers.map((header, i) =>
              <th
                data-filter={i} style={{
                width: this.innerOptions.tabular?.fixedWidth ? `${(100 / this.data.headers.length)}%` : 'auto',
              }}><input type="text" class="discovery-input" onInput={e => this.filter(i, e)} /></th>)
            : ''
          }
        </tr>
        </thead>
        <tbody>
        {this.displayedValues.map((value, i) =>
          <tr class={i % 2 === 0 ? 'odd' : 'even'} onClick={() => this.setSelected(value)}
              onMouseOver={() => this.setOver(value)}
              style={this.getRowStyle(i)}
          >{value.map((v, j) =>
            <td style={this.getCellStyle(i, j)}><span innerHTML={v.display + (v.unit || '')} /></td>,
          )}</tr>,
        )}
        </tbody>
      </table>
      {!this.innerOptions?.tabular?.onTop ? this.getPagination() : ''}
    </div>;
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

  private getClasses(i: number): string {
    const c: string[] = [];
    if (this.innerOptions?.tabular?.sortable) {
      c.push('pointer');
    }
    if (this.innerOptions?.tabular?.sortable && this.sortCol === i) {
      c.push('sortable');
      if (this.sortAsc) {
        c.push('asc');
      } else {
        c.push('desc');
      }
    }
    return c.join(' ');
  }

  private getPagination() {
    return <div class="center">
      <div class="pagination">
        {this.page !== 0 ? <div class="prev hoverable" onClick={() => this.prev()}>&lt;</div> : ''}
        {this.page - this.windowed > 0 ? <div class="index disabled">...</div> : ''}
        {this.pages.length > 1
          ? this.pages.map(c => <span>
        {c >= this.page - this.windowed && c <= this.page + this.windowed
          ? <span class={{ index: true, hoverable: this.page !== c, active: this.page === c }}
                  onClick={() => this.goto(c)}>{c}</span>
          : ''}
      </span>) : ''}
        {this.page + this.windowed < this.pages.length ? <div class="index disabled">...</div> : ''}
        {this.page + this.elemsCount < (this.filteredDataset ?? []).length - 1 ?
          <div class="next hoverable" onClick={() => this.next()}>&gt;</div> : ''}
      </div>
    </div>;
  }
}
