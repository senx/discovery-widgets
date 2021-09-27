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

