/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface DiscoveryChartLine {
        "height": number;
        "result": string;
        "width": number;
    }
    interface DiscoveryTile {
        "type": 'line';
        "url": string;
    }
    interface DiscoveryTileResult {
        "height": number;
        "result": string;
        "start": number;
        "type": 'line';
        "width": number;
    }
}
declare global {
    interface HTMLDiscoveryChartLineElement extends Components.DiscoveryChartLine, HTMLStencilElement {
    }
    var HTMLDiscoveryChartLineElement: {
        prototype: HTMLDiscoveryChartLineElement;
        new (): HTMLDiscoveryChartLineElement;
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
        "discovery-chart-line": HTMLDiscoveryChartLineElement;
        "discovery-tile": HTMLDiscoveryTileElement;
        "discovery-tile-result": HTMLDiscoveryTileResultElement;
    }
}
declare namespace LocalJSX {
    interface DiscoveryChartLine {
        "height"?: number;
        "onDraw"?: (event: CustomEvent<void>) => void;
        "result"?: string;
        "width"?: number;
    }
    interface DiscoveryTile {
        "onStatusHeaders"?: (event: CustomEvent<string[]>) => void;
        "type"?: 'line';
        "url"?: string;
    }
    interface DiscoveryTileResult {
        "height"?: number;
        "result"?: string;
        "start"?: number;
        "type"?: 'line';
        "width"?: number;
    }
    interface IntrinsicElements {
        "discovery-chart-line": DiscoveryChartLine;
        "discovery-tile": DiscoveryTile;
        "discovery-tile-result": DiscoveryTileResult;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "discovery-chart-line": LocalJSX.DiscoveryChartLine & JSXBase.HTMLAttributes<HTMLDiscoveryChartLineElement>;
            "discovery-tile": LocalJSX.DiscoveryTile & JSXBase.HTMLAttributes<HTMLDiscoveryTileElement>;
            "discovery-tile-result": LocalJSX.DiscoveryTileResult & JSXBase.HTMLAttributes<HTMLDiscoveryTileResultElement>;
        }
    }
}
