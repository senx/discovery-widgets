import {Component, Element, h, Prop, State} from '@stencil/core';
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
  @Prop() unit: string = '';
  @Prop() url: string;
  @Prop() chartTitle: string;

  @Element() el: HTMLElement;

  @State() execTime = 0;
  @State() bgColor: string;
  @State() fontColor: string;

  private LOG: Logger;
  private wrapper: HTMLDivElement;
  private innerHeight: number;

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileResultComponent, this.debug);
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
      let fontColor = Utils.getCSSColor(this.el, '--warp-view-font-color', '#000000');
      fontColor = ((this.options as Param) || {fontColor}).fontColor || fontColor;

      let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
      bgColor = ((this.options as Param) || {bgColor: bgColor}).bgColor || bgColor;

      const dm = ((this.result as unknown as DataModel) || {
        globalParams: {
          bgColor, fontColor
        }
      }).globalParams || {bgColor, fontColor};

      this.bgColor = dm.bgColor
      this.fontColor = dm.fontColor
      this.innerHeight =  Utils.getContentBounds(this.wrapper.parentElement).h - 10;
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
      case "scatter":
      case "spline-area":
      case "spline":
      case 'step':
      case 'step-after':
      case 'step-before':
        return <discovery-line
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          unit={this.unit}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'annotation':
        return <discovery-annotation
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          unit={this.unit}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'bar':
        return <discovery-bar
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          unit={this.unit}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'display':
        return <discovery-display
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          unit={this.unit}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'map':
        return <discovery-map
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'image':
        return <discovery-image
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'button':
        return <discovery-button
          result={this.result}
          onDraw={ev => this.drawn()}
          url={this.url}
          type={this.type}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      case 'gauge':
        return <discovery-gauge
          result={this.result}
          onDraw={ev => this.drawn()}
          type={this.type}
          unit={this.unit}
          options={this.options}
          height={this.innerHeight}
          width={this.width}
          debug={this.debug}
        />;
      default:
        return '';
    }
  }

  render() {
    return <div class="discovery-tile" style={{backgroundColor: this.bgColor, color: this.fontColor, height: this.height + 'px'}}>
      {this.chartTitle ? <h2>{this.chartTitle}</h2> : ''}
      <div class="discovery-chart-wrapper" ref={(el) => this.wrapper = el as HTMLDivElement}>
        {this.getView()}
      </div>
    </div>;
  }
}
