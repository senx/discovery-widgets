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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {ChartType, DataModel, DiscoveryEvent} from '../../model/types';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {Utils} from '../../utils/utils';
import domtoimage from 'dom-to-image';
import {LangUtils} from '../../utils/lang-utils';

@Component({
  tag: 'discovery-button',
  styleUrl: 'discovery-button.scss',
  shadow: true,
})
export class DiscoveryButtonComponent {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug = false;
  @Prop() url: string;
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() vars = '{}';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() execResult: EventEmitter<any[]>;
  @Event() statusError: EventEmitter;
  @Event({
    eventName: 'discoveryEvent',
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  @State() parsing = false;
  @State() rendering = false;
  @State() label = 'Ok';
  @State() innerStyle: { [k: string]: string; };
  @State() active: string;

  private defOptions: Param = new Param();
  private LOG: Logger;
  private root: HTMLDivElement;
  private innerVars: any = {};
  private innerResult: DataModel;


  @Watch('vars')
  varsUpdate(newValue: string, oldValue: string) {
    this.parseResult();
    if (this.LOG) {
      this.LOG?.debug(['varsUpdate'], {
        vars: this.vars,
        newValue, oldValue
      });
    }
  }

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.parseResult();
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler, this.el.id);
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
    if (res.vars) {
      this.innerVars = {...this.innerVars, ...res.vars};
    }
  }

  @Method()
  async resize() {
    // empty
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(type: 'png' | 'svg' = 'png') {
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.options as Param) || {bgColor}).bgColor || bgColor;
    const dm: Param = ((this.innerResult || {
      globalParams: {bgColor}
    }).globalParams || {bgColor}) as Param;
    bgColor = dm.bgColor || bgColor;
    return await domtoimage.toPng(this.root, {height: this.height, width: this.width, bgcolor: bgColor});
  }


  componentWillLoad() {
    this.LOG = new Logger(DiscoveryButtonComponent, this.debug);
    this.parsing = true;
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });
    this.parseResult();
    this.draw.emit();
  }

  private parseResult() {
    this.innerResult = GTSLib.getData(this.result);
    const btnLabel = ((this.options as Param).button || {label: 'Ok'}).label;
    const dm = (this.innerResult || {
      globalParams: {
        button: {label: btnLabel}
      }
    }).globalParams || {button: {label: btnLabel}};

    this.label = dm.button.label;
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, this.innerResult.globalParams);
    this.options = {...options};

    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    } else if (!!this.vars) {
      this.innerVars = this.vars;
    }
    if (this.options.customStyles) {
      this.innerStyle = {...this.innerStyle, ...this.options.customStyles || {}};
    }
    setTimeout(() => this.active = (this.innerResult?.data || []).find(v => v.active)?.value);
  }

  private handleClick() {
    const ws = LangUtils.prepare(
      `${this.innerResult.data} EVAL`,
      this.innerVars || {},
      (this.options as Param)?.skippedVars || [],
      this.type,
      this.language);
    Utils.httpPost(this.url, ws, (this.options as Param).httpHeaders)
      .then((res: any) => {
        this.LOG?.debug(['handleClick', 'res.data'], res.data);
        const result = GTSLib.getData(res.data);
        this.LOG?.debug(['handleClick', 'getData'], result);
        if (!!result) {
          (result.events || []).forEach(e => {
            this.LOG?.debug(['handleClick', 'emit'], {discoveryEvent: e});
            if (!GTSLib.isArray(e.value)) {
              e.value = [e.value];
            }
            this.discoveryEvent.emit({...e, source: this.el.id});
          });
        }
        this.execResult.emit(res.data);
      })
      .catch(e => {
        this.statusError.emit(e);
        this.LOG?.error(['exec'], e);
      });
  }

  private toggle(value: string) {
    this.active = value;
    (this.innerResult.events || []).forEach(e => {
      this.LOG?.debug(['handleClick', 'emit'], {discoveryEvent: e});
      if (!e.value) {
        e.value = {};
      }
      e.value[e.selector] = value;
      this.discoveryEvent.emit({...e, source: this.el.id});
    });
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k => k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <div ref={el => this.root = el} class="button-wrapper">
        {this.type === 'button'
          ? <button type="button" class="discovery-btn"
                    innerHTML={this.label}
                    onClick={() => this.handleClick()}/>
          : <div class="discovery-btn-group">
            {GTSLib.isArray(this.innerResult?.data)
              ? (this.innerResult?.data || []).map(v =>
                <button type="button" class={{
                  'discovery-btn': true,
                  'active': v.value === this.active
                }}
                        innerHTML={v.label}
                        onClick={() => this.toggle(v.value)}
                />
              ) : ''}
          </div>}
      </div>
    ];
  }
}
