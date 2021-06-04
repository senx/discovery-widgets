import {Component, Element, Event, EventEmitter, h, Host, Listen, Prop, State, Watch} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import {DiscoveryEvent} from "../../model/discoveryEvent";

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
  @State() innerStyle: { [k: string]: string };

  private LOG: Logger;
  private defOptions: Param = new Param();

  @Watch('result')
  updateRes() {
    this.result = GTSLib.getData(this.result);
    this.parseResult();
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler);
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
    if (res.xpath) {
      const toDisplay = [];
      const result = this.result as DataModel;
      if (GTSLib.isArray(result.data)) {
        (result.data as any[] || []).forEach(img => {
          this.LOG.debug(['convert'], DiscoverySvgComponent.isSVG(img))
          if (DiscoverySvgComponent.isSVG(img)) {
            toDisplay.push(DiscoverySvgComponent.sanitize(img, res.xpath.selector, res.xpath.value));
          }
        })
      } else if (result.data && DiscoverySvgComponent.isSVG(result.data)) {
        this.LOG.debug(['convert'], DiscoverySvgComponent.isSVG(result.data))
        toDisplay.push(DiscoverySvgComponent.sanitize(result.data as string, res.xpath.selector, res.xpath.value));
      }

      this.toDisplay = [...toDisplay]
    }
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

  private static sanitize(svg, xpath?: string, replacement?: string) {
    try {
      const htmlDoc = Utils.parseXML(svg, "image/svg+xml");
      const el = htmlDoc.getElementsByTagName('svg').item(0);
      if (!!xpath) {
          const nsXpath = xpath.split('/').filter(e => !!e).map(e => 'svg:' + e).join('/');
          const iterator = htmlDoc.evaluate(nsXpath, htmlDoc, prefix => prefix === 'svg' ? 'http://www.w3.org/2000/svg' : null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)
          let elem = iterator.iterateNext();
          const elemsToReplace = [];
          while (elem) {
            elemsToReplace.push(elem);
            elem = iterator.iterateNext();
          }
          console.log(elemsToReplace)
          elemsToReplace.forEach(e => {
            const parent = e.parentElement;
            const g = document.createElement('g');
            g.innerHTML = replacement.trim();
            parent.replaceChild(g.firstChild, e);
          });
      }
      el.setAttribute('viewBox',
        '0 0 '
        + el.getAttribute('width').replace(/[a-z]+/gi, '') + ' '
        + el.getAttribute('height').replace(/[a-z]+/gi, ''));
    //  console.log(new XMLSerializer().serializeToString(htmlDoc))
      return new XMLSerializer().serializeToString(htmlDoc);
    } catch (e) {
      console.log(e)
      return svg;
    }
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k=> k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  render() {
    return (
      <Host>
        <style>{this.generateStyle(this.innerStyle)}</style>
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
