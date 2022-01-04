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

import {Component, Host, h, Prop, State, Element, Event, EventEmitter, Watch, Listen} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {FittyInstance} from "fitty";
import {GTSLib} from "../../utils/gts.lib";
import {DiscoveryEvent} from "../../model/discoveryEvent";
import {Utils} from "../../utils/utils";

@Component({
  tag: 'discovery-empty',
  styleUrl: 'discovery-empty.scss',
  shadow: true,
})
export class DiscoveryEmpty {

  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @State() @Prop({mutable: true}) width: number;
  @State() @Prop({mutable: true}) height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() message: string;
  @State() innerStyle: { [k: string]: string; };
  @State() innerOptions: Param;

  private wrapper: HTMLDivElement;
  private defOptions: Param = new Param();
  private divider: number = 1000;
  private LOG: Logger;
  private initial = false;

  @Watch('result')
  updateRes() {
    this.result = GTSLib.getData(this.result);
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
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryEmpty, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
    });
  }

  componentDidLoad() {
    setTimeout(() => {
      this.height = Utils.getContentBounds(this.el.parentElement).h;
      this.initial = true;
      this.parsing = false;
    });
  }

  render() {
    return [
      <div style={{display: 'hidden'}} >
        <div ref={(el) => this.wrapper = el as HTMLDivElement} />
      </div>
    ]
  }


}
