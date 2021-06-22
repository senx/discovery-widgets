import {Component, Element, Event, EventEmitter, h, Listen, Prop, State, Watch} from "@stencil/core";
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {DiscoveryEvent} from "../../model/discoveryEvent";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import flatpickr from "flatpickr";
import autoComplete from "@tarekraafat/autocomplete.js/dist/autoComplete.js";

@Component({
  tag: 'discovery-input',
  styleUrl: 'discovery-input.scss',
  shadow: true,
})
export class DiscoveryInputComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
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

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() value: string | number | number[] = '';
  @State() subType: 'list' | 'text' | 'secret' | 'autocomplete' | 'slider' | 'date' | 'date-range' = 'text';
  @State() innerStyle: { [k: string]: string; };
  @State() innerResult: DataModel;
  @State() label: string = 'Ok';

  @State() selectedValue: string | string[] | any;
  private defOptions: Param = new Param();
  private LOG: Logger;
  private inputField: HTMLInputElement | HTMLSelectElement;
  private display: HTMLDivElement;
  private disabled: boolean = false;
  private min = 0;
  private max = 100;
  private values = [];
  private root: HTMLDivElement;
  private flatpickrInstance: any;
  private autoCompleteJS: any;

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler);
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
  }

  @Watch('result')
  updateRes() {
    this.innerResult = GTSLib.getData(this.result);
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, this.innerResult.globalParams) as Param;
    this.options = {...options};
    if (this.options.customStyles) {
      this.innerStyle = {...this.innerStyle, ...this.options.customStyles || {}};
    }
    this.parseResult();
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryInputComponent, this.debug);
    this.parsing = true;
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.innerResult = GTSLib.getData(this.result);
    const btnLabel = ((this.options as Param).button || {label: 'Ok'}).label;
    const dm = ((this.result as unknown as DataModel) || {
      globalParams: {
        button: {label: btnLabel}
      }
    }).globalParams || {button: {label: btnLabel}};

    this.label = dm.button.label;
    this.subType = this.type.split(':')[1] as 'list' | 'text' | 'secret' | 'autocomplete';
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, this.innerResult.globalParams) as Param;
    this.options = {...options};
    if (this.options.customStyles) {
      this.innerStyle = {...this.innerStyle, ...this.options.customStyles || {}};
    }
    this.parseResult();
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      innerResult: this.innerResult,
      result: this.result
    });

    this.draw.emit();
  }

  componentDidLoad() {
    switch (this.subType) {
      case "date":
      case "date-range":
        this.flatpickrInstance = flatpickr(this.inputField as HTMLInputElement, {
          enableTime: true,
          appendTo: this.root,
          positionElement: this.inputField,
          static: true,
          enableSeconds: true,
          dateFormat: 'Y/m/d H:i:S'
        });
        this.flatpickrInstance.config.onChange.push((d, s, i) => {
          const divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
          if (this.subType === 'date-range') {
            this.selectedValue = d
              .map(date => date.toISOString())
              .map(date => GTSLib.toTimestamp(date, divider, (this.options as Param).timeZone));
          } else {
            this.selectedValue = GTSLib.toTimestamp(s, divider, (this.options as Param).timeZone);
          }
        });
        break;
      case 'autocomplete':
        this.autoCompleteJS = new autoComplete({
          placeHolder: "Search...",
          selector: () => this.inputField,
          data: {src: this.values, keys: 'v'},
          resultItem: {highlight: {render: true}}
        });
        this.inputField.addEventListener("selection", (event: any) => {
          this.selectedValue = event.detail.selection.value.k;
          this.value = event.detail.selection.value.v;
        });
        break;
      default:
        break;
    }
  }

  private handleClick = () => {
    if (this.inputField && this.subType !== 'date' && this.subType !== 'date-range') {
      this.selectedValue = this.inputField.value;
    }
    (this.innerResult.events || []).forEach(e => {
      if (!!this.selectedValue && e.type === 'variable') {
        if (!e.value) {
          e.value = {};
        }
        e.value[e.selector] = this.selectedValue;
        this.LOG.debug(['handleClick', 'emit'], {discoveryEvent: e});
        this.discoveryEvent.emit(e);
      }
    });
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k => k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  private handleSelect(e) {
    this.selectedValue = e.target.value;
    if (!!this.display && this.subType === 'slider') {
      const newValue = Number((parseInt(this.selectedValue as string, 10) - this.min) * 100 / (this.max - this.min));
      const newPosition = 10 - (newValue * 0.2);
      this.display.style.left = `calc(${newValue}% + (${newPosition}px))`;
    }
  }

  private parseResult() {
    const data = this.innerResult.data || '';
    this.min = ((this.options as Param).input || {min: 0}).min || 0;
    this.max = ((this.options as Param).input || {max: 100}).max || 100;
    switch (this.subType) {
      case "text":
      case "secret":
        if (GTSLib.isArray(data) && !!data[0]) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        break;
      case "date":
        if (GTSLib.isArray(data) && !!data[0]) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        if (this.flatpickrInstance) {
          this.flatpickrInstance.setDate(this.formatDateTime('' + this.value));
        }
        break;
      case "date-range":
        if (GTSLib.isArray(data) && data.length >= 2) {
          this.value = (data as any[]).sort();
        }
        this.selectedValue = this.value;
        if (this.flatpickrInstance) {
          this.flatpickrInstance.config.mode = 'range';
          this.flatpickrInstance.setDate(
            [
              this.formatDateTime('' + this.value[0]),
              this.formatDateTime('' + this.value[1])
            ]
          )
        }
        break;
      case "slider":
        if (GTSLib.isArray(data) && data.length > 0) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        const newValue = Number((parseInt(this.value as string, 10) - this.min) * 100 / (this.max - this.min));
        const newPosition = 10 - (newValue * 0.2);
        this.display.style.left = `calc(${newValue}% + (${newPosition}px))`;
        break;
      case "list":
      case 'autocomplete':
        this.values = [];
        if (GTSLib.isArray(data) && data.length > 0) {
          this.values = data as any[];
        } else {
          this.values = [data.toString() as string];
        }
        if (typeof this.values[0] === 'string') {
          this.values = this.values.map(s => {
            return {k: s, v: s};
          });
        }
        this.value = ((this.options as Param).input || {value: ''}).value || '';
        this.selectedValue = this.value;
        if (this.subType === 'autocomplete' && this.autoCompleteJS) {
          this.autoCompleteJS.data = {src: this.values, keys: 'v'}
        }
        break;
      default:
        return '';
    }

  }

  private formatDateTime(timestamp: string): string {
    const divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    return (GTSLib.toISOString(parseInt(timestamp, 10), divider, (this.options as Param).timeZone) || '').replace('Z', '');
  }

  private getInput() {
    switch (this.subType) {
      case "text":
        return <input type="text" class="discovery-input" value={this.value as string}
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "secret":
        return <input type="password" class="discovery-input" value={this.value as string}
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "date":
        return <input type="text" class="discovery-input"
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "date-range":
        return <input type="text" class="discovery-input"
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "autocomplete":
        return <input type="text" class="discovery-input" value={this.value as string}
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "slider":
        return <div class="range-outside-wrapper">
          <div class="range-wrap">
            <div class="range-value" ref={el => this.display = el as HTMLDivElement}>
              <span>{this.selectedValue}</span>
            </div>
            <input type="range" class="discovery-input" value={this.value as string}
                   min={this.min} max={this.max} onInput={e => this.handleSelect(e)}
                   ref={el => this.inputField = el as HTMLInputElement}
            />
          </div>
        </div>
      case "list":
        return <select class="discovery-input" onInput={e => this.handleSelect(e)}>
          {this.values.map(v => (<option value={v.k} selected={this.value === v.k}>{v.v}</option>))}
        </select>
      default:
        return '';
    }
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <div ref={el => this.root = el}>
        <div class="discovery-input-wrapper">
          {this.getInput()}
          <div class="discovery-input-btn-wrapper">
            <button
              class="discovery-btn"
              disabled={this.disabled}
              type="button"
              onClick={this.handleClick}
            >{this.label}</button>
          </div>
        </div>
      </div>
    ];
  }
}
