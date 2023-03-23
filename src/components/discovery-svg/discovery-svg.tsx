/*
 *   Copyright 2022-2023  SenX S.A.S.
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
import {ChartType, DataModel, DiscoveryEvent} from '../../model/types';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {Utils} from '../../utils/utils';
import html2canvas from 'html2canvas';

@Component({
  tag: 'discovery-svg',
  styleUrl: 'discovery-svg.scss',
  shadow: true,
})
export class DiscoverySvgComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() start: number;
  @Prop() options: Param | string = new Param();
  @Prop({mutable: true}) width: number;
  @Prop({mutable: true}) height: number;
  @Prop() debug = false;
  @Prop() unit = '';
  @Prop() url: string;
  @Prop() chartTitle: string;

  @Event() draw: EventEmitter<void>;
  @Event({
    eventName: 'discoveryEvent',
    composed: true,
    cancelable: true,
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  @Element() el: HTMLElement;

  @State() execTime = 0;
  @State() bgColor: string;
  @State() fontColor: string;
  @State() parsing = false;
  @State() toDisplay: string[] = [];
  @State() innerStyle: { [k: string]: string };
  @State() innerResult: DataModel
  @State() innerOptions: Param;

  private LOG: Logger;
  private defOptions: Param = new Param();
  private funqueue = [];
  private refs: HTMLDivElement[] = [];

  @Watch('result')
  updateRes() {
    this.innerResult = GTSLib.getData(this.result);
    this.parseResult();
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      setTimeout(() => this.parseResult());
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    this.funqueue.push(this.wrapFunction(this.processEvent.bind(this), this, [event]));
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    return Promise.resolve();
  }

  componentWillLoad() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    this.parseResult();
    this.processQueue();
  }

  convert(data: DataModel) {
    const toDisplay = [];
    this.refs = [];
    this.LOG?.debug(['convert'], data)
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = {...options};
    if (this.innerOptions.customStyles) {
      this.innerStyle = {...this.innerStyle, ...this.innerOptions.customStyles || {}};
    }
    if (GTSLib.isArray(data.data)) {
      (data.data as any[] || []).forEach(img => {
        this.LOG?.debug(['convert'], DiscoverySvgComponent.isSVG(img))
        if (DiscoverySvgComponent.isSVG(img)) {
          toDisplay.push(this.sanitize(img));
        }
      })
    } else if (data.data && DiscoverySvgComponent.isSVG(data.data)) {
      this.LOG?.debug(['convert'], DiscoverySvgComponent.isSVG(data.data))
      toDisplay.push(this.sanitize(data.data as string));
    }

    return toDisplay;
  }

  private processEvent(event: CustomEvent<DiscoveryEvent>) {
    return new Promise(resolve => {
      const res = Utils.parseEventData(event.detail, this.innerOptions.eventHandler, this.el.id);
      if (res.style) {
        this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
      }
      if (res.xpath) {
        const toDisplay = [];
        (this.toDisplay || []).forEach(img => {
          this.LOG?.debug(['convert'], DiscoverySvgComponent.isSVG(img))
          if (DiscoverySvgComponent.isSVG(img)) {
            toDisplay.push(this.sanitize(img, res.xpath.selector, res.xpath.value));
          }
        })
        this.toDisplay = [...toDisplay]
      }
      resolve(true);
    });
  }

  private wrapFunction(fn, context, params) {
    return () => fn.apply(context, params);
  }

  private processQueue() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    void new Promise(async resolve => {
      while (this.funqueue.length > 0) {
        await (this.funqueue.shift())();
      }
      resolve(true);
    }).then(() => setTimeout(() => this.processQueue(), 100));
  }

  private parseResult() {
    this.parsing = true;
    this.LOG = new Logger(DiscoverySvgComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.innerResult = GTSLib.getData(this.result);
    this.toDisplay = this.convert(this.innerResult || new DataModel())
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      toDisplay: this.toDisplay,
    });
    setTimeout(() => {
      this.refs.forEach(svgWrapper => {
        (this.innerOptions.svg?.handlers || []).forEach(h => {
          if (!!h.selector) {
            svgWrapper.querySelectorAll(h.selector).forEach(elem => {
              elem.classList.add('hoverable');
              if (!!h.click) {
                elem.addEventListener('click', () => this.triggerEvent(h.event))
              }
              if (!!h.hover) {
                elem.addEventListener('mouseover', () => this.triggerEvent(h.event))
              }
            });
          }
        });

      });
    })
    this.parsing = false;
    this.draw.emit();
  }

  private static isSVG(data) {
    return typeof data === 'string' && /<svg/gi.test(data);
  }

  private sanitize(svg, xpath?: string, replacement?: string | { [k: string]: string }) {
    try {
      const svgDoc = Utils.parseXML(svg, 'image/svg+xml');
      const el = svgDoc.getElementsByTagName('svg').item(0);
      if (!!xpath) {
        const nsXpath = xpath.split('/').filter(e => !!e).map(e => 'svg:' + e).join('/');
        const iterator = svgDoc.evaluate(nsXpath, svgDoc, prefix => prefix === 'svg' ? 'http://www.w3.org/2000/svg' : null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)
        let elem = iterator.iterateNext();
        const elemsToReplace: SVGElement[] = [];
        while (elem) {
          elemsToReplace.push(elem as SVGElement);
          elem = iterator.iterateNext();
        }
        elemsToReplace.forEach(e => {
          if (typeof replacement === 'string') {
            const parent = e.parentElement;
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.innerHTML = replacement.trim();
            parent.replaceChild(g.firstChild, e);
          } else {
            Object.keys(replacement).forEach(k => e.setAttribute(k, replacement[k].toString()));
          }
        });
      }
      if (el.getAttribute('width') && el.getAttribute('height')) {
        el.setAttribute('viewBox',
          '0 0 '
          + el.getAttribute('width').replace(/[a-z]+/gi, '') + ' '
          + el.getAttribute('height').replace(/[a-z]+/gi, ''));
      }
      if (el.getAttribute('preserveAspectRatio')) {
        el.removeAttribute('preserveAspectRatio');
      }
      el.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      return new XMLSerializer().serializeToString(svgDoc);
    } catch (e) {
      this.LOG?.error(['exec'], e);
      return svg;
    }
  }

  private triggerEvent(evt: DiscoveryEvent) {
    this.discoveryEvent.emit({...evt, source: this.el.id});
  }

  @Method()
  async export
  (type: 'png' | 'svg' = 'png') {
    return type === 'svg' ? this.toDisplay : (await html2canvas(this.el)).toDataURL();
  }

  private

  generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k => k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  render() {
    return (
      <Host>
        <style>{this.generateStyle(this.innerStyle)}</style>
        <div class="svg-wrapper" style={{width: `${this.width}px`, height: `${this.height}px`}}>
          {this.parsing
            ? <discovery-spinner>Parsing data...</discovery-spinner>
            : this.toDisplay.length > 0
              ? this.toDisplay.map(svg => <div class="svg-container" innerHTML={svg} ref={el => this.refs.push(el)}/>)
              : ''
          }</div>
      </Host>
    );
  }
}
