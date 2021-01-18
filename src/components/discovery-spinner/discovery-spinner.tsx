import {Component, Host, h, Prop} from '@stencil/core';

@Component({
  tag: 'discovery-spinner',
  styleUrl: 'discovery-spinner.scss',
  shadow: true,
})
export class DiscoverySpinner {
  @Prop() message = 'Loading...';

  render() {
    return (
      <Host>
        <p><div class="loader"></div> <slot></slot></p>
      </Host>
    );
  }
}

