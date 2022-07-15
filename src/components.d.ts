/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { DataModel } from "./model/dataModel";
import { ChartType, Dataset } from "./model/types";
import { Param } from "./model/param";
import { XAXisOption } from "echarts/types/dist/shared";
import { DiscoveryEvent } from "./model/discoveryEvent";
import { Dashboard } from "./model/dashboard";
import { Tile } from "./model/tile";
export namespace Components {
    interface DiscoveryAnnotation {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "setFocus": (regexp: string, ts: number) => Promise<void>;
        "setZoom": (dataZoom: { start: number; end: number; }) => Promise<void>;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unFocus": () => Promise<void>;
        "unit": string;
        "width": number;
    }
    interface DiscoveryBar {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "setFocus": (regexp: string, ts: number) => Promise<void>;
        "setZoom": (dataZoom: { start: number; end: number; }) => Promise<void>;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unFocus": () => Promise<void>;
        "unit": string;
        "width": number;
    }
    interface DiscoveryButton {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<any>;
        "height": number;
        "language": 'warpscript' | 'flows';
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "type": ChartType;
        "url": string;
        "vars": string;
        "width": number;
    }
    interface DiscoveryCalendar {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryDashboard {
        "autoRefresh": number;
        "cellHeight": number;
        "cols": number;
        "dashboardTitle": string;
        "debug": boolean;
        "getDashboardStructure": () => Promise<Dashboard>;
        "getPDF": (save?: boolean, output?: string) => Promise<any>;
        "options": Param | string;
        "type": 'scada' | 'dashboard' | 'flex';
        "url": string;
        "vars": any | string;
        "warpscript": string;
    }
    interface DiscoveryDisplay {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<any>;
        "height": number;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryGauge {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryHeatmap {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryHidden {
        "debug": boolean;
        "height": number;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryImage {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string[]>;
        "height": number;
        "options": Param | string;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryInput {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<any>;
        "height": number;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "type": ChartType;
        "url": string;
        "width": number;
    }
    interface DiscoveryLine {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "setFocus": (regexp: string, ts: number, value?: number) => Promise<void>;
        "setZoom": (dataZoom: { start: number; end: number; }) => Promise<void>;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unFocus": () => Promise<void>;
        "unit": string;
        "width": number;
    }
    interface DiscoveryLinearGauge {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<any>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unit": string;
        "vars": string;
        "width": number;
    }
    interface DiscoveryMap {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<any>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "setFocus": (regexp: string, ts: number) => Promise<void>;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unFocus": () => Promise<void>;
        "width": number;
    }
    interface DiscoveryModal {
        "data": Tile | Dashboard;
        "debug": boolean;
        "open": () => Promise<void>;
        "options": Param | string;
        "url": string;
    }
    interface DiscoveryPageable {
        "data": Dataset;
        "debug": boolean;
        "divider": number;
        "elemsCount": number;
        "options": Param;
        "windowed": number;
    }
    interface DiscoveryPie {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoverySlider {
        "debug": boolean;
        "export": (type: 'png' | 'svg', bgColor: string) => Promise<any>;
        "options": Param | string;
        "progress": boolean;
        "setValue": (value: number) => Promise<void>;
    }
    interface DiscoverySpinner {
        "message": string;
    }
    interface DiscoverySvg {
        "chartTitle": string;
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string | string[]>;
        "height": number;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "start": number;
        "type": ChartType;
        "unit": string;
        "url": string;
        "width": number;
    }
    interface DiscoveryTabular {
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<string>;
        "height": number;
        "options": Param | string;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryTile {
        "autoRefresh": number;
        "chartTitle": string;
        "debug": boolean;
        "exec": (refresh?: boolean) => Promise<unknown>;
        "export": (type?: 'png' | 'svg') => Promise<{ dataUrl: string; bgColor: string; }>;
        "hide": (regexp: string) => Promise<void>;
        "language": 'warpscript' | 'flows';
        "options": Param | string;
        "resize": () => Promise<void>;
        "setFocus": (regexp: string, ts: number, value?: number) => Promise<void>;
        "setZoom": (dataZoom: { start: number; end: number; }) => Promise<void>;
        "show": (regexp: string) => Promise<void>;
        "type": ChartType;
        "unFocus": () => Promise<void>;
        "unit": string;
        "url": string;
        "vars": string;
    }
    interface DiscoveryTileResult {
        "chartTitle": string;
        "debug": boolean;
        "export": (type?: 'png' | 'svg') => Promise<{ dataUrl: string; bgColor: string; }>;
        "height": number;
        "hide": (regexp: string) => Promise<void>;
        "language": 'warpscript' | 'flows';
        "options": Param | string;
        "parseEvents": () => Promise<void>;
        "resize": () => Promise<void>;
        "result": DataModel | string;
        "setFocus": (regexp: string, ts: number, value?: number) => Promise<void>;
        "setZoom": (dataZoom: { start: number; end: number; }) => Promise<void>;
        "show": (regexp: string) => Promise<void>;
        "start": number;
        "type": ChartType;
        "unFocus": () => Promise<void>;
        "unit": string;
        "url": string;
        "vars": string;
        "width": number;
    }
}
export interface DiscoveryAnnotationCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryAnnotationElement;
}
export interface DiscoveryBarCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryBarElement;
}
export interface DiscoveryButtonCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryButtonElement;
}
export interface DiscoveryCalendarCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryCalendarElement;
}
export interface DiscoveryDashboardCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryDashboardElement;
}
export interface DiscoveryDisplayCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryDisplayElement;
}
export interface DiscoveryGaugeCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryGaugeElement;
}
export interface DiscoveryHeatmapCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryHeatmapElement;
}
export interface DiscoveryHiddenCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryHiddenElement;
}
export interface DiscoveryImageCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryImageElement;
}
export interface DiscoveryInputCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryInputElement;
}
export interface DiscoveryLineCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryLineElement;
}
export interface DiscoveryLinearGaugeCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryLinearGaugeElement;
}
export interface DiscoveryMapCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryMapElement;
}
export interface DiscoveryPageableCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryPageableElement;
}
export interface DiscoveryPieCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryPieElement;
}
export interface DiscoverySliderCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoverySliderElement;
}
export interface DiscoverySvgCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoverySvgElement;
}
export interface DiscoveryTabularCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryTabularElement;
}
export interface DiscoveryTileCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryTileElement;
}
export interface DiscoveryTileResultCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLDiscoveryTileResultElement;
}
declare global {
    interface HTMLDiscoveryAnnotationElement extends Components.DiscoveryAnnotation, HTMLStencilElement {
    }
    var HTMLDiscoveryAnnotationElement: {
        prototype: HTMLDiscoveryAnnotationElement;
        new (): HTMLDiscoveryAnnotationElement;
    };
    interface HTMLDiscoveryBarElement extends Components.DiscoveryBar, HTMLStencilElement {
    }
    var HTMLDiscoveryBarElement: {
        prototype: HTMLDiscoveryBarElement;
        new (): HTMLDiscoveryBarElement;
    };
    interface HTMLDiscoveryButtonElement extends Components.DiscoveryButton, HTMLStencilElement {
    }
    var HTMLDiscoveryButtonElement: {
        prototype: HTMLDiscoveryButtonElement;
        new (): HTMLDiscoveryButtonElement;
    };
    interface HTMLDiscoveryCalendarElement extends Components.DiscoveryCalendar, HTMLStencilElement {
    }
    var HTMLDiscoveryCalendarElement: {
        prototype: HTMLDiscoveryCalendarElement;
        new (): HTMLDiscoveryCalendarElement;
    };
    interface HTMLDiscoveryDashboardElement extends Components.DiscoveryDashboard, HTMLStencilElement {
    }
    var HTMLDiscoveryDashboardElement: {
        prototype: HTMLDiscoveryDashboardElement;
        new (): HTMLDiscoveryDashboardElement;
    };
    interface HTMLDiscoveryDisplayElement extends Components.DiscoveryDisplay, HTMLStencilElement {
    }
    var HTMLDiscoveryDisplayElement: {
        prototype: HTMLDiscoveryDisplayElement;
        new (): HTMLDiscoveryDisplayElement;
    };
    interface HTMLDiscoveryGaugeElement extends Components.DiscoveryGauge, HTMLStencilElement {
    }
    var HTMLDiscoveryGaugeElement: {
        prototype: HTMLDiscoveryGaugeElement;
        new (): HTMLDiscoveryGaugeElement;
    };
    interface HTMLDiscoveryHeatmapElement extends Components.DiscoveryHeatmap, HTMLStencilElement {
    }
    var HTMLDiscoveryHeatmapElement: {
        prototype: HTMLDiscoveryHeatmapElement;
        new (): HTMLDiscoveryHeatmapElement;
    };
    interface HTMLDiscoveryHiddenElement extends Components.DiscoveryHidden, HTMLStencilElement {
    }
    var HTMLDiscoveryHiddenElement: {
        prototype: HTMLDiscoveryHiddenElement;
        new (): HTMLDiscoveryHiddenElement;
    };
    interface HTMLDiscoveryImageElement extends Components.DiscoveryImage, HTMLStencilElement {
    }
    var HTMLDiscoveryImageElement: {
        prototype: HTMLDiscoveryImageElement;
        new (): HTMLDiscoveryImageElement;
    };
    interface HTMLDiscoveryInputElement extends Components.DiscoveryInput, HTMLStencilElement {
    }
    var HTMLDiscoveryInputElement: {
        prototype: HTMLDiscoveryInputElement;
        new (): HTMLDiscoveryInputElement;
    };
    interface HTMLDiscoveryLineElement extends Components.DiscoveryLine, HTMLStencilElement {
    }
    var HTMLDiscoveryLineElement: {
        prototype: HTMLDiscoveryLineElement;
        new (): HTMLDiscoveryLineElement;
    };
    interface HTMLDiscoveryLinearGaugeElement extends Components.DiscoveryLinearGauge, HTMLStencilElement {
    }
    var HTMLDiscoveryLinearGaugeElement: {
        prototype: HTMLDiscoveryLinearGaugeElement;
        new (): HTMLDiscoveryLinearGaugeElement;
    };
    interface HTMLDiscoveryMapElement extends Components.DiscoveryMap, HTMLStencilElement {
    }
    var HTMLDiscoveryMapElement: {
        prototype: HTMLDiscoveryMapElement;
        new (): HTMLDiscoveryMapElement;
    };
    interface HTMLDiscoveryModalElement extends Components.DiscoveryModal, HTMLStencilElement {
    }
    var HTMLDiscoveryModalElement: {
        prototype: HTMLDiscoveryModalElement;
        new (): HTMLDiscoveryModalElement;
    };
    interface HTMLDiscoveryPageableElement extends Components.DiscoveryPageable, HTMLStencilElement {
    }
    var HTMLDiscoveryPageableElement: {
        prototype: HTMLDiscoveryPageableElement;
        new (): HTMLDiscoveryPageableElement;
    };
    interface HTMLDiscoveryPieElement extends Components.DiscoveryPie, HTMLStencilElement {
    }
    var HTMLDiscoveryPieElement: {
        prototype: HTMLDiscoveryPieElement;
        new (): HTMLDiscoveryPieElement;
    };
    interface HTMLDiscoverySliderElement extends Components.DiscoverySlider, HTMLStencilElement {
    }
    var HTMLDiscoverySliderElement: {
        prototype: HTMLDiscoverySliderElement;
        new (): HTMLDiscoverySliderElement;
    };
    interface HTMLDiscoverySpinnerElement extends Components.DiscoverySpinner, HTMLStencilElement {
    }
    var HTMLDiscoverySpinnerElement: {
        prototype: HTMLDiscoverySpinnerElement;
        new (): HTMLDiscoverySpinnerElement;
    };
    interface HTMLDiscoverySvgElement extends Components.DiscoverySvg, HTMLStencilElement {
    }
    var HTMLDiscoverySvgElement: {
        prototype: HTMLDiscoverySvgElement;
        new (): HTMLDiscoverySvgElement;
    };
    interface HTMLDiscoveryTabularElement extends Components.DiscoveryTabular, HTMLStencilElement {
    }
    var HTMLDiscoveryTabularElement: {
        prototype: HTMLDiscoveryTabularElement;
        new (): HTMLDiscoveryTabularElement;
    };
    interface HTMLDiscoveryTileElement extends Components.DiscoveryTile, HTMLStencilElement {
    }
    var HTMLDiscoveryTileElement: {
        prototype: HTMLDiscoveryTileElement;
        new (): HTMLDiscoveryTileElement;
    };
    interface HTMLDiscoveryTileResultElement extends Components.DiscoveryTileResult, HTMLStencilElement {
    }
    var HTMLDiscoveryTileResultElement: {
        prototype: HTMLDiscoveryTileResultElement;
        new (): HTMLDiscoveryTileResultElement;
    };
    interface HTMLElementTagNameMap {
        "discovery-annotation": HTMLDiscoveryAnnotationElement;
        "discovery-bar": HTMLDiscoveryBarElement;
        "discovery-button": HTMLDiscoveryButtonElement;
        "discovery-calendar": HTMLDiscoveryCalendarElement;
        "discovery-dashboard": HTMLDiscoveryDashboardElement;
        "discovery-display": HTMLDiscoveryDisplayElement;
        "discovery-gauge": HTMLDiscoveryGaugeElement;
        "discovery-heatmap": HTMLDiscoveryHeatmapElement;
        "discovery-hidden": HTMLDiscoveryHiddenElement;
        "discovery-image": HTMLDiscoveryImageElement;
        "discovery-input": HTMLDiscoveryInputElement;
        "discovery-line": HTMLDiscoveryLineElement;
        "discovery-linear-gauge": HTMLDiscoveryLinearGaugeElement;
        "discovery-map": HTMLDiscoveryMapElement;
        "discovery-modal": HTMLDiscoveryModalElement;
        "discovery-pageable": HTMLDiscoveryPageableElement;
        "discovery-pie": HTMLDiscoveryPieElement;
        "discovery-slider": HTMLDiscoverySliderElement;
        "discovery-spinner": HTMLDiscoverySpinnerElement;
        "discovery-svg": HTMLDiscoverySvgElement;
        "discovery-tabular": HTMLDiscoveryTabularElement;
        "discovery-tile": HTMLDiscoveryTileElement;
        "discovery-tile-result": HTMLDiscoveryTileResultElement;
    }
}
declare namespace LocalJSX {
    interface DiscoveryAnnotation {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryAnnotationCustomEvent<any>) => void;
        "onDataZoom"?: (event: DiscoveryAnnotationCustomEvent<{ start: number, end: number, min: number, max: number }>) => void;
        "onDraw"?: (event: DiscoveryAnnotationCustomEvent<void>) => void;
        "onTimeBounds"?: (event: DiscoveryAnnotationCustomEvent<any>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryBar {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryBarCustomEvent<any>) => void;
        "onDataZoom"?: (event: DiscoveryBarCustomEvent<{ start: number, end: number, min: number, max: number }>) => void;
        "onDraw"?: (event: DiscoveryBarCustomEvent<void>) => void;
        "onLeftMarginComputed"?: (event: DiscoveryBarCustomEvent<number>) => void;
        "onTimeBounds"?: (event: DiscoveryBarCustomEvent<any>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryButton {
        "debug"?: boolean;
        "height"?: number;
        "language"?: 'warpscript' | 'flows';
        "onDiscoveryEvent"?: (event: DiscoveryButtonCustomEvent<DiscoveryEvent>) => void;
        "onDraw"?: (event: DiscoveryButtonCustomEvent<void>) => void;
        "onExecResult"?: (event: DiscoveryButtonCustomEvent<any[]>) => void;
        "onStatusError"?: (event: DiscoveryButtonCustomEvent<any>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "url"?: string;
        "vars"?: string;
        "width"?: number;
    }
    interface DiscoveryCalendar {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryCalendarCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryCalendarCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryDashboard {
        "autoRefresh"?: number;
        "cellHeight"?: number;
        "cols"?: number;
        "dashboardTitle"?: string;
        "debug"?: boolean;
        "onRendered"?: (event: DiscoveryDashboardCustomEvent<void>) => void;
        "onStatusError"?: (event: DiscoveryDashboardCustomEvent<any>) => void;
        "onStatusHeaders"?: (event: DiscoveryDashboardCustomEvent<string[]>) => void;
        "options"?: Param | string;
        "type"?: 'scada' | 'dashboard' | 'flex';
        "url"?: string;
        "vars"?: any | string;
        "warpscript"?: string;
    }
    interface DiscoveryDisplay {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: DiscoveryDisplayCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryGauge {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryGaugeCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryGaugeCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryHeatmap {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryHeatmapCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryHeatmapCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryHidden {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: DiscoveryHiddenCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryImage {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: DiscoveryImageCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryInput {
        "debug"?: boolean;
        "height"?: number;
        "onDiscoveryEvent"?: (event: DiscoveryInputCustomEvent<DiscoveryEvent>) => void;
        "onDraw"?: (event: DiscoveryInputCustomEvent<void>) => void;
        "onExecResult"?: (event: DiscoveryInputCustomEvent<any[]>) => void;
        "onStatusError"?: (event: DiscoveryInputCustomEvent<any>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "url"?: string;
        "width"?: number;
    }
    interface DiscoveryLine {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryLineCustomEvent<any>) => void;
        "onDataZoom"?: (event: DiscoveryLineCustomEvent<{ start: number, end: number, min: number, max: number }>) => void;
        "onDraw"?: (event: DiscoveryLineCustomEvent<void>) => void;
        "onLeftMarginComputed"?: (event: DiscoveryLineCustomEvent<number>) => void;
        "onTimeBounds"?: (event: DiscoveryLineCustomEvent<any>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryLinearGauge {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryLinearGaugeCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryLinearGaugeCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "vars"?: string;
        "width"?: number;
    }
    interface DiscoveryMap {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryMapCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryMapCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "width"?: number;
    }
    interface DiscoveryModal {
        "data"?: Tile | Dashboard;
        "debug"?: boolean;
        "options"?: Param | string;
        "url"?: string;
    }
    interface DiscoveryPageable {
        "data"?: Dataset;
        "debug"?: boolean;
        "divider"?: number;
        "elemsCount"?: number;
        "onDataPointOver"?: (event: DiscoveryPageableCustomEvent<any>) => void;
        "options"?: Param;
        "windowed"?: number;
    }
    interface DiscoveryPie {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryPieCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryPieCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoverySlider {
        "debug"?: boolean;
        "onStartDrag"?: (event: DiscoverySliderCustomEvent<void>) => void;
        "onValueChanged"?: (event: DiscoverySliderCustomEvent<number>) => void;
        "options"?: Param | string;
        "progress"?: boolean;
    }
    interface DiscoverySpinner {
        "message"?: string;
    }
    interface DiscoverySvg {
        "chartTitle"?: string;
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: DiscoverySvgCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "start"?: number;
        "type"?: ChartType;
        "unit"?: string;
        "url"?: string;
        "width"?: number;
    }
    interface DiscoveryTabular {
        "debug"?: boolean;
        "height"?: number;
        "onDataPointOver"?: (event: DiscoveryTabularCustomEvent<any>) => void;
        "onDraw"?: (event: DiscoveryTabularCustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryTile {
        "autoRefresh"?: number;
        "chartTitle"?: string;
        "debug"?: boolean;
        "language"?: 'warpscript' | 'flows';
        "onExecResult"?: (event: DiscoveryTileCustomEvent<string>) => void;
        "onStatusError"?: (event: DiscoveryTileCustomEvent<any>) => void;
        "onStatusHeaders"?: (event: DiscoveryTileCustomEvent<string[]>) => void;
        "options"?: Param | string;
        "type"?: ChartType;
        "unit"?: string;
        "url"?: string;
        "vars"?: string;
    }
    interface DiscoveryTileResult {
        "chartTitle"?: string;
        "debug"?: boolean;
        "height"?: number;
        "language"?: 'warpscript' | 'flows';
        "onDiscoveryEvent"?: (event: DiscoveryTileResultCustomEvent<DiscoveryEvent>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "start"?: number;
        "type"?: ChartType;
        "unit"?: string;
        "url"?: string;
        "vars"?: string;
        "width"?: number;
    }
    interface IntrinsicElements {
        "discovery-annotation": DiscoveryAnnotation;
        "discovery-bar": DiscoveryBar;
        "discovery-button": DiscoveryButton;
        "discovery-calendar": DiscoveryCalendar;
        "discovery-dashboard": DiscoveryDashboard;
        "discovery-display": DiscoveryDisplay;
        "discovery-gauge": DiscoveryGauge;
        "discovery-heatmap": DiscoveryHeatmap;
        "discovery-hidden": DiscoveryHidden;
        "discovery-image": DiscoveryImage;
        "discovery-input": DiscoveryInput;
        "discovery-line": DiscoveryLine;
        "discovery-linear-gauge": DiscoveryLinearGauge;
        "discovery-map": DiscoveryMap;
        "discovery-modal": DiscoveryModal;
        "discovery-pageable": DiscoveryPageable;
        "discovery-pie": DiscoveryPie;
        "discovery-slider": DiscoverySlider;
        "discovery-spinner": DiscoverySpinner;
        "discovery-svg": DiscoverySvg;
        "discovery-tabular": DiscoveryTabular;
        "discovery-tile": DiscoveryTile;
        "discovery-tile-result": DiscoveryTileResult;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "discovery-annotation": LocalJSX.DiscoveryAnnotation & JSXBase.HTMLAttributes<HTMLDiscoveryAnnotationElement>;
            "discovery-bar": LocalJSX.DiscoveryBar & JSXBase.HTMLAttributes<HTMLDiscoveryBarElement>;
            "discovery-button": LocalJSX.DiscoveryButton & JSXBase.HTMLAttributes<HTMLDiscoveryButtonElement>;
            "discovery-calendar": LocalJSX.DiscoveryCalendar & JSXBase.HTMLAttributes<HTMLDiscoveryCalendarElement>;
            "discovery-dashboard": LocalJSX.DiscoveryDashboard & JSXBase.HTMLAttributes<HTMLDiscoveryDashboardElement>;
            "discovery-display": LocalJSX.DiscoveryDisplay & JSXBase.HTMLAttributes<HTMLDiscoveryDisplayElement>;
            "discovery-gauge": LocalJSX.DiscoveryGauge & JSXBase.HTMLAttributes<HTMLDiscoveryGaugeElement>;
            "discovery-heatmap": LocalJSX.DiscoveryHeatmap & JSXBase.HTMLAttributes<HTMLDiscoveryHeatmapElement>;
            "discovery-hidden": LocalJSX.DiscoveryHidden & JSXBase.HTMLAttributes<HTMLDiscoveryHiddenElement>;
            "discovery-image": LocalJSX.DiscoveryImage & JSXBase.HTMLAttributes<HTMLDiscoveryImageElement>;
            "discovery-input": LocalJSX.DiscoveryInput & JSXBase.HTMLAttributes<HTMLDiscoveryInputElement>;
            "discovery-line": LocalJSX.DiscoveryLine & JSXBase.HTMLAttributes<HTMLDiscoveryLineElement>;
            "discovery-linear-gauge": LocalJSX.DiscoveryLinearGauge & JSXBase.HTMLAttributes<HTMLDiscoveryLinearGaugeElement>;
            "discovery-map": LocalJSX.DiscoveryMap & JSXBase.HTMLAttributes<HTMLDiscoveryMapElement>;
            "discovery-modal": LocalJSX.DiscoveryModal & JSXBase.HTMLAttributes<HTMLDiscoveryModalElement>;
            "discovery-pageable": LocalJSX.DiscoveryPageable & JSXBase.HTMLAttributes<HTMLDiscoveryPageableElement>;
            "discovery-pie": LocalJSX.DiscoveryPie & JSXBase.HTMLAttributes<HTMLDiscoveryPieElement>;
            "discovery-slider": LocalJSX.DiscoverySlider & JSXBase.HTMLAttributes<HTMLDiscoverySliderElement>;
            "discovery-spinner": LocalJSX.DiscoverySpinner & JSXBase.HTMLAttributes<HTMLDiscoverySpinnerElement>;
            "discovery-svg": LocalJSX.DiscoverySvg & JSXBase.HTMLAttributes<HTMLDiscoverySvgElement>;
            "discovery-tabular": LocalJSX.DiscoveryTabular & JSXBase.HTMLAttributes<HTMLDiscoveryTabularElement>;
            "discovery-tile": LocalJSX.DiscoveryTile & JSXBase.HTMLAttributes<HTMLDiscoveryTileElement>;
            "discovery-tile-result": LocalJSX.DiscoveryTileResult & JSXBase.HTMLAttributes<HTMLDiscoveryTileResultElement>;
        }
    }
}
