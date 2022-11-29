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
import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {ChartType, DataModel} from '../../model/types';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {Utils} from '../../utils/utils';

@Component({
  tag: 'discovery-hidden',
  styleUrl: 'discovery-hidden.scss',
  shadow: true,
})
export class DiscoveryHidden {

  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @State() @Prop({mutable: true}) width: number;
  @State() @Prop({mutable: true}) height: number;
  @Prop() debug = false;
  @Prop() unit = '';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing = false;
  @State() rendering = false;
  @State() message: string;
  @State() innerStyle: { [k: string]: string; };
  @State() innerOptions: Param;

  private wrapper: HTMLDivElement;
  private divider = 1000;
  private LOG: Logger;
  @State() private initial = false;

  @Watch('result')
  updateRes() {
    this.result = GTSLib.getData(this.result);
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryHidden, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
    });
  }

  componentDidLoad() {
    setTimeout(() => {
      this.height = Utils.getContentBounds(this.el.parentElement).h;
      this.initial = true;
      this.parsing = false;
      setTimeout(() => this.draw.emit(), 100);
    });
  }

  @Method()
  async resize() {
    // empty
  }

  render() {
    return <div style={{display: 'hidden'}}>
      <div ref={(el) => this.wrapper = el }/>
    </div>
  }


}
