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
import { Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch } from '@stencil/core';
import { Utils } from '../../utils/utils';
import { ChartType, DataModel, DiscoveryEvent } from '../../model/types';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { LangUtils } from '../../utils/lang-utils';
import { v4 } from 'uuid';

@Component({
  tag: 'discovery-tile',
  styleUrl: 'discovery-tile.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop({ mutable: true }) url: string;
  @Prop() chartTitle: string;
  @Prop() chartDescription: string;
  @Prop() type: ChartType;
  @Prop({ mutable: true, reflect: true }) options: Param | string = new Param();
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() debug = false;
  @Prop() unit = '';
  @Prop({ mutable: true }) autoRefresh = -1;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  @Prop() vars: any | string = '{}';

  @Event({ bubbles: true }) statusHeaders: EventEmitter<string[]>;
  @Event({ bubbles: true }) statusError: EventEmitter;
  @Event({ bubbles: true }) execResult: EventEmitter<string>;
  @Event() selfType: EventEmitter<ChartType>;
  @Event() draw: EventEmitter<void>;

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
  @State() hiddenByWs = false;

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private timerFadeOut: any;
  private innerVars = {};
  private innerOptions: Param = new Param();
  private tileResult: HTMLDiscoveryTileResultElement;
  private socket: WebSocket;
  private componentId: string;
  private firstExec = false;

  @Watch('options')
  async optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone(opts);
      if (Utils.deepEqual(opts.httpHeaders ?? {}, this.innerOptions.httpHeaders ?? {})) {
        await this.exec(true);
      }
      this.LOG?.debug(['optionsUpdate 2'], this.type, { options: this.innerOptions, newValue, oldValue });
    }
  }

  @Watch('vars')
  async varsUpdate(newValue: string, oldValue: string) {
    let vars = this.vars;
    if (!!this.vars && typeof this.vars === 'string') {
      vars = JSON.parse(this.vars);
    }
    if (!Utils.deepEqual(vars, this.innerVars)) {
      this.innerVars = Utils.clone(vars);
      await this.exec(true);
    }
    if (this.LOG) {
      this.LOG?.debug(['varsUpdate'], { vars: this.vars, newValue, oldValue });
    }
  }

  @Listen('discoveryEvent', { target: 'window' })
  async discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, this.innerOptions.eventHandler, this.componentId);
    if (res.vars) {
      this.innerVars = Utils.clone({ ...(this.innerVars ?? {}), ...res.vars });
      if (!(this.innerOptions.mutedVars ?? []).includes(event.detail.selector)) {
        await this.exec(true);
      }
    }
    if (res.selected) {
      const vars = Utils.clone({ ...(this.innerVars ?? {}), ...res.vars });
      if (!Utils.deepEqual(this.innerVars ?? {}, vars)) {
        this.innerVars = Utils.clone(vars);
        if (!(this.innerOptions.mutedVars ?? []).includes(event.detail.selector)) {
          await this.exec(true);
        }
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

  // noinspection JSUnusedGlobalSymbols
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
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = { ...(this.options as any) ?? new Param() };
    }
    this.innerVars = JSON.parse(this.vars ?? '{}');
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
  }

  async componentDidLoad() {
    if (!this.firstExec) {
      await this.exec();
    }
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    this.LOG?.debug(['disconnectedCallback'], 'disconnected');
    if (this.timer) {
      window.clearInterval(this.timer);
      window.clearInterval(this.timerFadeOut);
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
      if (this.el?.innerHTML !== undefined) {
        if (!refresh) {
          setTimeout(() => this.loaded = false);
        }
        this.ws = LangUtils.prepare(
          Utils.unsescape(this.el.innerHTML),
          { ...this.innerVars ?? {} },
          this.innerOptions?.skippedVars ?? [],
          this.type,
          this.language);
        if (!!window) {
          const win = window as any;
          let registry = win.DiscoveryPluginRegistry;
          registry = registry ?? {};
          if (!!(registry ?? {})[this.type] && !!registry[this.type].scriptWrapper && typeof registry[this.type].scriptWrapper === 'function') {
            this.ws = registry[this.type].scriptWrapper(this.ws);
          }
        }
        this.LOG?.debug(['exec'], this.chartTitle, this.ws, this.type);
        this.url = Utils.getUrl(this.url);
        if (this.url.toLowerCase().startsWith('http')) {
          setTimeout(() => {
            this.hasError = false;
            this.errorMessage = '';
            this.statusMessage = undefined;
            this.showLoader = !!this.innerOptions.showLoader;
          });

          Utils.httpPost(this.url, this.ws, this.innerOptions.httpHeaders)
            .then((res: any) => {
              this.hiddenByWs = false;
              const toRefresh = this.result === res.data;
              if ((this.type ?? '').startsWith('input') || (this.type ?? '').startsWith('svg')) {
                this.result = '';
              }
              this.headers = res.headers;
              this.headers.statusText = `Your script execution took ${GTSLib.formatElapsedTime(res.status.elapsed)} serverside, fetched ${res.status.fetched} datapoints and performed ${res.status.ops}  WarpLib operations.`;
              this.LOG?.debug(['exec', 'headers'], this.headers);
              this.statusHeaders.emit(this.headers);
              if (this.innerOptions.showStatus) {
                this.statusMessage = this.headers.statusText;
              }
              this.start = window.performance.now();
              const rws: DataModel = GTSLib.getData(res.data);
              let autoRefreshFeedBack = rws.globalParams?.autoRefresh ?? -1;
              const fadeOutAfter = rws.globalParams?.fadeOutAfter;
              if (rws.localvars) {
                Utils.mergeDeep(this.innerVars, rws.localvars);
              }
              if (autoRefreshFeedBack < 0) {
                autoRefreshFeedBack = undefined;
              }
              if (this.autoRefresh !== this.innerOptions.autoRefresh ?? autoRefreshFeedBack) {
                this.autoRefresh = autoRefreshFeedBack ? autoRefreshFeedBack : this.innerOptions.autoRefresh;
                if (this.timer) {
                  window.clearInterval(this.timer);
                }
                if (this.autoRefresh && this.autoRefresh > 0) {
                  this.timer = window.setInterval(() => void this.exec(true), this.autoRefresh * 1000);
                }
              }
              if (fadeOutAfter) {
                if (this.timerFadeOut) {
                  window.clearInterval(this.timerFadeOut);
                }
                if (fadeOutAfter > 0) {
                  this.timerFadeOut = window.setInterval(() => {
                    this.hiddenByWs = true;
                    window.clearInterval(this.timerFadeOut);
                  }, fadeOutAfter * 1000);
                }
              }
              setTimeout(() => {
                void (async () => {
                  this.loaded = true;
                  this.showLoader = false;
                  this.LOG?.debug(['exec', 'result'], this.chartTitle, this.result);
                  this.result = res.data;
                  this.execResult.emit(this.result);
                  this.hasError = false;
                  if (toRefresh && refresh && !!this.tileResult) {
                    await this.tileResult.parseEvents();
                  }
                  resolve(true);
                })();
              });
            })
            .catch(e => {
              this.displayError(e);
              this.loaded = true;
              this.showLoader = false;
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
                this.hasError = this.innerOptions.showErrors;
                this.errorMessage = JSON.parse(res)[0] || 'Error';
                this.statusError.emit(this.errorMessage);
              } else {
                this.result = res;
                this.hasError = false;
                this.errorMessage = '';
                this.LOG?.debug(['exec', 'result'], this.result);
                this.execResult.emit(this.result);
              }
            };
            this.socket.send(`<% ${this.ws} %> ${(this.innerOptions.autoRefresh || 1000)} EVERY`);
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

  private handleSelfType(type: any) {
    this.selfType.emit(type);
  }

  private displayError(e: any) {
    this.statusError.emit(e);
    this.hasError = !!this.innerOptions.showErrors;
    this.errorMessage = e.message ?? e.statusText;
    this.LOG?.error(['exec'], e, this.innerOptions.showErrors, this.errorMessage);
  }

  render() {
    return <div>
      {this.loaded ?
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
             class={this.hiddenByWs ? 'hidden-by-ws' : ''}>
          {this.hasError ? <div class="discovery-tile-error">{this.errorMessage}</div> : ''}
          <discovery-tile-result
            url={this.url}
            start={this.start}
            result={this.result}
            type={this.type}
            options={JSON.stringify(this.innerOptions)}
            unit={this.unit}
            debug={this.debug}
            height={this.height}
            width={this.width}
            language={this.language}
            chart-title={this.chartTitle}
            chart-description={this.chartDescription}
            onSelfType={type => this.handleSelfType(type)}
            onExecError={(e: any) => this.displayError(e.detail)}
            onDraw={() => this.draw.emit()}
            vars={JSON.stringify(this.innerVars)}
            ref={(el) => this.tileResult = el}
            id={this.componentId}
          />
          {this.statusMessage ? <div class="discovery-tile-status">{this.statusMessage}</div> : ''}
        </div>
        : <div class="discovery-tile-spinner">
          {this.showLoader ? <discovery-spinner>Requesting data...</discovery-spinner> : ''}
        </div>
      }
      {this.showLoader ? <div class="discovery-tile-spinner">
        <discovery-spinner>Requesting data...</discovery-spinner>
      </div> : ''}
      <pre id="ws"><slot /></pre>
    </div>;
  }
}
