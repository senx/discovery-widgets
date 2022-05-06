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

import {Component, Event, EventEmitter, h, Prop, Watch} from "@stencil/core";
import {Logger} from "../../../utils/logger";
import {Param} from "../../../model/param";
import {GTSLib} from "../../../utils/gts.lib";
import {Utils} from "../../../utils/utils";
import {Dataset} from "../discovery-tabular";

@Component({
  tag: 'discovery-pageable',
  styleUrl: 'discovery-pageable.scss',
  shadow: true,
})
export class DiscoveryPageable {
  @Prop() debug: boolean = false;
  @Prop() divider: number;
  @Prop() data: Dataset;
  @Prop({mutable: true}) options: Param = new Param();
  @Prop({mutable: true}) elemsCount = 15;
  @Prop({mutable: true}) windowed = 5;

  @Event() dataPointOver: EventEmitter;

  private LOG: Logger;
  private page = 0;
  private pages: number[] = [];
  private displayedValues: any[] = [];

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
    this.LOG.debug(['drawGridData', '_options'], this.options);
    if (!this.data) {
      return;
    }
    const options = Utils.mergeDeep<Param>({...new Param(), timeMode: 'date'}, this.options || {}) as Param;
    this.options = {...options};
    this.pages = [];
    for (let i = 0; i < (this.data.values || []).length / this.elemsCount; i++) {
      this.pages.push(i);
    }
    this.elemsCount = this.options.elemsCount || this.elemsCount;
    this.windowed = this.options.windowed || this.windowed;
    this.displayedValues = (this.data.values || []).slice(
      Math.max(0, this.elemsCount * this.page),
      Math.min(this.elemsCount * (this.page + 1), (this.data.values || []).length)
    );
    this.LOG.debug(['drawGridData', 'data'], this.data, {
      windowed: this.windowed,
      elemsCount: this.elemsCount,
      displayedValues: this.displayedValues,
    });
  }

  private static formatLabel(name: string) {
    return GTSLib.formatLabel(name);
  }

  private setSelected(value: any) {
    this.dataPointOver.emit({
        date: this.data.isGTS ? value[0] : undefined,
        name: this.data.name,
        value: value,
        meta: {
          header: this.data.headers
        }
      }
    );
  }

  private formatDate(date: number): string {
    const opts = this.options as Param;
    return (opts.timeMode === 'timestamp' || !this.data.isGTS)
      ? date.toString()
      : (GTSLib.toISOString(GTSLib.zonedTimeToUtc(date, this.divider, opts.timeZone), 1, opts.timeZone,
        opts.timeFormat) || '')
        .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '');
  }

  render() {
    return <div>
      <div class="heading" innerHTML={DiscoveryPageable.formatLabel(this.data.name)}/>
      <table>
        <thead>{this.data.headers.map(header => <th
          style={{width: this.options.tabular?.fixedWidth ? (100 / this.data.headers.length) + '%' : 'auto'}}>{header}</th>)}</thead>
        <tbody>
        {this.displayedValues.map((value, i) =>
          <tr class={i % 2 === 0 ? 'odd' : 'even'} onClick={() => this.setSelected(value)}>
            {value.map((v, j) => <td><span innerHTML={j === 0 ? this.formatDate(v) : v}/></td>)}
          </tr>
        )}
        </tbody>
      </table>
      <div class="center">
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
      </div>
    </div>
  }
}
