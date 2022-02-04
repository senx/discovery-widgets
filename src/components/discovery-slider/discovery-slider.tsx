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

import {Component, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {Logger} from "../../utils/logger";
import noUiSlider from 'nouislider';
import {API} from "nouislider/src/nouislider";
import {GTSLib} from "../../utils/gts.lib";
import {Param} from "../../model/param";
import {Utils} from "../../utils/utils";

@Component({
  tag: 'discovery-slider',
  styleUrl: 'discovery-slider.scss',
  shadow: true,
})
export class DiscoverySlider {

  @Prop() debug: boolean;
  @Prop() options: Param | string = {...new Param(), timeMode: 'date'};

  @State() innerOptions: Param;

  @Event() valueChanged: EventEmitter<number>;

  private sliderDiv: HTMLDivElement;
  private LOG: Logger;
  private slider: API;
  private divider: number;


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

  componentWillLoad() {
    this.LOG = new Logger(DiscoverySlider, this.debug);
    this.LOG.debug(['componentWillLoad'], this.options);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    let options = Utils.mergeDeep<Param>({
      ...new Param(),
      input: {
        min: 0, max: 100, horizontal: true
      }
    }, this.innerOptions || {}) as Param;
    this.innerOptions = {...options};
    this.LOG.debug(['componentWillLoad'], this.innerOptions);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
  }

  componentDidLoad() {
    let minmax = {min: this.innerOptions.input?.min || 0, max: this.innerOptions.input?.max || 100}
    let start = this.innerOptions.input?.value as number || this.innerOptions.input?.min || 0;
    const range = minmax.max - minmax.min;
    const pips = this.innerOptions.input?.step || Math.round(range / (this.innerOptions.input?.stepCount || range));
    const format = {
      to: v => this.innerOptions.timeMode === 'date'
        ? GTSLib.toISOString(v, this.divider, this.innerOptions.timeZone)?.replace('T', '<br />').replace('Z', '')
        : v,
      from: Number
    };
    if (this.innerOptions.timeMode === 'date') {
      this.sliderDiv.classList.add('discovery-date');
    } else {
      this.sliderDiv.classList.remove('discovery-date');
    }
    this.slider = noUiSlider.create(this.sliderDiv, {
      format,
      start,
      connect: this.innerOptions.input?.progress ? 'lower' : false,
      orientation: this.innerOptions.input?.horizontal ? 'horizontal' : 'vertical',
      tooltips: true,
      step: this.innerOptions.input?.step || this.innerOptions.input?.stepCount ? pips : undefined,
      range: minmax,
      pips: {
        mode: 'steps',
        stepped: false,
        density: 4,
        format
      } as any
    } as any);
    this.slider.on('set', e => {
      const r = this.innerOptions.timeMode === 'date'
        ? GTSLib.toTimestamp((e[0] as string).replace('<br />', 'T') + 'Z', this.divider, this.innerOptions.timeZone)
        : Number(e[0]);
      this.valueChanged.emit(r)
    });
  }

  @Method()
  async setValue(value: number) {
    this.slider.set(value);
  }

  render() {
    return (
      <div>
        <div id="slider" ref={(el) => this.sliderDiv = el as HTMLDivElement}/>
      </div>
    );
  }

}
