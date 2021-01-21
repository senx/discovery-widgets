import {Component, Host, h, Prop, Element, Event, EventEmitter} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";

@Component({
  tag: 'discovery-image',
  styleUrl: 'discovery-image.css',
  shadow: true,
})
export class DiscoveryImage {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';

  @Element() el: HTMLElement;
  @Event() draw: EventEmitter<void>;

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
