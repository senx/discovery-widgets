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
import {Component, h, Method, Prop, State, Watch} from '@stencil/core';
import {Tile} from '../../model/tile';
import {Dashboard} from '../../model/dashboard';
import {ChartType} from '../../model/types';
import {Utils} from '../../utils/utils';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {JsonLib} from '../../utils/jsonLib';

@Component({
  tag: 'discovery-modal',
  styleUrl: 'discovery-modal.scss',
  shadow: true,
})
export class DiscoveryModalComponent {
  @Prop({mutable: true}) data: Tile | Dashboard;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() url: string;
  @Prop() debug = false;

  @State() private tile: Tile;
  @State() private dashboard: Dashboard;
  @State() private showModal = false;

  private modal: HTMLDivElement;
  private LOG: Logger;


  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.LOG?.debug(['optionsUpdate'], {
      options: this.options,
      newValue, oldValue
    });
  }


  @Watch('data')
  dataUpdate(newValue: string, oldValue: string) {
    if (!!this.data && typeof this.data === 'string') {
      this.data = new JsonLib().parse(this.data as string);
    }
    this.LOG?.debug(['dataUpdate'], {
      data: this.data,
      newValue, oldValue
    });
    this.parseData();
  }

  @Method()
  public async open() {
    this.showModal = true;
    return Promise.resolve();
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryModalComponent, this.debug);
    this.parseData();
  }

  private parseData() {
    if (this.data) {
      if ((this.data as any).macro || (this.data as any).data) {
        this.dashboard = undefined;
        this.tile = this.data as Tile;
      } else {
        this.tile = undefined;
        this.dashboard = this.data as Dashboard;
      }
      this.LOG?.debug(['parseData'], {tile: this.tile, dashboard: this.dashboard});
    }
  }

  private closeModal() {
    this.showModal = false;
  }

  render() {
    return <div ref={(el) => this.modal = el}>
      {this.showModal ? <div class="modal">
        <div class="modal-content">
          <span class="close" onClick={() => this.closeModal()}>&times;</span>
          {!!this.tile ? <div class="modal-wrapper">{!!this.tile.macro
            ? <discovery-tile url={this.tile.endpoint || this.url}
                              type={this.tile.type as ChartType}
                              chart-title={this.tile.title}
                              debug={this.debug}
                              options={JSON.stringify(Utils.merge(this.options, this.tile.options))}
            >{this.tile.macro + ' EVAL'}</discovery-tile>
            : <discovery-tile-result
              url={this.tile.endpoint || this.url}
              result={Utils.sanitize(this.tile.data)}
              type={this.tile.type as ChartType}
              unit={this.tile.unit}
              options={Utils.merge(this.options, this.tile.options)}
              debug={this.debug}
              chart-title={this.tile.title}
            />}</div> : ''
          }
          {!!this.dashboard ? <div class="modal-wrapper">
            <discovery-dashboard url={this.url} dashboard-title={this.dashboard.title}
                                 cols={this.dashboard.cols} cell-height={this.dashboard.cellHeight}
                                 debug={this.debug} options={this.options}
            >{`<%
<'
${JSON.stringify(this.dashboard)}
'>
JSON-> %> EVAL`}</discovery-dashboard>
          </div> : ''}
        </div>
      </div> : ''}
    </div>
  }
}
