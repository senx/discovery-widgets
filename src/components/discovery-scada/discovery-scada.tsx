import {Component, Element, Event, EventEmitter, h, Host, Prop, State, Watch} from '@stencil/core';
import {Utils} from "../../utils/utils";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Dashboard} from "../../model/dashboard";
import {ChartType} from "../../model/types";
import {DataModel} from "../../model/dataModel";

@Component({
  tag: 'discovery-scada',
  styleUrl: 'discovery-scada.scss',
  shadow: true,
})
export class DiscoveryScadaComponent {
  @Prop() url: string;
  @Prop() dashboardTitle: string;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() debug: boolean = false;
  @Prop({mutable: true}) autoRefresh: number = -1;
  @Prop() cellHeight: number = 220;
  @Prop() cols: number = 12;

  @Event() statusHeaders: EventEmitter<string[]>;
  @Event() statusError: EventEmitter;

  @Element() el: HTMLElement;
  @State() width: number;
  @State() height: number;
  @State() scadaHeight: number = 0;
  @State() result: Dashboard;
  @State() headers: any;
  @State() loaded = false;
  @State() start: number;

  private LOG: Logger;
  private ws: string;
  private timer: any;

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

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryScadaComponent, this.debug);
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
      Utils.httpPost(this.url, this.ws).then((res: any) => {
        const result = JSON.parse(res.data as string);
        const tmpResult: Dashboard = result.length > 0 ? result[0] : new Dashboard();
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
        this.result = {...tmpResult};
      }).catch(e => {
        this.statusError.emit(e);
        this.LOG.error(['exec'], e);
      })
    }
  }


  render() {
    return <Host>
      {this.loaded ?
        <div class="discovery-scada-main">
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
                                      options={JSON.stringify(DiscoveryScadaComponent.merge(this.options, t.options))}
                    >{t.macro + ' EVAL'}</discovery-tile>
                    : <discovery-tile-result
                      url={t.endpoint || this.url}
                      result={DiscoveryScadaComponent.sanitize(t.data)}
                      type={t.type as ChartType}
                      unit={t.unit}
                      options={DiscoveryScadaComponent.merge(this.options, t.options)}
                      debug={this.debug}
                      chart-title={t.title}
                    />
                  }</div>
              </div>)
            }</div>
        </div>
        : <discovery-spinner>Requesting data...</discovery-spinner>
      }
      <pre id="ws"><slot/></pre>
    </Host>;
  }

  private static sanitize(data: string | DataModel) {
    return typeof data === 'string' ? '["' + data + '"]' : data;
  }

  private static merge(options: Param | string, options2: Param) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    return {...new Param(), ...options as Param, ...options2}
  }
}
