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

import {Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";

@Component({
  tag: 'discovery-image',
  styleUrl: 'discovery-image.scss',
  shadow: true,
})
export class DiscoveryImageComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';

  @Element() el: HTMLElement;
  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() toDisplay: string[] = [];

  private defOptions: Param = new Param();
  private LOG: Logger;
  private initial = false;

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.result = GTSLib.getData(this.result);
      this.toDisplay = this.convert(this.result as DataModel || new DataModel())
      this.draw.emit();
    }
  }

  componentWillLoad() {
    setTimeout(() => {
      this.parsing = true;
      this.initial = true;
      this.LOG = new Logger(DiscoveryImageComponent, this.debug);
      if (typeof this.options === 'string') {
        this.options = JSON.parse(this.options);
      }
      this.result = GTSLib.getData(this.result);
      this.toDisplay = this.convert(this.result as DataModel || new DataModel())
      this.LOG.debug(['componentWillLoad'], {
        type: this.type,
        options: this.options,
        toDisplay: this.toDisplay,
        result: this.result
      });
      this.parsing = false;
      if (this.initial) {
        this.draw.emit();
        this.initial = false;
      }
    });
  }

  convert(data: DataModel) {
    const toDisplay = [];
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    if (GTSLib.isArray(data.data)) {
      (data.data as any[] || []).forEach(img => {
        if (GTSLib.isEmbeddedImage(img)) {
          toDisplay.push(img);
        }
      })
    } else if (data.data && GTSLib.isEmbeddedImage(data.data)) {
      toDisplay.push(data.data as string);
    }
    return toDisplay;
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return this.toDisplay;
  }

  render() {
    return (
      <Host>
        <div class="images-wrapper" style={{width: '100%', height: '100%'}}>
          {this.parsing
            ? <discovery-spinner>Parsing data...</discovery-spinner>
            : this.toDisplay.length > 0
              ? this.toDisplay.map((img) => <img src={img} class="responsive" alt="Result"/>)
              : ''
          }</div>
      </Host>
    );
  }
}
