/*
 *   Copyright 2022  SenX S.A.S.
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

import {Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {Utils} from "../../utils/utils";
import {ChartType} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {DiscoveryEvent} from "../../model/discoveryEvent";

@Component({
  tag: 'discovery-tile',
  styleUrl: 'discovery-tile.scss',
  shadow: true,
})
export class DiscoveryTileComponent {
  @Prop() url: string;
  @Prop() chartTitle: string;
  @Prop() type: ChartType;
  @Prop({mutable: true}) options: Param | string = new Param();
  @Prop() language: 'warpscript' | 'flows' = 'warpscript';
  @Prop() debug: boolean = false;
  @Prop() unit: string = '';
  @Prop({mutable: true}) autoRefresh: number = -1;
  @Prop() vars: string = '{}';

  @Event() statusHeaders: EventEmitter<string[]>;
  @Event() statusError: EventEmitter;
  @Event() execResult: EventEmitter<string>;

  @Element() el: HTMLElement;

  @State() loaded = false;
  @State() result = '[]';
  @State() width: number;
  @State() height: number;
  @State() headers: any;
  @State() start: number;

  private LOG: Logger;
  private ws: string;
  private timer: any;
  private innerVars = {}
  private tileResult: HTMLDiscoveryTileResultElement;
  private socket: WebSocket;

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    if (!!this.options && typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
      /*this.exec(true).then(() => {
        // empty
      });*/
    }
    if (this.LOG) {
      this.LOG.debug(['optionsUpdate'], {
        options: this.options,
        newValue, oldValue
      });
    }
  }

  @Watch('vars')
  varsUpdate(newValue: string, oldValue: string) {
    if (!!this.vars && typeof this.vars === 'string') {
      this.innerVars = JSON.parse(this.vars);
      this.exec(true).then(() => {
        // empty
      });
    }
    if (this.LOG) {
      this.LOG.debug(['varsUpdate'], {
        vars: this.vars,
        newValue, oldValue
      });
    }
  }

  @Listen('discoveryEvent', {target: 'window'})
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, (this.options as Param).eventHandler);
    if (res.vars) {
      this.innerVars = {...JSON.parse(this.vars), ...res.vars};
      this.exec().then(() => {
        // empty
      });
    }
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
    this.LOG.debug(['componentDidLoad'], 'Tile - resize', this.tileResult);
    if (this.tileResult) {
      return this.tileResult.resize();
    }
  }

  @Method()
  async show(regexp: string) {
    if (this.tileResult) {
      await this.tileResult.show(regexp);
    }
  }

  @Method()
  async hide(regexp: string) {
    if (this.tileResult) {
      await this.tileResult.hide(regexp);
    }
  }

  @Method()
  async setFocus(regexp: string, ts: number, value?: number) {
    if (this.tileResult) {
      await this.tileResult.setFocus(regexp, ts, value);
    }
  }

  @Method()
  async unFocus() {
    if (this.tileResult) {
      await this.tileResult.unFocus();
    }
  }

  componentWillLoad() {
    this.LOG = new Logger(DiscoveryTileComponent, this.debug);
    this.LOG.debug(['componentWillLoad'], {
      url: this.url,
      type: this.type,
      options: this.options,
      language: this.language,
      innerVars: this.innerVars,
    });
    if (!!this.options && typeof this.options === 'string' && this.options !== 'undefined') {
      this.options = JSON.parse(this.options);
    }
    this.innerVars = JSON.parse(this.vars || '{}');
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w - 15;
    this.height = dims.h;
  }

  componentDidLoad() {
    this.exec().then(() => {
      // empty;
    });
  }

  // noinspection JSUnusedGlobalSymbols
  disconnectedCallback() {
    this.LOG.debug(['disconnectedCallback'], 'disconnected');
    if (this.timer) {
      window.clearInterval(this.timer);
    }
    if (!!this.socket) {
      this.socket.close();
    }
  }

  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return this.tileResult.export(type);
  }

  @Method()
  async exec(refresh = false) {
    if (!refresh) {
      setTimeout(() => this.loaded = true);
    }
    this.ws = this.el.innerText;
    if (this.ws && this.ws !== '') {
      this.LOG.debug(['exec'], this.ws, this.type);
      if (this.language === 'flows') {
        this.ws = Object.keys(this.innerVars || {})
          .map(k => Utils.generateVars(k, this.innerVars[k])).join("\n") + "\n" + this.ws;
        this.ws = `<'
${this.ws}
'>
FLOWS`;
      } else {
        this.ws = Object.keys(this.innerVars || {})
          .map(k => Utils.generateVars(k, this.innerVars[k])).join("\n") + "\n" + this.ws;
      }
      if (this.url.toLowerCase().startsWith('http')) {

        if (this.type === 'marauder') {
          this.ws = this.ws + `
'dataStruct' STORE
$dataStruct 'data' GET 'data' STORE
$dataStruct 'globalParams' GET 'globalParams' STORE
<% $globalParams ISNULL %> <% { } 'globalParams' STORE %> IFT
$globalParams 'map' GET 'map' STORE
<% $map ISNULL %> <% { 'step' 10 m } 'map' STORE %> IFT
$map 'step' GET 'b' STORE
$data LASTTICK 'last' STORE

[ $data bucketizer.mean $last 0 1 ] BUCKETIZE
[ SWAP [] reducer.mean ] REDUCE 0 GET LOCATIONS 2 ->LIST FLATTEN LIST-> DROP [ 'lat' 'long' ] STORE

[ $data bucketizer.last $last $b 0 ] BUCKETIZE 'gts' STORE
$b 5 * 5 [ 'quietperiod' 'minvalues' ]  STORE
// Force minvalues to be at leas 2
2 $minvalues MAX 'minvalues' STORE
// Now compute the overall bounding box
$data BBOX
// Zip extrema together
ZIP
// Compute global extrema
LIST-> DROP MAX 4 ROLL MIN 4 ROLL MIN 4 ROLL MAX 4 ROLL
// store lower left / upper right coordinates
[ 'lllat' 'lllon' 'urlat' 'urlon' ] STORE
// Compute per unit offset in both lat and lon so we get the finest
// resolution when storing lat/lon offset from ll corner on 32 bits
$urlat $lllat - 65535.0 / 'latstep' STORE
$urlon $lllon - 65535.0 / 'lonstep' STORE
// Check that all GTS are bucketized with the same parameters
$gts 0 GET BUCKETSPAN 'bucketspan' STORE
$gts 0 GET LASTBUCKET 'lastbucket' STORE
$gts 0 GET BUCKETCOUNT 'bucketcount' STORE
$bucketspan 0 != $lastbucket 0 != && 'GTS MUST be bucketized' ASSERTMSG
// Replace values with 0
[ $gts 0.0 mapper.replace 0 0 0 ] MAP 'gts' STORE
$gts <%
  'g' STORE
  $g BUCKETSPAN $bucketspan  ==
  $g LASTBUCKET $lastbucket ==
  && 'GTS MUST all have the same bucketization parameters' ASSERTMSG
  // update bucketcount
  $bucketcount $g BUCKETCOUNT MAX 'bucketcount' STORE
  // Split 'gts' according to 'quietperiod'
  $g $quietperiod $minvalues '.split' TIMESPLIT
  // Now iterate over the splits, bucketizing them with the same parameters
  // as the GTS they come from and interpolating missing values
  <%
    [ SWAP NULL $lastbucket $bucketspan 0 ] BUCKETIZE
    INTERPOLATE
  %> F LMAP
  // Merge the splits back
  MERGE
  // Rebucketize
  [ SWAP NULL $lastbucket $bucketspan 0 ] BUCKETIZE
%> F LMAP
FLATTEN 'gts' STORE
// Now set the value of each data point to 32 bits representing offset
// of the position from the ll corner
[ $gts UNBUCKETIZE
  <%
    [ 4 5 ] SUBLIST FLATTEN
    DUP SIZE 2 ==
    <%
      LIST-> DROP
      $lllon - TODOUBLE $lonstep / ROUND TOLONG 0xFFFF & SWAP
      $lllat - TODOUBLE $latstep / ROUND TOLONG 0xFFFF & 16 << SWAP |
      0 NaN NaN NaN 5 ROLL
    %> <% DROP 0 NaN NaN NaN NULL %> IFTE
  %> MACROMAPPER 0 0 0 ] MAP
NONEMPTY 'data' STORE
$data <% LABELS %> F LMAP 'infos' STORE
//
// Now shift and scale the ticks so we end up with indices
//
$data $lastbucket $bucketcount 1 - $bucketspan * - -1 * TIMESHIFT
1.0 $bucketspan / TIMESCALE 'gts' STORE
//
// Create image
//
$bucketcount $gts SIZE '2D' PGraphics
Ppixels

// Update the pixels with the GTS values
$gts
<%
  'y' STORE
  <%
    LIST-> [ 'x' NULL NULL NULL 'v' NULL ] STORE
    $v $y $bucketcount * $x + SET
  %> FOREACH
%> T FOREACH
// Count null elements
0 POPR0
DUP <% 0 == <% PUSHR0 1 + POPR0 %> IFT %> FOREACH
PupdatePixels
{
  'iTXt' [
    {
      'keyword' 'Discovery'
      'text' {
        'type' 'MM'
        'v' 0
        'lllat' $lllat
        'lllon' $lllon
        'urlat' $urlat
        'urlon' $urlon
        'latstep' $latstep
        'lonstep' $lonstep
        'lastbucket' $lastbucket
        'bucketspan' $bucketspan MSTU TODOUBLE /
        'bucketcount' $bucketcount
        'gts' $gts SIZE
        'positions' $gts SIZE $bucketcount * PUSHR0 -
        'infos' $infos
      } ->JSON
      'compressionFlag' true
    }
  ]
}
Pencode 'img' STORE
$long $lat $img`
        }

        Utils.httpPost(this.url, this.ws, (this.options as Param).httpHeaders)
          .then((res: any) => {
            this.result = res.data as string;
            this.headers = {};
            res.headers.split('\n')
              .filter(header => header !== '' && header.toLowerCase().startsWith('x-warp10'))
              .forEach(header => {
                const headerName = header.split(':');
                this.headers[headerName[0].trim()] = headerName[1].trim();
              });
            this.headers.statusText = `Your script execution took ${GTSLib.formatElapsedTime(parseInt(this.headers['x-warp10-elapsed'], 10))} serverside,
fetched ${this.headers['x-warp10-fetched']} datapoints
and performed ${this.headers['x-warp10-ops']}  WarpLib operations.`;
            this.LOG.debug(['exec', 'headers'], this.headers);
            this.statusHeaders.emit(this.headers);
            this.start = new Date().getTime();
            if (this.autoRefresh !== (this.options as Param).autoRefresh) {
              this.autoRefresh = (this.options as Param).autoRefresh;
              if (this.timer) {
                window.clearInterval(this.timer);
              }
              if (this.autoRefresh && this.autoRefresh > 0) {
                this.timer = window.setInterval(() => this.exec(true), this.autoRefresh * 1000);
              }
            }
            this.LOG.debug(['exec', 'result'], this.result);
            this.execResult.emit(this.result);
            setTimeout(() => this.loaded = true);
          }).catch(e => {
          this.statusError.emit(e);
          setTimeout(() => this.loaded = true);
          this.LOG.error(['exec'], e);
        });
      } else if (this.url.toLowerCase().startsWith('ws')) {
        // Web Socket
        if (!!this.socket) {
          this.socket.close();
        }
        this.socket = new WebSocket(this.url);
        this.socket.onopen = () => {
          this.socket.onmessage = event => {
            this.result = event.data as string;
            this.LOG.debug(['exec', 'result'], this.result);
            this.execResult.emit(this.result);
          }
          this.socket.send('<% ' + this.ws + ' %> ' + ((this.options as Param).autoRefresh || 1000) + ' EVERY');
        };
      }
    }
  }

  @Method()
  async setZoom(dataZoom: { start: number, end: number }) {
    this.tileResult.setZoom(dataZoom);
  }

  render() {
    return <Host>
      {this.loaded ?
        <div style={{width: '100%', height: '100%'}}>
          <discovery-tile-result
            url={this.url}
            start={this.start}
            result={this.result}
            type={this.type}
            options={this.options}
            unit={this.unit}
            debug={this.debug}
            height={this.height}
            width={this.width}
            chart-title={this.chartTitle}
            ref={(el) => this.tileResult = el as HTMLDiscoveryTileResultElement}
          />
        </div>
        : <div class="discovery-tile-spinner">
          <discovery-spinner>Requesting data...</discovery-spinner>
        </div>
      }
      <pre id="ws"><slot/></pre>
    </Host>;
  }
}
