import {Component, Element, h, Prop, State} from '@stencil/core';

@Component({
  tag: 'discovery-tile-result',
  styleUrl: 'discovery-tile-result.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() result: string;
  @Prop() type: 'line';
  @Prop() start: number;
  @Element() el: HTMLElement;

  @State() execTime = 0;
  @Prop() width: number;
  @Prop() height: number;


  componentDidLoad() {
  }

  drawn() {
    if (this.execTime === 0) {
      this.execTime = new Date().getTime() - this.start;
    }
  }

  getView() {
    switch (this.type) {
      case "line":
        return <discovery-chart-line result={this.result} onDraw={ev => this.drawn()} width={this.width}
                                          height={this.height}
        ></discovery-chart-line>;
      default:
        return '';
    }
  }

  render() {
    return <div>
      {this.getView()}
    </div>;
  }
}
