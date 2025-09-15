/*
 *   Copyright 2022-2025 SenX S.A.S.
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
import { Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State, Watch } from '@stencil/core';
import { Utils } from '../../utils/utils';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { ChartType, Dashboard, DataModel, DiscoveryEvent, Tile } from '../../model/types';
import { JsonLib } from '../../utils/jsonLib';
import { v4 } from 'uuid';
import { PdfLib } from '../../utils/pdfLib';
import { LangUtils } from '../../utils/lang-utils';
import _ from 'lodash';

@Component({
  tag: 'discovery-dashboard',
  styleUrl: 'discovery-dashboard.scss',
  shadow: true,
})
export class DiscoveryDashboardComponent {
  @Prop() url: string;
  @Prop() dashboardTitle: string;
  @Prop({ mutable: true }) data: Dashboard | string;
  @Prop() warpscript: string;
  @Prop({ mutable: true }) options: Param | string = new Param();
  @Prop() debug = false;
  @Prop({ mutable: true }) autoRefresh = -1;
  @Prop() cellHeight = 220;
  @Prop() cols = 12;
  @Prop() type: 'scada' | 'dashboard' | 'flex' = 'dashboard';
  @Prop() language: 'warpscript' | 'flows' | 'json' = 'warpscript';
  @Prop() vars: any = '{}';
  @Prop() inTile: boolean = false;

  @Event() statusHeaders: EventEmitter<string[]>;
  @Event() statusError: EventEmitter;
  @Event() rendered: EventEmitter<void>;

  @Element() el: HTMLElement;

  @State() width: number;
  @State() height: number;
  @State() result: Dashboard;
  @State() modalContent: Tile | Dashboard;
  @State() headers: any;
  @State() loaded = false;
  @State() start: number;
  @State() innerStyle: { [k: string]: string; };
  @State() audioFile: string;
  @State() title: string;
  @State() description: string;
  @State() types: any = {};
  @State() hasError = false;

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private modal: HTMLDiscoveryModalElement;
  private innerType: 'scada' | 'dashboard' | 'flex';
  private scadaHeight: number;
  private innerStyles: any;
  private innerOptions: Param;
  private tiles: Tile[];
  private renderedTiles: Tile[];
  private done: any = {};
  private dash: HTMLDivElement;
  private innerVars = {};
  private componentId: string;
  private eventState: any = {};
  private refreshTimer: any;
  private firstLoad = false;
  private errorMessage = '';

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone(opts);
      this.LOG?.debug(['optionsUpdate'], { options: this.innerOptions, newValue, oldValue });
    }
  }

  @Watch('data')
  dataUpdate(newValue: string, oldValue: string) {
    this.LOG?.debug(['dataUpdate'], { newValue, oldValue });
    this.parseResult();
  }

  @Watch('vars')
  varsUpdate(newValue: string, oldValue: string) {
    let vars = this.vars;
    if (!!this.vars && typeof this.vars === 'string') {
      vars = JSON.parse(this.vars);
    }
    if (!Utils.deepEqual(vars, this.innerVars)) {
      this.innerVars = Utils.clone(vars);
      this.exec();
    }
    if (this.LOG) {
      this.LOG?.debug(['varsUpdate'], { vars: this.vars, newValue, oldValue });
    }
  }

  @Watch('warpscript')
  warpscriptUpdate(newValue: string, oldValue: string) {
    if (this.warpscript !== undefined && this.warpscript !== '' && this.warpscript !== 'undefined') {
      this.exec();
    }
    if (this.LOG) {
      this.LOG?.debug(['warpscriptUpdate'], {
        ws: this.ws,
        newValue, oldValue,
      });
    }
  }

  @Listen('discoveryEvent', { target: 'window' })
  async discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    this.eventState = {
      ...this.eventState,
      vars: {
        ...this.eventState.vars ?? {},
        ...Utils.clone(Utils.parseEventData(event.detail, 'tag=.*,type=.*', this.componentId).vars),
      },
    };
    const res = Utils.parseEventData(event.detail, this.innerOptions?.eventHandler, this.componentId);
    if (res.vars) {
      this.innerVars = Utils.clone({ ...(this.innerVars ?? {}), ...res.vars });
      if (!(this.innerOptions.mutedVars ?? []).includes(event.detail.selector)) {
        this.exec();
      }
    }
    if (res.popup && this.modal) {
      this.modalContent = res.popup;
      await this.modal.open();
    }
    if (res.style) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...res.style as { [k: string]: string } });
    }
    if (res.audio) {
      this.audioFile = res.audio;
    }
    if (res.title) {
      this.title = res.title;
    }
    if (res.description) {
      this.description = res.description;
    }
    if (res.link) {
      if (res.link.target === '_blank') {
        window.open(res.link.link, '_blank').focus();
      } else {
        window.location.href = res.link.link;
      }
    }
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.LOG = new Logger(DiscoveryDashboardComponent, this.debug);
    this.componentId = v4();
    if (!!this.options && typeof this.options === 'string' && this.options !== 'undefined') {
      this.innerOptions = JSON.parse(this.options ?? '{}');
    } else if (this.options === 'undefined') {
      this.innerOptions = new Param();
    } else {
      this.innerOptions = Utils.clone(this.options as Param);
    }
    this.LOG?.debug(['componentWillLoad'], { url: this.url, options: this.innerOptions });
    this.firstLoad = true;
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
    this.exec();
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    this.LOG?.debug(['disconnectedCallback'], 'disconnected');
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }

  @Method()
  async getPDF(save = true, output = 'blob', a4: boolean = false): Promise<any> {
    try {
      const win = Utils.getContentBounds(this.dash);
      const struct = await this.getDashboardStructure();
      this.LOG?.debug(['getPDF'], struct);
      return await PdfLib.generatePDF(this.dash, win.w, win.h, struct, save, output, a4, this.LOG);
    } catch (e) {
      this.LOG?.error(['getPDF'], e);
    }
  }

  @Method()
  async getVars(): Promise<any> {
    return Promise.resolve(Utils.clone(this.eventState?.vars ?? {}));
  }

  @Method()
  async getDashboardStructure(): Promise<Dashboard> {
    const result = Utils.clone(this.result);
    const tiles = Utils.clone(this.tiles);
    const res: {
      dataUrl: string,
      bgColor: string
    }[] = await Promise.all(tiles.map(((t: any) => t.elem?.export('png'))));
    for (let i = 0; i < tiles.length; i++) {
      tiles[i].png = res[i]?.dataUrl;
      tiles[i].bgColor = Utils.getCSSColor(this.el, '--warp-view-tile-background', res[i]?.bgColor);
      tiles[i].uid = v4();
      delete tiles[i].macro;
      delete tiles[i].data;
      delete tiles[i].endpoint;
    }
    result.tiles = tiles.filter((t: any) => t.type !== 'hidden');
    result.cellHeight = result.cellHeight ?? this.cellHeight ?? 220;
    result.cols = result.cols ?? this.cols ?? 12;
    result.bgColor = Utils.getCSSColor(this.el, '--warp-view-dashboard-background', '#fff');
    result.fontColor = Utils.getCSSColor(this.el, '--warp-view-font-color', '#000');
    return { ...new Dashboard(), ...result };
  }

  private processExecutionResult(res: any, stackRepresentation:boolean) {
    const result = new JsonLib().parse(res.data as string);
    let tmpResult: Dashboard;
    if (stackRepresentation) {
      tmpResult = result.length > 0 ? result[0] ?? new Dashboard() : new Dashboard();
    } else {
      tmpResult = result;
    }
    this.innerOptions = Utils.clone({ ...this.innerOptions, ...(tmpResult?.options ?? {}) });
    this.headers = res.headers;
    if (res.status) {
      this.headers.statusText = `Your script execution took ${GTSLib.formatElapsedTime(res.status.elapsed)} serverside, fetched ${res.status.fetched} datapoints and performed ${res.status.ops}  WarpLib operations.`;
    }
    this.statusHeaders.emit(this.headers);
    this.loaded = true;
    this.start = new Date().getTime();
    if (this.autoRefresh !== this.innerOptions.autoRefresh) {
      this.autoRefresh = this.innerOptions.autoRefresh;
      if (this.timer) {
        window.clearInterval(this.timer);
      }
      if (this.autoRefresh && this.autoRefresh > 0) {
        this.timer = window.setInterval(() => this.exec(), this.autoRefresh * 1000);
      }
    }
    this.innerType = tmpResult?.type ?? this.type ?? 'dashboard';
    if (typeof tmpResult?.tiles === 'string') {
      this.LOG?.debug(['exec', 'macroTiles'], tmpResult.tiles);
      const ws = LangUtils.prepare(
        Utils.unsescape(tmpResult.tiles + ' EVAL'),
        this.innerVars || {},
        this.innerOptions?.skippedVars ?? [],
        'dashboard', 'warpscript');
      Utils.httpPost(this.url, ws, this.innerOptions.httpHeaders).then((t: any) => {
        this.LOG?.debug(['exec', 'macroTiles', 'res'], t);
        this.renderedTiles = new JsonLib().parse(t.data as string)[0] ?? [];
        this.sanitizeTiles();
        this.processResult(tmpResult);
      }).catch(e => {
        this.LOG?.error(['exec'], e);
        tmpResult.tiles = [];
        this.processResult(tmpResult);
      });
    } else {
      this.renderedTiles = tmpResult?.tiles ?? [];
      this.sanitizeTiles();
      this.processResult(tmpResult);
    }
  }

  exec() {
    this.ws = this.warpscript ?? Utils.unsescape(this.el.innerHTML);
    this.hasError = false;
    this.errorMessage = '';
    if (this.ws !== undefined && this.ws !== '' && this.ws !== 'undefined' && this.firstLoad) {
      this.loaded = false;
      this.done = {};
      if (this.language !== 'json') {
        Utils.httpPost(Utils.getUrl(this.url), this.ws + ' DUP TYPEOF \'MACRO\' == <% EVAL %> IFT', this.innerOptions.httpHeaders)
          .then((res: any) => {
            this.processExecutionResult(res,true)
          }
          ).catch(e => {
            this.loaded = true;
            this.statusError.emit(e);
            if (!this.inTile) {
              this.hasError = !!this.innerOptions.showErrors;
              this.errorMessage = e.message ?? e.statusText;
            }
            this.LOG?.error(['exec'], e);
          });
      } else {
        this.processExecutionResult({ data: this.ws, headers: {} },false)
      }

    } else if (this.inTile) {
      // TODO: dashboard within a dashboard: this hacky delay ensure to have the right innerOptions to avoid the first requests that will end in 403.
      setTimeout(() => this.parseResult(), 1000);
    } else {
      this.parseResult();
    }
  }

  private sanitizeTiles() {
    this.renderedTiles.forEach(t => t.data = DiscoveryDashboardComponent.sanitize(t.data));
  }

  private parseResult() {
    let tmpResult: Dashboard;
    if (!!this.data && typeof this.data === 'string') {
      const res = JSON.parse(this.data);
      tmpResult = GTSLib.isArray(res) ? res[0] : res;
    } else {
      tmpResult = GTSLib.isArray(this.data) ? this.data[0] : this.data;
    }
    this.innerOptions = Utils.clone({ ...this.innerOptions, ...tmpResult?.options ?? {} });
    this.innerType = tmpResult?.type ?? this.type ?? 'dashboard';
    this.loaded = true;
    if (typeof tmpResult?.tiles === 'string') {
      this.LOG?.debug(['exec', 'macroTiles'], tmpResult?.tiles);
      this.processMacroTiles(tmpResult);
    } else {
      this.renderedTiles = tmpResult?.tiles ?? [];
      this.sanitizeTiles();
    }
    this.processResult(tmpResult);
  }

  private processMacroTiles(tmpResult: Dashboard) {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (typeof tmpResult.tiles === 'string') {
      Utils.httpPost(this.url, tmpResult.tiles + ' EVAL', this.innerOptions.httpHeaders).then((t: any) => {
        this.LOG?.debug(['exec', 'macroTiles', 'res'], t);
        this.renderedTiles = new JsonLib().parse(t.data as string)[0] || [];
        this.sanitizeTiles();
        this.processResult(tmpResult);
        if ((this.innerOptions.autoRefresh ?? 0) > 0 && !!this.data) {
          this.refreshTimer = setTimeout(() => this.processMacroTiles(tmpResult), this.innerOptions.autoRefresh * 1000);
        }
      }).catch(e => {
        this.LOG?.error(['exec'], e);
        tmpResult.tiles = [];
      });
    }
  }

  private processResult(tmpResult: Dashboard) {
    tmpResult = tmpResult ?? new Dashboard();
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    } else {
      this.innerVars = this.vars ?? {};
    }
    if (this.innerType === 'scada') {
      const tiles = tmpResult.tiles as Tile[];  // items array
      if (tiles.length > 0) {
        let y = 0;
        let height = 0;
        tiles.forEach(item => {
          if (item.y >= y) {
            y = item.y;
            height = Math.max(y + item.h, height);
          }
        });
        this.scadaHeight = height + 20;
      }
    }

    if (!GTSLib.isArray(tmpResult?.tiles)) {
      tmpResult.tiles = [...(tmpResult?.tiles as Tile[]) ?? []];
    } else {
      tmpResult.tiles = tmpResult.tiles ?? [];
    }
    this.LOG?.debug(['processResult', 'tmpResult'], tmpResult);
    tmpResult.vars = Utils.clone({ ...tmpResult.vars ?? {}, ...this.innerVars });
    tmpResult.cols = tmpResult.cols ?? this.cols ?? 12;
    this.result = Utils.clone(tmpResult);
    this.title = this.dashboardTitle ?? this.result.title;
    this.description = this.result.description;
    this.tiles = [];
    for (let i = 0; i < (this.result?.tiles ?? []).length; i++) {
      this.done[i] = 0;
    }
  }

  static merge(options: Param | string, tileOptions: Param) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    const opts = Utils.clone(options as Param);
    const params = _.merge(new Param(), opts, { eventHandler: undefined }, tileOptions ?? {});
    params.httpHeaders = opts.httpHeaders ?? {};
    return params;
  }

  static mergeVars(vars: any[] | string[]) {
    let myVars: any = {};
    vars.map((v: any) => typeof v === 'string' ? JSON.parse(v) : v).forEach(v => myVars = { ...myVars, ...v });
    return myVars;
  }

  static sanitize(data: any): string | DataModel {
    if (typeof data === 'string' && !data.startsWith('[') && !data.startsWith('{')) return '["' + data + '"]';
    else if (typeof data === 'string') return data;
    else return GTSLib.isArray(data) ? data : [data];
  }

  private getType(id: number, type: string): string {
    return ((this.types[id] ?? type ?? '').replace(/:/gi, '-') as string) + (this.renderedTiles[id]?.options?.responsive ? ' auto-height' : '');
  }

  private getRowSpan(id: number, span: number): string {
    return this.renderedTiles[id]?.options?.responsive ? `span ${span - 1}` : `${span}`;
  }

  private setActualType(id: number, type: CustomEvent<ChartType>) {
    type.stopPropagation();
    this.types[id] = type.detail;
    this.types = Utils.clone(this.types);
  }

  private getRendering() {
    this.tiles = [];
    switch (this.innerType) {
      case 'scada':
        return this.result ? <div class="discovery-scada-main">
          {this.title && this.title !== '' ? <h1>{this.title}</h1> : ''}
          {this.description && this.description !== '' ? <p>{this.description}</p> : ''}
          <div class="discovery-scada-wrapper" style={{ height: `${this.scadaHeight}px` }}>
            {(this.renderedTiles ?? []).map((t, i) =>
              <div class={'discovery-scada-tile ' + this.getType(i, t.type)}
                   style={{
                     left: `${t.x}px`,
                     width: `${t.w}px`,
                     height: `${t.h}px`,
                     top: `${t.y}px`,
                     zIndex: `${(t.z ?? 0)}`,
                   }}
              >
                <div>
                  {t.macro
                    ? <discovery-tile url={t.endpoint ?? this.url}
                                      type={t.type}
                                      chart-title={t.title}
                                      unit={t.unit}
                                      onSelfType={type => this.setActualType(i, type)}
                                      debug={this.debug}
                                      id={`chart-${i}`}
                                      script={t.macro + ' EVAL'}
                                      ref={(el) => this.addTile(el, t, i)}
                                      vars={JSON.stringify(DiscoveryDashboardComponent.mergeVars([this.result.vars, t.vars]))}
                                      options={JSON.stringify(DiscoveryDashboardComponent.merge(this.innerOptions, t.options))}
                    ></discovery-tile>
                    : <discovery-tile-result
                      url={t.endpoint ?? this.url}
                      result={t.data}
                      type={t.type}
                      onSelfType={type => this.setActualType(i, type)}
                      ref={(el) => this.addTile(el, t, i)}
                      id={`chart-${i}}`}
                      unit={t.unit}
                      options={DiscoveryDashboardComponent.merge(this.innerOptions, t.options)}
                      debug={this.debug}
                      chart-title={t.title}
                    />
                  }</div>
              </div>)
            }</div>
        </div> : '';
      case 'dashboard':
        return this.result ?
          <div class="discovery-dashboard-main">
            {this.title && this.title !== '' ? <h1>{this.title}</h1> : ''}
            {this.description && this.description !== '' ? <p>{this.description}</p> : ''}
            <div class="discovery-dashboard-wrapper" style={{
              width: '100%',
              gridAutoRows: `minmax(${(this.result?.cellHeight ?? this.cellHeight)}px, auto)`,
              gridTemplateColumns: `repeat(${this.result.cols}, 1fr)`,
            }}>
              {(this.renderedTiles ?? []).map((t, i) =>
                <div class={'discovery-dashboard-tile ' + this.getType(i, t.type)}
                     style={{
                       gridColumn: `${(t.x + 1)} / ${(t.x + t.w + 1)}`,
                       gridRow: `${(t.y + 1)} / ${(t.y + t.h + 1)}`,
                       height: `${((this.result.cellHeight || this.cellHeight) * t.h + 10 * (t.h - 1) + 5)}px`,
                       minHeight: '100%',
                       gridRowEnd: this.getRowSpan(i, t.y + t.h + 1),
                     }}
                >
                  <div>
                    {t.macro
                      ? <discovery-tile url={t.endpoint ?? this.url}
                                        type={t.type}
                                        chart-title={t.title}
                                        debug={this.debug}
                                        unit={t.unit}
                                        id={`chart-${i}`}
                                        script={t.macro + ' EVAL'}
                                        ref={(el) => this.addTile(el, t, i)}
                                        onSelfType={type => this.setActualType(i, type)}
                                        vars={JSON.stringify(DiscoveryDashboardComponent.mergeVars([this.innerVars, this.result.vars, t.vars]))}
                                        options={JSON.stringify(DiscoveryDashboardComponent.merge(this.innerOptions, t.options))}
                      ></discovery-tile>
                      : <discovery-tile-result
                        url={t.endpoint ?? this.url}
                        result={t.data}
                        type={t.type}
                        ref={(el) => this.addTile(el, t, i)}
                        unit={t.unit}
                        id={`chart-${i}}`}
                        onSelfType={type => this.setActualType(i, type)}
                        options={DiscoveryDashboardComponent.merge(this.innerOptions, t.options)}
                        debug={this.debug}
                        chart-title={t.title}
                      />
                    }</div>
                </div>)
              }</div>
          </div> : '';
      case 'flex':
        return this.result ?
          <div class="discovery-flex-main">
            {this.title && this.title !== '' ? <h1>{this.title}</h1> : ''}
            {this.description && this.description !== '' ? <p>{this.description}</p> : ''}
            <div class="discovery-flex-wrapper">
              {(this.renderedTiles ?? []).map((t, i) =>
                <div class={'discovery-dashboard-tile ' + this.getType(i, t.type)}
                     style={{
                       height: this.getHeight(t),
                       minHeight: '100%',
                       maxWidth: `calc(100% / ${this.result.cols} * ${t.w} - var(--warp-view-dashboard-gap, 10px) * 2)`,
                     }}
                     id={t.id}
                >
                  <div>
                    {t.macro
                      ? <discovery-tile url={t.endpoint ?? this.url}
                                        type={t.type}
                                        chart-title={t.title}
                                        debug={this.debug}
                                        unit={t.unit}
                                        script={t.macro + ' EVAL'}
                                        id={`chart-${i}`}
                                        onSelfType={type => this.setActualType(i, type)}
                                        ref={(el) => this.addTile(el, t, i)}
                                        vars={JSON.stringify(DiscoveryDashboardComponent.mergeVars([this.result.vars, t.vars]))}
                                        options={JSON.stringify(DiscoveryDashboardComponent.merge(this.innerOptions, t.options))}
                      ></discovery-tile>
                      : <discovery-tile-result
                        url={t.endpoint ?? this.url}
                        result={t.data}
                        type={t.type}
                        ref={(el) => this.addTile(el, t, i)}
                        unit={t.unit}
                        onSelfType={type => this.setActualType(i, type)}
                        id={`chart-${i}}`}
                        options={JSON.stringify(DiscoveryDashboardComponent.merge(this.innerOptions, t.options))}
                        debug={this.debug}
                        chart-title={t.title}
                      />
                    }</div>
                </div>)
              }</div>
          </div> : '';

      default:
        return '';
    }
  }

  render() {
    return <Host>
      <discovery-modal
        ref={(el) => this.modal = el}
        data={this.modalContent}
        options={this.innerOptions}
        url={this.url}
        parentId={this.componentId}
        debug={this.debug} />
      {this.loaded
        ? [
          <style>{this.generateStyle(this.innerStyle)}</style>,
          this.hasError ? <div class="discovery-tile-error">{this.errorMessage}</div> : '',
          <div ref={el => this.dash = el}>{this.getRendering()}</div>,
          this.audioFile ? <audio src={this.audioFile} autoPlay id="song" /> : '',
        ]
        : <discovery-spinner>Requesting data...</discovery-spinner>
      }
      <pre id="ws"><slot /></pre>
    </Host>;
  }

  private generateStyle(styles: { [k: string]: string }): string {
    this.innerStyles = Utils.clone({ ...this.innerStyles, ...styles, ...this.innerOptions.customStyles ?? {} });
    return Object.keys(this.innerStyles || {}).map(k => `${k} { ${this.innerStyles[k]} }`).join('\n');
  }

  private addTile(el: HTMLDiscoveryTileElement | HTMLDiscoveryTileResultElement, t: Tile, i: number) {
    if (el) {
      t.elem = el;
      this.tiles.push(t);
      el.addEventListener('draw', () => {
         
        this.done[i] = (this.done[i] || 0) + 1;
        const res = Object.keys(this.done).map(s => {
          switch (this.tiles[i]?.type) {
            case 'line':
            case 'area':
            case 'scatter':
            case 'spline-area':
            case 'step-area':
            case 'spline':
            case 'step':
            case 'step-after':
            case 'step-before':
              return this.done[s] === !!this.tiles[i].macro ? 2 : 1;
            default:
              return this.done[s] === 1;
          }
        });
        if ((this.renderedTiles ?? []).length === Object.keys(this.done).length && res.every(r => !!r)) {
          this.rendered.emit();
        }
      });
    }
  }

  private getHeight(t: Tile) {
    return `${((this.result.cellHeight ?? this.cellHeight) * t.h + 10 * (t.h - 1) + 5)}px`;
  }
}
