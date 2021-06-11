import {Component, Element, Event, EventEmitter, h, Listen, Prop, State} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import {DiscoveryEvent} from "../../model/discoveryEvent";

@Component({
  tag: 'discovery-button',
  styleUrl: 'discovery-button.scss',
  shadow: true,
})
export class DiscoveryButtonComponent {
  @Prop({mutable: true}) result: DataModel | string;
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
  @State() label: string = 'Ok';
  @State() innerStyle: { [k: string]: string; };

  private defOptions: Param = new Param();
  private LOG: Logger;

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler);
    if(res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryButtonComponent, this.debug);
    this.parsing = true;
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
    });

    let btnLabel = ((this.options as Param).button || {label: 'Ok'}).label;

    const dm = ((this.result as unknown as DataModel) || {
      globalParams: {
        button: {label: btnLabel}
      }
    }).globalParams || {button: {label: btnLabel}};

    this.label = dm.button.label;
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, this.result.globalParams) as Param;
    this.options = {...options};
    if (this.options.customStyles) {
      this.innerStyle = {...this.innerStyle, ...this.options.customStyles || {}};
    }
    this.draw.emit();
  }

  private handleClick = () => {
    Utils.httpPost(this.url, (this.result as DataModel).data + ' EVAL')
      .then((res: any) => {
        this.LOG.debug(['handleClick', 'res.data'], res.data);
        const result = GTSLib.getData(res.data);
        this.LOG.debug(['handleClick', 'getData'], result);
        if (result && result.data && GTSLib.isArray(result.data) && result.data.length > 0) {
          (result.data[0].events || []).forEach(e => {
            this.LOG.debug(['handleClick', 'emit'], {discoveryEvent: e});
            this.discoveryEvent.emit(e);
          });
        }
        this.execResult.emit(res.data);
      })
      .catch(e => {
        this.statusError.emit(e);
        console.error(e)
      });
  }

  private generateStyle(innerStyle: { [k: string]: string }): string {
    return Object.keys(innerStyle || {}).map(k=> k + ' { ' + innerStyle[k] + ' }').join('\n');
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <button type="button" class="discovery-btn" innerHTML={this.label} onClick={this.handleClick}/>
    ];
  }

}
