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

import {Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {DataModel} from "../../model/dataModel";
import {Utils} from "../../utils/utils";
import {GTSLib} from "../../utils/gts.lib";
import {DiscoveryEvent} from "../../model/discoveryEvent";
import elementResizeEvent from "element-resize-event";

@Component({
  tag: 'discovery-tile-result',
  styleUrl: 'discovery-tile-result.scss',
  shadow: true,
})
export class DiscoveryTileResultComponent {
  @Prop() result: DataModel | string;
  @Prop({mutable: true}) type: ChartType;
  @Prop() start: number;
  @Prop() options: Param | string = new Param();
  @Prop({mutable: true}) width: number;
  @Prop({mutable: true}) height: number;
  @Prop() debug: boolean = false;
  @Prop({mutable: true}) unit: string = '';
  @Prop() url: string;
  @Prop() chartTitle: string;

  @Element() el: HTMLElement;

  @State() execTime = 0;
  @State() bgColor: string;
  @State() fontColor: string;
  @State() innerResult: DataModel | string;
  @State() innerOptions: Param;
  @State() innerStyle: { [k: string]: string; };
  @State() innerType: ChartType;

  @Event({
    eventName: 'discoveryEvent',
    composed: true,
    cancelable: true,
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  private LOG: Logger;
  private wrapper: HTMLDivElement;
  private tileElem: HTMLDivElement;
  private title: HTMLDivElement;
  private innerStyles: any;
  private tile: any;

  @Watch('type')
  updateType(newValue: string) {
    if (newValue !== this.innerType) {
      setTimeout(() => this.innerType = this.type);
    }
  }

  @Watch('result')
  updateRes() {
    this.innerResult = GTSLib.getData(this.result);
    this.parseResult();
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      if (this.LOG) {
        this.LOG.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, this.innerOptions.eventHandler);
    if (res.data) {
      this.innerResult = res.data;
      this.parseResult();
    }
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
    if (res.zoom) {
      this.setZoom(res.zoom).then(() => {
        // empty
      });
    }
    if (res.focus) {
      this.setFocus(res.focus.name, res.focus.date, res.focus.value).then(() => {
        // empty
      });
    }
  }


  @Listen('draw', {capture: false})
  onDrawHandler() {
    if (this.tile) {
      (this.tile as any).resize();
    }
  }

  componentWillLoad() {
    this.innerType = this.type;
    this.LOG = new Logger(DiscoveryTileResultComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      result: this.result
    });
    if (!!this.options && typeof this.options === 'string' && this.options !== 'undefined') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options as Param;
    }
    this.innerResult = GTSLib.getData(this.result);
    this.innerType = this.innerResult.globalParams?.type || this.innerOptions.type || this.innerType;
    this.LOG.debug(['componentWillLoad'], {
      type: this.innerType,
      options: this.innerOptions,
      result: this.innerResult
    });
  }

  componentDidLoad() {
    this.parseResult();
    elementResizeEvent(this.tileElem, () => this.resize());
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    elementResizeEvent.unbind(this.el);
  }

  handleZoom(event: CustomEvent<{ start: number, end: number }>) {
    ((this.innerResult as unknown as DataModel).events || [])
      .filter(e => e.type === 'zoom')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit(e);
      });
  }

  handleDataPointOver(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events || [])
      .filter(e => e.type === 'focus')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit(e);
      });
  }

  getView() {
    switch (this.innerType) {
      case "line":
      case "area":
      case "scatter":
      case "spline-area":
      case "step-area":
      case "spline":
      case 'step':
      case 'step-after':
      case 'step-before':
        return <discovery-line
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          debug={this.debug}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          ref={el => this.tile = el || this.tile}
        />;
      case 'annotation':
        return <discovery-annotation
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
        />;
      case 'bar':
        return <discovery-bar
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
        />;
      case 'display':
        return <discovery-display
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      case 'map':
        return <discovery-map
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
        />;
      case 'image':
        return <discovery-image
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      case 'button':
        return <discovery-button
          result={this.innerResult}
          url={this.url}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      case 'gauge':
      case 'circle':
        return <discovery-gauge
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
        />;
      case 'linear-gauge':
        return <discovery-linear-gauge
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
        />;
      case 'pie':
      case 'doughnut':
      case 'rose':
        return <discovery-pie
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
        />;
      case 'tabular':
        return <discovery-tabular
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      case 'svg':
        return <discovery-svg
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      case 'input:text':
      case 'input:autocomplete':
      case 'input:list':
      case 'input:secret':
      case 'input:slider':
      case 'input:date':
      case 'input:date-range':
        return <discovery-input
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      case 'empty':
        return <discovery-empty
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          debug={this.debug}
        />;
      default:
        return '';
    }
  }

  @Method()
  async resize() {
    setTimeout(() => {
      if (this.tile) {
        (this.tile as any).resize();
      }
    });
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    if (this.tile) {
      (this.tile as any).setZoom(dataZoom);
    }
  }

  @Method()
  async show(regexp: string) {
    /* tslint:disable:no-string-literal */
    if (this.tile && this.tile['show']) {
      await (this.tile as any).show(regexp);
    }
  }

  @Method()
  async hide(regexp: string) {
    /* tslint:disable:no-string-literal */
    if (this.tile && this.tile['hide']) {
      await (this.tile as any).hide(regexp);
    }
  }

  @Method()
  async setFocus(regexp: string, ts: number, value?: number) {
    /* tslint:disable:no-string-literal */
    if (this.tile && this.tile['setFocus']) {
      await (this.tile as any).setFocus(regexp, ts, value);
    }
  }

  @Method()
  async unFocus() {
    /* tslint:disable:no-string-literal */
    if (this.tile && this.tile['unFocus']) {
      await (this.tile as any).unFocus();
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    /* tslint:disable:no-string-literal */
    if (this.tile && this.tile['export']) {
      return (this.tile as any).export(type);
    } else {
      return undefined;
    }
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <div class="discovery-tile"
           ref={el => this.tileElem = el}
           style={{
             backgroundColor: this.bgColor,
             color: this.fontColor,
             height: '100%', width: '100%'
           }}>
        {this.chartTitle ? <h2 ref={el => this.title = el as HTMLDivElement}>{this.chartTitle}</h2> : ''}
        <div class="discovery-chart-wrapper" ref={(el) => this.wrapper = el as HTMLDivElement}>
          {this.getView()}
        </div>
      </div>
    ];
  }

  private parseResult() {
    setTimeout(() => {
      this.unit = (this.options as Param).unit || this.unit
      this.innerType = (this.innerResult as unknown as DataModel).globalParams?.type || this.innerType;
      this.handleCSSColors();
      ((this.innerResult as unknown as DataModel).events || [])
        .filter(e => !!e.value)
        .filter(e => e.type !== 'zoom')
        .forEach(e => {
          if (this.LOG) {
            this.LOG.debug(['parseResult', 'emit'], {discoveryEvent: e});
          }
          this.discoveryEvent.emit(e)
        });
    });
    if (this.LOG) {
      this.LOG.debug(['parseResult'], {
        type: this.innerType,
        options: this.options,
        result: this.innerResult
      });
    }
  }

  private generateStyle(styles: { [k: string]: string }): string {
    this.innerStyles = {...this.innerStyles, ...styles, ...(this.options as Param).customStyles || {}};
    return Object.keys(this.innerStyles || {}).map(k => k + ' { ' + this.innerStyles[k] + ' }').join('\n');
  }

  private handleCSSColors() {
    let fontColor = Utils.getCSSColor(this.el, '--warp-view-font-color', '#000000');
    fontColor = ((this.innerOptions as Param) || {fontColor}).fontColor || fontColor;
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.innerOptions as Param) || {bgColor}).bgColor || bgColor;
    const dm: Param = (((this.innerResult as unknown as DataModel) || {
      globalParams: {bgColor, fontColor}
    }).globalParams || {bgColor, fontColor}) as Param;
    this.bgColor = dm.bgColor || bgColor;
    this.fontColor = dm.fontColor || fontColor;
  }
}
