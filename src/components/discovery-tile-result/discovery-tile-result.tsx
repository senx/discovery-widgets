import {Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {DataModel} from "../../model/dataModel";
import {Utils} from "../../utils/utils";
import {GTSLib} from "../../utils/gts.lib";
import {DiscoveryEvent} from "../../model/discoveryEvent";

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
  @Prop({mutable: true}) width: number;
  @Prop({mutable: true}) height: number;
  @Prop() debug: boolean = false;
  @Prop({mutable: true}) unit: string = '';
  @Prop() url: string;
  @Prop() chartTitle: string;

  @Element() el: HTMLElement;

  @State() execTime = 0;
  @State() bgColor: string;
  @State() fontColor: string;
  @State() innerResult: DataModel | string;
  @State()  innerOptions: Param;
  @State() innerStyle: { [k: string]: string; };

  @Event({
    eventName: 'discoveryEvent',
    composed: true,
    cancelable: true,
    bubbles: true,
  }) discoveryEvent: EventEmitter<DiscoveryEvent>;

  private LOG: Logger;
  private wrapper: HTMLDivElement;
  private title: HTMLDivElement;
  private innerStyles: any;
  private tile: any;

  @Watch('result')
  updateRes() {
    this.innerResult = GTSLib.getData(this.result);
    this.parseResult();
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG.debug(['optionsUpdate'],newValue, oldValue);
    if(JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      if (this.LOG) {
        this.LOG.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, this.innerOptions.eventHandler);
    if (res.data) {
      this.innerResult = res.data;
      this.parseResult();
    }
    if (res.style) {
      this.innerStyle = {...this.innerStyle, ...res.style as { [k: string]: string }};
    }
    if (res.zoom) {
      this.setZoom(res.zoom).then(() => {
        // empty
      });
    }

  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileResultComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      result: this.result
    });
    if (!!this.options && typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options as Param;
    }
    this.innerResult = GTSLib.getData(this.result);
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      result: this.innerResult
    });
  }

  componentDidLoad() {
    this.parseResult();
  }

  handleZoom(event: CustomEvent<{ start: number, end: number }>) {
    ((this.innerResult as unknown as DataModel).events || [])
      .filter(e => e.type === 'zoom')
      .forEach(e => {
        e.value = event.detail;
        this.discoveryEvent.emit(e);
      });
  }

  getView() {
    switch (this.type) {
      case "line":
      case "area":
      case "scatter":
      case "spline-area":
      case "step-area":
      case "spline":
      case 'step':
      case 'step-after':
      case 'step-before':
        return <discovery-line
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          debug={this.debug}
          onDataZoom={event => this.handleZoom(event)}
          ref={(el) => this.tile = el}
        />;
      case 'annotation':
        return <discovery-annotation
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          onDataZoom={event => this.handleZoom(event)}
          debug={this.debug}
        />;
      case 'bar':
        return <discovery-bar
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          onDataZoom={event => this.handleZoom(event)}
          debug={this.debug}
        />;
      case 'display':
        return <discovery-display
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'map':
        return <discovery-map
          result={this.innerResult}
          type={this.type}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'image':
        return <discovery-image
          result={this.innerResult}
          type={this.type}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'button':
        return <discovery-button
          result={this.innerResult}
          url={this.url}
          type={this.type}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'gauge':
      case 'circle':
        return <discovery-gauge
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'linear-gauge':
        return <discovery-linear-gauge
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'pie':
      case 'doughnut':
      case 'rose':
        return <discovery-pie
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'tabular':
        return <discovery-tabular
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'svg':
        return <discovery-svg
          result={this.innerResult}
          type={this.type}
          unit={this.unit}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      case 'input:text':
      case 'input:autocomplete':
      case 'input:list':
      case 'input:secret':
      case 'input:slider':
      case 'input:date':
      case 'input:date-range':
        return <discovery-input
          result={this.innerResult}
          type={this.type}
          options={this.innerOptions}
          ref={(el) => this.tile = el}
          debug={this.debug}
        />;
      default:
        return '';
    }
  }

  @Method()
  async resize() {
    if (this.tile) {
      (this.tile as any).resize();
    }
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    if (this.tile) {
      (this.tile as any).setZoom(dataZoom);
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    if (this.tile && this.tile['export']) {
      return (this.tile as any).export(type);
    } else {
      return undefined;
    }
  }

  render() {
    return [
      <style>{this.generateStyle(this.innerStyle)}</style>,
      <div class="discovery-tile"
           style={{
             backgroundColor: this.bgColor,
             color: this.fontColor,
             height: '100%', width: '100%'
           }}>
        {this.chartTitle ? <h2 ref={(el) => this.title = el as HTMLDivElement}>{this.chartTitle}</h2> : ''}
        <div class="discovery-chart-wrapper" ref={(el) => this.wrapper = el as HTMLDivElement}>
          {this.getView()}
        </div>
      </div>
    ];
  }

  private parseResult() {
    setTimeout(() => {
      this.unit = (this.options as Param).unit || this.unit
      this.handleCSSColors();
      ((this.innerResult as unknown as DataModel).events || [])
        .filter(e => !!e.value).filter(e => e.type !== 'zoom')
        .forEach(e => {
          if (this.LOG) {
            this.LOG.debug(['parseResult', 'emit'], {discoveryEvent: e});
          }
          this.discoveryEvent.emit(e)
        });
    });
    if (this.LOG) {
      this.LOG.debug(['parseResult'], {
        type: this.type,
        options: this.options,
        result: this.innerResult
      });
    }
  }

  private generateStyle(styles: { [k: string]: string }): string {
    this.innerStyles = {...this.innerStyles, ...styles, ...(this.options as Param).customStyles || {}};
    return Object.keys(this.innerStyles || {}).map(k => k + ' { ' + this.innerStyles[k] + ' }').join('\n');
  }

  private handleCSSColors() {
    let fontColor = Utils.getCSSColor(this.el, '--warp-view-font-color', '#000000');
    fontColor = ((this.options as Param) || {fontColor}).fontColor || fontColor;
    let bgColor = Utils.getCSSColor(this.el, '--warp-view-bg-color', 'transparent');
    bgColor = ((this.options as Param) || {bgColor}).bgColor || bgColor;
    const dm: Param = (((this.innerResult as unknown as DataModel) || {
      globalParams: {bgColor, fontColor}
    }).globalParams || {bgColor, fontColor}) as Param;
    this.bgColor = dm.bgColor;
    this.fontColor = dm.fontColor;
  }
}
