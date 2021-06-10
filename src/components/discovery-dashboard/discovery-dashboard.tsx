import {Component, Element, Event, EventEmitter, h, Host, Listen, Prop, State, Watch} from '@stencil/core';
import {Utils} from "../../utils/utils";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Dashboard} from "../../model/dashboard";
import {ChartType} from "../../model/types";
import {DataModel} from "../../model/dataModel";
import {DiscoveryEvent} from "../../model/discoveryEvent";
import {Tile} from "../../model/tile";

@Component({
  tag: 'discovery-dashboard',
  styleUrl: 'discovery-dashboard.scss',
  shadow: true,
})
export class DiscoveryDashboardComponent {
  @Prop() url: string;
  @Prop() dashboardTitle: string;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() debug: boolean = false;
  @Prop({mutable: true}) autoRefresh: number = -1;
  @Prop() cellHeight: number = 220;
  @Prop() cols: number = 12;
  @Prop() type: 'scada' | 'dashboard' = 'dashboard';

  @Event() statusHeaders: EventEmitter<string[]>;
  @Event() statusError: EventEmitter;

  @Element() el: HTMLElement;
  @State() width: number;
  @State() height: number;
  @State() result: Dashboard;
  @State() modalContent: Tile | Dashboard;
  @State() headers: any;
  @State() loaded = false;
  @State() start: number;

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private modal: HTMLDiscoveryModalElement;
  private _type: 'scada' | 'dashboard';
  private scadaHeight: number;

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.LOG.debug(['optionsUpdate'], {
      options: this.options,
      newValue, oldValue
    });
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler);
    if (res.popup && this.modal) {
      this.modalContent = res.popup;
      this.modal.open().then(() => {
      });
    }
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryDashboardComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      url: this.url,
      options: this.options,
    });
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }

    const {h, w} = Utils.getContentBounds(this.el.parentElement);
    this.width = w - 15;
    this.height = h;
  }

  componentDidLoad() {
    this.exec();
  }

  disconnectedCallback() {
    this.LOG.debug(['disconnectedCallback'], 'disconnected');
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }

  exec(refresh = false) {
    this.ws = this.el.innerText;
    if (this.ws && this.ws !== '') {
      this.loaded = false;
      Utils.httpPost(this.url, this.ws)
        .then((res: any) => {
          const result = JSON.parse(res.data as string);
          const tmpResult = result.length > 0 ? result[0] : new Dashboard();
          this.options = {...this.options as Param, ...tmpResult.options};
          this.headers = {};
          res.headers.split('\n')
            .filter(h => h !== '' && h.toLowerCase().startsWith('x-warp10'))
            .forEach(h => {
              const header = h.split(':');
              this.headers[header[0].trim()] = header[1].trim();
            });
          this.headers['statusText'] = `Your script execution took ${GTSLib.formatElapsedTime(parseInt(this.headers['x-warp10-elapsed'], 10))} serverside,
fetched ${this.headers['x-warp10-fetched']} datapoints
and performed ${this.headers['x-warp10-ops']}  WarpLib operations.`;
          this.statusHeaders.emit(this.headers);
          this.loaded = true;
          this.start = new Date().getTime();
          if (this.autoRefresh !== (this.options as Param).autoRefresh) {
            this.autoRefresh = (this.options as Param).autoRefresh;
            if (this.timer) {
              window.clearInterval(this.timer);
            }
            if (this.autoRefresh && this.autoRefresh > 0) {
              this.timer = window.setInterval(() => this.exec(true), this.autoRefresh * 1000);
            }
          }
          this._type = tmpResult.type || this.type || 'dashboard';
          if (this._type === 'scada') {
            const tiles = tmpResult.tiles;  // items array
            if (tiles.length > 0) {
              let y = 0;
              let h = 0;
              tiles.forEach(item => {
                if (item.y >= y) {
                  y = item.y;
                  h = Math.max(y + item.h, h);
                }
              });
              this.scadaHeight = h + 20;
            }
          }
          this.result = {...tmpResult};
        }).catch(e => {
        this.statusError.emit(e);
        this.LOG.error(['exec'], e);
      })
    }
  }

  static merge(options: Param | string, options2: Param) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    return {...new Param(), ...options as Param, ...options2}
  }


  static sanitize(data: string | DataModel) {
    if (typeof data === 'string') return '["' + data + '"]';
    else return data
  }

  private getRendering() {
    switch (this._type) {
      case "scada":
        return <div class="discovery-scada-main">
          {this.dashboardTitle || this.result.title ? <h1>{this.dashboardTitle || this.result.title}</h1> : ''}
          {this.result.description ? <p>{this.result.description}</p> : ''}
          <div class="discovery-scada-wrapper"
               style={{height: this.scadaHeight + 'px'}}
          >
            {this.result.tiles.map((t) =>
              <div class="discovery-scada-tile"
                   style={{
                     left: t.x + 'px',
                     width: t.w + 'px',
                     height: t.h + 'px',
                     top: t.y + 'px',
                     zIndex: '' + (t.z || 0)
                   }}
              >
                <div>
                  {t.macro
                    ? <discovery-tile url={t.endpoint || this.url}
                                      type={t.type as ChartType}
                                      chart-title={t.title}
                                      unit={t.unit}
                                      debug={this.debug}
                                      options={JSON.stringify(DiscoveryDashboardComponent.merge(this.options, t.options))}
                    >{t.macro + ' EVAL'}</discovery-tile>
                    : <discovery-tile-result
                      url={t.endpoint || this.url}
                      result={DiscoveryDashboardComponent.sanitize(t.data)}
                      type={t.type as ChartType}
                      unit={t.unit}
                      options={DiscoveryDashboardComponent.merge(this.options, t.options)}
                      debug={this.debug}
                      chart-title={t.title}
                    />
                  }</div>
              </div>)
            }</div>
        </div>;
      case "dashboard":
        return <div class="discovery-dashboard-main">
          {this.dashboardTitle || this.result.title ? <h1>{this.dashboardTitle || this.result.title}</h1> : ''}
          {this.result.description ? <p>{this.result.description}</p> : ''}
          <div class="discovery-dashboard-wrapper" style={{
            width: '100%', height: 'auto',
            gridAutoRows: 'minmax(' + this.cellHeight + 'px, auto)',
            gridTemplateColumns: 'repeat(' + this.cols + ', 1fr)'
          }}>
            {this.result.tiles.map((t) =>
              <div class="discovery-dashboard-tile"
                   style={{
                     gridColumn: (t.x + 1) + ' / ' + (t.x + t.w + 1),
                     gridRow: (t.y + 1) + ' / ' + (t.y + t.h + 1),
                   }}
              >
                <div>
                  {t.macro
                    ? <discovery-tile url={t.endpoint || this.url}
                                      type={t.type as ChartType}
                                      chart-title={t.title}
                                      options={JSON.stringify(DiscoveryDashboardComponent.merge(this.options, t.options))}
                    >{t.macro + ' EVAL'}</discovery-tile>
                    : <discovery-tile-result
                      url={t.endpoint || this.url}
                      result={DiscoveryDashboardComponent.sanitize(t.data)}
                      type={t.type as ChartType}
                      unit={t.unit}
                      options={DiscoveryDashboardComponent.merge(this.options, t.options)}
                      debug={this.debug}
                      chart-title={t.title}
                    />
                  }</div>
              </div>)
            }</div>
        </div>
      default:
        return '';
    }
  }

  render() {
    return <Host>
      <discovery-modal
        ref={(el) => this.modal = el as HTMLDiscoveryModalElement}
        data={this.modalContent}
        options={this.options}
        url={this.url}
        debug={this.debug}/>
      {this.loaded ? this.getRendering() : <discovery-spinner>Requesting data...</discovery-spinner>}
      <pre id="ws"><slot/></pre>
    </Host>;
  }
}
