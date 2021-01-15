import {Component, Element, h, Prop, State} from '@stencil/core';
import {ChartType} from "../../model/dataModel";

@Component({
  tag: 'discovery-tile-result',
  styleUrl: 'discovery-tile-result.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() result: string;
  @Prop() type: ChartType;
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
      case "area":
        return <discovery-chart-line result={this.result} onDraw={ev => this.drawn()} width={this.width}
                                     type={this.type}
                                          height={this.height}
        ></discovery-chart-line>;
      default:
        return '';
    }
  }

  render() {
    return <div>{this.getView()}</div>;
  }
}
