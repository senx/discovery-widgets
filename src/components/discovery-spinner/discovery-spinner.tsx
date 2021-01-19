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
       <div class="loader"/> <slot/>
      </Host>
    );
  }
}

