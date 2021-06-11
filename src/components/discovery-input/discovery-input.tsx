import {Component, Element, Event, EventEmitter, h, Listen, Prop, State, Watch} from "@stencil/core";
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {DiscoveryEvent} from "../../model/discoveryEvent";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";

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
  @State() value: string = '';
  @State() subType: 'list' | 'text' | 'secret' | 'autocomplete' = 'text';
  @State() innerStyle: { [k: string]: string; };
  @State() innerResult: DataModel;
  @State() label: string = 'Ok';

  private selectedValue: string | string[];
  private defOptions: Param = new Param();
  private LOG: Logger;
  private inputField: HTMLInputElement | HTMLSelectElement;
  private disabled: boolean = false;

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
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryInputComponent, this.debug);
    this.parsing = true;
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.innerResult = GTSLib.getData(this.result);
    let btnLabel = ((this.options as Param).button || {label: 'Ok'}).label;
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
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      innerResult: this.innerResult,
      result: this.result
    });

    this.draw.emit();
  }

  private handleClick = () => {
    if (this.inputField) {
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

  private handleSecondSelect(e) {
    this.selectedValue = e.target.value;
  }

  private getInput() {
    const data = this.innerResult.data || '';
    switch (this.subType) {
      case "text":
        if (GTSLib.isArray(data) && !!data[0]) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        return <input type="text" class="discovery-input" value={this.value}
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "secret":
        if (GTSLib.isArray(data) && data.length > 0) {
          this.value = data[0].toString();
        } else {
          this.value = (data.toString() as string);
        }
        this.selectedValue = this.value;
        return <input type="password" class="discovery-input" value={this.value}
                      ref={el => this.inputField = el as HTMLInputElement}
        />
      case "list":
        let values = [];
        if (GTSLib.isArray(data) && data.length > 0) {
          values = data as any[];
        } else {
          values = [data.toString() as string];
        }
        if (typeof values[0] === 'string') {
          values = values.map(s => {
            return {k: s, v: s};
          });
        }
        this.value = ((this.options as Param).input || {value: ''}).value || '';
        this.selectedValue = this.value;
        return <select class="discovery-input" onInput={e => this.handleSecondSelect(e)}>
          {values.map(v => (<option value={v.k} selected={this.value === v.k}>{v.v}</option>))}
        </select>
      default:
        return '';
    }
  }

  render() {
    return [<style>{this.generateStyle(this.innerStyle)}</style>,
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
      </div>];
  }
}
