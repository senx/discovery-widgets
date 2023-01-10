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
import {Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {Utils} from '../../utils/utils';
import {ChartType, DiscoveryEvent} from '../../model/types';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {LangUtils} from '../../utils/lang-utils';
import {v4} from 'uuid';

@Component({
  tag: 'discovery-tile',
  styleUrl: 'discovery-tile.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() url: string;
  @Prop() chartTitle: string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() debug = false;
  @Prop() unit = '';
  @Prop({mutable: true}) autoRefresh = -1;
  @Prop() vars: any | string = '{}';

  @Event({bubbles: true}) statusHeaders: EventEmitter<string[]>;
  @Event({bubbles: true}) statusError: EventEmitter;
  @Event({bubbles: true}) execResult: EventEmitter<string>;
  @Event() selfType: EventEmitter<ChartType>;

  @Element() el: HTMLElement;

  @State() loaded = false;
  @State() result = '[]';
  @State() width: number;
  @State() height: number;
  @State() headers: any;
  @State() start: number;
  @State() showLoader = false;
  @State() hasError = false;
  @State() errorMessage = '';
  @State() statusMessage = '';

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private innerVars = {}
  private tileResult: HTMLDiscoveryTileResultElement;
  private socket: WebSocket;
  private componentId: string;

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    if (this.LOG) {
      this.LOG?.debug(['optionsUpdate'], {
        options: this.options,
        newValue, oldValue
      });
    }
  }

  @Watch('vars')
  varsUpdate(newValue: string, oldValue: string) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
      void this.exec(true).then(() => {
        // empty
      });
    }
    if (this.LOG) {
      this.LOG?.debug(['varsUpdate'], {
        vars: this.vars,
        newValue, oldValue
      });
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler, this.componentId);
    if (res.vars) {
      this.innerVars = {...(this.innerVars || {}), ...this.innerVars, ...res.vars};
      if (!((this.options as Param).mutedVars || []).includes(event.detail.selector)) {
        void this.exec(true).then(() => {
          // empty
        });
      }
    }
    if (res.selected) {
      this.innerVars = {...(this.innerVars || {}), ...this.innerVars, ...res.selected};
      if (!((this.options as Param).mutedVars || []).includes(event.detail.selector)) {
        void this.exec(true).then(() => {
          // empty
        });
      }
    }
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
    this.LOG?.debug(['componentDidLoad'], 'Tile - resize', this.tileResult);
    if (this.tileResult) {
      return this.tileResult.resize();
    }
  }

  @Method()
  async show(regexp: string) {
    if (this.tileResult) {
      await this.tileResult.show(regexp);
    }
  }
  @Method()
  async showById(id: number) {
    if (this.tileResult) {
      await this.tileResult.showById(id);
    }
  }

  @Method()
  async hide(regexp: string) {
    if (this.tileResult) {
      await this.tileResult.hide(regexp);
    }
  }
  @Method()
  async hideById(id: number) {
    if (this.tileResult) {
      await this.tileResult.hideById(id);
    }
  }

  @Method()
  async setFocus(regexp: string, ts: number, value?: number) {
    if (this.tileResult) {
      await this.tileResult.setFocus(regexp, ts, value);
    }
  }

  @Method()
  async unFocus() {
    if (this.tileResult) {
      await this.tileResult.unFocus();
    }
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileComponent, this.debug);
    this.componentId = v4();
    this.LOG?.debug(['componentWillLoad'], {
      url: this.url,
      type: this.type,
      options: this.options,
      language: this.language,
      innerVars: this.innerVars,
    });
    if (!!this.options && typeof this.options === 'string' && this.options !== 'undefined') {
      this.options = JSON.parse(this.options);
    }
    this.innerVars = JSON.parse(this.vars || '{}');
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
  }

  async componentDidLoad() {
    await this.exec();
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    this.LOG?.debug(['disconnectedCallback'], 'disconnected');
    if (this.timer) {
      window.clearInterval(this.timer);
    }
    if (!!this.socket) {
      this.socket.close();
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png'): Promise<{ dataUrl: string, bgColor: string }> {
    if (this.tileResult) {
      return this.tileResult.export(type);
    } else {
      return undefined;
    }
  }

  @Method()
  async exec(refresh = false) {
    return new Promise(resolve => {
      if (this.el.innerHTML && this.el.innerHTML !== '') {
        if (!refresh) {
          setTimeout(() => this.loaded = false);
        }
        this.ws = LangUtils.prepare(
          Utils.unsescape(this.el.innerHTML),
          this.innerVars || {},
          (this.options as Param)?.skippedVars || [],
          this.type,
          this.language);
        if (!!window) {
          const win = window as any;
          let registry = win.DiscoveryPluginRegistry;
          registry = registry || {};
          if (!!(registry || {})[this.type] && !!registry[this.type].scriptWrapper && typeof registry[this.type].scriptWrapper === 'function') {
            this.ws = registry[this.type].scriptWrapper(this.ws);
          }
        }
        this.LOG?.debug(['exec'], this.ws, this.type);
        if (this.url.toLowerCase().startsWith('http')) {
          setTimeout(() => {
            this.hasError = false;
            this.errorMessage = '';
            this.statusMessage = undefined;
            if ((this.options as Param).showLoader) {
              this.showLoader = true;
            }
          });

          Utils.httpPost(this.url, this.ws, (this.options as Param).httpHeaders)
            .then((res: any) => {
              const toRefresh = this.result === res.data;
              if(this.type.startsWith('input')) {
                this.result = '';
              }
              this.headers = {};
              res.headers.split('\n')
                .filter(header => header !== '' && header.toLowerCase().startsWith('x-warp10'))
                .forEach(header => {
                  const headerName = header.split(':');
                  this.headers[headerName[0].trim()] = headerName[1].trim();
                });
              this.headers.statusText = `Your script execution took ${GTSLib.formatElapsedTime(parseInt(this.headers['x-warp10-elapsed'], 10))} serverside,
fetched ${this.headers['x-warp10-fetched']} datapoints
and performed ${this.headers['x-warp10-ops']}  WarpLib operations.`;
              this.LOG?.debug(['exec', 'headers'], this.headers);
              this.statusHeaders.emit(this.headers);
              if ((this.options as Param).showStatus) {
                this.statusMessage = this.headers.statusText;
              }
              this.start = new Date().getTime();
              if (this.autoRefresh !== (this.options as Param).autoRefresh) {
                this.autoRefresh = (this.options as Param).autoRefresh;
                if (this.timer) {
                  window.clearInterval(this.timer);
                }
                if (this.autoRefresh && this.autoRefresh > 0) {
                  this.timer = window.setInterval(() => void this.exec(true), this.autoRefresh * 1000);
                }
              }
              setTimeout(() => {
                void (async () => {
                  this.loaded = true;
                  this.showLoader = false;
                  this.LOG?.debug(['exec', 'result'], this.result);
                  this.result = res.data as string;
                  this.execResult.emit(this.result);
                  if (toRefresh && refresh) {
                    await this.tileResult.parseEvents();
                  }
                  resolve(true);
                })();
              });
            }).catch(e => {
            this.statusError.emit(e);
            setTimeout(() => {
              this.loaded = true;
              this.showLoader = false;
              this.hasError = (this.options as Param).showErrors;
              this.errorMessage = e;
            });
            this.LOG?.error(['exec'], e);
            resolve(true);
          });
        } else if (this.url.toLowerCase().startsWith('ws')) {
          // Web Socket
          if (!!this.socket) {
            this.socket.close();
          }
          this.socket = new WebSocket(this.url);
          this.socket.onopen = () => {
            this.socket.onmessage = event => {
              const res = event.data as string;
              setTimeout(() => {
                this.loaded = true;
                this.showLoader = false;
              });
              if (res.startsWith('["Exception at \'EVERY')) {
                this.hasError = (this.options as Param).showErrors;
                this.errorMessage = JSON.parse(res)[0] || 'Error';
                this.statusError.emit(this.errorMessage);
              } else {
                this.result = res;
                this.hasError = false;
                this.errorMessage = '';
                this.LOG?.debug(['exec', 'result'], this.result);
                this.execResult.emit(this.result);
              }
            }
            this.socket.send(`<% ${this.ws} %> ${((this.options as Param).autoRefresh || 1000)} EVERY`);
            resolve(true);
          };
        }
      }
    });
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    await this.tileResult.setZoom(dataZoom);
  }

  render() {
    return <div>
      {this.loaded ?
        this.hasError
          ? <div class="discovery-tile-error">{this.errorMessage}</div>
          : <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
            <discovery-tile-result
              url={this.url}
              start={this.start}
              result={this.result}
              type={this.type}
              options={this.options}
              unit={this.unit}
              debug={this.debug}
              height={this.height}
              width={this.width}
              language={this.language}
              chart-title={this.chartTitle}
              onSelfType={type => this.handleSelfType(type)}
              vars={JSON.stringify(this.innerVars)}
              ref={(el) => this.tileResult = el}
              id={this.componentId}
            />
            {this.statusMessage
              ? <div class="discovery-tile-status">{this.statusMessage}</div>
              : ''}
          </div>
        : <div class="discovery-tile-spinner">
          {this.showLoader ? <discovery-spinner>Requesting data...</discovery-spinner> : ''}
        </div>
      }
      {this.showLoader ? <div class="discovery-tile-spinner">
        <discovery-spinner>Requesting data...</discovery-spinner>
      </div> : ''}
      <pre id="ws"><slot/></pre>
    </div>;
  }

  private handleSelfType(type) {
    this.selfType.emit(type);
  }
}
