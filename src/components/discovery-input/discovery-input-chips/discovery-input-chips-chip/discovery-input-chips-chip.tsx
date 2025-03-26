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

import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'discovery-input-chips-chip',
  styleUrl: 'discovery-input-chips-chip.scss',
  shadow: true,
})
export class DiscoveryInputChipsChip {
  @Prop() label: string;
  @Prop() disabled: boolean = false;

  @Event({
    composed: true,
    bubbles: true,
    cancelable: false,
  }) removeChip: EventEmitter<string>;

  render() {
    return <Host>
      <span id="label" innerHTML={this.label}></span>
      {this.disabled ? '' : <div id="close_icon" onClick={() => this.handleClose()}>
        <svg fill="#000000" xmlns="http://www.w3.org/2000/svg"
          // @ts-ignore
             xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
             x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
      <path id="close_icon_stroke"
            d="M50.433,0.892c-27.119,0-49.102,21.983-49.102,49.102s21.983,49.103,49.102,49.103s49.101-21.984,49.101-49.103  S77.552,0.892,50.433,0.892z M69.879,70.439l-0.05,0.053c-2.644,2.792-7.052,2.913-9.845,0.269l-10.192-9.649l-9.647,10.19  c-2.645,2.793-6.998,2.853-9.845,0.268l-0.053-0.048c-2.847-2.586-2.915-7.052-0.27-9.845l9.648-10.19L28.707,41.149  c-2.793-2.645-2.913-7.052-0.269-9.845l0.05-0.053c2.645-2.793,7.052-2.914,9.845-0.27l10.919,10.337l10.337-10.918  c2.645-2.793,7.053-2.913,9.846-0.27l0.052,0.049c2.793,2.644,2.913,7.053,0.27,9.845L59.418,50.945l10.192,9.65  C72.402,63.239,72.523,67.647,69.879,70.439z"></path>
  </svg>
      </div>}
    </Host>;
  }

  private handleClose() {
    if (!this.disabled) {
      this.removeChip.emit(this.label);
    }
  }
}
