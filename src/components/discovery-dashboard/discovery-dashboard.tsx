import {Component, Element, Event, EventEmitter, h, Host, Prop, State, Watch} from '@stencil/core';
import {Utils} from "../../utils/utils";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Dashboard} from "../../model/dashboard";
import {ChartType} from "../../model/types";
import {DataModel} from "../../model/dataModel";

@Component({
  tag: 'discovery-dashboard',
  styleUrl: 'discovery-dashboard.scss',
  shadow: true,
})
export class DiscoveryDashboardComponent {
  @Prop() url: string;
  @Prop() dashboardTitle: string;
  @Prop() options: Param | string = new Param();
  @Prop() debug: boolean = false;
  @Prop() autoRefresh: number = -1;

  @Event() statusHeaders: EventEmitter<string[]>;
  @Event() statusError: EventEmitter;

  @Element() el: HTMLElement;
  @State() width: number;
  @State() height: number;
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
      Utils.httpPost(this.url, this.ws).then((res: any) => {
        const result = JSON.parse(res.data as string);
        this.result = result.length > 0 ? result[0] : new Dashboard();
        console.log(this.result)
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
      }).catch(e => {
        this.statusError.emit(e);
        console.error(e)
      })
    }
  }


  render() {
    return <Host>
      {this.loaded ?
        <div class="discovery-dashboard-wrapper" style={{width: '100%', height: 'auto'}}>
          {this.result.tiles.map((t) =>
            <div class="discovery-dashboard-tile"
                 style={{
                   gridColumn: (t.x + 1) + ' / ' + (t.x + t.w),
                   gridRow: (t.y + 1) + ' / ' + (t.y + t.h),
                 }}
            >
              <div>
                {t.macro
                  ? <discovery-tile url={t.endpoint || this.url}
                                    type={t.type as ChartType}
                                    chart-title={t.title}
                                    options={JSON.stringify(t.options)}
                  >{t.macro + ' EVAL'}</discovery-tile>
                  : <discovery-tile-result
                    url={t.endpoint || this.url}
                    result={this.sanityze(t.data)}
                    type={t.type as ChartType}
                    options={t.options}
                    debug={this.debug}
                    chart-title={t.title}
                  />
                }</div>
            </div>)
          }</div>
        : <discovery-spinner>Requesting data...</discovery-spinner>
      }
      <pre id="ws"><slot/></pre>
    </Host>;
  }

  private sanityze(data: string | DataModel) {
    if (typeof data === 'string') return '["' + data + '"]';
    else return data
  }
}
