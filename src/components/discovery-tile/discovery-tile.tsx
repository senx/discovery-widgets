import {Component, Element, Event, EventEmitter, h, Host, Prop, State} from '@stencil/core';
import {Utils} from "../../utils/utils";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";

@Component({
  tag: 'discovery-tile',
  styleUrl: 'discovery-tile.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() url: string;
  @Prop() type: ChartType;
  @Prop() options: Param = new Param();
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() debug: boolean = false;

  @Event() statusHeaders: EventEmitter<string[]>;
  @Element() el: HTMLElement;

  @State()
  private loaded = false;
  @State()
  private result = '[]';
  @State()
  private width: number;
  @State()
  private height: number;
  @State()
  private headers: string[];
  @State()
  private start: number;
  private LOG: Logger;
  private ws: string;

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      url: this.url,
      type: this.type,
      options: this.options,
      language: this.language,
    });
    this.width = this.el.parentElement.getBoundingClientRect().width;
    this.height = this.el.parentElement.getBoundingClientRect().height;
  }

  componentDidLoad() {
    this.ws = this.el.innerText;
    if (this.language === 'flows') {
      this.ws = "<'\n" + this.ws + "\n'>\n ->FLOWS"
    }
    if (this.ws && this.ws !== '') {
      Utils.httpPost(this.url, this.ws).then((res: any) => {
        this.result = res.data as string;
        this.headers = res.headers.split('\n').filter(h => h !== '');
        this.statusHeaders.emit(this.headers);
        this.loaded = true;
        this.start = new Date().getTime();
      }).catch(e => {
        console.error(e)
      })
    }
  }


  render() {
    return <Host>
      {this.loaded ?
        <div style={{width: '100%', height: 'auto'}}>
          <discovery-tile-result
            start={this.start}
            result={this.result}
            type={this.type}
            width={this.width}
            height={this.height}
            options={this.options}
            debug={this.debug}
          />
        </div>
        : <discovery-spinner>Requesting data...</discovery-spinner>
      }
      <pre id="ws"><slot/></pre>
    </Host>;
  }
}
