import {Component, Element, Event, EventEmitter, h, Host, Prop, State, Watch} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";

@Component({
  tag: 'discovery-svg',
  styleUrl: 'discovery-svg.scss',
  shadow: true,
})
export class DiscoverySvgComponent {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() start: number;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop({mutable: true}) width: number;
  @Prop({mutable: true}) height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';
  @Prop() url: string;
  @Prop() chartTitle: string;

  @Event() draw: EventEmitter<void>;

  @Element() el: HTMLElement;

  @State() execTime = 0;
  @State() bgColor: string;
  @State() fontColor: string;
  @State() parsing: boolean = false;
  @State() toDisplay: string[] = [];

  private LOG: Logger;
  private defOptions: Param = new Param();

  @Watch('result')
  updateRes() {
    this.result = GTSLib.getData(this.result);
    this.parseResult();
  }

  componentWillLoad() {
    this.parseResult();
  }

  private parseResult() {
    this.parsing = true;
    this.LOG = new Logger(DiscoverySvgComponent, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.toDisplay = this.convert(this.result as DataModel || new DataModel())
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      toDisplay: this.toDisplay,
    });
    this.parsing = false;
    this.draw.emit();
  }

  convert(data: DataModel) {
    const toDisplay = [];
    this.LOG.debug(['convert'], data)
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    if (GTSLib.isArray(data.data)) {
      (data.data as any[] || []).forEach(img => {
        this.LOG.debug(['convert'], DiscoverySvgComponent.isSVG(img))
        if (DiscoverySvgComponent.isSVG(img)) {
          toDisplay.push(DiscoverySvgComponent.sanitize(img));
        }
      })
    } else if (data.data && DiscoverySvgComponent.isSVG(data.data)) {
      this.LOG.debug(['convert'], DiscoverySvgComponent.isSVG(data.data))
      toDisplay.push(DiscoverySvgComponent.sanitize(data.data as string));
    }

    return toDisplay;
  }

  private static isSVG(data) {
    return typeof data === 'string' && /<svg/gi.test(data);
  }

  private static sanitize(svg) {
    const parser = new DOMParser();
    try {
      const htmlDoc = parser.parseFromString(svg, 'text/xml');
      const el = htmlDoc.getElementsByTagName('svg').item(0);
      console.log( el.getAttribute('width').replace(/[a-zA-Z]+/, ''))
      el.setAttribute('viewBox',
        '0 0 '
        + el.getAttribute('width').replace(/[a-z]+/gi, '') + ' '
        + el.getAttribute('height').replace(/[a-z]+/gi, ''));
      return new XMLSerializer().serializeToString(htmlDoc);
    } catch (e) {
      return svg;
    }
  }

  render() {
    return (
      <Host>
        <div class="svg-wrapper" style={{width: this.width + 'px', height: this.height + 'px'}}>
          {this.parsing
            ? <discovery-spinner>Parsing data...</discovery-spinner>
            : this.toDisplay.length > 0
              ? this.toDisplay.map(svg => <div class="svg-container" innerHTML={svg}/>)
              : ''
          }</div>
      </Host>
    );
  }
}
