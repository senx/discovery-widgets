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
import { Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, DiscoveryEvent } from '../../model/types';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import fitty, { FittyInstance } from 'fitty';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Utils } from '../../utils/utils';
import domtoimage from 'dom-to-image';
import showdown from 'showdown';

dayjs.extend(relativeTime);

@Component({
  tag: 'discovery-display',
  styleUrl: 'discovery-display.scss',
  shadow: true,
})
export class DiscoveryDisplayComponent {

  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @State() @Prop({ mutable: true }) width: number;
  @State() @Prop({ mutable: true }) height: number;
  @Prop() debug = false;
  @Prop() unit = '';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;

  @State() parsing = false;
  @State() rendering = false;
  @State() message: string = '';
  @State() innerStyle: { [k: string]: string; };
  @State() innerOptions: Param;

  private wrapper: HTMLDivElement;
  private pngWrapper: HTMLDivElement;
  private defOptions: Param = { ...new Param(), responsive: true };
  private divider = 1000;
  private LOG: Logger;
  private timer: any;
  private fitties: FittyInstance;
  private innerHeight: number;
  private initial = false;
  private gts: any;
  private chartOptions: Param = {
    ...new Param(),
    hideXAxis: true,
    hideYAxis: true,
    bgColor: 'transparent',
    scheme: 'ATLANTIS',
  };

  @Watch('result')
  updateRes(newValue: any) {
    const message = this.convert(GTSLib.getData(newValue) ?? new DataModel());
    if (message !== this.message) {
      this.message = message;
      this.fitties.fit();
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
      this.chartOptions = Utils.clone({ ...this.chartOptions, fontColor: this.innerOptions.fontColor });
      this.message = this.convert(this.result as DataModel || new DataModel());
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue }, this.chartOptions);
    }
  }

  @Listen('discoveryEvent', { target: 'window' })
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, this.innerOptions?.eventHandler || '', this.el.id);
    if (res.style) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...res.style });
    }
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    if (!!this.wrapper) {
      const height = Utils.getContentBounds(this.wrapper.parentElement).h - 20;
      if (height !== this.innerHeight) {
        this.innerHeight = height;
      }
      this.fitties.fit();
    }
    return Promise.resolve();
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(type: 'png' | 'svg' = 'png') {
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.innerOptions) || { bgColor }).bgColor || bgColor;
    const dm: Param = (((this.result as unknown as DataModel) || {
      globalParams: { bgColor },
    }).globalParams || { bgColor }) as Param;
    bgColor = dm.bgColor || bgColor;
    return await domtoimage.toPng(this.pngWrapper, { height: this.height, width: this.width, bgcolor: bgColor });
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryDisplayComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.chartOptions = Utils.clone({ ...this.chartOptions, fontColor: this.innerOptions.fontColor });
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.message = this.convert(this.result ?? new DataModel());
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
      if (!!this.wrapper) {
        const height = Utils.getContentBounds(this.wrapper.parentElement).h - 20;
        if (height !== this.innerHeight) {
          this.innerHeight = height;
          this.LOG?.debug(['flexFont'], height);
        }
        if (this.innerOptions.responsive && this.initial && !this.innerOptions?.display?.markdown) {
          this.fitties = fitty(this.wrapper, {
            maxSize: height * 0.80, minSize: 14, observeMutations: {
              subtree: false,
              childList: false,
              characterData: true,
            },
          });
          this.fitties.fit();
        }
      }
      this.initial = false;
      this.draw.emit();
    });
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.fitties) {
      this.fitties.unsubscribe();
    }
  }

  private convert(dataModel: DataModel): string {
    if (!!this.timer) {
      clearInterval(this.timer);
    }
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions ?? {});
    options = Utils.mergeDeep<Param>(options || {} as Param, dataModel.globalParams);
    this.innerOptions = Utils.clone(options);
    if (this.innerOptions.customStyles) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...this.innerOptions.customStyles ?? {} });
    }
    this.chartOptions = Utils.clone({ ...this.chartOptions, fontColor: this.innerOptions.fontColor });
    this.LOG?.debug(['convert'], 'dataModel', dataModel);
    let display: any;
    if (!!dataModel.data) {
      display = GTSLib.isArray(dataModel.data) ? dataModel.data[0] ?? this.message : dataModel.data ?? this.message;
    } else {
      display = GTSLib.isArray(dataModel) ? dataModel[0] ?? this.message : dataModel ?? this.message;
    }
    display = GTSLib.isArray(display) ? display[0] ?? this.message : display ?? this.message;
    if (GTSLib.isGts(display)) {
      this.gts = [display];
      let v: string | number = this.innerOptions.display?.value ?? '';
      if (this.innerOptions.display?.value === undefined && display.v && display.v.length > 0) {
        const dataPoint = display.v[display.v.length - 1];
        v = dataPoint[dataPoint.length - 1];
        if (this.innerOptions.display?.decimals) {
          const dec = Math.pow(10, this.innerOptions.display?.decimals ?? 2);
          v = Math.round(parseFloat(v + '') * dec) / dec;
        }
      }
      display = v;
    }
    if (display && display.hasOwnProperty('text')) {
      if (display.hasOwnProperty('url')) {
        display = `<a href="${display.url}" target="_blank">${display.text}</a>`;
      } else {
        display = display.text;
      }
    }
    switch (this.innerOptions.timeMode) {
      case 'date':
        if (display && !isNaN(parseInt(display, 10))) {
          display = GTSLib.toISOString(parseInt(display, 10), this.divider, this.innerOptions.timeZone,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined);
        }
        break;
      case 'duration':
        if (display && !isNaN(parseInt(display, 10))) {
          const start = GTSLib.toISOString(parseInt(display, 10), this.divider, this.innerOptions.timeZone,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined);
          display = this.displayDuration(dayjs(start));
        }
        break;
      case 'custom':
      case 'timestamp':
        display = decodeURIComponent(decodeURIComponent(display));
    }
    if (this.innerOptions?.display?.markdown) {
      const converter = new showdown.Converter({ emoji: true,
        tables: true,
        tasklists: true,
        flavor: 'github',
        moreStyling: true,
        parseImgDimensions: true,
        requireSpaceBeforeHeadingText: true,
        simpleLineBreaks: false,
        encodeEmails: false,
        simplifiedAutoLink: false,
        metadata: true,
        ghCodeBlocks: true, });
      display = converter.makeHtml(display);
    }
    return display ?? '';
  }

  render() {
    return <div ref={(el) => this.pngWrapper = el} class="png-wrapper">
      <style>{this.generateStyle(this.innerStyle)}</style>
      <div style={{ color: this.innerOptions.fontColor }}
           class={this.getClass()}>
        {this.parsing ? <discovery-spinner>Parsing data...</discovery-spinner> : ''}
        {this.rendering ? <discovery-spinner>Rendering data...</discovery-spinner> : ''}
        <div ref={(el) => this.wrapper = el} class="value">
          <span innerHTML={this.message ?? ''} /><small>{this.innerOptions.unit ?? this.unit ?? ''}</small>
        </div>
      </div>
      {this.gts && this.innerOptions.display?.showChart
        ? <div class="chart-wrapper">
          <div>
            <discovery-tile-result
              url=""
              result={this.gts ?? []}
              type={this.innerOptions.display?.chartType ?? 'area'}
              options={this.chartOptions}
            />
          </div>
        </div>
        : ''
      }
    </div>;
  }

  private displayDuration(start: dayjs.Dayjs) {
    this.timer = setInterval(() => this.message = dayjs().to(start), 1000);
    return dayjs().to(start);
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle ?? {}).map(k => k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  private getClass() {
    return 'display-container pos-' + (this.innerOptions?.display?.labelPosition ?? 'c') + (this.innerOptions?.display?.markdown ? ' display-md' : '');
  }
}
