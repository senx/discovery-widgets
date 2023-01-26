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
import {Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {Utils} from '../../utils/utils';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {ChartType, Dashboard, DataModel, DiscoveryEvent, Tile} from '../../model/types';
import {JsonLib} from '../../utils/jsonLib';
import {v4, v4 as uuidv4} from 'uuid';
import {PdfLib} from '../../utils/pdfLib';
import {LangUtils} from '../../utils/lang-utils';

@Component({
  tag: 'discovery-dashboard',
  styleUrl: 'discovery-dashboard.scss',
  shadow: true,
})
export class DiscoveryDashboardComponent {
  @Prop() url: string;
  @Prop() dashboardTitle: string;
  @Prop({mutable: true}) data: Dashboard | string;
  @Prop() warpscript: string;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() debug = false;
  @Prop({mutable: true}) autoRefresh = -1;
  @Prop() cellHeight = 220;
  @Prop() cols = 12;
  @Prop() type: 'scada' | 'dashboard' | 'flex' = 'dashboard';
  @Prop() vars: any | string = '{}';

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

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private modal: HTMLDiscoveryModalElement;
  private innerType: 'scada' | 'dashboard' | 'flex';
  private scadaHeight: number;
  private innerStyles: any;
  private tiles: Tile[];
  private renderedTiles: Tile[];
  private done: any = {};
  private dash: HTMLDivElement;
  private innerVars = {}
  private componentId: string;
  private eventState: any = {};
  @State() private types: any = {};
  private refreshTimer;

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
    this.LOG?.debug(['optionsUpdate'], {
      options: this.options,
      newValue, oldValue
    });
    this.parseResult();
  }


  @Watch('vars')
  varsUpdate(newValue: string, oldValue: string) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
      this.exec();
    } else {
      this.innerVars = this.vars || {};
    }
    if (this.LOG) {
      this.LOG?.debug(['varsUpdate'], {
        vars: this.vars,
        newValue, oldValue
      });
    }
  }

  @Watch('warpscript')
  warpscriptUpdate(newValue: string, oldValue: string) {
    if (!!this.warpscript) {
      this.exec();
    }
    if (this.LOG) {
      this.LOG?.debug(['warpscriptUpdate'], {
        ws: this.ws,
        newValue, oldValue
      });
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  async discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    this.eventState = Utils.mergeDeep(this.eventState, Utils.parseEventData(event.detail, 'tag=.*,type=.*', this.componentId));
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler, this.componentId);
    if (res.popup && this.modal) {
      this.modalContent = res.popup;
      await this.modal.open();
    }
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
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
    if (res.vars) {
      this.innerVars = {...(this.innerVars || {}), ...this.innerVars, ...res.vars};
      if (!((this.options as Param).mutedVars || []).includes(event.detail.selector)) {
        this.exec();
      }
    }
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryDashboardComponent, this.debug);
    this.componentId = v4();
    if (!!this.options && typeof this.options === 'string' && this.options !== 'undefined') {
      this.options = JSON.parse(this.options || '{}');
    }
    if (this.options === 'undefined') {
      this.options = new Param();
    }
    this.LOG?.debug(['componentWillLoad'], {url: this.url, options: this.options});
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
  }

  componentDidLoad() {
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
  async getPDF(save = true, output = 'blob'): Promise<any> {
    try {
      const win = Utils.getContentBounds(this.dash);
      const struct = await this.getDashboardStructure();
      this.LOG?.debug(['getPDF'], struct);
      return await PdfLib.generatePDF(win.w, win.h, struct, save, output, this.LOG);
    } catch (e) {
      this.LOG?.error(['getPDF'], e);
    }
  }

  @Method()
  async getVars(): Promise<any> {
    return Promise.resolve({
      ...this.innerVars,
      ...(this.eventState?.vars || {})
    });
  }

  @Method()
  async getDashboardStructure(): Promise<Dashboard> {
    const result = Utils.clone(this.result);
    const tiles = Utils.clone(this.tiles);
    const res: { dataUrl: string, bgColor: string }[] = await Promise.all(tiles.map((t => t.elem?.export('png'))));
    for (let i = 0; i < tiles.length; i++) {
      tiles[i].png = res[i]?.dataUrl;
      tiles[i].bgColor = Utils.getCSSColor(this.el, '--warp-view-tile-background', res[i]?.bgColor);
      tiles[i].uid = uuidv4();
      delete tiles[i].macro;
      delete tiles[i].data;
      delete tiles[i].elem;
      delete tiles[i].endpoint;
    }
    result.tiles = tiles.filter(t => t.type !== 'hidden');
    result.cellHeight = result.cellHeight || this.cellHeight || 220;
    result.cols = result.cols || this.cols || 12;
    result.bgColor = Utils.getCSSColor(this.el, '--warp-view-dashboard-background', '#fff');
    result.fontColor = Utils.getCSSColor(this.el, '--warp-view-font-color', '#000');
    return {...new Dashboard(), ...result};
  }

  exec() {
    this.ws = this.warpscript || Utils.unsescape(this.el.innerHTML);
    if (this.ws && this.ws !== '') {
      this.loaded = false;
      this.done = {};
      Utils.httpPost(this.url, this.ws + ' DUP TYPEOF \'MACRO\' == <% EVAL %> IFT', (this.options as Param).httpHeaders)
        .then((res: any) => {
          const result = new JsonLib().parse(res.data as string);
          const tmpResult: Dashboard = result.length > 0 ? result[0] : new Dashboard();
          this.options = {...this.options as Param, ...tmpResult.options};
          this.headers = {};
          res.headers.split('\n')
            .filter(header => header !== '' && header.toLowerCase().startsWith('x-warp10'))
            .forEach(headerName => {
              const header = headerName.split(':');
              this.headers[header[0].trim()] = header[1].trim();
            });
          this.headers.statusText = `Your script execution took ${GTSLib.formatElapsedTime(parseInt(this.headers['x-warp10-elapsed'], 10))} serverside,
fetched ${this.headers['x-warp10-fetched']} datapoints
and performed ${this.headers['x-warp10-ops']}  WarpLib operations.`;
          this.statusHeaders.emit(this.headers);
          this.loaded = true;
          this.start = new Date().getTime();
          if (this.autoRefresh !== this.options.autoRefresh) {
            this.autoRefresh = this.options.autoRefresh;
            if (this.timer) {
              window.clearInterval(this.timer);
            }
            if (this.autoRefresh && this.autoRefresh > 0) {
              this.timer = window.setInterval(() => this.exec(), this.autoRefresh * 1000);
            }
          }
          this.innerType = tmpResult.type || this.type || 'dashboard';

          if (typeof tmpResult.tiles === 'string') {
            this.LOG?.debug(['exec', 'macroTiles'], tmpResult.tiles);
            const ws = LangUtils.prepare(
              Utils.unsescape(tmpResult.tiles + ' EVAL'),
              this.innerVars || {},
              (this.options)?.skippedVars || [],
              'dashboard', 'warpscript');
            Utils.httpPost(this.url, ws, this.options.httpHeaders).then((t: any) => {
              this.LOG?.debug(['exec', 'macroTiles', 'res'], t);
              this.renderedTiles = new JsonLib().parse(t.data as string)[0] || []
              this.processResult(tmpResult);
            }).catch(e => {
              this.LOG?.error(['exec'], e);
              tmpResult.tiles = [];
              this.processResult(tmpResult);
            });
          } else {
            this.renderedTiles = tmpResult.tiles || [];
            this.processResult(tmpResult);
          }
        }).catch(e => {
        this.statusError.emit(e);
        this.LOG?.error(['exec'], e);
      });
    } else {
      this.parseResult();
    }
  }

  private parseResult() {
    let tmpResult: Dashboard;
    if (!!this.data && typeof this.data === 'string') {
      const res = JSON.parse(this.data);
      tmpResult = GTSLib.isArray(res) ? res[0] : res;
    } else {
      tmpResult = GTSLib.isArray(this.data) ? this.data[0] : this.data;
    }
    this.options = {...this.options as Param, ...tmpResult.options};
    this.innerType = tmpResult.type || this.type || 'dashboard';
    this.loaded = true;
    if (typeof tmpResult.tiles === 'string') {
      this.LOG?.debug(['exec', 'macroTiles'], tmpResult.tiles);
      this.processMacroTiles(tmpResult)
    } else {
      this.renderedTiles = tmpResult.tiles || [];
    }
    this.processResult(tmpResult);
  }

  private processMacroTiles(tmpResult: Dashboard) {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (typeof tmpResult.tiles === 'string') {
      Utils.httpPost(this.url, tmpResult.tiles + ' EVAL', (this.options as Param).httpHeaders).then((t: any) => {
        this.LOG?.debug(['exec', 'macroTiles', 'res'], t);
        this.renderedTiles = new JsonLib().parse(t.data as string)[0] || []
        this.processResult(tmpResult);
        if ((this.options as Param).autoRefresh || 0 > 0 && !!this.data) {
          this.refreshTimer = setTimeout(() => this.processMacroTiles(tmpResult), (this.options as Param).autoRefresh * 1000);
        }
      }).catch(e => {
        this.LOG?.error(['exec'], e);
        tmpResult.tiles = [];
      });
    }
  }

  private processResult(tmpResult: Dashboard) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    } else {
      this.innerVars = this.vars || {};
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

    if (GTSLib.isArray(tmpResult.tiles)) {
      tmpResult.tiles = [...(tmpResult.tiles as Tile[]) || []];
    } else {
      tmpResult.tiles = tmpResult.tiles || [];
    }
    this.LOG?.debug(['processResult', 'tmpResult'], tmpResult);
    tmpResult.vars = {...tmpResult.vars || {}, ...this.innerVars};
    tmpResult.cols = tmpResult.cols || this.cols || 12;
    this.result = {...tmpResult};
    this.title = this.dashboardTitle || this.result.title;
    this.description = this.result.description;
    this.tiles = [];
    for (let i = 0; i < {tiles: {}, ...this.result}.tiles.length; i++) {
      this.done[i] = 0;
    }
  }

  static merge(options: Param | string, options2: Param) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    return {...new Param(), ...options as Param, ...options2}
  }

  static mergeVars(vars: any[] | string[]) {
    let myVars: any = {};
    vars.map(v => {
      if (typeof v === 'string') {
        return JSON.parse(v);
      } else {
        return v;
      }
    }).forEach(v => myVars = {...myVars, ...v});
    return myVars;
  }

  static sanitize(data: string | DataModel | any): string | DataModel {
    if (typeof data === 'string') return '["' + data + '"]';
    else return GTSLib.isArray(data) ? data : [data];
  }


  private getType(id: number, type: string): string {
    return ((this.types[id] || type || '').replace(/:/gi, '-') as string) + (!!this.renderedTiles[id]?.options?.responsive ? ' auto-height' : '');
  }

  private setActualType(id: number, type: CustomEvent<ChartType>) {
    type.stopPropagation();
    this.types[id] = type.detail;
    this.types = {...this.types};
  }

  private getRendering() {
    switch (this.innerType) {
      case 'scada':
        return <div class="discovery-scada-main">
          <h1>{this.title}</h1>
          <p>{this.description}</p>
          <div class="discovery-scada-wrapper" style={{height: `${this.scadaHeight}px`}}>
            {(this.renderedTiles || []).map((t, i) =>
              <div class={'discovery-scada-tile ' + this.getType(i, t.type)}
                   style={{
                     left: `${t.x}px`,
                     width: `${t.w}px`,
                     height: `${t.h}px`,
                     top: `${t.y}px`,
                     zIndex: `${(t.z || 0)}`
                   }}
              >
                <div>
                  {t.macro
                    ? <discovery-tile url={t.endpoint || this.url}
                                      type={t.type as ChartType}
                                      chart-title={t.title}
                                      unit={t.unit}
                                      onSelfType={type => this.setActualType(i, type)}
                                      debug={this.debug}
                                      id={`chart-${i}}`}
                                      ref={(el) => this.addTile(el, t, i)}
                                      vars={JSON.stringify(DiscoveryDashboardComponent.mergeVars([this.result.vars, t.vars]))}
                                      options={JSON.stringify(DiscoveryDashboardComponent.merge(this.options, t.options))}
                    >{t.macro + ' EVAL'}</discovery-tile>
                    : <discovery-tile-result
                      url={t.endpoint || this.url}
                      result={DiscoveryDashboardComponent.sanitize(t.data)}
                      type={t.type as ChartType}
                      onSelfType={type => this.setActualType(i, type)}
                      ref={(el) => this.addTile(el, t, i)}
                      id={`chart-${i}}`}
                      unit={t.unit}
                      options={DiscoveryDashboardComponent.merge(this.options, t.options)}
                      debug={this.debug}
                      chart-title={t.title}
                    />
                  }</div>
              </div>)
            }</div>
        </div>;
      case 'dashboard':
        return this.result ?
          <div class="discovery-dashboard-main">
            <h1>{this.title}</h1>
            <p>{this.description}</p>
            <div class="discovery-dashboard-wrapper" style={{
              width: '100%',
              gridAutoRows: `minmax(${(this.result?.cellHeight || this.cellHeight)}px, auto)`,
              gridTemplateColumns: `repeat(${this.result.cols}, 1fr)`
            }}>
              {(this.renderedTiles || []).map((t, i) =>
                <div class={'discovery-dashboard-tile ' + this.getType(i, t.type)}
                     style={{
                       gridColumn: `${(t.x + 1)} / ${(t.x + t.w + 1)}`,
                       gridRow: `${(t.y + 1)} / ${((this.options as Param).responsive ? 'span ' : '')}${(t.y + t.h + 1)}`,
                       height: `${((this.result.cellHeight || this.cellHeight) * t.h + 10 * (t.h - 1) + 5)}px`,
                       minHeight: '100%'
                     }}
                >
                  <div>
                    {t.macro
                      ? <discovery-tile url={t.endpoint || this.url}
                                        type={t.type as ChartType}
                                        chart-title={t.title}
                                        debug={this.debug}
                                        unit={t.unit}
                                        id={`chart-${i}}`}
                                        ref={(el) => this.addTile(el, t, i)}
                                        onSelfType={type => this.setActualType(i, type)}
                                        vars={JSON.stringify(DiscoveryDashboardComponent.mergeVars([this.result.vars, t.vars]))}
                                        options={JSON.stringify(DiscoveryDashboardComponent.merge(this.options, t.options))}
                      >{t.macro + ' EVAL'}</discovery-tile>
                      : <discovery-tile-result
                        url={t.endpoint || this.url}
                        result={DiscoveryDashboardComponent.sanitize(t.data)}
                        type={t.type as ChartType}
                        ref={(el) => this.addTile(el, t, i)}
                        unit={t.unit}
                        id={`chart-${i}}`}
                        onSelfType={type => this.setActualType(i, type)}
                        options={DiscoveryDashboardComponent.merge(this.options, t.options)}
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
            <h1>{this.title}</h1>
            <p>{this.description}</p>
            <div class="discovery-flex-wrapper">
              {(this.renderedTiles || []).map((t, i) =>
                <div class={'discovery-dashboard-tile ' + this.getType(i, t.type)}
                     style={{
                       height: `${((this.result.cellHeight || this.cellHeight) * t.h + 10 * (t.h - 1) + 5)}px`,
                       minHeight: '100%',
                       maxWidth: `calc(100% / ${this.result.cols} * ${t.w} - var(--warp-view-dashboard-gap, 10px) * 2)`
                     }}
                >
                  <div>
                    {t.macro
                      ? <discovery-tile url={t.endpoint || this.url}
                                        type={t.type as ChartType}
                                        chart-title={t.title}
                                        debug={this.debug}
                                        unit={t.unit}
                                        id={`chart-${i}}`}
                                        onSelfType={type => this.setActualType(i, type)}
                                        ref={(el) => this.addTile(el, t, i)}
                                        vars={JSON.stringify(DiscoveryDashboardComponent.mergeVars([this.result.vars, t.vars]))}
                                        options={JSON.stringify(DiscoveryDashboardComponent.merge(this.options, t.options))}
                      >{t.macro + ' EVAL'}</discovery-tile>
                      : <discovery-tile-result
                        url={t.endpoint || this.url}
                        result={DiscoveryDashboardComponent.sanitize(t.data)}
                        type={t.type as ChartType}
                        ref={(el) => this.addTile(el, t, i)}
                        unit={t.unit}
                        onSelfType={type => this.setActualType(i, type)}
                        id={`chart-${i}}`}
                        options={DiscoveryDashboardComponent.merge(this.options, t.options)}
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
        options={this.options}
        url={this.url}
        debug={this.debug}/>
      {this.loaded
        ? [<style>{this.generateStyle(this.innerStyle)}</style>,
          <div ref={el => this.dash = el}>{this.getRendering()}</div>, this.audioFile ?
            <audio src={this.audioFile} autoPlay id="song"/> : '']
        : <discovery-spinner>Requesting data...</discovery-spinner>
      }
      <pre id="ws"><slot/></pre>
    </Host>;
  }

  private generateStyle(styles: { [k: string]: string }): string {
    this.innerStyles = {...this.innerStyles, ...styles, ...(this.options as Param).customStyles || {}};
    return Object.keys(this.innerStyles || {}).map(k => `${k} { ${this.innerStyles[k]} }`).join('\n');
  }

  private addTile(el: HTMLDiscoveryTileElement | HTMLDiscoveryTileResultElement, t: Tile, i: number) {
    if (!!el) {
      t.elem = el;
      this.tiles.push(t);
      el.addEventListener('draw', () => {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        this.done[i] = (this.done[i] || 0) + 1;
        const res = Object.keys(this.done).map(s => {
          switch (this.tiles[i].type) {
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
        if ((this.renderedTiles || []).length === Object.keys(this.done).length && res.every(r => !!r)) {
          this.rendered.emit();
        }
      });
    }
  }
}
