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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, DiscoveryEvent } from '../../model/types';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/l10n/index';
import rangePlugin from 'flatpickr/dist/plugins/rangePlugin';
import autoComplete from '@tarekraafat/autocomplete.js/dist/autoComplete.js';
import domToImage from 'dom-to-image';

@Component({
  tag: 'discovery-input',
  styleUrl: 'discovery-input.scss',
  shadow: true,
})
export class DiscoveryInputComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug = false;
  @Prop() url: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() execResult: EventEmitter<any[]>;
  @Event() statusError: EventEmitter;
  @Event({
    eventName: 'discoveryEvent',
    composed: true,
    cancelable: true,
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  @State() parsing = false;
  @State() rendering = false;
  @State() value: string | number | number[] | string[] | any [] = '';
  @State() subType: 'list' | 'text' | 'textarea' | 'file' | 'secret' | 'number' | 'autocomplete' | 'slider' | 'date' | 'date-range' | 'multi' | 'multi-cb' | 'chips' | 'chips-autocomplete' = 'text';
  @State() innerStyle: { [k: string]: string; };
  @State() innerResult: DataModel;
  @State() label = 'Ok';
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  @State() selectedValue: string | string[] | any;
  @State() values = [];

  private defOptions: Param = { ...new Param(), input: { caseSensitive: true, onlyFromAutocomplete: true } };
  private innerOptions: Param = new Param();
  private LOG: Logger;
  private inputField: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLDiscoverySliderElement | HTMLDiscoveryInputChipsElement;
  private inputField2: HTMLInputElement;
  private disabled = false;
  private delayTimer: any;

  private root: HTMLDivElement;
  private flatpickrInstance: flatpickr.Instance;
  private autoCompleteJS: any;
  private checkBoxes: HTMLDivElement;
  private pngWrapper: HTMLDivElement;
  private innerStyles: any;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private oldValue: string | string[] | any;

  @Listen('discoveryEvent', { target: 'window' })
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, this.innerOptions.eventHandler, this.el.id);
    if (res.style) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...res.style as { [k: string]: string } });
    }
  }

  @Watch('result')
  updateRes() {
    this.LOG.debug(['updateRes'], this.innerResult);
    this.innerResult = GTSLib.getData(this.result);
    this.innerOptions = Utils.mergeDeep<Param>(this.innerOptions ?? {} as Param, this.innerResult.globalParams);
    if (this.innerOptions.customStyles) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...this.innerOptions.customStyles ?? {} });
    }
    this.parseResult();
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

  @Method()
  async resize() {
    // empty
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    const dims = Utils.getContentBounds(this.type === 'input:multi-cb' || this.type === 'input:slider'
      ? this.pngWrapper : this.root);
    this.width = dims.w - 15;
    this.height = dims.h;
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.innerOptions) || { bgColor }).bgColor || bgColor;
    const dm: Param = (((this.result as unknown as DataModel) || {
      globalParams: { bgColor },
    }).globalParams || { bgColor }) as Param;
    bgColor = dm.bgColor || bgColor;
    if (this.type === 'input:slider') {
      return await (this.inputField as HTMLDiscoverySliderElement).export(type, bgColor);
    } else {
      return await domToImage.toPng(this.type === 'input:multi-cb' ? this.pngWrapper : this.root, {
        height: this.height,
        width: this.width,
        bgcolor: bgColor,
      });
    }
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.LOG = new Logger(DiscoveryInputComponent, this.debug);
    this.parsing = true;
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.innerResult = GTSLib.getData(this.result);
    this.subType = this.type.split(':')[1] as 'list' | 'text' | 'secret' | 'autocomplete';
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options ?? {});
    options = Utils.mergeDeep<Param>(options || {} as Param, this.innerResult.globalParams);
    this.innerOptions = Utils.clone(options);
    if (this.innerOptions.customStyles) {
      this.innerStyle = Utils.clone({ ...this.innerStyle, ...this.innerOptions.customStyles ?? {} });
    }
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      innerOptions: this.innerOptions,
      innerResult: this.innerResult,
      result: this.result,
    });
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    switch (this.subType) {
      case 'date':
      case 'date-range':
        const divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
        const opts = {
          enableTime: true,
          positionElement: this.inputField,
          static: true,
          enableSeconds: true,
          time_24hr: true,
          plugins: [],
          formatDate: (d: Date) => GTSLib.toISOString(GTSLib.zonedTimeToUtc(d.valueOf(), 1) * divider, divider, undefined,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined),
        } as any;
        if (this.subType === 'date-range') {
          opts.plugins = [rangePlugin({ input: this.inputField2 })];
        }
        if (!!this.innerOptions.input && !!this.innerOptions.input.min) {
          opts.minDate = GTSLib.toISOString(this.innerOptions.input.min, divider, undefined,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined);
        }
        if (!!this.innerOptions.input && !!this.innerOptions.input.max) {
          opts.maxDate = GTSLib.toISOString(this.innerOptions.input.max, divider, undefined,
            this.innerOptions.fullDateDisplay ? this.innerOptions.timeFormat : undefined);
        }
        this.flatpickrInstance = flatpickr(this.inputField as HTMLInputElement, opts);
        this.flatpickrInstance.config.onClose.push(() => {
          if (this.subType === 'date-range') {
            this.selectedValue = this.flatpickrInstance.selectedDates
              .map(date => GTSLib.zonedTimeToUtc(date.valueOf(), 1, this.innerOptions.timeZone) * divider);
          } else {
            this.selectedValue = GTSLib.zonedTimeToUtc(this.flatpickrInstance.selectedDates[0].valueOf(), 1, this.innerOptions.timeZone) * divider;
          }
          if (!this.innerOptions.input?.showButton) {
            this.handleClick();
          }
        });
        break;
      case 'autocomplete':
        // noinspection JSPotentiallyInvalidConstructorUsage
        this.autoCompleteJS = new autoComplete({
          placeHolder: 'Search...',
          selector: () => this.inputField,
          data: { src: this.values, keys: 'v' },
          resultItem: { highlight: { render: true } },
          events: {
            input: {
              selection: (event: any) => {
                const selection = event.detail.selection.value.v;
                this.autoCompleteJS.input.value = selection;
                this.selectedValue = selection;
                this.LOG?.debug(['selection'], { v: this.selectedValue, b: !this.innerOptions.input?.showButton });
                if (!this.innerOptions.input?.showButton) {
                  this.handleClick();
                }
              },
            },
          },
        });
        break;
      default:
        break;
    }
    this.parseResult();
    this.LOG?.debug(['componentDidLoad'], {
      type: this.type,
      innerOptions: this.innerOptions,
      innerResult: this.innerResult,
      result: this.result,
    });
    this.draw.emit();
  }

  private handleClick() {
    if (this.innerOptions.input?.delayRequest && this.innerOptions.input?.delayRequest > 0) {
      if (this.delayTimer) {
        window.clearInterval(this.delayTimer);
      }
      this.delayTimer = setTimeout(() => this.handleClickRT(), this.innerOptions.input?.delayRequest);
    } else {
      this.handleClickRT();
    }
  };

  private handleClickRT() {
    const valid = !this.innerOptions?.input?.validation
      || (
        !!this.innerOptions?.input?.validation
        && !!(this.inputField as any)?.validity?.valid
        && (!this.inputField2 || !!(this.inputField2 as any)?.validity?.valid)
      );
    if (this.inputField && !['file', 'date', 'date-range', 'multi', 'chips', 'chips-autocomplete'].includes(this.subType)) {
      if ('value' in this.inputField) {
        this.selectedValue = this.inputField.value;
      }
    }
    for (const e of (this.innerResult?.events ?? [])) {
      if (this.selectedValue !== undefined) {
        if (this.subType === 'date-range' && this.selectedValue.length !== 2) {
          continue;
        }
        if (e.selector) {
          if (!e.value) {
            e.value = {};
          }
          e.value[e.selector] = this.selectedValue;
        } else {
          e.value = this.selectedValue;
        }
        if (this.subType === 'number') {
          e.value[e.selector] = parseFloat(e.value[e.selector]);
        }
        if (valid) {
          this.LOG?.debug(['handleClick', 'emit'], { discoveryEvent: e, subtype: this.subType }, this.selectedValue);
          this.discoveryEvent.emit({ ...e, source: this.el.id });
        } else {
          this.LOG?.debug(['handleClick', 'emit'], 'Invalid value');
        }
      }
    }
  };

  private generateStyle(styles: { [k: string]: string }): string {
    this.innerStyles = Utils.clone({ ...this.innerStyles, ...styles, ...this.innerOptions.customStyles ?? {} });
    return Object.keys(this.innerStyles ?? {}).map(k => `${k} { ${this.innerStyles[k]} }`).join('\n');
  }

  private handleSelect(e: any) {
    if (this.selectedValue !== (e?.target?.value ?? e?.detail)) {
      this.selectedValue = e?.target?.value ?? e?.detail;
      if (this.subType === 'chips-autocomplete' || this.subType === 'chips') {
        this.selectedValue = e.detail;
      }
      if (this.subType === 'multi' && e.target?.options) {
        this.selectedValue = Array.from(e.target.options)
          .filter((o: HTMLOptionElement) => !!o.selected)
          .map((o: HTMLOptionElement) => o.value);
      }
      if (this.subType === 'multi-cb' && this.checkBoxes) {
        this.selectedValue = Array.from(this.checkBoxes.querySelectorAll('input[type="checkbox"]'))
          .filter((o: HTMLInputElement) => o.checked)
          .map((o: HTMLInputElement) => o.value);
      }
      if (this.subType !== 'file' && !this.innerOptions.input?.showButton) {
        if (this.selectedValue !== undefined) {
          this.handleClick();
        }
      }
    }
  }

  private async readText(event: any) {
    const file = event.target.files.item(0);
    const text = await this.toBase64(file);
    this.LOG.debug(['readText'], { file, text });
    this.selectedValue = await this.toBase64(file);
    if (!this.innerOptions.input?.showButton) {
      this.handleClick();
    }
    event.target.value = '';
  }

  private toBase64(file: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  private parseResult() {
    const data = this.innerResult.data !== undefined ? this.innerResult.data : '';
    this.LOG.debug(['parseResult', 'innerOptions'], this.innerOptions);
    const btnLabel = (this.innerOptions.button ?? { label: 'Ok' }).label;
    const dm = ((this.result as unknown as DataModel) ?? {
      globalParams: {
        button: { label: btnLabel },
      },
    }).globalParams ?? { button: { label: btnLabel } };

    this.label = (dm.button || { label: btnLabel }).label;
    switch (this.subType) {
      case 'text':
      case 'textarea':
      case 'secret':
        if (GTSLib.isArray(data) && !!data[0]) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        break;
      case 'number':
        if (GTSLib.isArray(data) && data[0] !== undefined) {
          this.value = parseFloat(data[0].toString());
        } else {
          this.value = parseFloat(data.toString());
        }
        this.selectedValue = this.value;
        break;
      case 'date':
        if (GTSLib.isArray(data) && !!data[0]) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        if (this.flatpickrInstance) {
          this.flatpickrInstance.set('plugins', []);
          if (this.innerOptions.input?.locale) {
            let locale = this.innerOptions.input?.locale ?? 'default';
            if (locale === 'AUTO') {
              locale = Utils.getNavigatorLanguage();
            }
            this.flatpickrInstance.set('locale', flatpickr.l10ns[locale]);
          }
          this.flatpickrInstance.setDate(this.formatDateTime(`${this.value}`), true);
        }
        break;
      case 'date-range':
        if (GTSLib.isArray(data) && data.length >= 2) {
          this.value = (data as any[]).sort();
        }
        this.selectedValue = this.value;
        if (this.flatpickrInstance) {
          if (this.innerOptions.input?.locale) {
            let locale = this.innerOptions.input?.locale ?? 'default';
            if (locale === 'AUTO') {
              locale = Utils.getNavigatorLanguage();
            }
            this.flatpickrInstance.set('locale', flatpickr.l10ns[locale]);
          }
          this.flatpickrInstance.setDate(
            [
              this.formatDateTime(`${this.value[0]}`),
              this.formatDateTime(`${this.value[1]}`),
            ], true,
          );
        }
        break;
      case 'slider':
        this.innerOptions.input = this.innerOptions.input ?? {};
        this.innerOptions.input.value = this.innerOptions.input.value ?? data;
        this.value = this.innerOptions?.input?.value === undefined ? 0 : this.innerOptions.input.value;
        this.selectedValue = this.value;
        this.innerOptions = Utils.clone(this.innerOptions);
        break;
      case 'list':
      case 'multi':
      case 'multi-cb':
      case 'autocomplete':
      case 'chips':
      case 'chips-autocomplete':
        if (this.checkBoxes) {
          Array.from(this.checkBoxes.querySelectorAll('input[type="checkbox"]'))
            .filter((o: HTMLInputElement) => o.checked)
            .forEach((o: HTMLInputElement) => o.checked = false);
        }
        this.values = [];
        if (GTSLib.isArray(data)) {
          this.values = [...data as any[]].filter(d => d !== '');
        } else {
          this.values = [data.toString() as string].filter(d => d !== '');
        }
        if (typeof this.values[0] === 'string' || typeof this.values[0] === 'number') {
          this.values = this.values.map(s => ({ k: s, v: s, h: false }));
        }
        let index = 0;
        if (!!(this.innerOptions.input ?? {}).value) {
          index = this.values.map(o => o.v).indexOf((this.innerOptions.input || {}).value);
        }
        if (!!this.inputField) {
          (this.inputField as HTMLSelectElement).selectedIndex = index;
        }
        setTimeout(() => {
          let value: string | number | number[] | string[] = this.innerOptions?.input?.value;
          if (this.subType === 'multi' || this.subType === 'multi-cb' || this.subType === 'chips' || this.subType === 'chips-autocomplete') {
            value = value ?? [];
            if (!GTSLib.isArray(value)) {
              value = [value] as number[] | string[];
            }
          }
          if (this.subType !== 'autocomplete' && this.subType !== 'list') {
            this.value = [...value as any[]];
          } else {
            this.value = this.innerOptions?.input?.value !== undefined ? this.innerOptions?.input?.value : '';
          }
          if (this.subType === 'multi-cb' && this.checkBoxes) {
            Array.from(this.checkBoxes.querySelectorAll('input[type="checkbox"]'))
              .forEach((o: HTMLInputElement) => o.checked = (this.value as any[]).includes(o.value));
          }
          if (this.selectedValue !== undefined && this.selectedValue !== this.oldValue) {
            this.handleSelect({ detail: this.selectedValue });
            this.oldValue = Utils.clone(this.selectedValue);
          }
          this.selectedValue = Utils.clone(this.value);
        });
        if (this.subType === 'autocomplete' && this.autoCompleteJS) {
          this.autoCompleteJS.data = {
            src: this.values,
            keys: 'v',
            filter: (list: any[]) => list.filter(item => {
              if ('value' in this.inputField) {
                const inputValue = this.innerOptions.input?.caseSensitive ? this.inputField.value : this.inputField.value.toLowerCase();
                const itemValue = this.innerOptions.input?.caseSensitive ? item.value.v : item.value.v.toLowerCase();
                if (itemValue.startsWith(inputValue)) {
                  return item.value;
                }
              }
            }),
          };
        }
        break;
      default:
        return '';
    }
  }

  private formatDateTime(timestamp: string): string {
    const divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    return GTSLib.toISOString(parseInt(timestamp, 10), divider, this.innerOptions.timeZone,
      undefined).replace('Z', '');
  }

  private selectAll(e: any) {
    if (this.type === 'input:multi-cb' && this.checkBoxes) {
      Array.from(this.checkBoxes.querySelectorAll('input[type="checkbox"]'))
        .filter((o: HTMLInputElement) => !o.checked)
        .forEach((o: HTMLInputElement) => o.checked = true);
      this.handleSelect(e);
    }
  }

  private selectNone(e: any) {
    if (this.type === 'input:multi-cb' && this.checkBoxes) {
      Array.from(this.checkBoxes.querySelectorAll('input[type="checkbox"]'))
        .filter((o: HTMLInputElement) => o.checked)
        .forEach((o: HTMLInputElement) => o.checked = false);
      this.handleSelect(e);
    }
  }

  private handleFilter(e: any) {
    e.stopPropagation();
    if (this.type === 'input:multi-cb' && this.checkBoxes) {
      this.values = this.values.map(v => ({
        ...v,
        h: !new RegExp(`.*${(e.target.value || e.detail || '')}.*`, 'gi').test(v.v),
      }));
    }
  }

  private handleAutoComplete(input: string) {
    if (this.subType === 'chips-autocomplete') {
      return this.values
        .filter(v => v.k.match(new RegExp(input, this.innerOptions.input?.caseSensitive ? 'g' : 'gi')))
        .map(v => v.k);
    } else {
      return [];
    }
  }

  private handleContains(input: string) {
    if (this.subType === 'chips-autocomplete') {
      return this.values
        .map(v => !!this.innerOptions.input?.caseSensitive ? v.k.toLowerCase() : v.k)
        .includes(!!this.innerOptions.input?.caseSensitive ? input.toLowerCase() : input);
    } else {
      return false;
    }
  }

  private getClass() {
    return `discovery-input${this.innerOptions?.input?.validation ? ' validation' : ''}`;
  }

  private getInput() {
    switch (this.subType) {
      case 'text':
        return <input type="text" class={this.getClass()}
                      value={this.value as string}
                      onInput={e => this.handleSelect(e)}
                      required={this.innerOptions?.input?.validation}
                      minlength={this.innerOptions?.input?.min}
                      maxlength={this.innerOptions?.input?.max}
                      disabled={this.innerOptions?.input?.disabled}
                      ref={el => this.inputField = el}
        />;
      case 'number':
        return [
          <input type="number" class={this.getClass()} value={this.value.toString()}
                 onInput={e => this.handleSelect(e)}
                 ref={el => this.inputField = el}
                 min={this.innerOptions?.input?.min}
                 max={this.innerOptions?.input?.max}
                 required={this.innerOptions?.input?.validation}
                 disabled={this.innerOptions?.input?.disabled}
                 step={this.innerOptions?.input?.step ?? 'any'}
          />, <span class="validity"></span>];
      case 'file':
        return <input type="file" class={this.getClass()}
                      accept={this.innerOptions?.input?.accept ?? '*/*'}
                      required={this.innerOptions?.input?.validation}
                      onChange={e => void this.readText(e)}
                      disabled={this.innerOptions?.input?.disabled}
                      ref={el => this.inputField = el}
        />;
      case 'textarea':
        return <textarea class={this.getClass()} value={this.value as string}
                         onInput={e => this.handleSelect(e)}
                         required={this.innerOptions?.input?.validation}
                         disabled={this.innerOptions?.input?.disabled}
                         ref={el => this.inputField = el}
        />;
      case 'secret':
        return <input type="password" class={this.getClass()} value={this.value as string}
                      onInput={e => this.handleSelect(e)}
                      required={this.innerOptions?.input?.validation}
                      disabled={this.innerOptions?.input?.disabled}
                      ref={el => this.inputField = el}
        />;
      case 'date':
        return <input type="text" class={this.getClass()}
                      required={this.innerOptions?.input?.validation}
                      disabled={this.innerOptions?.input?.disabled}
                      ref={el => this.inputField = el}
        />;
      case 'date-range':
        return <div class={{ 'range': true, 'disabled': this.innerOptions?.input?.disabled }}>
          <span>{this.innerOptions.input?.fromLabel ?? 'from'}</span>
          <input type="text" class={this.getClass()}
                 required={this.innerOptions?.input?.validation}
                 disabled={this.innerOptions?.input?.disabled}
                 ref={el => this.inputField = el} />
          <span>{this.innerOptions.input?.toLabel ?? 'to'}</span>
          <input type="text" class={this.getClass()}
                 required={this.innerOptions?.input?.validation}
                 disabled={this.innerOptions?.input?.disabled}
                 ref={el => this.inputField2 = el} />
        </div>;
      case 'autocomplete':
        return <input type="text" class={this.getClass()}
                      required={this.innerOptions?.input?.validation}
                      value={this.value as string}
                      disabled={this.innerOptions?.input?.disabled}
                      ref={el => this.inputField = el}
        />;
      case 'slider':
        return <div class="slider-wrapper" ref={el => this.pngWrapper = el}>
          <discovery-slider options={this.innerOptions}
                            onValueChanged={e => this.handleSelect(e)}
                            debug={this.debug}
                            disabled={this.innerOptions?.input?.disabled}
                            ref={el => this.inputField = el}
          />
        </div>;
      case 'list':
        return <select class={this.getClass()} onInput={e => this.handleSelect(e)}
                       required={this.innerOptions?.input?.validation}
                       disabled={this.innerOptions?.input?.disabled}
                       ref={el => this.inputField = el}>
          {this.values.map(v => (<option value={v.k} selected={this.value === v.k}>{v.v}</option>))}
        </select>;
      case 'multi':
        return <select class={this.getClass()} onInput={e => this.handleSelect(e)} multiple
                       required={this.innerOptions?.input?.validation}
                       disabled={this.innerOptions?.input?.disabled}
                       ref={el => this.inputField = el}>
          {this.values.map(v => (
            <option value={v.k} selected={(this.value as string[] || []).includes(v.k)}>{v.v}</option>))}
        </select>;
      case 'multi-cb':
        return <div class="multi-cb-wrapper" ref={el => this.pngWrapper = el}>
          <div class="multi-cb-layout">
            {this.innerOptions.input?.showFilter
              ? <input type="text" class={this.getClass()} onKeyUp={e => this.handleFilter(e)} />
              : ''
            }
            <div class="multi-cb-list-wrapper" ref={el => this.checkBoxes = el}>
              {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
              {this.values.map(v => (
                <div class={{ 'multi-cb-item-wrapper': true, hidden: v.h }}>
                  <input type="checkbox" value={v.k}
                         checked={(this.value as string[] || []).includes(v.k)}
                         onInput={e => this.handleSelect(e)}
                         disabled={this.innerOptions?.input?.disabled}
                         name={v.v} />
                  <label htmlFor={v.v}>{v.v}</label>
                </div>))}
            </div>
          </div>
          <div class="multi-cb-buttons-wrapper">
            <div>
              <button class="discovery-btn secondary" type="button"
                      disabled={this.innerOptions?.input?.disabled}
                      onClick={e => this.selectAll(e)}>{this.innerOptions?.input?.allLabel ?? 'All'}</button>
              <button class="discovery-btn secondary" type="button"
                      disabled={this.innerOptions?.input?.disabled}
                      onClick={e => this.selectNone(e)}>{this.innerOptions?.input?.noneLabel ?? 'None'}</button>
            </div>
            {this.innerOptions.input?.showButton ?
              <div class="discovery-input-btn-wrapper">
                <button class="discovery-btn"
                        disabled={this.innerOptions?.input?.disabled || this.disabled}
                        type="button"
                        onClick={() => this.handleClickRT()} innerHTML={this.label}></button>
              </div> : ''}
          </div>
        </div>;
      case 'chips':
      case 'chips-autocomplete':
        return <div class={{ 'chips-input-wrapper': true, 'disabled': this.innerOptions?.input?.disabled }}>
          <discovery-input-chips
            ref={el => this.inputField = el}
            chips={this.value as string[]}
            autocomplete={this.handleAutoComplete.bind(this)}
            containsFn={this.handleContains.bind(this)}
            disabled={this.innerOptions?.input?.disabled}
            onChipChange={e => this.handleSelect(e)}
            constrain_input={!!this.innerOptions.input?.onlyFromAutocomplete}
          ></discovery-input-chips>
        </div>;
      default:
        return '';
    }
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <div ref={el => this.root = el}>
        <div class={'discovery-input-wrapper type-' + this.subType}>
          {this.getInput()}
          {this.innerOptions.input?.showButton && this.type !== 'input:multi-cb' ?
            <div class={'discovery-input-btn-wrapper ' + this.subType}>
              <button
                class="discovery-btn"
                disabled={this.innerOptions?.input?.disabled || this.disabled}
                type="button"
                onClick={() => this.handleClickRT()}
              >{this.label}</button>
            </div> : ''}
        </div>
      </div>,
    ];
  }
}
