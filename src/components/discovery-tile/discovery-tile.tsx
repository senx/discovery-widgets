import {Component, Element, Event, EventEmitter, h, Host, Listen, Prop, State, Watch} from '@stencil/core';
import {Utils} from "../../utils/utils";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {DiscoveryEvent} from "../../model/discoveryEvent";

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
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';
  @Prop({mutable: true}) autoRefresh: number = -1;
  @Prop() vars: string= '{}';

  @Event() statusHeaders: EventEmitter<string[]>;
  @Event() statusError: EventEmitter<any>;

  @Element() el: HTMLElement;

  @State() loaded = false;
  @State() result = '[]';
  @State() width: number;
  @State() height: number;
  @State() headers: any;
  @State() start: number;

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private innerVars = {}

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
    if (res.vars) {
      this.innerVars = {...JSON.parse(this.vars), ...res.vars};
      this.exec();
    }
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      url: this.url,
      type: this.type,
      options: this.options,
      language: this.language,
      innerVars: this.innerVars,
    });
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }

    this.innerVars = JSON.parse(this.vars || '{}');
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
    if (!refresh) this.loaded = true;
    this.ws = this.el.innerText;
    if (this.ws && this.ws !== '') {
      this.LOG.debug(['exec'], this.ws);
      if (this.language === 'flows') {
        this.ws = Object.keys(this.innerVars || {}).map(k => `${k} = "${this.innerVars[k]}"`).join("\n") + "\n" + this.ws;
        this.ws = `<'
${this.ws}
'>
FLOWS`;
      } else {
        this.ws = Object.keys(this.innerVars || {}).map(k => `"${this.innerVars[k]}" "${k}" STORE`).join("\n") + "\n" + this.ws;
      }
      console.log(this.ws)
      Utils.httpPost(this.url, this.ws).then((res: any) => {
        this.result = res.data as string;
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
        this.LOG.debug(['exec', 'headers'], this.headers);
        this.statusHeaders.emit(this.headers);
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
        this.LOG.debug(['exec', 'result'], this.result);
        this.loaded = true;
      }).catch(e => {
        this.statusError.emit(e);
        this.loaded = true;
        console.error(e)
      })
    }
  }


  render() {
    return <Host>
      {this.loaded ?
        <div style={{width: '100%', height: 'auto'}}>
          <discovery-tile-result
            url={this.url}
            start={this.start}
            result={this.result}
            type={this.type}
            width={this.width}
            height={this.height}
            options={this.options}
            unit={this.unit}
            debug={this.debug}
            chart-title={this.chartTitle}
          />
        </div>
        : <div class="discovery-tile-spinner">
          <discovery-spinner>Requesting data...</discovery-spinner>
        </div>
      }
      <pre id="ws"><slot/></pre>
    </Host>;
  }
}
