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
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import domtoimage from 'dom-to-image';
import { LangUtils } from '../../utils/lang-utils';

@Component({
  tag: 'discovery-button',
  styleUrl: 'discovery-button.scss',
  shadow: true,
})
export class DiscoveryButtonComponent {
  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({ mutable: true }) options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug = false;
  @Prop() url: string;
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() vars = '{}';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() execResult: EventEmitter<any[]>;
  @Event() execError: EventEmitter;
  @Event() statusError: EventEmitter;
  @Event({
    eventName: 'discoveryEvent',
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  @State() parsing = false;
  @State() rendering = false;
  @State() label = 'Ok';
  @State() labelPosition: 'start' | 'end' | 'center' = 'center';
  @State() innerStyle: { [k: string]: string; };
  @State() active: string;
  @State() innerOptions: Param;
  @State() loading = false;
  @State() loadingBtnGrp: boolean[] = [];
  private macros: any[];

  private defOptions: Param = new Param();
  private LOG: Logger;
  private root: HTMLDivElement;
  private innerVars: any = {};
  private innerResult: DataModel;

  @Watch('vars')
  varsUpdate(newValue: any, oldValue: any) {
    let vars = this.vars;
    if (!!this.vars && typeof this.vars === 'string') {
      vars = JSON.parse(this.vars);
    }
    if (!Utils.deepEqual(vars, this.innerVars)) {
      this.innerVars = Utils.clone(vars as any);
      this.parseResult();
    }
    this.LOG?.debug(['varsUpdate'], { vars: this.vars, newValue, oldValue });
  }

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.parseResult();
    }
  }

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone(opts);
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue });
      this.parseResult();
    }
  }

  @Listen('discoveryEvent', { target: 'window' })
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler, this.el.id);
    if (res.style) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...res.style as { [k: string]: string } });
    }
    if (res.vars) {
      this.innerVars = Utils.clone({ ...this.innerVars, ...res.vars });
    }
  }

  @Method()
  async resize() {
    // empty
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  async export(_type: 'png' | 'svg' = 'png') {
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.options as Param) || { bgColor }).bgColor || bgColor;
    const dm: Param = ((this.innerResult || {
      globalParams: { bgColor },
    }).globalParams || { bgColor }) as Param;
    bgColor = dm.bgColor || bgColor;
    return await domtoimage.toPng(this.root, { height: this.height, width: this.width, bgcolor: bgColor });
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.LOG = new Logger(DiscoveryButtonComponent, this.debug);
    this.parsing = true;
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    }
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
    });
    this.parseResult();
    this.draw.emit();
  }

  private parseResult() {
    this.macros = [];
    this.innerResult = GTSLib.getData(this.result);
    const btnLabel = this.innerResult?.globalParams?.button?.label ?? this.innerOptions?.button?.label ?? 'Ok';
    const labelPosition = this.innerOptions?.button?.labelPosition ?? this.innerResult?.globalParams?.button?.labelPosition ?? 'center';

    this.label = btnLabel;
    this.labelPosition = labelPosition;
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions ?? {});
    options = Utils.mergeDeep<Param>(options ?? {} as Param, this.innerResult.globalParams);
    this.innerOptions = Utils.clone(options);

    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    } else if (this.vars) {
      this.innerVars = this.vars;
    }
    this.innerStyle = Utils.clone({ ...this.innerStyle, ...this.innerOptions?.customStyles ?? {} });
    setTimeout(() => this.active = (this.innerResult?.data || []).find((v: any) => v.active)?.value);
    if (this.type === 'button:group') {
      (this.innerResult.data ?? []).forEach((macro: any, i: number) => {
        this.macros.push({
          macro,
          button: (this.innerResult.params ?? [])[i]?.button ?? this.innerOptions?.button ?? {
            label: btnLabel,
            labelPosition,
          },
        });
      });
    } else {
      this.macros.push({
        macro: this.innerResult.data[0] // the GTSLib.getData returns an array with the object
      })
    }
  }

  private processEvents(result: any) {
    if (result) {
      for (const e of (result.events ?? [])) {
        this.LOG?.debug(['handleClick', 'emit'], { discoveryEvent: e });
        if (typeof e.value !== 'object' && GTSLib.isArray(e.value)) {
          e.value = [e.value];
        }
        this.discoveryEvent.emit({ ...e, source: this.el.id });
      }
    }
  }

  private handleClick(macro?: any, index?: number) {
    // if macro is a js object, we don't need to do a ws execution, it is already the result. real macros are rendered as strings by Warp 10.
    if (typeof macro.macro === 'object') {
      this.processEvents(macro.macro);
    } else {
      this.loading = true;
      this.loadingBtnGrp[index ?? 0] = true;
      const ws = LangUtils.prepare(
        `${macro ? macro.macro : this.innerResult.data} EVAL`, // inside a ``, js arrays of string are rendered as concatenated strings
        this.innerVars ?? {},
        this.innerOptions?.skippedVars ?? [],
        this.type,
        this.language);
      Utils.httpPost(this.url, ws, this.innerOptions.httpHeaders)
        .then(res => {
          this.LOG?.debug(['handleClick', 'res.data'], res.data);
          const result = GTSLib.getData(res.data);
          this.LOG?.debug(['handleClick', 'getData'], result);
          this.processEvents(result);
          this.loading = false;
          this.loadingBtnGrp[index ?? 0] = false;
          this.execResult.emit(res.data);
        })
        .catch(e => {
          this.loading = false;
          this.loadingBtnGrp[index ?? 0] = false;
          this.statusError.emit(e);
          this.execError.emit(e);
          this.LOG?.error(['exec'], e);
        });
    }
  }

  private toggle(value: string) {
    this.active = value;
    for (const e of (this.innerResult.events ?? [])) {
      this.LOG?.debug(['handleClick', 'emit'], { discoveryEvent: e });
      if (!e.value) {
        e.value = {};
      }
      e.value[e.selector] = value;
      this.discoveryEvent.emit({ ...e, source: this.el.id });
    }
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k => k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <div ref={el => this.root = el} class="button-wrapper">
        {this.type === 'button'
          ? <button type="button" class={{
            'discovery-btn': true,
            'button--loading': this.isLoading(0),
            'button--start': this.labelPosition === 'start',
            'button--center': this.labelPosition === 'center',
            'button--end': this.labelPosition === 'end',
          }}
                    disabled={this.isLoading(0)}
                    innerHTML={this.label}
                    onClick={() => this.handleClick(this.macros[0])}></button>
          : ''}
        {this.type === 'button:radio'
          ? <div class="discovery-btn-radio">
            {GTSLib.isArray(this.innerResult?.data)
              ? (this.innerResult?.data ?? []).map((v: any) =>
                  <button type="button"
                          class={{
                            'discovery-btn': true,
                            'active': v.value === this.active,
                            'button--start': this.labelPosition === 'start',
                            'button--center': this.labelPosition === 'center',
                            'button--end': this.labelPosition === 'end',
                          }} innerHTML={v.label} onClick={() => this.toggle(v.value)} />
                ,
              ) : ''}
          </div> : ''}
        {this.type === 'button:group'
          ? <div class={{
            'discovery-btn-group': true,
            'discovery-btn-group-v': !!this.innerOptions?.button?.vertical,
            'discovery-btn-group-h': !this.innerOptions?.button?.vertical,
          }}>
            {(this.macros ?? []).map((b: any, i: number) =>
                <button type="button"
                        class={{
                          'discovery-btn': true,
                          'button--loading': this.isLoading(i),
                          'button--start': b.button.labelPosition === 'start',
                          'button--center': b.button.labelPosition === 'center',
                          'button--end': b.button.labelPosition === 'end',
                        }}
                        disabled={this.isLoading(i)}
                        innerHTML={b.button.label}
                        onClick={() => this.handleClick(b, i)} />
              ,
            )}
          </div> : ''}
      </div>,
    ];
  }

  private isLoading(index: number) {
    return this.loadingBtnGrp[index ?? 0];
  }
}
