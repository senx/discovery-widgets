import {Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType, MapParams} from "../../model/types";
import {Param} from "../../model/param";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import {Logger} from "../../utils/logger";
import domtoimage from 'dom-to-image';
import Leaflet, {TileLayerOptions} from 'leaflet';
import UPNG from '../../utils/UPNG';
import {CanvasLayer} from "leaflet-canvas-layer";
import {MapLib} from "../../utils/map-lib";
import {ColorLib} from "../../utils/color-lib";

@Component({
  tag: 'discovery-marauder',
  styleUrl: 'discovery-marauder.scss',
  shadow: true,
})
export class DiscoveryMarauder {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @State() @Prop() width: number;
  @State() @Prop({mutable: true}) height: number;
  @Prop() debug: boolean = false;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter<any>;
  @Event() pausedEvent: EventEmitter<boolean>;

  @State() parsing: boolean = false;
  @State() toDisplay: string[] = [];
  @State() innerOptions: Param;
  @State() loading: boolean = true;
  @State() currentTick: number;
  @State() paused: boolean = true;

  private modal: HTMLDivElement;
  private defOptions: Param = {
    ...new Param(),
    timeMode: 'date',
    map: {
      tiles: [],
      animate: false
    }
  }
  private divider: number = 1000;
  private LOG: Logger;
  private mapElement: HTMLDivElement;
  private map: Leaflet.Map;
  private mapOpts: MapParams;
  private initial = false;
  private lat: number;
  private long: number;
  private infos: any;
  private ticks: number = 0;
  private bucketcount: number;
  private lastbucket: number;
  private bucketspan = 0.0;
  private gts = 0;
  private lllat = 0.0;
  private lllon = 0.0;
  private urlat = 0.0;
  private urlon = 0.0;
  private latstep = 0.0;
  private lonstep = 0.0;
  private data: any;
  private markers: any[];
  private tick: number;
  private done = true;
  private inMove: boolean;
  private inZoom: Boolean;
  private previousPause: any;
  private selectedSquare: any;
  private needRedraw: boolean;
  private selectedCenterLatLng: any;
  private ctrlPressed: Boolean;
  private selectedCenter: any;
  private selectionSize = 50;
  private tilesLayer: Leaflet.TileLayer;
  private tileLayerGroup = Leaflet.featureGroup();
  private info: any;
  private running = null;
  private scheduled = false;
  private drawContext: { canvas: any; ctx: any; histctx: any; info: any };
  private delay = 10;
  private MARKERS = true;
  private TRACK_MARKERS = false;
  private TRACKS = true;
  private markerSize = 5;
  private markerRadius = this.markerSize / 2.0;
  private markerOffset = (this.markerSize - 1) / 2;
  private trackMarkerColor = '#00897B';
  private trackMarkerSize = 4;
  private trackMarkerRadius = this.trackMarkerSize / 2.0;
  private trackMarkerOffset = (this.trackMarkerSize - 1) / 2;
  private bgTransparentThreshold = 250;
  private transparentThreshold = 256;
  private extraTicks = 50;
  private stopTick: number;
  private step = 1;
  private particles = null; // [ 0 ];
  private histcanvas = null;
  private trackOpacity = 0.05;
  private trackWidth = 2;
  private SQUARE_MARKERS = false;
  private SQUARE_TRACK_MARKERS = false;
  private resetOnZoom = true;
  private slider: HTMLInputElement;
  private display: HTMLDivElement;
  private sliderMin: string = '0';
  private sliderMax: string = '0';
  private popup: any;
  @State() selected: any[] = [];

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.result = GTSLib.getData(this.result);
      this.initial = true;
      setTimeout(() => this.drawMap(this.result as DataModel || new DataModel(), true, true));
    }
  }

  @Watch('options')
  optionsUpdate(newValue: string, oldValue: string) {
    this.LOG.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      setTimeout(() => this.drawMap(this.result as DataModel || new DataModel(), true, true));
      if (this.LOG) {
        this.LOG.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
      }
    }
  }

  @Method()
  async resize() {
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    return await domtoimage.toPng(this.mapElement, {height: this.height, width: this.width});
  }

  @Listen('keydown', {target: 'document'})
  async handleKeyDown(ev: KeyboardEvent) {
    this.LOG.debug(['handleKeydown'], ev);
    if (ev.key === 'Shift') {
      this.ctrlPressed = true;
    }
  }

  @Listen('keyup', {target: 'document'})
  async handleKeyUp(ev: KeyboardEvent) {
    this.LOG.debug(['handleKeyUp'], ev);
    if (ev.key === 'Shift') {
      this.ctrlPressed = false;
    }
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryMarauder, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      toDisplay: this.toDisplay,
    });
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
    this.parsing = false;
  }

  componentDidLoad() {
    this.height = Utils.getContentBounds(this.el.parentElement).h;
    this.setSliderPosition(0);
    this.drawMap(this.result as DataModel || new DataModel());
  }

  drawMap(data: DataModel, isRefresh = false, optionUpdate: boolean = false) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {}) as Param;
    this.LOG.debug(['drawMap', 'this.options 2 '], {...data.globalParams});
    options = Utils.mergeDeep<Param>(options, data.globalParams || {});
    this.innerOptions = {...options};
    if (!!this.map) {
      this.map.invalidateSize(true);
    }
    this.mapOpts = this.innerOptions.map || {};
    let tilesPromise: Promise<void>;
    if (this.mapOpts.mapType !== 'NONE') {
      const map = MapLib.mapTypes[this.mapOpts.mapType || 'DEFAULT'];
      const mapOpts: TileLayerOptions = {
        maxNativeZoom: this.mapOpts.maxNativeZoom || 19,
        maxZoom: this.mapOpts.maxZoom || 40,
        edgeBufferTiles: 5
      };
      if (map.attribution) {
        mapOpts.attribution = map.attribution;
      }
      if (map.subdomains) {
        mapOpts.subdomains = map.subdomains;
      }
      this.LOG.debug(['displayMap'], {isRefresh, optionUpdate});
      if (!isRefresh || optionUpdate) {
        this.LOG.debug(['displayMap'], 'map', map);
        this.tilesLayer = Leaflet.tileLayer(map.link, mapOpts);
        tilesPromise = new Promise(resolve => setTimeout(() => this.tilesLayer.on("load", () => resolve())));
      }
    }
    if (!!this.map) {
      this.LOG.debug(['displayMap'], 'map exists');
      if (!isRefresh || optionUpdate) {
        this.tileLayerGroup.clearLayers();
        if (optionUpdate && !!this.tilesLayer) {
          this.tilesLayer.addTo(this.tileLayerGroup);
        }
      }
    } else {
      this.LOG.debug(['displayMap'], 'new map', this.tilesLayer);
      this.map = Leaflet.map(this.mapElement, {
        preferCanvas: true,
        zoomAnimation: true,
        maxBoundsViscocity: 1,
        worldCopyJump: true,
        maxBounds: new Leaflet.LatLngBounds(new Leaflet.latLng(-89.98155760646617, -180), new Leaflet.LatLng(89.99346179538875, 180)),
        maxZoom: this.mapOpts.maxZoom || 19,
        //   center: [this.lat, this.long],
        layers: [this.tileLayerGroup],
        boxZoom: false,
        trackResize: false
      });
      if (this.tilesLayer) {
        this.tilesLayer.bringToBack(); // TODO: test it
        this.tilesLayer.addTo(this.tileLayerGroup);
      }
      this.map.on('movestart', () => {
        this.inMove = true;
        if (!this.inZoom) {
          this.previousPause = this.paused;
        }
        if (this.popup) {
          this.popup.removeFrom(this.map);
          this.popup = undefined;
        }
        this.emitPause(true);
      });

      this.map.on('moveend', () => {
        this.emitPause(this.previousPause);
        this.selectedSquare = undefined;
        if (this.previousPause) {
          this.needRedraw = true;
        }
        if (this.selectedCenterLatLng) {
          this.inMove = true;
        }
      });
      this.map.on('zoomstart', () => {
        this.inZoom = true;
        this.previousPause = this.paused;
        this.emitPause(true);
      });
      this.map.on('zoomend', () => {
        if (this.popup) {
          this.popup.removeFrom(this.map);
          this.popup = undefined;
        }
        if (this.selectedCenterLatLng) {
          this.map.panTo(this.selectedCenterLatLng);
        }
        this.emitPause(this.previousPause);
      });
      this.map.on('click', e => {
        if (this.popup) {
          this.popup.removeFrom(this.map);
          this.popup = undefined;
        }
        if (this.selectedSquare) {
          this.map.removeLayer(this.selectedSquare);
          this.selectedSquare = undefined;
        }
        if (this.ctrlPressed) {
          this.emitPause(true);
          this.selectedCenterLatLng = e.latlng;
          this.selectedCenter = this.map.latLngToLayerPoint(e.latlng);
          const bounds = [
            this.map.layerPointToLatLng(Leaflet.point(this.selectedCenter.x - this.selectionSize, this.selectedCenter.y - this.selectionSize)),
            this.map.layerPointToLatLng(Leaflet.point(this.selectedCenter.x + this.selectionSize, this.selectedCenter.y + this.selectionSize))
          ];
          this.selectedSquare = Leaflet.rectangle(bounds, {color: 'blue', weight: 1}).addTo(this.map);
          this.getDetails();
        }
      });

      const mapCanvasLayer = new CanvasLayer();
      // If we do not inherit from L.CanvasLayer we can setup a delegate to receive events from L.CanvasLayer
      mapCanvasLayer.delegate(this);
      (mapCanvasLayer as any).addTo(this.map);
    }

    Promise.all([tilesPromise])
      .then(() => setTimeout(() => {
        if (this.initial) {
          this.draw.emit();
          this.initial = false;
        }
      }, 500));
    this.paused = false;
    this.initMap(data);
  }

  private openModal() {
    this.modal.style.display = 'block';
  }

  private closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none'
    }
  }

  private initMap(data): void {
    this.currentTick = 0;
    this.setSliderPosition(this.currentTick);
    if ((data.data || []).length === 0) return;
    const result = data.data;
    this.loading = false;
    const decoded = atob(result[0].substring(22));
    this.lat = result[1];
    this.long = result[2];
    this.map.setView({
        lat: this.lat || 0,
        lng: this.long || 0
      }, this.mapOpts.startZoom || 10,
      {animate: true}
    );
    const buf = new ArrayBuffer(decoded.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = decoded.length; i < strLen; i++) {
      bufView[i] = decoded.charCodeAt(i);
    }
    const png = UPNG.decode(buf);
    // Extract parameters
    const json = png.tabs.iTXt['Discovery'];
    const params = JSON.parse(json);
    console.log(params);
    this.infos = params.infos;
    this.ticks = params.bucketcount;
    this.sliderMax = this.ticks + '';
    this.bucketspan = params.bucketspan;
    this.bucketcount = params.bucketcount;
    this.gts = params.gts;
    this.lastbucket = params.lastbucket;
    this.lonstep = params.lonstep;
    this.latstep = params.latstep;
    this.lllat = params.lllat;
    this.lllon = params.lllon;
    this.urlat = params.urlat;
    this.urlon = params.urlon;
    this.delay = this.innerOptions.map?.delay || 1000;
    this.map.fitBounds([
      [this.lllat, this.lllon],
      [this.urlat, this.urlon]
    ]);
    this.data = png.data;
    this.markers = new Array(this.gts);
    this.currentTick = 0;
    this.tick = 0;
    this.done = true;
    this.emitPause(this.paused);
  }

  private emitPause(b: boolean) {
    this.paused = b;
    if (!this.paused && this.selectedSquare) {
      this.map.removeLayer(this.selectedSquare);
      this.selectedSquare = undefined;
    }
    this.pausedEvent.emit(b);
  }

  private getDetails() {
    this.selected = [];
    for (let particle = 0; particle < this.gts; particle++) {
      const positions = this.getPositions(particle, Math.max(this.tick - 1, 0));
      if (!!positions && !!positions[2] && !isNaN(positions[2]) && !isNaN(positions[3])) {
        const p = this.map.latLngToLayerPoint([positions[2], positions[3]]);
        if (
          p.x > this.selectedCenter.x - this.selectionSize
          && p.x < this.selectedCenter.x + this.selectionSize
          && p.y > this.selectedCenter.y - this.selectionSize
          && p.y < this.selectedCenter.y + this.selectionSize
        ) {
          this.selected.push({index: particle, info: this.infos[particle]});
        }
      }
    }
    this.openModal();
  }

  // noinspection JSUnusedLocalSymbols
  private onDrawLayer(info): void {
    info.canvas.getContext('2d').clearRect(0, 0, info.canvas.width, info.canvas.height);

    this.info = info;
    if (this.scheduled) {
      return;
    }
    if (this.done) {
      this.done = false;
      if (!this.needRedraw) {
        this.running = this.doParticles(info);
      } else {
        this.drawOnMap(this.info, false);
      }
    } else {
      if (!this.inZoom && !this.inMove) {
        this.done = false;
        if (!this.needRedraw) {
          this.scheduled = true;
          this.running = this.running.then(() => {
            this.scheduled = false;
            this.done = false;
            this.running = this.doParticles(info);
          });
        } else {
          this.drawOnMap(this.info, false);
        }
      } else {
        if (!!this.info) {
          if (this.selectedCenterLatLng) {
            this.drawOnMap(this.info, false);
            this.selectedCenter = this.map.latLngToLayerPoint(this.selectedCenterLatLng);
            const bounds = [
              this.map.layerPointToLatLng(Leaflet.point(this.selectedCenter.x - this.selectionSize, this.selectedCenter.y - this.selectionSize)),
              this.map.layerPointToLatLng(Leaflet.point(this.selectedCenter.x + this.selectionSize, this.selectedCenter.y + this.selectionSize))
            ];
            this.selectedSquare = Leaflet.rectangle(bounds, {color: 'blue', weight: 1}).addTo(this.map);
            if (!this.inMove || this.inZoom) {
              this.getAllDetails();
            }
          } else {
            this.done = false;
            if (this.needRedraw) {
              this.drawOnMap(this.info, !this.needRedraw);
            } else {
              this.running = this.running.then(() => {
                this.scheduled = false;
                this.done = false;
                this.running = this.doParticles(info);
              });
            }
          }
        }
        this.inMove = false;
        this.inZoom = false;
      }
    }
    this.needRedraw = false;
  }

  private getPositions(gtsidx, tick): (number)[] | (any | number)[] {
    let offset = ((gtsidx * this.ticks) + tick) * 4;
    if (!this.data) return;
    // ARGB
    let lat = ((this.data[offset + 3] << 8) | (this.data[offset] & 0xFF)) & 0xFFFF;
    let lon = ((this.data[offset + 1] << 8) | (this.data[offset + 2] & 0xFF)) & 0xFFFF;
    if (0 === lat && 0 === lon) {
      lat = NaN;
      lon = NaN;
    } else {
      lat = this.lllat + (lat * this.latstep);
      lon = this.lllon + (lon * this.lonstep);
    }
    if (tick < this.step) {
      return [NaN, NaN, lat, lon];
    } else {
      //
      // Check if within the previous 'step' ticks one is absent, in which case
      // the function will return NaN/NaN as the previous position
      //
      let prevlat = null;
      let prevlon = null;

      if (this.step > 1) {
        for (let j = 1; j < this.step; j++) {
          offset = ((gtsidx * this.ticks) + tick - j) * 4;
          if (0 === this.data[offset] && 0 === this.data[offset + 1] && 0 === this.data[offset + 2] && 0 === this.data[offset + 3]) {
            prevlat = NaN;
            prevlon = NaN;
            break;
          }
        }
      }

      if (null === prevlat) {
        offset = ((gtsidx * this.ticks) + tick - this.step) * 4;
        prevlat = ((this.data[offset + 3] << 8) | (this.data[offset] & 0xFF)) & 0xFFFF;
        prevlon = ((this.data[offset + 1] << 8) | (this.data[offset + 2] & 0xFF)) & 0xFFFF;
        if (0 === prevlat && 0 === prevlon) {
          prevlat = NaN;
          prevlon = NaN;
        } else {
          prevlat = this.lllat + (prevlat * this.latstep);
          prevlon = this.lllon + (prevlon * this.lonstep);
        }
      }
      return [prevlat, prevlon, lat, lon];
    }
  }

  drawOnMap(info: any, drawTraces: boolean = true): void {
    const canvas = info.canvas;
    const ctx = canvas.getContext('2d');
    const histctx = this.histcanvas.getContext('2d');
    if (this.tick < this.ticks) {
      this.markers?.fill(null);
      histctx.fillStyle = this.trackMarkerColor;
      for (let particle = 0; particle < this.gts; particle++) {
        if (!!this.particles && !this.particles.includes(particle)) {
          continue;
        }
        if (this.done) {
          // return;
        }
        const positions = this.getPositions(particle, this.tick);

        if (drawTraces) {
          histctx.strokeStyle = ColorLib.getColor(particle, this.innerOptions.scheme);
          // Draw line if the previous position is not NaN/NaN
          if (this.TRACKS && !!positions && !!positions[0] && !isNaN(positions[0]) && !isNaN(positions[1]) && !isNaN(positions[2]) && !isNaN(positions[3])) {
            histctx.beginPath();
            histctx.lineWidth = this.trackWidth;
            let dot;
            dot = info.layer._map.latLngToContainerPoint([positions[0], positions[1]]);
            histctx.moveTo(dot.x, dot.y);
            dot = info.layer._map.latLngToContainerPoint([positions[2], positions[3]]);
            histctx.lineTo(dot.x, dot.y);
            histctx.stroke();
          }
        } else {
          histctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
        }

        // Draw marker at current location
        if (!!positions && !!positions[3] && !isNaN(positions[2]) && !isNaN(positions[3])) {
          let dot;
          dot = info.layer._map.latLngToContainerPoint([positions[2], positions[3]]);
          this.markers[particle] = dot;
          if (this.TRACK_MARKERS) {
            if (this.SQUARE_TRACK_MARKERS || true) {
              histctx.fillRect(dot.x - this.trackMarkerOffset,
                dot.y - this.trackMarkerOffset, this.trackMarkerSize, this.trackMarkerSize);
            } else {
              // @ts-ignore
              histctx.fillStyle = ColorLib.getColor(particle, this.innerOptions.scheme);
              histctx.beginPath();
              histctx.arc(dot.x, dot.y, this.trackMarkerRadius, 0, 2 * Math.PI);
              histctx.stroke();
            }
          }
        }
      }
    }
    if (this.currentTick < this.ticks + this.extraTicks * this.step) {
      // Now clear the canvas and draw histcanvas with opacity 0.8 on it
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (drawTraces) {
        ctx.drawImage(this.histcanvas, 0, 0);
      }
      // Copy the context onto histctx
      histctx.clearRect(0, 0, this.histcanvas.width, this.histcanvas.height);
      histctx.drawImage(canvas, 0, 0);
      const alpha = histctx.globalAlpha;
      // Will determine length of track
      histctx.globalAlpha = this.trackOpacity;
      histctx.fillStyle = 'white';
      histctx.fillRect(0, 0, canvas.width, canvas.height);
      histctx.globalAlpha = alpha;
      // Now remove the pixels which are 'white' so they become transparent
      const imgdata = histctx.getImageData(0, 0, this.histcanvas.width, this.histcanvas.height);
      const pixels = imgdata.data;
      const size = pixels.length;
      for (let idx = 0; idx < size; idx += 4) {
        // Pixels which are close to white get their transparency set to full
        if (
          this.transparentThreshold < 256
          && pixels[idx] >= this.transparentThreshold
          && pixels[idx + 1] >= this.transparentThreshold
          && pixels[idx + 2] >= this.transparentThreshold
          || (
            this.bgTransparentThreshold < 256
            && pixels[idx] === pixels[idx + 1]
            && pixels[idx] === pixels[idx + 2]
            && pixels[idx] > this.bgTransparentThreshold)
        ) {
          pixels[idx + 3] = 0;
        }
      }
      histctx.putImageData(imgdata, 0, 0);
      // Draw the current markers
      if (this.MARKERS && this.tick < this.ticks && !!this.markers) {
        for (let particle = 0; particle < this.gts; particle++) {
          const dot = this.markers[particle];
          if (dot) {
            if (this.SQUARE_MARKERS) {
              ctx.fillStyle = ColorLib.getColor(particle, this.innerOptions.scheme);
              ctx.fillRect(dot.x - this.markerOffset,
                dot.y - this.markerOffset,
                this.markerSize,
                this.markerSize
              );
            } else {
              ctx.fillStyle = ColorLib.getColor(particle, this.innerOptions.scheme);
              ctx.beginPath();
              ctx.arc(dot.x, dot.y, this.markerRadius, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }
    }
  }

  async doParticles(info): Promise<void> {
    const canvas = info.canvas;
    try {
      // Retrieve canvas
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ctx = canvas.getContext('2d');
      // Allocate canvas with history
      const oldcanvas = this.histcanvas;
      this.histcanvas = document.createElement('canvas');
      this.histcanvas.width = canvasWidth;
      this.histcanvas.height = canvasHeight;
      this.histcanvas.bounds = info.bounds;
      const histctx = this.histcanvas.getContext('2d');
      // Copy the current canvas to the new one
      if (!this.resetOnZoom && null != oldcanvas) {
        const NE = info.layer._map.latLngToContainerPoint(oldcanvas.bounds._northEast);
        const SW = info.layer._map.latLngToContainerPoint(oldcanvas.bounds._southWest);
        histctx.drawImage(oldcanvas, 0, 0, oldcanvas.width, oldcanvas.height, SW.x, NE.y, (NE.x - SW.x + 1), (SW.y - NE.y + 1));
      }
      this.tick = this.currentTick;
      this.stopTick = this.ticks + (this.extraTicks * this.step);
      this.drawContext = {info, ctx, histctx, canvas};
      this.drawIt();
    } finally {
      this.done = true;
    }
  }

  private drawIt(): void {
    if (!this.paused && this.tick < this.stopTick) {
      this.currentTick = this.tick;
      this.setSliderPosition(this.currentTick);
      //   this.zone.run(() => this.eventBus.emit(new EventData('mapData', this.currentTick)));
      const start = window.performance.now();
      this.drawOnMap(this.drawContext.info);
      const end = window.performance.now();
      const d = Math.max(1, this.delay - Math.round(end - start));
      this.tick = this.tick + this.step;
      if (this.tick >= this.stopTick - this.extraTicks) {
        this.drawContext.ctx.clearRect(0, 0, this.drawContext.canvas.width, this.drawContext.canvas.height);
        this.drawContext.histctx.clearRect(0, 0, this.drawContext.canvas.width, this.drawContext.canvas.height);
        this.tick = 0;
      }
      if (d > 1) {
        setTimeout(() => this.drawIt(), d);
      } else {
        setTimeout(() => this.drawIt());
      }
    } else {
      setTimeout(() => this.drawIt(), 500);
    }
  }


  private getAllDetails() {

  }

  private handleSelect(e) {
    this.setSliderPosition(parseInt(e.target.value as string, 10), true)
  }

  private setSliderPosition(pos: number, setTick = false) {
    const newValue = pos * 100 / this.ticks;
    const newPosition = 10 - (newValue * 0.2);
    if (setTick) {
      this.tick = pos;
      this.drawOnMap(this.info, true);
    }
    this.display.style.left = `calc(${newValue}% + (${newPosition}px))`;
  }

  private togglePlayPause() {
    this.paused = !this.paused;
    this.emitPause(this.paused);
  }

  private formatSlider(v: string) {
    if (!v || v === 'undefined') return undefined;
    const ts = this.lastbucket - (this.bucketcount - parseInt(v, 10)) * this.bucketspan;
    return this.innerOptions.timeMode === 'date'
      ? GTSLib.toISOString(
        ts,
        this.divider, this.innerOptions.timeZone
      )?.replace('T', '')
      : ts.toString()
  }

  render() {
    return <div class="map-container" style={{width: this.width + 'px', height: this.height + 'px'}}>
      <div class="modal" onClick={() => this.closeModal()}
           ref={(el) => this.modal = el as HTMLDivElement}>
        <div class="modal-content">
          <span class="close" onClick={() => this.closeModal()}>&times;</span>
          {!!this.selected && this.selected.length > 0
            ? <table>
              <thead>
              <tr>
                <th>#</th>
                {Object.keys(this.selected[0].info).filter(k => !k.startsWith('.')).map(k => <th><b>{k}</b></th>)}
              </tr>
              </thead>
              <tbody>
              {this.selected.map((s, i) =>
                <tr class={i % 2 === 0 ? 'odd' : 'even'}>
                  <td>{s.index}</td>
                  {Object.keys(s.info).filter(k => !k.startsWith('.')).map(k => <td>{s.info[k]}</td>)}
                </tr>)}
              </tbody>
            </table>
            : ''}
        </div>
      </div>
      <div class="commands-wrapper">
        <div class="slider-wrapper">
          <div class="range-outside-wrapper">
            <div class="range-wrap">
              <div class="range-value" ref={el => this.display = el as HTMLDivElement}>
                <span>{this.formatSlider(this.currentTick + '')}</span>
              </div>
              <input type="range" class="discovery-input" value={this.currentTick}
                     min={this.sliderMin} max={this.sliderMax} onInput={e => this.handleSelect(e)}
                     ref={el => this.slider = el as HTMLInputElement}
              />
            </div>
          </div>
          <div class="labels-wrapper">
            <span class="slider-bounds" innerHTML={this.formatSlider(this.sliderMin) || '&nbsp;'}/>
            <span class="slider-bounds" innerHTML={this.formatSlider(this.sliderMax) || '&nbsp;'}/>
          </div>
        </div>
        <button type="button" class={
          {
            'discovery-btn': true,
            'paused': this.paused,
            'play': !this.paused,
          }
        } onClick={() => this.togglePlayPause()}
        />
      </div>
      <div ref={(el) => this.mapElement = el as HTMLDivElement} class="map-wrapper"/>
    </div>;
  }

}

