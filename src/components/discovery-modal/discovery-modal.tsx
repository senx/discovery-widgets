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
import { Component, h, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, Dashboard, Tile } from '../../model/types';
import { Utils } from '../../utils/utils';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { JsonLib } from '../../utils/jsonLib';
import { GTSLib } from '../../utils/gts.lib';
import { ColorLib } from '../../utils/color-lib';

@Component({
  tag: 'discovery-modal',
  styleUrl: 'discovery-modal.scss',
  shadow: true,
})
export class DiscoveryModalComponent {
  @Prop({ mutable: true }) data: Tile | Dashboard;
  @Prop({ mutable: true }) options: Param | string = new Param();
  @Prop() url: string;
  @Prop() debug = false;

  @State() private tile: Tile;
  @State() private dashboard: Dashboard;
  @State() private showModal = false;

  private modal: HTMLDivElement;
  private modalWrapper: HTMLDivElement;
  private tileElem: HTMLDiscoveryTileResultElement | HTMLDiscoveryTileElement;
  private LOG: Logger;
  private title: string;


  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.LOG?.debug(['optionsUpdate'], {
      options: this.options,
      newValue, oldValue,
    });
  }


  @Watch('data')
  dataUpdate(newValue: string, oldValue: string) {
    if (!!this.data && typeof this.data === 'string') {
      this.data = new JsonLib().parse(this.data as string);
    }
    this.LOG?.debug(['dataUpdate'], { data: this.data, newValue, oldValue });
    this.parseData();
  }

  @Method()
  public async open() {
    this.showModal = true;
    setTimeout(()=> this.resize(), 1000)
    return Promise.resolve();
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryModalComponent, this.debug);
    this.parseData();
  }

  private parseData() {
    if (GTSLib.isArray(this.data)) {
      this.data = this.data[0];
    }
    if (this.data) {
      if ((this.data as any).macro ?? (this.data as any).data) {
        this.dashboard = undefined;
        this.tile = this.data as Tile;
        this.title = this.tile.title;
        this.tile.title = undefined;
      } else {
        this.tile = undefined;
        this.dashboard = this.data as Dashboard;
        this.title = this.dashboard.title;
        this.dashboard.title = undefined;
      }
      this.LOG?.debug(['parseData'], { tile: this.tile, dashboard: this.dashboard });
    }
  }

  private async resize() {
    this.modalWrapper.style.height = Utils.getContentBounds(this.modalWrapper).h + 'px';
    if(this.tileElem) await this.tileElem.resize();
  }

  private closeModal() {
    this.showModal = false;
  }

  render() {
    return <div ref={(el) => this.modal = el}>
      {this.showModal ? <div class="modal"
                             style={{
                               backgroundColor: (this.options as Param)?.popup?.backdropColor
                                 ? ColorLib.sanitizeColor((this.options as Param)?.popup?.backdropColor)
                                 : Utils.getCSSColor(this.modal, '--warp-view-modal-backdrop-color', '#00000066'),
                             }}
      >
        <div class="modal-content" style={{
          width: (this.options as Param)?.popup?.width ?? '80%',
          minHeight: (this.options as Param)?.popup?.height ?? '80%',
          backgroundColor: (this.options as Param)?.popup?.bgColor
            ? ColorLib.sanitizeColor((this.options as Param)?.popup?.bgColor)
            : Utils.getCSSColor(this.modal, '--warp-view-modal-bg-color', '#fefefe'),
        }}>
          <div class="header">
            {this.title ? <h2 class="title"
                              style={{
                                color: (this.options as Param)?.popup?.fontColor
                                  ? ColorLib.sanitizeColor((this.options as Param)?.popup?.fontColor)
                                  : Utils.getCSSColor(this.modal, '--warp-view-font-color', '#404040'),
                              }}
            >{this.title}</h2> : <span></span>}
            <span class="close"
                  style={{
                    color: (this.options as Param)?.popup?.fontColor
                      ? ColorLib.sanitizeColor((this.options as Param)?.popup?.fontColor)
                      : Utils.getCSSColor(this.modal, '--warp-view-font-color', '#404040'),
                  }}
                  onClick={() => this.closeModal()}>&times;</span>
          </div>
          <div class="modal-wrapper"  ref={(el) => this.modalWrapper = el}>
            {!!this.tile
              ? this.tile.macro
                ? <discovery-tile url={this.tile.endpoint || this.url}
                                  type={this.tile.type as ChartType}
                                  chart-title={this.tile.title}
                                  debug={this.debug}
                                  onDraw={e => this.resize()}
                                  ref={(el) => this.tileElem = el}
                                  options={JSON.stringify(Utils.merge(this.options, this.tile.options))}
                >{this.tile.macro + ' EVAL'}</discovery-tile>
                : <discovery-tile-result
                  url={this.tile.endpoint || this.url}
                  result={Utils.sanitize(this.tile.data)}
                  type={this.tile.type as ChartType}
                  unit={this.tile.unit}
                  options={Utils.merge(this.options, this.tile.options)}
                  debug={this.debug}
                  onDraw={e => this.resize()}
                  ref={(el) => this.tileElem = el}
                  chart-title={this.tile.title}
                />
              : ''}
            {!!this.dashboard
              ? <discovery-dashboard url={this.url} dashboard-title={this.dashboard.title}
                                     cols={this.dashboard.cols} cell-height={this.dashboard.cellHeight}
                                     debug={this.debug} options={this.options}
              >{`<%
<'
${JSON.stringify(this.dashboard)}
'>
JSON-> %> EVAL`}</discovery-dashboard>
              : ''}
          </div>
        </div>
      </div> : ''}
    </div>;
  }
}
