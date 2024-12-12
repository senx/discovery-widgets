/*
 *   Copyright 2022-2024 SenX S.A.S.
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
import { Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { Logger } from '../../utils/logger';
import noUiSlider from 'nouislider';
import { API } from 'nouislider/src/nouislider';
import { GTSLib } from '../../utils/gts.lib';
import { Param } from '../../model/param';
import { Utils } from '../../utils/utils';
import domToImage from 'dom-to-image';

@Component({
  tag: 'discovery-slider',
  styleUrl: 'discovery-slider.scss',
  shadow: true,
})
export class DiscoverySlider {

  @Prop() debug: boolean;
  @Prop() progress: boolean;
  @Prop() disabled: boolean = false;
  @Prop() options: Param | string = { ...new Param(), timeMode: 'date' };

  @State() innerOptions: Param;

  @Event() valueChanged: EventEmitter<number>;
  @Event() startDrag: EventEmitter<void>;
  @Element() el: HTMLElement;

  private sliderDiv: HTMLDivElement;
  private LOG: Logger;
  private slider: API;
  private divider: number;
  private innerValue: number | number[];
  private defOptions = { ...new Param(), input: { min: 0, max: 100, horizontal: true, showTicks: true, step: 1 } };

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    this.innerOptions = Utils.clone({ ...this.defOptions, ...opts });
    this.innerValue = this.innerOptions.input?.value as number | number[] || this.innerValue || this.innerOptions.input?.min || 0;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await this.setValue(this.innerValue);
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue });
      }
      return Promise.resolve();
    });
    if(this.innerOptions?.input?.disabled) {
      this.slider?.disable();
    } else {
      this.slider?.enable();
    }
    this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue });
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.LOG = new Logger(DiscoverySlider, this.debug);
    this.LOG?.debug(['componentWillLoad'], this.options);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    const options = Utils.mergeDeep<Param>({ ...this.defOptions }, this.innerOptions || {});
    this.innerOptions = Utils.clone(options);
    this.LOG?.debug(['componentWillLoad'], this.innerOptions);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
  }


  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    this.innerValue = this.innerValue ?? this.innerOptions.input?.value as number | number[] ?? this.innerOptions.input?.min ?? 0;
    this.slider = noUiSlider.create(this.sliderDiv, this.getSliderOptions());
    if(this.innerOptions?.input?.disabled) {
      this.slider?.disable();
    } else {
      this.slider?.enable();
    }
    this.setChangeListener();
  }

  @Method()
  async setValue(value: number | number[]) {
    this.innerValue = value;
    this.slider.destroy();
    this.slider = noUiSlider.create(this.sliderDiv, this.getSliderOptions());
    this.setChangeListener();
    return Promise.resolve();
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(type: 'png' | 'svg' = 'png', bgColor: string) {
    const dims = Utils.getContentBounds(this.sliderDiv);
    const width = dims.w - 15;
    const height = dims.h;
    return await domToImage.toPng(this.sliderDiv, { height, width, bgcolor: bgColor });
  }

  render() {
    return (
      <div>
        <div id="slider" ref={(el) => this.sliderDiv = el} />
      </div>
    );
  }

  private getSliderOptions() {
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    const minmax = {
      min: this.innerOptions.input?.min || 0,
      max: (!!this.innerOptions.input?.max || this.innerOptions.input?.max === 0)
        ? this.innerOptions.input?.max
        : 100,
    };
    const start = this.innerValue;
    const range = minmax.max - minmax.min;
    const pips = this.innerOptions.input?.step ?? Math.round(range / (this.innerOptions.input?.stepCount ?? range));
    const format = {
      to: (v: number) => this.innerOptions.timeMode === 'date'
        ? (GTSLib.toISOString(v, this.divider, this.innerOptions.timeZone, this.innerOptions.timeFormat) ?? '')
          .replace('T', '<br />').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
        : parseFloat(v.toFixed(4)).toString() + (this.innerOptions.unit ?? '')
      ,
      from: Number,
    };
    if (this.innerOptions.timeMode === 'date') {
      this.sliderDiv.classList.add('discovery-date');
    } else {
      this.sliderDiv.classList.remove('discovery-date');
    }
    let connect: boolean | boolean[] | string | string[] = this.innerOptions.input?.progress || this.progress ? 'lower' : false;
    if (GTSLib.isArray(this.innerValue)) {
      connect = true;
    }
    return {
      format,
      start,
      connect,
      orientation: this.innerOptions.input?.horizontal ?? true ? 'horizontal' : 'vertical',
      tooltips: this.innerOptions.timeMode === 'date' ? true : {
        to: (v: any) => parseFloat((v).toFixed(4)).toString() + (this.innerOptions.unit || ''),
        from: (v: any) => parseFloat((v).toFixed(4)),
      },
      step: this.innerOptions.input?.step || this.innerOptions.input?.stepCount ? pips : undefined,
      range: minmax,
      pips: this.innerOptions.input?.showTicks ?? true ? {
        mode: 'positions',
        values: [0, 25, 50, 75, 100],
        stepped: true,
        density: 4,
        format,
      } as any : undefined,
    } as any;
  }

  private setChangeListener() {
    const throttledHandler = (v: any) => {
      let r: any;
      if (GTSLib.isArray(v) && v.length > 1) {
        r = this.innerOptions.timeMode === 'date'
          ? [this.parseDate(v[0].replace(this.innerOptions?.unit ?? '', '')), this.parseDate(v[1].replace(this.innerOptions?.unit ?? '', ''))]
          : [Number(v[0].replace(this.innerOptions?.unit ?? '', '')), Number(v[1].replace(this.innerOptions?.unit ?? '', ''))];
      } else {
        r = this.innerOptions.timeMode === 'date'
          ? this.parseDate(v[0].replace(this.innerOptions?.unit ?? '', ''))
          : Number(v[0].replace(this.innerOptions?.unit ?? '', ''));
      }
      this.valueChanged.emit(r);
    };
    const handler = Utils.throttle(throttledHandler, 200);
    this.slider
      .on(this.innerOptions.input?.immediate ? 'slide' : 'change', values => handler(values ?? [0]));
  }

  private parseDate(d: string): number {
    return GTSLib.toTimestamp(d.replace('<br />', 'T'), this.divider, this.innerOptions.timeZone);
  }
}
