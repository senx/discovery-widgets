import {Component, Element, Event, EventEmitter, h, Host, Prop, State} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";

@Component({
  tag: 'discovery-button',
  styleUrl: 'discovery-button.scss',
  shadow: true,
})
export class DiscoveryButtonComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() url: string;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() execResult: EventEmitter<any[]>;
  @Event() statusError: EventEmitter<any>;

  @State() parsing: boolean = false;
  @State() rendering: boolean = false;
  @State() label: string = 'Ok';

  private defOptions: Param = new Param();
  private LOG: Logger;

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryButtonComponent, this.debug);
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
    this.draw.emit();
  }

  private handleClick = () => {
    Utils.httpPost(this.url, (this.result as DataModel).data + ' EVAL')
      .then((res: any) => {
        this.execResult.emit(res.data)
      })
      .catch(e => {
        this.statusError.emit(e);
        console.error(e)
      });
  }

  render() {
    return <button type="button" class="discovery-btn" innerHTML={this.label} onClick={this.handleClick}/>;
  }

}
