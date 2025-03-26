/*
 *   Copyright 2022-2025 SenX S.A.S.
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

import { Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { ChartType, DataModel, MapParams } from '../../model/types';
import { Param } from '../../model/param';
import { Logger } from '../../utils/logger';
import { GTSLib } from '../../utils/gts.lib';
import { Utils } from '../../utils/utils';
import Leaflet, { TileLayerOptions } from 'leaflet';
import { MapLib } from '../../utils/map-lib';
import { ColorLib } from '../../utils/color-lib';
import { AntPath, antPath } from 'leaflet-ant-path';
import domtoimage from 'dom-to-image';
import 'leaflet-edgebuffer';
import 'leaflet.heat';
import 'leaflet.markercluster';
import { v4 } from 'uuid';

@Component({
  tag: 'discovery-map',
  styleUrl: 'discovery-map.scss',
  shadow: true,
})
export class DiscoveryMapComponent {
  @Prop({ mutable: true }) result: DataModel | string;
  @Prop() type: ChartType;
  @Prop() options: Param | string = new Param();
  @State() @Prop() width: number;
  @State() @Prop({ mutable: true }) height: number;
  @Prop() debug = false;

  @Element() el: HTMLElement;

  @Event() draw: EventEmitter<void>;
  @Event() dataPointOver: EventEmitter;
  @Event() dataPointSelected: EventEmitter;
  @Event() geoBounds: EventEmitter<string>;
  @Event() poi: EventEmitter;

  @State() parsing = false;
  @State() toDisplay: string[] = [];
  @State() innerOptions: Param;

  private defOptions: Param = {
    ...new Param(), map: {
      tiles: [],
      animate: false,
    },
  };
  private divider = 1000;
  private LOG: Logger;
  private mapElement: HTMLDivElement;
  private map: Leaflet.Map;
  private bounds: Leaflet.LatLngBounds;
  private currentZoom: number;
  private currentLat: number;
  private currentLong: number;
  private pathData: any[] = [];
  private positionData: any[] = [];
  private geoJson: any[] = [];
  private pathDataLayer = Leaflet.featureGroup();
  private positionDataLayer = Leaflet.featureGroup();
  private tileLayerGroup = Leaflet.featureGroup();
  private geoJsonLayer = Leaflet.featureGroup();
  private tilesLayer: Leaflet.TileLayer;
  private poiLayer: Leaflet.LayerGroup = new Leaflet.LayerGroup();
  private mainLayer: Leaflet.LayerGroup;
  private heatmapLayer = Leaflet.featureGroup();
  private shadowHeatmapLayer = Leaflet.featureGroup();
  private firstDraw = true;
  private mapOpts: MapParams;
  private initial = true;
  private hidden: { [key: string]: boolean } = {};
  private popupTimeout: any;
  private markerOver = false;
  private markersRef: any;
  private tileLayers: string[] = [];
  private pois: any[] = [];

  @Watch('result')
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.result = GTSLib.getData(this.result);
      this.initial = true;
      setTimeout(() => this.drawMap(this.result as DataModel ?? new DataModel(), true, true));
    }
  }

  @Watch('options')
  optionsUpdate(newValue: any, oldValue: any) {
    this.LOG?.debug(['optionsUpdate'], newValue, oldValue);
    let opts = newValue;
    if (!!newValue && typeof newValue === 'string') {
      opts = JSON.parse(newValue);
    }
    if (!Utils.deepEqual(opts, this.innerOptions)) {
      this.innerOptions = Utils.clone(opts);
      setTimeout(() => this.drawMap(this.result as DataModel ?? new DataModel(), true, true));
      this.LOG?.debug(['optionsUpdate 2'], { options: this.innerOptions, newValue, oldValue });
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

  @Method()
  async export(_type: 'png' | 'svg' = 'png') {
    return await domtoimage.toPng(this.mapElement, { height: this.height, width: this.width });
  }

  @Method()
  async show(regexp: string) {
    GTSLib.flatDeep(((this.result as DataModel ?? new DataModel()).data as any[])).forEach(gts => {
      const gtsName = ((this.result as DataModel ?? new DataModel()).params ?? [])[gts.id]?.key ?? GTSLib.serializeGtsMetadata(gts);
      if (new RegExp(regexp).test(gtsName)) {
        this.hidden[gts.id] = false;
      }
    });
    this.drawMap(this.result as DataModel ?? new DataModel(), true);
    return Promise.resolve();
  }

  @Method()
  async hide(regexp: string) {
    GTSLib.flatDeep(((this.result as DataModel ?? new DataModel()).data as any[])).forEach(gts => {
      const gtsName = ((this.result as DataModel ?? new DataModel()).params ?? [])[gts.id]?.key ?? GTSLib.serializeGtsMetadata(gts);
      if (new RegExp(regexp).test(gtsName)) {
        this.hidden[gts.id] = true;
      }
    });
    this.drawMap(this.result as DataModel ?? new DataModel(), true);
    return Promise.resolve();
  }

  @Method()
  async hideById(id: number) {
    Object.keys(this.hidden).forEach(k => {
      if (new RegExp(id.toString()).test(k)) {
        this.hidden[k] = true;
      }
    });
    this.drawMap(this.result as DataModel ?? new DataModel(), true);
    return Promise.resolve();
  }

  @Method()
  async showById(id: number | string) {
    Object.keys(this.hidden).forEach(k => {
      if (new RegExp(id.toString()).test(k)) {
        this.hidden[k] = false;
      }
    });
    this.drawMap(this.result as DataModel ?? new DataModel(), true);
    return Promise.resolve();
  }

  // noinspection JSUnusedGlobalSymbols
  componentWillLoad() {
    this.parsing = true;
    this.LOG = new Logger(DiscoveryMapComponent, this.debug);
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    this.result = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit ?? 'us');
    this.LOG?.debug(['componentWillLoad'], {
      type: this.type,
      options: this.innerOptions,
      toDisplay: this.toDisplay,
    });
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h - 100;
    this.parsing = false;
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    this.drawMap(this.result as DataModel ?? new DataModel());
  }

  drawMap(data: DataModel, isRefresh = false, optionUpdate?: boolean) {
    let tilesPromise: Promise<void>;
    let zoomPromise: Promise<void>;
    this.tileLayers = [];
    let options = Utils.mergeDeep<Param>(this.defOptions, this.innerOptions ?? {});
    this.LOG?.debug(['drawMap', 'this.options 2 '], { ...data.globalParams });
    options = Utils.mergeDeep<Param>(options, data.globalParams ?? {});
    optionUpdate = JSON.stringify(options) !== JSON.stringify(this.innerOptions);
    this.innerOptions = Utils.clone(options);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit ?? 'us');
    if (this.map) {
      this.map.invalidateSize(true);
    }
    this.LOG?.debug(['drawMap', 'data'], data);
    this.LOG?.debug(['drawMap', 'this.height'], this.height);
    this.LOG?.debug(['drawMap', 'this.options'], { ...this.innerOptions });
    const dataList = GTSLib.flatDeep(GTSLib.flattenGtsIdArray(data.data as any[], 0).res);
    data.params = data.params ?? [];
    const params = data.params;
    this.mapOpts = this.innerOptions.map ?? {};
    dataList.forEach(g => {
      if (GTSLib.isGts(g)) {
        if (!this.hidden[g.id]) {
          this.hidden[g.id] = false;
        }
      }
    });
    this.pathData = MapLib.toLeafletMapPaths({
      gts: dataList,
      params,
      globalParams: this.innerOptions,
    }, this.hidden, this.innerOptions.scheme) ?? [];
    this.positionData = MapLib.toLeafletMapPositionArray({
      gts: dataList,
      params,
      globalParams: this.innerOptions,
    }, this.hidden, this.innerOptions.scheme) ?? [];
    this.geoJson = MapLib.toGeoJSON({ gts: dataList, params });
    if (this.mapOpts.mapType !== 'NONE') {
      const map = MapLib.mapTypes[this.mapOpts.mapType || 'DEFAULT'] ?? MapLib.mapTypes.DEFAULT;
      const mapOpts: TileLayerOptions = {
        maxNativeZoom: this.mapOpts.maxNativeZoom ?? 19,
        maxZoom: this.mapOpts.maxZoom ?? 40,
        edgeBufferTiles: 5,
      };
      if (map.attribution) {
        mapOpts.attribution = map.attribution;
      }
      if (map.subdomains) {
        mapOpts.subdomains = map.subdomains;
      }
      this.LOG?.debug(['displayMap'], { isRefresh, optionUpdate });
      if (!isRefresh || optionUpdate) {
        this.LOG?.debug(['displayMap'], 'map', map);
        this.tileLayers.push(map.link);
        if (!!this.tilesLayer && this.tilesLayer._url !== map.link) {
          this.tileLayerGroup.removeLayer(this.tilesLayer);
          this.tilesLayer = undefined;
        }
        if (!this.tilesLayer) {
          this.tilesLayer = Leaflet.tileLayer(map.link, mapOpts);
          this.tilesLayer.addTo(this.tileLayerGroup);
          tilesPromise = new Promise(resolve => setTimeout(() => this.tilesLayer.on('load', () => resolve())));
        }
      }
    }
    if (this.map) {
      this.LOG?.debug(['displayMap'], 'map exists');
      this.pathDataLayer.clearLayers();
      this.positionDataLayer.clearLayers();
      this.geoJsonLayer.clearLayers();
      this.heatmapLayer.clearLayers();
      this.shadowHeatmapLayer.clearLayers();
      this.poiLayer.clearLayers();
    } else {
      this.mainLayer = new Leaflet.LayerGroup([this.tileLayerGroup, this.heatmapLayer, this.geoJsonLayer, this.pathDataLayer, this.positionDataLayer]);
      this.map = Leaflet.map(this.mapElement, {
        preferCanvas: true,
        layers: this.mainLayer,
        zoomAnimation: true,
        maxBoundsViscocity: 1,
        worldCopyJump: true,
        maxBounds: new Leaflet.LatLngBounds(new Leaflet.latLng(-89.98155760646617, -180), new Leaflet.LatLng(89.99346179538875, 180)),
        maxZoom: this.mapOpts.maxZoom ?? 19,
      });
      this.geoJsonLayer.bringToBack();
      Leaflet.control.scale().addTo(this.map);
      this.map.on('load', () => this.LOG?.debug(['displayMap', 'load'], this.map.getCenter().lng, this.currentLong, this.map.getZoom()));
      this.map.on('zoomend', () => {
        if (!this.firstDraw) {
          this.currentZoom = this.map.getZoom();
          this.geoBounds.emit(this.map.getBounds().toBBoxString());
        }
      });
      this.map.on('moveend', () => {
        if (!this.firstDraw) {
          this.currentLat = this.map.getCenter().lat;
          this.currentLong = this.map.getCenter().lng;
        }
      });
    }
    const pathDataSize = (this.pathData ?? []).length;
    for (let i = 0; i < pathDataSize; i++) {
      const path = this.pathData[i];
      if (path) {
        this.updateGtsPath(path, data.params[i]);
      }
    }
    this.LOG?.debug(['displayMap'], 'pathData', this.pathData);
    const positionsSize = (this.positionData ?? []).length;
    for (let i = 0; i < positionsSize; i++) {
      const pData = this.positionData[i];
      if (pData) {
        this.updatePositionArray(pData, data.params[i], i);
      }
    }
    this.LOG?.debug(['displayMap'], 'positionData', this.positionData);
    (this.mapOpts.tiles ?? []).forEach(t => {
      this.LOG?.debug(['displayMap'], t);
      const tile: { url?: string, subdomains: string, maxNativeZoom: number, maxZoom: number } = {
        subdomains: 'abcd',
        maxNativeZoom: this.mapOpts.maxNativeZoom ?? 19,
        maxZoom: this.mapOpts.maxZoom ?? 19,
      };
      if (typeof t === 'string') {
        tile.url = t;
      } else if (typeof t === 'object') {
        tile.url = t.url;
        tile.maxZoom = this.mapOpts.maxZoom ?? 19;
        tile.maxNativeZoom = t.maxNativeZoom ?? this.mapOpts.maxNativeZoom ?? 19;
      }
      this.tileLayers.push(tile.url);
      const l = Leaflet.tileLayer(tile.url, {
        subdomains: 'abcd',
        maxNativeZoom: tile.maxNativeZoom ?? 19,
        maxZoom: this.mapOpts.maxZoom ?? 19,
      });


      if (!this.tileLayerGroup.getLayers().find((l: any) => l._url === t.url)) {
        this.tileLayerGroup.addLayer(l);
      }
    });
    if (!isRefresh || optionUpdate) {
      this.tileLayerGroup.getLayers().forEach((l: any) => {

        if (!this.tileLayers.includes(l._url)) {
          this.tileLayerGroup.removeLayer(l);
        }
      });
    }

    const geoJsonSize = (this.geoJson ?? []).length;
    for (let i = 0; i < geoJsonSize; i++) {
      const m = this.geoJson[i];
      if (m) {
        const color = ColorLib.getColor(i, this.innerOptions.scheme);
        const opts = {
          style: () => ({
            color: (data.params && data.params[i]) ? data.params[i].datasetColor ?? color : color,
            fillColor: (data.params && data.params[i])
              ? ColorLib.transparentize(data.params[i].fillColor ?? color)
              : ColorLib.transparentize(color),
          }),
        } as any;
        if (m.geometry.type === 'Point') {
          opts.pointToLayer = (geoJsonPoint: any, latlng: any) => Leaflet.marker(latlng, {
            icon: this.icon(color, (data.params && data.params[i]) ? (data.params[i].map ?? { marker: 'circle' }).marker : 'circle', (data.params && data.params[i]), 0),
            riseOnHover: true,
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
    }
    let hasHeatmap = false;
    // HeatMap
    const size = (dataList ?? []).length;
    for (let i = 0; i < size; i++) {
      let p = (params ?? [])[i];
      if (!p) {
        p = { ...new Param() };
      }
      if (!!p.map?.heatmap && dataList[i].v[0] && dataList[i].v[0].length >= 3) {
        const g = dataList[i];
        let max = Number.MIN_SAFE_INTEGER;
        let min = Number.MAX_SAFE_INTEGER;
        hasHeatmap = true;
        const hasHeatmapData = g.v.map((v: any[]) => {
          max = Math.max(max, v[v.length - 1]);
          min = Math.min(min, v[v.length - 1]);
          Leaflet.circleMarker([v[1], v[2]], { radius: 1 }).addTo(this.shadowHeatmapLayer);
          return [v[1], v[2], v[v.length - 1]];
        });
        Leaflet.heatLayer(hasHeatmapData, {
          radius: p.map?.heatRadius ?? this.innerOptions.map?.heatRadius ?? 25,
          minOpacity: p.map?.heatOpacity ?? this.innerOptions.map?.heatOpacity ?? 0.05,
          maxZoom: 0,
          max,
          blur: p.map?.heatBlur ?? this.innerOptions.map?.heatBlur ?? 15,
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
                  lat: this.mapOpts.startLat ?? this.bounds.getCenter().lat ?? 0,
                  lng: this.mapOpts.startLong ?? this.bounds.getCenter().lng ?? 0,
                }, this.mapOpts.startZoom ?? this.map.getBoundsZoom(this.bounds) ?? 10,
                { animate: true },
              );
            } else {
              this.map.setView({
                  lat: this.currentLat ?? this.mapOpts.startLat ?? 0,
                  lng: this.currentLong ?? this.mapOpts.startLong ?? 0,
                }, this.currentZoom ?? this.mapOpts.startZoom ?? 10,
                { animate: false });
            }
          } else if (this.map && this.bounds) {
            this.LOG?.debug(['displayMap', 'setView'], 'fitBounds', 'this.bounds', this.bounds);
            this.map.fitBounds(this.bounds, { padding: [1, 1], animate: false, duration: 0 });
          }
          this.currentLat = this.map.getCenter().lat;
          this.currentLong = this.map.getCenter().lng;
        } else {
          this.LOG?.debug(['displayMap', 'setView'], 'invalid bounds', { lat: this.currentLat, lng: this.currentLong });
          this.map.setView({
              lat: this.currentLat ?? this.mapOpts.startLat ?? 0,
              lng: this.currentLong ?? this.mapOpts.startLong ?? 0,
            }, this.currentZoom ?? this.mapOpts.startZoom ?? 10,
            {
              animate: false,
              duration: 0,
            },
          );
          zoomPromise = new Promise(resolve => this.map.once('moveend zoomend', () => resolve()));
        }
      }, 10);
    } else {
      this.LOG?.debug(['displayMap', 'no data'], 'lost', this.currentZoom, this.mapOpts.startZoom);
      if (!this.mapOpts.track) {
        this.currentLat = this.mapOpts.startLat ?? 0;
        this.currentLong = this.mapOpts.startLong ?? 0;
        this.currentZoom = this.mapOpts.startZoom ?? 2;
      }
      this.map.setView(
        [
          this.currentLat ?? this.mapOpts.startLat ?? 0,
          this.currentLong ?? this.mapOpts.startLong ?? 0,
        ],
        this.currentZoom ?? this.mapOpts.startZoom ?? 2,
        {
          animate: false,
          duration: 0,
        },
      );
      zoomPromise = new Promise(resolve => setTimeout(() => this.map.once('moveend zoomend', () => resolve())));
    }
    this.firstDraw = false;
    this.poiLayer.addTo(this.map);
    //  this.patchMapTileGapBug();
    void Promise.all([zoomPromise, tilesPromise])
      .then(() => setTimeout(() => {
        if (this.initial) {
          this.draw.emit();
          this.initial = false;
        }
      }, 500));
  }

  private icon(color: string, marker: string | string[] = '', param: Param, i: number): Leaflet.Icon {
    const c = `${ColorLib.sanitizeColor(color).slice(1)}`;
    let iconUrl: string;
    let iconSize = [20, 20];
    let iconAnchor = [10, 10];
    if (param?.map?.iconSize || this.innerOptions?.map?.iconSize) {
      const size = param?.map?.iconSize ?? this.innerOptions?.map?.iconSize ?? [48, 48];
      iconSize = GTSLib.isArray(size) ? size as number[] : [size as number, size as number];
      iconAnchor = [iconSize[0] / 2, iconSize[0] / 2];
    }
    const mark: string = GTSLib.isArray(marker) ? marker[i] ?? 'circle' : marker as string ?? 'circle';
    if (mark.startsWith('http') || mark.startsWith('data:image')) {
      iconUrl = mark;
    } else if (mark.startsWith('<svg')) {
      iconUrl = 'data:image/svg+xml;base64,' + window.btoa(mark);
    } else {
      iconAnchor = [10, 22];
      const margin = 2;
      if (param?.map?.iconSize || this.innerOptions?.map?.iconSize) {
        const size = param?.map?.iconSize ?? this.innerOptions?.map?.iconSize ?? iconSize;
        iconSize = GTSLib.isArray(size) ? size as number[] : [size as number, size as number];
        iconAnchor = [iconSize[0] / 2, iconSize[1] - margin];
      }
      iconUrl = `https://www.mapmarker.io/api/v2/font-awesome/v5/pin?icon=fa-${mark}-solid&size=${iconSize[0]}&color=fff&background=${c}`;
    }
    return Leaflet.icon({ iconUrl, iconAnchor, iconSize });
  }

  private getGTSDots(gts: any, param: Param) {
    const dots = [];
    let icon: any;
    let size: number;
    switch (gts.render) {
      case 'path': {
        icon = this.icon(gts.color, gts.marker, param, 0);
        size = (gts.path ?? []).length;
        for (let i = 0; i < size; i++) {
          const g = gts.path[i];
          if (i < size - 1 || !gts.marker) {
            const marker = Leaflet.circleMarker(
              g, {
                radius: gts.baseRadius ?? MapLib.BASE_RADIUS,
                color: gts.color,
                fillColor: gts.color,
                fillOpacity: 1,
                riseOnHover: true,
              },
            );
            this.addPopup(gts, g.val, g.ts, marker, 0);
            dots.push(marker);
          } else {
            const marker = Leaflet.marker(g, { icon, riseOnHover: true, opacity: 1 });
            this.addPopup(gts, g.val, g.ts, marker, icon.options.iconAnchor[1] * -1);
            dots.push(marker);
          }
        }
        break;
      }
      case 'marker':
        if (!GTSLib.isArray(gts.marker)) {
          icon = this.icon(gts.color, gts.marker, param, 0);
        }
        size = (gts.path ?? []).length;
        for (let i = 0; i < size; i++) {
          if (GTSLib.isArray(gts.marker)) {
            icon = this.icon(gts.color, gts.marker, param, i);
          }
          const g = gts.path[i];
          const marker = Leaflet.marker(g, { icon, riseOnHover: true, opacity: 1 });
          this.addPopup(gts, g.val, g.ts, marker, 0);
          dots.push(marker);
        }
        break;
      case 'weightedDots':
        size = (gts.path ?? []).length;
        for (let i = 0; i < size; i++) {
          const p = gts.path[i];
          let v = parseInt(p.val, 10);
          if (isNaN(v)) {
            v = 0;
          }
          const radius = 50 * v / ((gts.maxValue ?? 1) - (gts.minValue ?? 0));
          const marker = Leaflet.circleMarker(
            p, {
              radius: radius === 0 ? 1 : radius,
              color: gts.borderColor ?? 'transparent',
              fillColor: gts.color, fillOpacity: 0.5,
              riseOnHover: true,
              weight: 1,
            });
          this.addPopup(gts, p.val, p.ts, marker, 0);
          dots.push(marker);
        }
        break;
      case 'dots':
      default:
        size = (gts.path ?? []).length;
        for (let i = 0; i < size; i++) {
          const g = gts.path[i];
          const marker = Leaflet.circleMarker(
            g, {
              radius: gts.baseRadius ?? MapLib.BASE_RADIUS,
              color: gts.color,
              riseOnHover: true,
              fillColor: gts.color,
              fillOpacity: 1,
            },
          );
          this.addPopup(gts, g.val, g.ts, marker, 0);
          dots.push(marker);
        }
        break;
    }
    return dots;
  }

  private updateGtsPath(gts: any, param: Param) {
    const path = MapLib.pathDataToLeaflet(gts.path);
    const group = Leaflet.featureGroup();
    if ((path ?? []).length > 1 && !!gts.line && (gts.render === 'dots' || gts.render === 'path')) {
      if (this.mapOpts.animate) {
        group.addLayer(new AntPath(path ?? [], {
          delay: 800, dashArray: [10, 100],
          weight: 5, color: ColorLib.transparentize(gts.color, 0.5),
          pulseColor: gts.color,
          paused: false, reverse: false, hardwareAccelerated: true, hardwareAcceleration: true,
        }));
      } else {
        group.addLayer(Leaflet.polyline(path ?? [], { color: gts.color, opacity: 0.5 }));
      }
    }
    const dots = this.getGTSDots(gts, param);
    const size = (dots ?? []).length;
    for (let i = 0; i < size; i++) {
      group.addLayer(dots[i]);
    }
    this.pathDataLayer.addLayer(group);
  }

  private addPopup(positionData: any, value: any, ts: any, marker: any, offset: number) {
    if (positionData) {
      let date = ts;
      if (ts && (this.innerOptions.timeMode ?? 'date') === 'date') {
        date = (GTSLib.toISOString(ts ?? 0, this.divider, this.innerOptions.timeZone, this.innerOptions.timeFormat) ?? '')
          .replace('T', ' ').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '');
      }
      let content = '';
      content = `${date ? `<p>${date}</p>` : ''}<p><b>${positionData.key}</b>: ${value === 0 ? 0 : value ?? 'na'}</p>`;
      Object.keys(positionData.properties ?? [])
        .forEach(k => content += `<b>${k}</b>: ${decodeURIComponent(positionData.properties[k])}<br />`);

      if (positionData.tooltip[ts]) {
        content += positionData.tooltip[ts];
      }
      marker.on('mouseover', () => {
        marker.openPopup();
        this.markerOver = true;
        if (this.popupTimeout) {
          clearTimeout(this.popupTimeout);
        }
        this.popupTimeout = setTimeout(() => {
          if (marker.isPopupOpen() && !this.markerOver) marker.closePopup();
        }, this.innerOptions.tooltipDelay ?? 3000);
        this.dataPointOver.emit({
          date: ts,
          name: positionData.key,
          value,
          meta: positionData.properties,
        });
      });
      this.markersRef = { ...this.markersRef ?? {} };
      if (!this.markersRef[positionData.key]) {
        this.markersRef[positionData.key] = {};
      }
      this.markersRef[positionData.key][ts] = marker;
      marker.bindPopup(content, { autoClose: true, offset: new Leaflet.Point(0, offset) });
    }
    marker.on('mouseout', () => this.markerOver = false);
    marker.on('click', () => {
      const date = this.innerOptions.timeMode === 'date'
        ? GTSLib.zonedTimeToUtc(ts, 1, this.innerOptions.timeZone) * this.divider
        : ts;
      this.dataPointSelected.emit({ date, name: positionData.key, value, meta: positionData.properties });
      if (this.innerOptions.poi) {
        if (this.pois.find(p => p.lat === marker.getLatLng().lat && p.lng === marker.getLatLng().lng && p.name === positionData.key)) {
          this.pois = this.pois.filter(p => p.lat !== marker.getLatLng().lat && p.lng !== marker.getLatLng().lng && p.name !== positionData.key);
        } else {
          this.pois.push({
            date,
            name: positionData.key,
            value,
            meta: positionData.properties,
            uid: v4(),
            lat: marker.getLatLng().lat,
            lng: marker.getLatLng().lng,
          });
        }
        this.poiLayer.clearLayers();
        this.poi.emit(this.pois);
        this.pois.forEach(p => {
          const icon = this.icon(this.innerOptions.poiColor, undefined, this.innerOptions, 0);
          const m = Leaflet.marker([p.lat, p.lng], { icon, riseOnHover: true, opacity: 1 });
          this.poiLayer.addLayer(m);
        });
      }

    });
  }

  @Method()
  async setFocus(regexp: string, ts: number) {
    Object.keys(this.markersRef ?? {})
      .filter(s => new RegExp(regexp).test(s))
      .forEach(k => {
        if (this.markersRef[k][ts]) {
          this.markersRef[k][ts].openPopup();
        }
      });
    return Promise.resolve();
  }

  @Method()
  async unFocus() {
    Object.keys(this.markersRef)
      .forEach(k => {
        (Object.keys(this.markersRef[k] ?? {}))
          .forEach(ts => {
            if (this.markersRef[k][ts]) {
              if (this.markersRef[k][ts].isPopupOpen() && !this.markerOver) this.markersRef[k][ts].closePopup();
            }
          });
      });
    return Promise.resolve();
  }

  private updatePositionArray(positionData: any, param: Param, dataIndex: number) {
    const opts: { [key: string]: any } = {};

    if (this.mapOpts?.maxClusterRadius) opts.maxClusterRadius = this.mapOpts.maxClusterRadius;
    if (this.mapOpts?.clusterCustomIcon) {
      opts.iconCreateFunction = (cluster: any) => {
        const ico = this.icon(GTSLib.isArray(positionData.color) ? positionData.color[0] ?? ColorLib.getColor(dataIndex, this.innerOptions.scheme) : positionData.color, positionData.marker, param, 0);
        const icoHtmlElt = ico.createIcon();
        const icoW = parseInt(icoHtmlElt.style.getPropertyValue('width'), 10);
        const icoH = parseInt(icoHtmlElt.style.getPropertyValue('height'), 10);
        const icoMarginLeft = icoHtmlElt.style.getPropertyValue('margin-left');
        const icoMarginTop = icoHtmlElt.style.getPropertyValue('margin-top');
        // remove shift from ico, to apply it to the parent div later on
        icoHtmlElt.style.removeProperty('margin-left');
        icoHtmlElt.style.removeProperty('margin-top');
        // 30 pixel is hardcoded for the cluster child count indicator
        const html = `<div style="margin-left:${icoMarginLeft};margin-top:${icoMarginTop};">
                       <div style="position:absolute">${icoHtmlElt.outerHTML}</div>
                       <div style="position:absolute;left:${(icoW / 2) - 15}px;top:${(icoH / 2) - 15}px;width:30px;height:30px;border-radius:50%;background-color:rgba(255,255,255,0.8);text-align:center;line-height: 30px;">
                         ${cluster.getChildCount()}
                       </div>
                    </div>`;
        return Leaflet.divIcon({ html: html });
      };
    }

    const group = this.innerOptions.map?.cluster
      ? Leaflet.markerClusterGroup(opts)
      : Leaflet.featureGroup();
    const path = MapLib.updatePositionArrayToLeaflet(positionData.positions);
    if ((positionData.positions ?? []).length > 1 && !!positionData.line) {
      if (this.mapOpts.animate) {
        group.addLayer(antPath(path ?? [], {
          delay: 800, dashArray: [10, 100],
          weight: 5, color: ColorLib.transparentize(positionData.color, 0.5),
          pulseColor: positionData.color,
          paused: false, reverse: false, hardwareAccelerated: true, hardwareAcceleration: true,
        }));
      } else {
        group.addLayer(Leaflet.polyline(path ?? [], { color: positionData.color, opacity: 0.5 }));
      }
    }
    let icon: any;
    let result: number[];
    let inStep: number[];
    let size: number;
    this.LOG?.debug(['updatePositionArray'], positionData);

    switch (positionData.render) {
      case 'marker':
        size = (positionData.positions ?? []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          icon = this.icon(GTSLib.isArray(positionData.color) ? positionData.color[i] ?? ColorLib.getColor(dataIndex, this.innerOptions.scheme) : positionData.color, positionData.marker, param,
            GTSLib.isArray(positionData.marker) ? i : 0);
          const marker = Leaflet.marker({ lat: p[0], lng: p[1] }, { icon, riseOnHover: true, opacity: 1 });
          this.addPopup(positionData, p[2], undefined, marker, 0);
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
        size = (positionData.positions ?? []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const radius = (parseInt(p[2], 10) - (positionData.minValue ?? 0)) * 50 / (positionData.maxValue ?? 50);

          this.LOG?.debug(['updatePositionArray', 'coloredWeightedDots', 'radius'], positionData.baseRadius * p[4]);
          const marker = Leaflet.circleMarker(
            { lat: p[0], lng: p[1] },
            {
              radius,
              color: positionData.borderColor ?? positionData.color,
              fillColor: ColorLib.rgb2hex(
                positionData.colorGradient[p[5]].r,
                positionData.colorGradient[p[5]].g,
                positionData.colorGradient[p[5]].b),
              riseOnHover: true,
              fillOpacity: 0.3,
            });
          this.addPopup(positionData, p[2], undefined, marker, 0);
          group.addLayer(marker);
        }
        break;
      case 'weightedDots':
        size = (positionData.positions ?? []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const radius = (parseInt(p[2], 10) - (positionData.minValue ?? 0)) * 50 / (positionData.maxValue ?? 50);
          const marker = Leaflet.circleMarker(
            { lat: p[0], lng: p[1] }, {
              radius,
              color: positionData.borderColor ?? positionData.color,
              fillColor: positionData.color,
              weight: 2,
              riseOnHover: true,
              fillOpacity: 0.3,
            });
          this.addPopup(positionData, p[2], undefined, marker, 0);
          group.addLayer(marker);
        }
        break;
      case 'dots':
      default:
        size = (positionData.positions ?? []).length;
        for (let i = 0; i < size; i++) {
          const p = positionData.positions[i];
          const marker = Leaflet.circleMarker(
            { lat: p[0], lng: p[1] }, {
              radius: positionData.baseRadius ?? MapLib.BASE_RADIUS,
              color: positionData.borderColor ?? positionData.color,
              fillColor: positionData.color,
              weight: 2,
              riseOnHover: true,
              fillOpacity: 0.7,
            });
          this.addPopup(positionData, p[2] === 0 ? 0 : p[2] ?? 'na', undefined, marker, 0);
          group.addLayer(marker);
        }
        break;
    }
    this.positionDataLayer.addLayer(group);
  }

  render() {
    return <div class="map-container">
      <div ref={(el) => this.mapElement = el} />
    </div>;
  }

}
