/*
 *   Copyright 2021  SenX S.A.S.
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

import {Component, Element, h, Host, Prop} from '@stencil/core';

@Component({
  tag: 'discovery-spinner',
  styleUrl: 'discovery-spinner.scss',
  shadow: true,
})
export class DiscoverySpinner {
  @Prop({mutable: true}) message = 'Loading...';

  @Element() el: HTMLElement;

  componentDidLoad() {
    this.message = this.el.innerText || this.message;
  }

  render() {
    return (
      <Host>
        <div class="loader"/>
        <span class="message">{this.message}</span>
        <span class="hidden"><slot/></span>
      </Host>
    );
  }
}

