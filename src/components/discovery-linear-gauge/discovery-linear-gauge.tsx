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
import {DataModel} from '../../model/dataModel';
import {ChartType, ECharts} from '../../model/types';
import {Param} from '../../model/param';
import {EChartsOption} from 'echarts';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {ColorLib} from '../../utils/color-lib';
import {Utils} from '../../utils/utils';
import domtoimage from 'dom-to-image';
import {DiscoveryEvent} from '../../model/discoveryEvent';

@Component({
  tag: 'discovery-linear-gauge',
  styleUrl: 'discovery-linear-gauge.scss',
  shadow: true,
})
export class DiscoveryLinearGauge {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug = false;
  @Prop() unit: string;
  @Prop() vars = '{}';

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;

  @State() parsing = false;
  @State() rendering = false;
  @State() innerOptions: Param;
  @State() innerStyle: { [k: string]: string; };
  private innerVars: any = {};

  private root: HTMLDivElement;
  private tooltip: HTMLDivElement;
  private chartOpts: EChartsOption;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private divider = 1000;
  private myChart: ECharts;
  private dataStruct: any[];
  private isVertical = true;

  @Watch('result')
  updateRes() {
    this.convert(GTSLib.getData(this.result) || new DataModel());
    this.innerOptions.gauge = {horizontal: true, ...this.innerOptions.gauge};
    this.isVertical = !this.innerOptions.gauge?.horizontal;
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
      this.innerOptions.gauge = {horizontal: true, ...this.innerOptions.gauge};
      this.isVertical = !this.innerOptions.gauge?.horizontal;
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Watch('vars')
  varsUpdate(newValue: string, oldValue: string) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
    }
    if (this.LOG) {
      this.LOG?.debug(['varsUpdate'], {
        vars: this.vars,
        newValue, oldValue
      });
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler);
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
    if (res.vars) {
      this.innerVars = {...this.innerVars, ...res.vars};
    }
  }

  @Method()
  async resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
    return Promise.resolve();
  }

  @Method()
  async show(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    this.myChart.dispatchAction({
      type: 'legendUnSelect',
      batch: (this.myChart.getOption().series as any[]).map(s => {
        return {name: s.name}
      }).filter(s => new RegExp(regexp).test(s.name))
    });
    return Promise.resolve();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryLinearGauge, this.debug);
    this.innerVars = JSON.parse(this.vars);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.convert(GTSLib.getData(this.result) || new DataModel());
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      chartOpts: this.chartOpts
    });
  }

  convert(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams);
    this.innerOptions = {...options};
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.isVertical = !this.innerOptions.gauge?.horizontal;
    if (this.innerOptions.customStyles) {
      this.innerStyle = {...this.innerStyle, ...this.innerOptions.customStyles || {}};
    }
    // noinspection JSUnusedAssignment
    let gtsList = [];
    if (GTSLib.isArray(data.data)) {
      data.data = GTSLib.flatDeep(data.data as any[]);
      this.LOG?.debug(['convert', 'isArray']);
      if (data.data.length > 0 && GTSLib.isGts(data.data[0])) {
        this.LOG?.debug(['convert', 'isArray 2']);
        gtsList = GTSLib.flattenGtsIdArray(data.data as any[], 0).res;
      } else {
        this.LOG?.debug(['convert', 'isArray 3']);
        gtsList = data.data as any[];
      }
    } else {
      this.LOG?.debug(['convert', 'not array']);
      gtsList = [data.data];
    }
    this.LOG?.debug(['convert'], {options: this.innerOptions, gtsList});
    const gtsCount = gtsList.length;
    let overallMax = this.innerOptions.maxValue || 0;
    let overallMin = this.innerOptions.minValue || 0;
    const dataStruct = [];
    for (let i = 0; i < gtsCount; i++) {
      const c = ColorLib.getColor(i, this.innerOptions.scheme);
      const color = ((data.params || [])[i] || {datasetColor: c}).datasetColor || c;
      const gts = gtsList[i];
      if (GTSLib.isGts(gts)) {
        let max: number = Number.MIN_VALUE;
        const values = (gts.v || []);
        const val = values[values.length - 1] || [];
        let ts = 0;
        let value = 0;
        if (val.length > 0) {
          value = val[val.length - 1];
          ts = val[0];
        }
        if (!!data.params && !!data.params[i] && !!data.params[i].maxValue) {
          max = data.params[i].maxValue;
        } else {
          if (overallMax < value) {
            overallMax = value;
          }
        }
        let min: number = Number.MAX_VALUE;
        if (!!data.params && !!data.params[i] && !!data.params[i].minValue) {
          min = data.params[i].minValue;
        } else {
          if (overallMin > value) {
            overallMin = value;
          }
        }
        dataStruct.push({
          key: ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(gts),
          value, max, min, color, ts
        });
      } else {
        // custom data format
        let max: number = Number.MIN_VALUE;
        if (!!data.params && !!data.params[i] && !!data.params[i].maxValue) {
          max = data.params[i].maxValue;
        } else {
          if (overallMax < gts.value || Number.MIN_VALUE) {
            overallMax = gts.value || Number.MIN_VALUE;
          }
        }
        let min: number = Number.MAX_VALUE;
        if (!!data.params && !!data.params[i] && !!data.params[i].minValue) {
          min = data.params[i].minValue;
        } else {
          if (overallMin > gts.value || Number.MAX_VALUE) {
            overallMin = gts.value || Number.MAX_VALUE;
          }
        }
        if (gts.hasOwnProperty('value')) {
          dataStruct.push({key: gts.key || '', value: gts.value || 0, max, min, color});
        } else {
          dataStruct.push({key: '', value: gts || 0, max, min, color});
        }
      }
    }
    this.LOG?.debug(['convert', 'dataStruct'], dataStruct);
    dataStruct.forEach(d => {
      d.max = Math.max(overallMax, d.max);
      d.min = Math.min(overallMin, d.min);
      if (d.max === Number.MIN_VALUE) {
        d.max = d.value > 0 ? 100 : 0;
      }
      if (d.min === Number.MAX_VALUE) {
        d.min = d.value < 0 ? -100 : 0;
      }
      if (d.value > 0) {
        d.progress = d.value / d.max * 100.0;
      } else {
        d.progress = d.value / d.min * -100.0;
      }
    });
    this.dataStruct = dataStruct;
  }

  componentDidLoad() {
    this.parsing = false;
    this.rendering = true;
    this.rendering = false;
    setTimeout(() => this.draw.emit());
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(type: 'png' | 'svg' = 'png') {
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.options as Param) || {bgColor}).bgColor || bgColor;
    const res = this.result as DataModel;
    const dm: Param = ((res || {
      globalParams: {...new Param(), bgColor}
    }).globalParams || {...new Param(), bgColor});
    bgColor = dm.bgColor || bgColor;
    return await domtoimage.toPng(this.root, {height: this.height, width: this.width, bgcolor: bgColor});
  }

  setMousePosition(e: MouseEvent) {
    const r = this.el.getBoundingClientRect();
    this.tooltip.style.top = `${e.clientY - r.y}px`;
    this.tooltip.style.left = `${e.clientX - r.x}px`;
  }

  showTooltip(data: any) {
    this.tooltip.style.display = 'block';
    this.tooltip.innerHTML = `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${
      data.ts ? (this.innerOptions.timeMode || 'date') === 'date'
          ? GTSLib.toISOString(
            GTSLib.toTimestamp(data.ts, 1, this.innerOptions.timeZone),
            this.divider, this.innerOptions.timeZone,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined
          ).replace('T', ' ').replace('Z', '')
          : data.ts
        : ''
    }</div>
      <span class="label">${GTSLib.formatLabel(data.key)}</span>
      <span class="value" style="margin-left: ${data.key || '' !== '' ? '20px' : '0'} ">${data.value}${this.innerOptions.unit || this.unit || ''}</span>`
  }

  hideTooltip() {
    this.tooltip.style.display = 'none';
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k => k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  render() {
    return [<style>{this.generateStyle(this.innerStyle)}</style>,
      <div ref={el => this.root = el} onMouseMove={e => this.setMousePosition(e)} class={
        {'vertical-wrapper': !this.innerOptions.gauge?.horizontal}
      }>
        <div class="wv-tooltip" style={{display: 'none'}} ref={el => this.tooltip = el}></div>
        {this.dataStruct.map(d =>
          <div class={
            {
              'discovery-progress-group': true,
              'discovery-progress-group-vertical': this.isVertical
            }
          }>{this.innerOptions.showLegend && !this.innerOptions.gauge?.horizontal ?
            <p class="small" innerHTML={GTSLib.formatLabel(d.key)}></p> : ''}
            <h3
              class="discovery-legend">{d.value || '0'}{this.innerOptions.unit || ''} {!this.innerOptions.gauge?.horizontal ?
              <br/> : ''}
              <span
                class="small">of {d.value > 0 ? d.max: d.min}{this.innerOptions.unit || this.unit || ''}</span></h3>
            <div class={{
              'discovery-progress-container-horizontal': this.innerOptions.gauge?.horizontal
            }}>
              {d.min < 0 ?
                <div class="discovery-progress negative" onMouseOver={() => this.showTooltip(d)}
                     onMouseLeave={() => this.hideTooltip()}>
                  <div class="ticks">
                    {Array((this.innerOptions.gauge?.showTicks ? 10 : 0)).fill(0).map(() => <i class="tick"></i>)}
                  </div>
                  <div class="discovery-progress-bar" style={{
                    width: this.innerOptions.gauge?.horizontal ? `${Math.abs(d.progress)}%` : 'var(--warp-view-progress-size, 1rem)',
                    height: !this.innerOptions.gauge?.horizontal ? `${Math.abs(d.progress)}%` : 'var(--warp-view-progress-size, 1rem)',
                    display: d.progress > 0 ? 'none' : 'block',
                    backgroundColor: d.color
                  }}></div>
                </div>
                : ''
              }
              {d.max > 0 ?
                <div class="discovery-progress positive" onMouseOver={() => this.showTooltip(d)}
                     onMouseLeave={() => this.hideTooltip()}>
                  <div class="ticks">
                    {Array((this.innerOptions.gauge?.showTicks ? 10 : 0)).fill(0).map(() => <i class="tick"></i>)}
                  </div>
                  <div class="discovery-progress-bar" style={{
                    width: this.innerOptions.gauge?.horizontal ? `${Math.abs(d.progress)}%` : 'var(--warp-view-progress-size, 1rem)',
                    height: !this.innerOptions.gauge?.horizontal ? `${Math.abs(d.progress)}%` : 'var(--warp-view-progress-size, 1rem)',
                    backgroundColor: d.color,
                    display: d.progress < 0 ? 'none' : 'block'
                  }}></div>
                </div>
                : ''
              }
            </div>
            {this.innerOptions.showLegend && this.innerOptions.gauge?.horizontal ?
              <p class="small" innerHTML={GTSLib.formatLabel(d.key)}></p> : ''}
          </div>
        )}
        {this.parsing ? <div class="discovery-chart-spinner">
          <discovery-spinner>Parsing data...</discovery-spinner>
        </div> : ''}
        {this.rendering ? <div class="discovery-chart-spinner">
          <discovery-spinner>Rendering data...</discovery-spinner>
        </div> : ''}
      </div>];
  }
}
