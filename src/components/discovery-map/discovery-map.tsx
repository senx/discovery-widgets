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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch} from '@stencil/core';
import {DataModel} from '../../model/dataModel';
import {ChartType, MapParams} from '../../model/types';
import {Param} from '../../model/param';
import {Logger} from '../../utils/logger';
import {GTSLib} from '../../utils/gts.lib';
import {Utils} from '../../utils/utils';
import Leaflet, {TileLayerOptions} from 'leaflet';
import {MapLib} from '../../utils/map-lib';
import {ColorLib} from '../../utils/color-lib';
import {AntPath, antPath} from 'leaflet-ant-path';
import domtoimage from 'dom-to-image';
import 'leaflet-edgebuffer';
import 'leaflet.heat';

@Component({
  tag: 'discovery-map',
  styleUrl: 'discovery-map.scss',
  shadow: true,
})
export class DiscoveryMapComponent {
  @Prop({mutable: true}) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @State() @Prop() width: number;
  @State() @Prop({mutable: true}) height: number;
  @Prop() debug = false;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;

  @State() parsing = false;
  @State() toDisplay: string[] = [];
  @State() innerOptions: Param;

  private defOptions: Param = {
    ...new Param(), map: {
      tiles: [],
      animate: false
    }
  }
  private divider = 1000;
  private LOG: Logger;
  private mapElement: HTMLDivElement;
  private map: Leaflet.Map;
  private pointslayer = [];
  private bounds: Leaflet.LatLngBounds;
  private currentZoom: number;
  private currentLat: number;
  private currentLong: number;
  private iconAnchor: Leaflet.PointExpression = [20, 38];
  private popupAnchor: Leaflet.PointExpression = [0, -50];
  private pathData: any[] = [];
  private positionData: any[] = [];
  private geoJson: any[] = [];
  private pathDataLayer = Leaflet.featureGroup();
  private positionDataLayer = Leaflet.featureGroup();
  private tileLayerGroup = Leaflet.featureGroup();
  private geoJsonLayer = Leaflet.featureGroup();
  private tilesLayer: Leaflet.TileLayer;
  private mainLayer: Leaflet.LayerGroup;
  private heatmapLayer = Leaflet.featureGroup();
  private shadowHeatmapLayer = Leaflet.featureGroup();
  private firstDraw = true;
  private mapOpts: MapParams;
  private initial = false;
  private hidden: { [key: string]: boolean } = {};
  private poputTimeout;
  private markerOver = false;
  private markersRef: any;

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
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = {...this.options as Param};
      }
      setTimeout(() => this.drawMap(this.result as DataModel || new DataModel(), true, true));
      if (this.LOG) {
        this.LOG?.debug(['optionsUpdate 2'], {options: this.innerOptions, newValue, oldValue});
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
    return Promise.resolve();
  }

  // noinspection JSUnusedLocalSymbols
  @Method()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(type: 'png' | 'svg' = 'png') {
    return await domtoimage.toPng(this.mapElement, {height: this.height, width: this.width});
  }

  @Method()
  async show(regexp: string) {
    Object.keys(this.hidden).forEach(k => {
      if (new RegExp(regexp).test(k)) {
        this.hidden[k] = false;
      }
    });
    this.drawMap(this.result as DataModel || new DataModel(), true);
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    Object.keys(this.hidden).forEach(k => {
      if (new RegExp(regexp).test(k)) {
        this.hidden[k] = true;
      }
    });
    this.drawMap(this.result as DataModel || new DataModel(), true);
    return Promise.resolve();
  }

  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryMapComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us');
    this.LOG?.debug(['componentWillLoad'], {
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
    this.drawMap(this.result as DataModel || new DataModel());
  }

  drawMap(data: DataModel, isRefresh = false, optionUpdate?: boolean) {
    let tilesPromise: Promise<void>;
    let zoomPromise: Promise<void>;
    // noinspection JSUnusedAssignment
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions || {});
    this.LOG?.debug(['drawMap', 'this.options 2 '], {...data.globalParams});
    options = Utils.mergeDeep<Param>(options, data.globalParams || {});
    optionUpdate = JSON.stringify(options) !== JSON.stringify(this.innerOptions);
    this.innerOptions = {...options};
    if (!!this.map) {
      this.map.invalidateSize(true);
    }
    this.LOG?.debug(['drawMap', 'data'], data);
    this.LOG?.debug(['drawMap', 'this.height'], this.height);
    this.LOG?.debug(['drawMap', 'this.options'], {...this.innerOptions});
    data.data = GTSLib.flatDeep(data.data as any[]);
    const dataList = data.data as any[];
    const params = data.params;
    this.mapOpts = this.innerOptions.map || {};
    this.pointslayer = [];
    dataList.forEach((g, i) => {
      if (GTSLib.isGts(g)) {
        const gtsName = ((data.params || [])[i] || {key: undefined}).key || GTSLib.serializeGtsMetadata(g);
        if (!this.hidden[gtsName]) {
          this.hidden[gtsName] = false;
        }
      }
    })
    this.pathData = MapLib.toLeafletMapPaths({gts: dataList, params}, this.hidden, this.innerOptions.scheme) || [];
    this.positionData = MapLib.toLeafletMapPositionArray({gts: dataList, params}, [], this.innerOptions.scheme) || [];
    this.geoJson = MapLib.toGeoJSON({gts: dataList, params});

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
      this.LOG?.debug(['displayMap'], {isRefresh, optionUpdate});
      if (!isRefresh || optionUpdate) {
        this.LOG?.debug(['displayMap'], 'map', map);
        this.tilesLayer = Leaflet.tileLayer(map.link, mapOpts);
        tilesPromise = new Promise(resolve => setTimeout(() => this.tilesLayer.on('load', () => resolve())));
      }
    }
    if (!!this.map) {
      this.LOG?.debug(['displayMap'], 'map exists');
      this.pathDataLayer.clearLayers();
      this.positionDataLayer.clearLayers();
      this.geoJsonLayer.clearLayers();
      this.heatmapLayer.clearLayers();
      this.shadowHeatmapLayer.clearLayers();
      if (!isRefresh || optionUpdate) {
        this.tileLayerGroup.clearLayers();
        if (optionUpdate && !!this.tilesLayer) {
          this.tilesLayer.addTo(this.tileLayerGroup);
        }
      }
    } else {
      this.mainLayer = new Leaflet.LayerGroup([this.tileLayerGroup, this.heatmapLayer, this.geoJsonLayer, this.pathDataLayer, this.positionDataLayer]);
      this.map = Leaflet.map(this.mapElement, {
        preferCanvas: true,
        layers: this.mainLayer,
        zoomAnimation: true,
        maxBoundsViscocity: 1,
        worldCopyJump: true,
        maxBounds: new Leaflet.LatLngBounds(new Leaflet.latLng(-89.98155760646617, -180), new Leaflet.LatLng(89.99346179538875, 180)),
        maxZoom: this.mapOpts.maxZoom || 19
      });
      this.geoJsonLayer.bringToBack();
      if (this.tilesLayer) {
        this.tilesLayer.bringToBack(); // TODO: test it
        if (!isRefresh) {
          this.tileLayerGroup.clearLayers();
          this.tilesLayer.addTo(this.tileLayerGroup);
        }
      }
      this.map.on('load', () => this.LOG?.debug(['displayMap', 'load'], this.map.getCenter().lng, this.currentLong, this.map.getZoom()));
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
    const pathDataSize = (this.pathData || []).length;
    for (let i = 0; i < pathDataSize; i++) {
      const path = this.pathData[i];
      if (!!path) {
        this.updateGtsPath(path);
      }
    }
    this.LOG?.debug(['displayMap'], 'pathData', this.pathData);
    const positionsSize = (this.positionData || []).length;
    for (let i = 0; i < positionsSize; i++) {
      this.updatePositionArray(this.positionData[i]);
    }
    this.LOG?.debug(['displayMap'], 'positionData', this.positionData);
    (this.mapOpts.tiles || []).forEach(t => {
      this.LOG?.debug(['displayMap'], t);
      const tile: { url?: string, subdomains: string, maxNativeZoom: number, maxZoom: number } = {
        subdomains: 'abcd',
        maxNativeZoom: this.mapOpts.maxNativeZoom || 19,
        maxZoom: this.mapOpts.maxZoom || 19
      };
      if (typeof t === 'string') {
        tile.url = t;
      } else if (typeof t === 'object') {
        tile.url = t.url;
        tile.maxZoom = this.mapOpts.maxZoom || 19;
        tile.maxNativeZoom = t.maxNativeZoom || this.mapOpts.maxNativeZoom || 19;
      }
      this.tileLayerGroup.addLayer(Leaflet.tileLayer(t, {
        subdomains: 'abcd',
        maxNativeZoom: tile.maxNativeZoom || 19,
        maxZoom: this.mapOpts.maxZoom || 19
      }));
    });

    const geoJsonSize = (this.geoJson || []).length;
    for (let i = 0; i < geoJsonSize; i++) {
      const m = this.geoJson[i];
      const color = ColorLib.getColor(i, this.innerOptions.scheme);
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
    let hasHeatmap = false;
    // HeatMap
    const size = (dataList || []).length;
    for (let i = 0; i < size; i++) {
      let p = (params || [])[i];
      if (!p) {
        p = {...new Param()};
      }
      if (!!p.map?.heatmap && dataList[i].v[0] && dataList[i].v[0].length >= 3) {
        const g = dataList[i];
        let max = Number.MIN_SAFE_INTEGER;
        let min = Number.MAX_SAFE_INTEGER;
        hasHeatmap = true;
        const hasHeatmapData = g.v.map(v => {
          max = Math.max(max, v[v.length - 1]);
          min = Math.min(min, v[v.length - 1]);
          Leaflet.circleMarker([v[1], v[2]], {radius: 1}).addTo(this.shadowHeatmapLayer);
          return [v[1], v[2], v[v.length - 1]]
        });
        Leaflet.heatLayer(hasHeatmapData, {
          radius: p.map?.heatRadius || this.innerOptions.map?.heatRadius || 25,
          minOpacity: p.map?.heatOpacity || this.innerOptions.map?.heatOpacity || 0.05,
          maxZoom: 0,
          max,
          blur: p.map?.heatBlur || this.innerOptions.map?.heatBlur || 15,
        }).addTo(this.heatmapLayer);
      }
    }

    if (this.pathData.length > 0 || this.positionData.length > 0 || this.geoJson.length > 0 || hasHeatmap) {
      // Fit map to curves
      const group = Leaflet.featureGroup([this.geoJsonLayer, this.positionDataLayer, this.pathDataLayer, this.shadowHeatmapLayer]);
      this.bounds = group.getBounds();
      setTimeout(() => {
        if (!!this.bounds && this.bounds.isValid()) {
          if ((this.currentLat || this.mapOpts.startLat) && (this.currentLong || this.mapOpts.startLong)) {
            this.LOG?.debug(['displayMap', 'setView'], 'fitBounds', 'already have bounds');
            if (this.mapOpts.track) {
              this.map.setView({
                  lat: this.mapOpts.startLat || this.bounds.getCenter().lat || 0,
                  lng: this.mapOpts.startLong || this.bounds.getCenter().lng || 0
                }, this.mapOpts.startZoom || this.map.getBoundsZoom(this.bounds) || 10,
                {animate: true}
              );
            } else {
              this.map.setView({
                  lat: this.currentLat || this.mapOpts.startLat || 0,
                  lng: this.currentLong || this.mapOpts.startLong || 0
                }, this.currentZoom || this.mapOpts.startZoom || 10,
                {animate: false});
            }
          } else {
            this.LOG?.debug(['displayMap', 'setView'], 'fitBounds', 'this.bounds', this.bounds);
            this.map.fitBounds(this.bounds, {padding: [1, 1], animate: false, duration: 0});
          }
          this.currentLat = this.map.getCenter().lat;
          this.currentLong = this.map.getCenter().lng;
        } else {
          this.LOG?.debug(['displayMap', 'setView'], 'invalid bounds', {lat: this.currentLat, lng: this.currentLong});
          this.map.setView({
              lat: this.currentLat || this.mapOpts.startLat || 0,
              lng: this.currentLong || this.mapOpts.startLong || 0
            }, this.currentZoom || this.mapOpts.startZoom || 10,
            {
              animate: false,
              duration: 0
            }
          );
          zoomPromise = new Promise(resolve => this.map.once('moveend zoomend', () => resolve()));
        }
      }, 10);
    } else {
      this.LOG?.debug(['displayMap', 'lost'], 'lost', this.currentZoom, this.mapOpts.startZoom);
      this.map.setView(
        [
          this.currentLat || this.mapOpts.startLat || 0,
          this.currentLat || this.mapOpts.startLat || 0,
          this.currentLong || this.mapOpts.startLong || 0
        ],
        this.currentZoom || this.mapOpts.startZoom || 2,
        {
          animate: false,
          duration: 0
        }
      );
      zoomPromise = new Promise(resolve => setTimeout(() => this.map.once('moveend zoomend', () => resolve())));
    }
    this.firstDraw = false;
    this.patchMapTileGapBug();
    void Promise.all([zoomPromise, tilesPromise])
      .then(() => setTimeout(() => {
        if (this.initial) {
          this.draw.emit();
          this.initial = false;
        }
      }, 500));
  }

  private icon(color: string, marker = '') {
    const c = `${color.slice(1)}`;
    const m = marker !== '' ? marker : 'circle';
    return Leaflet.icon({
      // eslint-disable-next-line max-len
      iconUrl: `https://cdn.mapmarker.io/api/v1/font-awesome/v5/pin?icon=fa-${m}&iconSize=14&size=40&hoffset=${m !== 'circle' ? 0 : 1}&voffset=0&color=fff&background=${c}`,
      iconAnchor: this.iconAnchor,
      popupAnchor: this.popupAnchor
    });
  }

  private getGTSDots(gts) {
    const dots = [];
    let icon;
    let size;
    switch (gts.render) {
      case 'path': {
        icon = this.icon(gts.color, gts.marker);
        size = (gts.path || []).length;

        for (let i = 0; i < size; i++) {
          const g = gts.path[i];
          if (i > 0 || !gts.marker) {
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
          } else {
            const marker = Leaflet.marker(g, {icon, opacity: 1});
            this.addPopup(gts, g.val, g.ts, marker);
            dots.push(marker);
          }
        }
        break;
      }
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
    if ((path || []).length > 1 && !!gts.line && (gts.render === 'dots' || gts.render === 'path')) {
      if (!!this.mapOpts.animate) {
        group.addLayer(new AntPath(path || [], {
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
      let date = ts;
      if (ts && (this.innerOptions.timeMode || 'date') === 'date') {
        date = (GTSLib.toISOString(GTSLib.utcToZonedTime(ts, 1, this.innerOptions.timeZone), this.divider, this.innerOptions.timeZone,
          this.innerOptions.timeFormat) || '')
          .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '');
      }
      let content = '';
      content = `<p>${date}</p><p><b>${positionData.key}</b>: ${value || 'na'}</p>`;
      Object.keys(positionData.properties || []).forEach(k => content += `<b>${k}</b>: ${positionData.properties[k]}<br />`);

      if(!!positionData.tooltip[ts]) {
        content += positionData.tooltip[ts];
      }
      marker.on('mouseover', () => {
        marker.openPopup();
        this.markerOver = true;
        if (!!this.poputTimeout) {
          clearTimeout(this.poputTimeout)
        }
        this.poputTimeout = setTimeout(() => {
          if (marker.isPopupOpen() && !this.markerOver) marker.closePopup();
        }, 3000);
        this.dataPointOver.emit({
          date: ts,
          name: positionData.key,
          value,
          meta: positionData.properties
        });
      })
      this.markersRef = {...this.markersRef || {}}
      if (!this.markersRef[positionData.key]) {
        this.markersRef[positionData.key] = {};
      }
      this.markersRef[positionData.key][ts] = marker;
      marker.bindPopup(content, {autoClose: true});
    }
    marker.on('mouseout', () => {
      this.markerOver = false;
    })
  }

  @Method()
  async setFocus(regexp: string, ts: number) {
    const date = this.innerOptions.timeMode === 'date'
      ? GTSLib.utcToZonedTime(ts || 0, this.divider, this.innerOptions.timeZone)
      : ts || 0;
    Object.keys(this.markersRef || {})
      .filter(s => new RegExp(regexp).test(s))
      .forEach(k => {
        if (!!this.markersRef[k][date]) {
          this.markersRef[k][date].openPopup();
        }
      });
    return Promise.resolve();
  }

  @Method()
  async unFocus() {
    Object.keys(this.markersRef)
      .forEach(k => {
        (Object.keys(this.markersRef[k] || {}))
          .forEach(ts => {
            if (!!this.markersRef[k][ts]) {
              if (this.markersRef[k][ts].isPopupOpen() && !this.markerOver) this.markersRef[k][ts].closePopup();
            }
          });
      });
    return Promise.resolve();
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
    this.LOG?.debug(['updatePositionArray'], positionData);

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
        this.LOG?.debug(['updatePositionArray', 'build marker'], icon);
        break;
      case 'coloredWeightedDots':
        this.LOG?.debug(['updatePositionArray', 'coloredWeightedDots'], positionData);
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

          this.LOG?.debug(['updatePositionArray', 'coloredWeightedDots', 'radius'], positionData.baseRadius * p[4]);
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
    // eslint-disable-next-line no-underscore-dangle
    const originalInitTile = Leaflet.GridLayer.prototype._initTile;
    if (originalInitTile.isPatched) {
      return;
    }
    Leaflet.GridLayer.include({
      _initTile(tile) {
        originalInitTile.call(this, tile);
        const tileSize = this.getTileSize();
        tile.style.width = `${tileSize.x as number + 1.5}px`;
        tile.style.height = `${tileSize.y as number + 1}px`;
      }
    });
    // eslint-disable-next-line no-underscore-dangle
    Leaflet.GridLayer.prototype._initTile.isPatched = true;
  }

  render() {
    return <div class="map-container" style={{width: `${this.width}px`, height: `${this.height}px`}}>
      <div ref={(el) => this.mapElement = el}/>
    </div>;
  }

}
