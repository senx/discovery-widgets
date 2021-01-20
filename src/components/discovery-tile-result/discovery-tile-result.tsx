import {Component, Element, h, Host, Prop, State} from '@stencil/core';
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {DataModel} from "../../model/dataModel";
import {Utils} from "../../utils/utils";
import {GTSLib} from "../../utils/gts.lib";

@Component({
  tag: 'discovery-tile-result',
  styleUrl: 'discovery-tile-result.scss',
  shadow: true,
})
export class DiscoveryTileResultComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() start: number;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;

  @Element() el: HTMLElement;

  @State() execTime = 0;
  @State() bgColor: string;

  private LOG: Logger;

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileResultComponent, this.debug);
    console.log( typeof this.options, this.options)
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      result: this.result
    });
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      result: this.result
    });
  }

  componentDidLoad() {
    setTimeout(() => {
      let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
      bgColor =  ((this.options as Param) || {bgColor: bgColor}).bgColor || bgColor;
      const dm = ((this.result as unknown as DataModel) || {globalParams: {bgColor: bgColor}}).globalParams || {bgColor: bgColor};
      bgColor = dm.bgColor;
      this.bgColor = bgColor
    })
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
      case "spline-area":
      case "spline":
      case 'step':
      case 'step-after':
      case 'step-before':
        return <discovery-chart-line
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          options={this.options}
          height={this.height}
          width={this.width}
          debug={this.debug}
        />;
      case 'annotation':
        return <discovery-annotation
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          options={this.options}
          height={this.height}
          width={this.width}
          debug={this.debug}
        />;
      case 'bar':
        return <discovery-bar
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          options={this.options}
          height={this.height}
          width={this.width}
          debug={this.debug}
        />;
      default:
        return '';
    }
  }

  render() {
    return <div style={{backgroundColor: this.bgColor, padding: '5px'}}>{this.getView()}</div>;
  }
}
