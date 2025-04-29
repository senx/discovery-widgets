/*
 *   Copyright 2022-2025 SenX S.A.S.
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

import { Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, DiscoveryEvent } from '../../model/types';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { Utils } from '../../utils/utils';
import { GTSLib } from '../../utils/gts.lib';
import elementResizeEvent from 'element-resize-event';
import { PluginManager } from '../../utils/PluginManager';
import { v4 } from 'uuid';
import { DiscoveryButtonCustomEvent } from '../../components';

@Component({
  tag: 'discovery-tile-result',
  styleUrl: 'discovery-tile-result.scss',
  shadow: true,
})
export class DiscoveryTileResultComponent {
  @Element() el: HTMLElement;

  @Prop({ mutable: true }) result: DataModel | string;
  @Prop({ mutable: true }) type: ChartType;
  @Prop() start: number;
  @Prop() options: Param | string = new Param();
  @Prop({ mutable: true }) width: number;
  @Prop({ mutable: true }) height: number;
  @Prop() debug = false;
  @Prop({ mutable: true }) unit = '';
  @Prop() url: string;
  @Prop() chartTitle: string;
  @Prop() chartDescription: string;
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() vars = '{}';
  @Prop() standalone = true;

  @State() execTime = 0;
  @State() bgColor: string;
  @State() fontColor: string;
  @State() innerResult: DataModel | string;
  @State() innerOptions: Param = new Param();
  @State() innerStyle: { [k: string]: string; };
  @State() innerType: ChartType;
  @State() innerTitle: string;
  @State() ready: boolean = false;

  @Event({
    eventName: 'discoveryEvent',
    composed: true,
    cancelable: true,
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;
  @Event() draw: EventEmitter<void>;
  @Event() selfType: EventEmitter<ChartType>;
  @Event() execError: EventEmitter<any[]>;

  private LOG: Logger;
  private tileElem: HTMLDivElement;
  private innerStyles: any;
  private tile: any;
  private innerVars = {};
  private componentId: string;

  @Watch('type')
  updateType(newValue: string) {
    if (newValue !== this.innerType) {
      setTimeout(() => {
        this.innerType = this.type;
        this.selfType.emit(this.innerType);
      });
    }
  }

  @Watch('result')
  updateRes(newValue: string) {
    this.LOG?.debug(['updateRes'], 'could be huge');
    this.innerResult = GTSLib.getData(newValue);
    this.parseResult();
  }

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: string) {
    this.LOG?.debug(['optionsUpdate'], this.innerType, newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    opts = Utils.mergeDeep<Param>(opts ?? {} as Param, (this.innerResult as unknown as DataModel)?.globalParams ?? {});
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone(opts);
      this.LOG?.debug(['optionsUpdate 2'], this.type, { options: this.innerOptions, newValue, oldValue });
    }
  }

  @Watch('vars')
  varsUpdate(newValue: any, oldValue: any) {
    if (!!this.vars && typeof this.vars === 'string') {
      const vars = JSON.parse(this.vars);
      if (!Utils.deepEqual(this.innerVars, vars)) {
        this.innerVars = Utils.clone(vars);
      }
    }
    this.LOG?.debug(['varsUpdate'], { innerVars: this.innerVars, newValue, oldValue });
  }

  @Listen('discoveryEvent', { target: 'window' })
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    if (!this.innerOptions?.eventHandler) {
      return;
    }
    const res = Utils.parseEventData(event.detail, this.innerOptions?.eventHandler ?? '', this.componentId);
    if (res.hasEvent) {
      this.LOG?.debug(['discoveryEventHandler'], {
        type: event.detail.type,
        event: event.detail,
      });
      if (res.data) {
        this.innerResult = res.data;
        this.parseResult();
      }
      if (res.style) {
        this.innerStyle = Utils.clone({ ...this.innerStyle, ...res.style as { [k: string]: string } });
      }
      if (res.zoom) {
        void this.setZoom(res.zoom).then(() => {
          // empty
        });
      }
      if (res.focus) {
        if (res.focus.date) {
          void this.setFocus(res.focus.name, res.focus.date, res.focus.value).then(() => {
            // empty
          });
        } else {
          void this.unFocus().then(() => {
            // empty
          });
        }
      }
      if (res.margin) {
        this.innerOptions = Utils.clone({ ...this.innerOptions, leftMargin: res.margin });
      }
      if (res.bounds) {
        this.innerOptions = {
          ...this.innerOptions,
          bounds: {
            ...this.innerOptions.bounds,
            minDate: res.bounds.min,
            maxDate: res.bounds.max,
          },
        };
      }
    }
  }

  @Listen('draw', { capture: false })
  @Listen('rendered', { capture: false })
  onDrawHandler() {
    if (this.tile) {
      if (this.tile.resize) {
        (this.tile).resize();
      }
    }
  }

  @Listen('leftMarginComputed', { capture: false })
  onLeftMarginComputed(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events || [])
      .filter(e => e.type === 'margin')
      .forEach(e => this.discoveryEvent.emit({
        source: this.componentId,
        type: 'margin',
        tags: e.tags,
        value: event.detail,
      }));
  }

  @Listen('timeBounds', { capture: false })
  onTimeBounds(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events || [])
      .filter(e => e.type === 'bounds')
      .forEach(e => this.discoveryEvent.emit({
        source: this.componentId,
        type: 'bounds',
        tags: e.tags,
        value: event.detail,
      }));
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileResultComponent, this.debug);
    this.componentId = this.el.id || v4();
    this.innerType = this.type;
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      result: this.result,
    });
    this.innerResult = GTSLib.getData(this.result);
    this.innerVars = JSON.parse(this.vars ?? '{}');
    this.innerType = this.innerResult.globalParams?.type ?? this.innerOptions.type ?? this.innerType;
    this.selfType.emit(this.innerType);
    this.LOG?.debug(['componentWillLoad 2'], {
      type: this.innerType,
      options: this.innerOptions,
      result: this.innerResult,
    });
    this.ready = true;
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    this.parseResult();
    elementResizeEvent.unbind(this.tileElem);
    elementResizeEvent(this.tileElem, async () => await this.resize());
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    elementResizeEvent.unbind(this.tileElem);
  }

  handleZoom(event: CustomEvent<{ start?: number, end?: number, type?: string }>) {
    ((this.innerResult as unknown as DataModel).events || [])
      .filter(e => e.type === 'zoom')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit({ ...e, source: this.el.id });
      });
  }

  handleDataPointOver(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events ?? [])
      .filter(e => e.type === 'focus')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit({ ...e, source: this.el.id });
      });
  }

  handleDataSelected(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events ?? [])
      .filter(e => e.type === 'selected')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit({ ...e, source: this.el.id, eventId: v4()}); // the eventId allow the user to be sure to filter out events, or be sure to refire a popup, for example
      });
  }

  handlePoi(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events ?? [])
      .filter(e => e.type === 'poi')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit({ ...e, source: this.el.id });
      });
  }

  handleGeoBounds(event: CustomEvent) {
    ((this.innerResult as unknown as DataModel).events ?? [])
      .filter(e => e.type === 'bounds')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit({ ...e, source: this.el.id });
      });
  }

  getView() {
    switch (this.innerType) {
      case 'line':
      case 'area':
      case 'scatter':
      case 'spline-area':
      case 'step-area':
      case 'spline':
      case 'step':
      case 'step-after':
      case 'step-before':
        return <discovery-line
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          debug={this.debug}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          onPoi={event => this.handlePoi(event)}
          ref={el => this.tile = el ?? this.tile}
          id={this.componentId}
        />;
      case 'annotation':
        return <discovery-annotation
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          onPoi={event => this.handlePoi(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'bar':
        return <discovery-bar
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          onPoi={event => this.handlePoi(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'bar-polar':
        return <discovery-bar-polar
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'boxplot':
        return <discovery-boxplot
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el || this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'display':
        return <discovery-display
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'map':
        return <discovery-map
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          onGeoBounds={event => this.handleGeoBounds(event)}
          onPoi={event => this.handlePoi(event)}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'image':
        return <discovery-image
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'button':
      case 'button:radio':
      case 'button:group':
        return <discovery-button
          result={this.innerResult}
          url={this.url}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          onExecError={e => this.handleExecError(e)}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'gauge':
      case 'circle':
      case 'compass':
        return <discovery-gauge
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'linear-gauge':
        return <discovery-linear-gauge
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'pie':
      case 'doughnut':
      case 'rose':
        return <discovery-pie
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'tabular':
        return <discovery-tabular
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          ref={el => this.tile = el ?? this.tile}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'svg':
        return <discovery-svg
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'input:text':
      case 'input:textarea':
      case 'input:autocomplete':
      case 'input:list':
      case 'input:secret':
      case 'input:slider':
      case 'input:date':
      case 'input:date-range':
      case 'input:multi':
      case 'input:multi-cb':
      case 'input:chips':
      case 'input:chips-autocomplete':
      case 'input:file':
      case 'input:number':
        return <discovery-input
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'hidden':
        return <discovery-hidden
          result={this.innerResult}
          type={this.innerType}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          debug={this.debug}
          id={this.componentId}
        />;
      case 'calendar':
        return <discovery-calendar
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'heatmap':
        return <discovery-heatmap
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'profile':
        return <discovery-profile
          result={this.innerResult}
          type={this.innerType}
          unit={this.unit}
          options={this.innerOptions}
          ref={el => this.tile = el ?? this.tile}
          onDataZoom={event => this.handleZoom(event)}
          onDataPointOver={event => this.handleDataPointOver(event)}
          onDataPointSelected={event => this.handleDataSelected(event)}
          debug={this.debug}
          id={this.componentId}
          vars={JSON.stringify(this.innerVars)}
          language={this.language}
          url={this.url}
          onExecError={e => this.handleExecError(e)}
        />;
      case 'dashboard':
      case 'dashboard:flex':
      case 'dashboard:scada':
        const sub = this.innerType.split(':');
        let dashBoardType = 'dashboard';
        if (sub.length > 1) {
          dashBoardType = sub[1];
        }
        return <discovery-dashboard
          data={GTSLib.getData(this.innerResult).data}
          vars={JSON.stringify(this.innerVars)}
          type={dashBoardType as any}
          url={this.url}
          inTile={true}
          options={JSON.stringify(this.innerOptions)}
          ref={el => this.tile = el ?? this.tile}
          onRendered={() => this.draw.emit()}
          debug={this.debug}
          id={this.componentId}
        />;
      default:
        this.LOG?.debug(['getView'], PluginManager.getInstance().registry);
        if (PluginManager.getInstance().has(this.innerType)) {
          this.LOG?.debug(['getView', 'type'], this.innerType);
          const Tag = PluginManager.getInstance().get(this.innerType).tag;
          return <Tag
            result={this.innerResult}
            type={this.innerType}
            options={this.innerOptions}
            height={this.height}
            width={this.width}
            vars={JSON.stringify(this.innerVars)}
            url={this.url}
            ref={(el: any) => this.tile = el ?? this.tile}
            debug={this.debug}
            id={this.componentId}
            onExecError={(e: any) => this.handleExecError(e)}
          />;
        }
        return '';
    }
  }

  @Method()
  async resize() {
    setTimeout(() => {
      if (!!this.tile && !!this.tile.resize) {
        (this.tile).resize();
      }
    }, 500);
    return Promise.resolve();
  }

  @Method()
  async setZoom(dataZoom: { start?: number, end?: number, type?: string }) {
    if (this.tile) {
      (this.tile).setZoom(dataZoom);
    }
    return Promise.resolve();
  }

  @Method()
  async show(regexp: string) {

    if (this.tile && this.tile['show']) {
      await (this.tile).show(regexp);
    }
  }

  @Method()
  async showById(id: number) {

    if (this.tile && this.tile['showById']) {
      await (this.tile).showById(id);
    }
  }

  @Method()
  async hide(regexp: string) {

    if (this.tile && this.tile['hide']) {
      await (this.tile).hide(regexp);
    }
  }

  @Method()
  async hideById(id: number) {

    if (this.tile && this.tile['hideById']) {
      await (this.tile).hideById(id);
    }
  }

  @Method()
  async setFocus(regexp: string, ts: number, value?: number) {

    if (this.tile && this.tile['setFocus']) {
      await (this.tile).setFocus(regexp, ts, value);
    }
  }

  @Method()
  async unFocus() {

    if (this.tile && this.tile['unFocus']) {
      await (this.tile).unFocus();
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png'): Promise<{ dataUrl: string, bgColor: string }> {

    if (this.tile && this.tile['export']) {
      const dataUrl = await (this.tile).export(type);
      return { dataUrl, bgColor: Utils.getCSSColor(this.tileElem, '--warp-view-tile-background', '#fff') };
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
             background: this.bgColor,
             color: this.fontColor,
             height: '100%', width: '100%',
           }}>
        {this.innerTitle && this.innerTitle !== ''
          ? <h2 class="tile-title">{this.innerTitle ?? ''}</h2>
          : ''}
        {this.chartDescription && this.chartDescription !== ''
          ? <p class="tile-desc">{this.chartDescription ?? ''}</p>
          : ''}
        {this.ready ? <div class="discovery-chart-wrapper">
          {this.getView()}
        </div> : ''}
      </div>,
    ];
  }

  @Method()
  async parseEvents() {
    this.LOG?.debug(['parseEvents'], { discoveryEvents: ((this.innerResult as unknown as DataModel)?.events ?? []) });
    setTimeout(() => ((this.innerResult as unknown as DataModel)?.events ?? [])
      .filter(e => e.value !== undefined)
      .filter(e => !['zoom', 'margin', 'selected'].includes(e.type))
      .forEach(e => {
        if (this.LOG) {
          this.LOG?.debug(['parseEvents', 'emit'], { discoveryEvent: e });
        }
        if (!(this.type.startsWith('input') && this.innerOptions?.input?.showButton)) {
          this.discoveryEvent.emit({ ...e, source: this.el.id });
        }
      }));
    return Promise.resolve();
  }

  private parseResult() {
    let options = new Param();
    if (!!this.options && typeof this.options === 'string' && this.options !== 'undefined') {
      options = { ...options, ...JSON.parse(this.options) };
    } else {
      options = { ...options, ...(this.options as Param ?? {}) };
    }
    options = Utils.mergeDeep<Param>(options ?? {} as Param, (this.innerResult as unknown as DataModel)?.globalParams ?? {});
    setTimeout(() => {
      void (async () => {
        this.unit = (this.options as Param).unit ?? this.unit;
        this.innerType = (this.innerResult as unknown as DataModel)?.globalParams?.type ?? this.innerType;
        this.innerOptions = Utils.clone(options);
        this.selfType.emit(this.innerType);
        this.innerTitle = this.innerOptions?.title ?? this.chartTitle ?? '';
        this.handleCSSColors();
        await this.parseEvents();
      })();
    });
    if (this.LOG) {
      this.LOG?.debug(['parseResult'], { type: this.innerType, options: this.options });
    }
  }

  private generateStyle(styles: { [k: string]: string }): string {
    this.innerStyles = Utils.clone({ ...this.innerStyles, ...styles, ...this.innerOptions.customStyles ?? {} });
    return Object.keys(this.innerStyles ?? {}).map(k => `${k} { ${this.innerStyles[k]} }`).join('\n');
  }

  private handleCSSColors() {
    let fontColor = Utils.getCSSColor(this.tileElem, '--warp-view-font-color', '#404040');
    fontColor = this.innerOptions?.fontColor ?? fontColor;
    let bgColor = Utils.getCSSColor(this.tileElem, '--warp-view-bg-color', 'transparent');
    bgColor = this.innerOptions?.bgColor ?? bgColor;
    this.bgColor = (this.innerResult as unknown as DataModel)?.globalParams?.bgColor ?? bgColor;
    this.fontColor = (this.innerResult as unknown as DataModel)?.globalParams?.fontColor ?? fontColor;

    if (this.tileElem) {
      const rs = getComputedStyle(this.tileElem);
      if ('' === rs.getPropertyValue('--warp-view-font-color').trim()) {
        this.tileElem.style.setProperty('--warp-view-font-color', this.fontColor);
      }
      if ('' === rs.getPropertyValue('--warp-view-chart-label-color').trim()) {
        this.tileElem.style.setProperty('--warp-view-chart-label-color', this.fontColor);
      }
      if ('#8e8e8e' === rs.getPropertyValue('--warp-view-chart-grid-color').trim()) {
        this.tileElem.style.setProperty('--warp-view-chart-grid-color', this.fontColor);
      }
    }
  }

  private handleExecError(e: DiscoveryButtonCustomEvent<any>) {
    this.execError.emit(e.detail);
  }
}
