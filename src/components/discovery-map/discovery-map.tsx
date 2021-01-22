import {Component, Element, Event, EventEmitter, h, Host, Prop, State} from '@stencil/core';
import {DataModel} from "../../model/dataModel";
import {ChartType, MapParams} from "../../model/types";
import {Param} from "../../model/param";
import {Logger} from "../../utils/logger";
import {GTSLib} from "../../utils/gts.lib";
import {Utils} from "../../utils/utils";
import Leaflet, {TileLayerOptions} from 'leaflet';
import {MapLib} from "../../utils/map-lib";
import {ColorLib} from "../../utils/color-lib";
import {antPath} from 'leaflet-ant-path';

@Component({
  tag: 'discovery-map',
  styleUrl: 'discovery-map.scss',
  shadow: true,
})
export class DiscoveryMapComponent {
  @Prop() result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @Prop() width: number;
  @Prop() height: number;
  @Prop() debug: boolean = false;

  @Element() el: HTMLElement;
  @Event() draw: EventEmitter<void>;

  @State() parsing: boolean = false;
  @State() toDisplay: string[] = [];

  private defOptions: Param = {
    ...new Param(), map: {
      heatControls: false,
      tiles: [],
      animate: false
    }
  }
  private divider: number = 1000;
  private LOG: Logger;
  private mapElement: HTMLDivElement;
  private map: Leaflet.Map;
  private pointslayer = [];
  private bounds: Leaflet.LatLngBounds;
  private annotationsMarkers = [];
  private positionArraysMarkers = [];
  private currentZoom: number;
  private currentLat: number;
  private currentLong: number;
  private iconAnchor: Leaflet.PointExpression = [20, 38];
  private popupAnchor: Leaflet.PointExpression = [0, -50];
  private heatLayer: any;
  private pathData: any[] = [];
  private positionData: any[] = [];
  private geoJson: any[] = [];
  private pathDataLayer = Leaflet.featureGroup();
  private positionDataLayer = Leaflet.featureGroup();
  private tileLayerGroup = Leaflet.featureGroup();
  private geoJsonLayer = Leaflet.featureGroup();
  private tilesLayer: Leaflet.TileLayer;
  private firstDraw: boolean = true;
  private mapOpts: MapParams;

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryMapComponent, this.debug);
    if (typeof this.options === 'string') {
      this.options = JSON.parse(this.options);
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider((this.options as Param).timeUnit || 'us');
    this.LOG.debug(['componentWillLoad'], {
      type: this.type,
      options: this.options,
      toDisplay: this.toDisplay,
    });
    this.parsing = false;
  }

  componentDidLoad() {
    this.drawMap(this.result as DataModel || new DataModel());
  }

  drawMap(data: DataModel) {
    let options = Utils.mergeDeep<Param>(this.defOptions, this.options || {}) as Param;
    options = Utils.mergeDeep<Param>(options || {} as Param, data.globalParams) as Param;
    this.options = {...options};
    if (!!this.map) {
      this.map.invalidateSize(true);
    }
    let dataList: any[];
    let params: any[];
    this.LOG.debug(['drawMap', 'this.options'], {...this.options});
    dataList = data.data as any[];
    params = data.params;
    const flattenGTS = GTSLib.flatDeep(dataList);
    const size = flattenGTS.length;

    this.mapOpts = this.options.map || {};

    this.pointslayer = [];
    this.pathData = MapLib.toLeafletMapPaths({gts: dataList, params}, [], this.options.scheme) || [];
    this.positionData = MapLib.toLeafletMapPositionArray({gts: dataList, params},  [], this.options.scheme) || [];
    this.geoJson = MapLib.toGeoJSON({gts: dataList, params});
    if (this.mapOpts.mapType !== 'NONE') {
      const map = MapLib.mapTypes[this.mapOpts.mapType || 'DEFAULT'];
      this.LOG.debug(['displayMap'], 'map', map);
      const mapOpts: TileLayerOptions = {maxZoom: 24, maxNativeZoom: 19};
      if (map.attribution) {
        mapOpts.attribution = map.attribution;
      }
      if (map.subdomains) {
        mapOpts.subdomains = map.subdomains;
      }
      this.tilesLayer = Leaflet.tileLayer(map.link, mapOpts);
      if (!!this.map) {
        this.LOG.debug(['displayMap'], 'map exists');
        this.pathDataLayer.clearLayers();
        this.positionDataLayer.clearLayers();
        this.geoJsonLayer.clearLayers();
        this.tileLayerGroup.clearLayers();
      } else {
        this.map = Leaflet.map(this.mapElement, {
          preferCanvas: true,
          layers: [this.tileLayerGroup, this.geoJsonLayer, this.pathDataLayer, this.positionDataLayer],
          zoomAnimation: true,
          maxZoom: 24
        });
        this.geoJsonLayer.bringToBack();
        this.tilesLayer.bringToBack(); // TODO: tester
        this.map.on('load', () => this.LOG.debug(['displayMap', 'load'], this.map.getCenter().lng, this.currentLong, this.map.getZoom()));
        this.map.on('zoomend', () => {
          if (!this.firstDraw) {
            this.currentZoom = this.map.getZoom();
          }
        });
        this.map.on('moveend', () => {
          if (!this.firstDraw) {
            this.currentLat = this.map.getCenter().lat;
            this.currentLong = this.map.getCenter().lng;
          }
        });
      }
    }
    this.tilesLayer.addTo(this.tileLayerGroup);
    const pathDataSize = (this.pathData || []).length;
    for (let i = 0; i < pathDataSize; i++) {
      const path = this.pathData[i];
      if (!!path) {
        this.updateGtsPath(path);
      }
    }
    const positionsSize = (this.positionData || []).length;
    for (let i = 0; i < positionsSize; i++) {
      this.updatePositionArray(this.positionData[i]);
    }
    (this.mapOpts.tiles || []).forEach(t => { // TODO to test
      this.LOG.debug(['displayMap'], t);
      this.tileLayerGroup.addLayer(Leaflet.tileLayer(t, {
        subdomains: 'abcd',
        maxNativeZoom: 19,
        maxZoom: 40
      }));
    });
    const geoJsonSize = (this.geoJson || []).length;
    for (let i = 0; i < geoJsonSize; i++) {
      const m = this.geoJson[i];
      const color = ColorLib.getColor(i, this.options.scheme);
      const opts = {
        style: () => ({
          color: (data.params && data.params[i]) ? data.params[i].datasetColor || color : color,
          fillColor: (data.params && data.params[i])
            ? ColorLib.transparentize(data.params[i].fillColor || color)
            : ColorLib.transparentize(color),
        })
      } as any;
      if (m.geometry.type === 'Point') {
        opts.pointToLayer = (geoJsonPoint, latlng) => Leaflet.marker(latlng, {
          icon: this.icon(color, (data.params && data.params[i]) ? (data.params[i].map || {marker: 'circle'}).marker : 'circle'),
          opacity: 1,
        });
      }
      let display = '';
      const geoShape = Leaflet.geoJSON(m, opts);
      if (m.properties) {
        Object.keys(m.properties).forEach(k => display += `<b>${k}</b>: ${m.properties[k]}<br />`);
        geoShape.bindPopup(display);
      }
      geoShape.addTo(this.geoJsonLayer);
    }
    if (this.pathData.length > 0 || this.positionData.length > 0 || this.geoJson.length > 0) {
      // Fit map to curves
      const group = Leaflet.featureGroup([this.geoJsonLayer, this.positionDataLayer, this.pathDataLayer]);
      this.bounds = group.getBounds();
      setTimeout(() => {
        if (!!this.bounds && this.bounds.isValid()) {
          if ((this.currentLat || this.mapOpts.startLat) && (this.currentLong || this.mapOpts.startLong)) {
            this.LOG.debug(['displayMap', 'setView'], 'fitBounds', 'already have bounds');
            this.map.setView({
                lat: this.currentLat || this.mapOpts.startLat || 0,
                lng: this.currentLong || this.mapOpts.startLong || 0
              }, this.currentZoom || this.mapOpts.startZoom || 10,
              {animate: false, duration: 0});
          } else {
            this.LOG.debug(['displayMap', 'setView'], 'fitBounds', 'this.bounds', this.bounds);
            this.map.fitBounds(this.bounds, {padding: [1, 1], animate: false, duration: 0});
          }
          this.currentLat = this.map.getCenter().lat;
          this.currentLong = this.map.getCenter().lng;
        } else {
          this.LOG.debug(['displayMap', 'setView'], 'invalid bounds', {lat: this.currentLat, lng: this.currentLong});
          this.map.setView({
              lat: this.currentLat || this.mapOpts.startLat || 0,
              lng: this.currentLong || this.mapOpts.startLong || 0
            }, this.currentZoom || this.mapOpts.startZoom || 10,
            {
              animate: false,
              duration: 500
            });
        }
      }, 10);
    } else {
      this.LOG.debug(['displayMap', 'lost'], 'lost', this.currentZoom, this.mapOpts.startZoom);
      this.map.setView(
        [
          this.currentLat || this.mapOpts.startLat || 0,
          this.currentLong || this.mapOpts.startLong || 0
        ],
        this.currentZoom || this.mapOpts.startZoom || 2,
        {
          animate: false,
          duration: 0
        }
      );
    }
    this.firstDraw = false;
    this.patchMapTileGapBug();
    this.draw.emit();
  }

  private icon(color: string, marker = '') {
    const c = `${color.slice(1)}`;
    const m = marker !== '' ? marker : 'circle';
    return Leaflet.icon({
      // tslint:disable-next-line:max-line-length
      iconUrl: `https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-${m}-solid&iconSize=14&size=40&hoffset=${m !== 'circle' ? 0 : 1}&voffset=0&color=fff&background=${c}`,
      iconAnchor: this.iconAnchor,
      popupAnchor: this.popupAnchor
    });
  }

  private getGTSDots(gts) {
    const dots = [];
    let icon;
    let size;
    switch (gts.render) {
      case 'marker':
        icon = this.icon(gts.color, gts.marker);
        size = (gts.path || []).length;
        for (let i = 0; i < size; i++) {
          const g = gts.path[i];
          const marker = Leaflet.marker(g, {icon, opacity: 1});
          this.addPopup(gts, g.val, g.ts, marker);
          dots.push(marker);
        }
        break;
      case 'weightedDots':
        size = (gts.path || []).length;
        for (let i = 0; i < size; i++) {
          const p = gts.path[i];
          let v = parseInt(p.val, 10);
          if (isNaN(v)) {
            v = 0;
          }
          const radius = 50 * v / ((gts.maxValue || 1) - (gts.minValue || 0));
          console.log('weightedDots', gts.borderColor, gts.color)
          const marker = Leaflet.circleMarker(
            p, {
              radius: radius === 0 ? 1 : radius,
              color: gts.borderColor || 'transparent',
              fillColor: gts.color, fillOpacity: 0.5,
              weight: 1
            });
          this.addPopup(gts, p.val, p.ts, marker);
          dots.push(marker);
        }
        break;
      case 'dots':
      default:
        size = (gts.path || []).length;
        for (let i = 0; i < size; i++) {
          const g = gts.path[i];
          console.log('dots', gts.borderColor, gts.color)
          const marker = Leaflet.circleMarker(
            g, {
              radius: gts.baseRadius || MapLib.BASE_RADIUS,
              color: gts.color,
              fillColor: gts.color,
              fillOpacity: 1
            }
          );
          this.addPopup(gts, g.val, g.ts, marker);
          dots.push(marker);
        }
        break;
    }
    return dots;
  }

  private updateGtsPath(gts: any) {
    const path = MapLib.pathDataToLeaflet(gts.path);
    const group = Leaflet.featureGroup();
    if ((path || []).length > 1 && !!gts.line && gts.render === 'dots') {
      if (!!this.mapOpts.animate) {
        group.addLayer(antPath(path || [], {
          delay: 800, dashArray: [10, 100],
          weight: 5, color: ColorLib.transparentize(gts.color, 0.5),
          pulseColor: gts.color,
          paused: false, reverse: false, hardwareAccelerated: true, hardwareAcceleration: true
        }));
      } else {
        group.addLayer(Leaflet.polyline(path || [], {color: gts.color, opacity: 0.5}));
      }
    }
    const dots = this.getGTSDots(gts);
    const size = (dots || []).length;
    for (let i = 0; i < size; i++) {
      group.addLayer(dots[i]);
    }
    this.pathDataLayer.addLayer(group);
  }

  private addPopup(positionData: any, value: any, ts: any, marker: any) {
    if (!!positionData) {
      let date;
      if (ts && !(this.options as Param).timeMode || (this.options as Param).timeMode !== 'timestamp') {
        date = (GTSLib.toISOString(ts, this.divider, (this.options as Param).timeZone) || '')
          .replace('Z', (this.options as Param).timeZone === 'UTC' ? 'Z' : '');
      }
      let content = '';
      content = `<p>${date}</p><p><b>${positionData.key}</b>: ${value || 'na'}</p>`;
      Object.keys(positionData.properties || []).forEach(k => content += `<b>${k}</b>: ${positionData.properties[k]}<br />`);
      marker.bindPopup(content);
    }
  }

  private updatePositionArray(positionData: any) {
    const group = Leaflet.featureGroup();
    const path = MapLib.updatePositionArrayToLeaflet(positionData.positions);
    if ((positionData.positions || []).length > 1 && !!positionData.line) {
      if (!!this.mapOpts.animate) {
        group.addLayer(antPath(path || [], {
          delay: 800, dashArray: [10, 100],
          weight: 5, color: ColorLib.transparentize(positionData.color, 0.5),
          pulseColor: positionData.color,
          paused: false, reverse: false, hardwareAccelerated: true, hardwareAcceleration: true
        }));
      } else {
        group.addLayer(Leaflet.polyline(path || [], {color: positionData.color, opacity: 0.5}));
      }
    }
    let icon;
    let result;
    let inStep;
    let size;
    this.LOG.debug(['updatePositionArray'], positionData);

    switch (positionData.render) {
      case 'marker':
        icon = this.icon(positionData.color, positionData.marker);
        size = (positionData.positions || []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const marker = Leaflet.marker({lat: p[0], lng: p[1]}, {icon, opacity: 1});
          this.addPopup(positionData, p[2], undefined, marker);
          group.addLayer(marker);
        }
        this.LOG.debug(['updatePositionArray', 'build marker'], icon);
        break;
      case 'coloredWeightedDots':
        this.LOG.debug(['updatePositionArray', 'coloredWeightedDots'], positionData);
        result = [];
        inStep = [];
        for (let j = 0; j < positionData.numColorSteps; j++) {
          result[j] = 0;
          inStep[j] = 0;
        }
        size = (positionData.positions || []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const radius = (parseInt(p[2], 10) - (positionData.minValue || 0)) * 50 / (positionData.maxValue || 50);

          this.LOG.debug(['updatePositionArray', 'coloredWeightedDots', 'radius'], positionData.baseRadius * p[4]);
          const marker = Leaflet.circleMarker(
            {lat: p[0], lng: p[1]},
            {
              radius,
              color: positionData.borderColor || positionData.color,
              fillColor: ColorLib.rgb2hex(
                positionData.colorGradient[p[5]].r,
                positionData.colorGradient[p[5]].g,
                positionData.colorGradient[p[5]].b),
              fillOpacity: 0.3,
            });
          this.addPopup(positionData, p[2], undefined, marker);
          group.addLayer(marker);
        }
        break;
      case 'weightedDots':
        size = (positionData.positions || []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const radius = (parseInt(p[2], 10) - (positionData.minValue || 0)) * 50 / (positionData.maxValue || 50);
          const marker = Leaflet.circleMarker(
            {lat: p[0], lng: p[1]}, {
              radius,
              color: positionData.borderColor || positionData.color,
              fillColor: positionData.color,
              weight: 2,
              fillOpacity: 0.3,
            });
          this.addPopup(positionData, p[2], undefined, marker);
          group.addLayer(marker);
        }
        break;
      case 'dots':
      default:
        size = (positionData.positions || []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const marker = Leaflet.circleMarker(
            {lat: p[0], lng: p[1]}, {
              radius: positionData.baseRadius || MapLib.BASE_RADIUS,
              color: positionData.borderColor || positionData.color,
              fillColor: positionData.color,
              weight: 2,
              fillOpacity: 0.7,
            });
          this.addPopup(positionData, p[2] || 'na', undefined, marker);
          group.addLayer(marker);
        }
        break;
    }
    this.positionDataLayer.addLayer(group);
  }


  private patchMapTileGapBug() {
    // Workaround for 1px lines appearing in some browsers due to fractional transforms
    // and resulting anti-aliasing. adapted from @cmulders' solution:
    // https://github.com/Leaflet/Leaflet/issues/3575#issuecomment-150544739
    // @ts-ignore
    const originalInitTile = Leaflet.GridLayer.prototype._initTile;
    if (originalInitTile.isPatched) {
      return;
    }
    Leaflet.GridLayer.include({
      _initTile(tile) {
        originalInitTile.call(this, tile);
        const tileSize = this.getTileSize();
        tile.style.width = tileSize.x + 1.5 + 'px';
        tile.style.height = tileSize.y + 1 + 'px';
      }
    });
    // @ts-ignore
    Leaflet.GridLayer.prototype._initTile.isPatched = true;
  }

  render() {
    return (
      <Host>
        <div class="map-container" style={{width: this.width + 'px', height: this.height + 'px'}}>
          <div ref={(el) => this.mapElement = el as HTMLDivElement}/>
        </div>
      </Host>
    );
  }

}
