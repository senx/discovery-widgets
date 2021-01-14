import {Component, Element, Event, EventEmitter, h, Prop, State} from '@stencil/core';
import {Utils} from "../../utils/utils";

@Component({
  tag: 'discovery-tile',
  styleUrl: 'discovery-tile.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() url: string;
  @Prop() type: 'line';
  @Prop() lang: 'warpscript' | 'flows' = 'warpscript';
  @Event() statusHeaders: EventEmitter<string[]>;
  @Element() el: HTMLElement;

  private ws: string;
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

  componentDidLoad() {
    this.ws = this.el.innerText;
    if(this.lang === 'flows') {
      this.ws = "<'\n" + this.ws + "\n'>\n ->FLOWS"
    }
    this.width = this.el.parentElement.getBoundingClientRect().width;
    this.height = this.el.parentElement.getBoundingClientRect().height;
    if (this.ws && this.ws !== '') {
      Utils.httpPost(this.url, this.ws).then((res: any) => {
        this.result = res.data as string;
        this.headers = res.headers.split('\n').filter(h => h !== '');
        this.statusHeaders.emit(this.headers);
        console.log(this.headers)
        this.loaded = true;
        this.start = new Date().getTime();
      }).catch(e => {
        console.error(e)
      })
    }
  }


  render() {
    return <div>
      {this.loaded
        ? <div>
          <p>{this.headers}</p>
          <div style={{width: this.width + 'px', height: (this.height) + 'px'}}>
            <discovery-tile-result start={this.start} result={this.result} type={this.type} width={this.width}
                                   height={this.height}></discovery-tile-result>
          </div>
        </div>
        : <p>Loading ...</p>
      }
      <pre id="ws"><slot/></pre>
    </div>;
  }
}
