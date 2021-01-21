/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { DataModel } from "./model/dataModel";
import { ChartType } from "./model/types";
import { Param } from "./model/param";
export namespace Components {
    interface DiscoveryAnnotation {
        "debug": boolean;
        "height": number;
        "options": Param | string;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryBar {
        "debug": boolean;
        "height": number;
        "options": Param | string;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryDisplay {
        "debug": boolean;
        "height": number;
        "options": Param | string;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoveryLine {
        "debug": boolean;
        "height": number;
        "options": Param | string;
        "result": DataModel | string;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
    interface DiscoverySpinner {
        "message": string;
    }
    interface DiscoveryTile {
        "debug": boolean;
        "language": 'warpscript' | 'flows';
        "options": Param | string;
        "type": ChartType;
        "unit": string;
        "url": string;
    }
    interface DiscoveryTileResult {
        "debug": boolean;
        "height": number;
        "options": Param | string;
        "result": DataModel | string;
        "start": number;
        "type": ChartType;
        "unit": string;
        "width": number;
    }
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
    interface HTMLDiscoveryDisplayElement extends Components.DiscoveryDisplay, HTMLStencilElement {
    }
    var HTMLDiscoveryDisplayElement: {
        prototype: HTMLDiscoveryDisplayElement;
        new (): HTMLDiscoveryDisplayElement;
    };
    interface HTMLDiscoveryLineElement extends Components.DiscoveryLine, HTMLStencilElement {
    }
    var HTMLDiscoveryLineElement: {
        prototype: HTMLDiscoveryLineElement;
        new (): HTMLDiscoveryLineElement;
    };
    interface HTMLDiscoverySpinnerElement extends Components.DiscoverySpinner, HTMLStencilElement {
    }
    var HTMLDiscoverySpinnerElement: {
        prototype: HTMLDiscoverySpinnerElement;
        new (): HTMLDiscoverySpinnerElement;
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
        "discovery-display": HTMLDiscoveryDisplayElement;
        "discovery-line": HTMLDiscoveryLineElement;
        "discovery-spinner": HTMLDiscoverySpinnerElement;
        "discovery-tile": HTMLDiscoveryTileElement;
        "discovery-tile-result": HTMLDiscoveryTileResultElement;
    }
}
declare namespace LocalJSX {
    interface DiscoveryAnnotation {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: CustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryBar {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: CustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryDisplay {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: CustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoveryLine {
        "debug"?: boolean;
        "height"?: number;
        "onDraw"?: (event: CustomEvent<void>) => void;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface DiscoverySpinner {
        "message"?: string;
    }
    interface DiscoveryTile {
        "debug"?: boolean;
        "language"?: 'warpscript' | 'flows';
        "onStatusHeaders"?: (event: CustomEvent<string[]>) => void;
        "options"?: Param | string;
        "type"?: ChartType;
        "unit"?: string;
        "url"?: string;
    }
    interface DiscoveryTileResult {
        "debug"?: boolean;
        "height"?: number;
        "options"?: Param | string;
        "result"?: DataModel | string;
        "start"?: number;
        "type"?: ChartType;
        "unit"?: string;
        "width"?: number;
    }
    interface IntrinsicElements {
        "discovery-annotation": DiscoveryAnnotation;
        "discovery-bar": DiscoveryBar;
        "discovery-display": DiscoveryDisplay;
        "discovery-line": DiscoveryLine;
        "discovery-spinner": DiscoverySpinner;
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
            "discovery-display": LocalJSX.DiscoveryDisplay & JSXBase.HTMLAttributes<HTMLDiscoveryDisplayElement>;
            "discovery-line": LocalJSX.DiscoveryLine & JSXBase.HTMLAttributes<HTMLDiscoveryLineElement>;
            "discovery-spinner": LocalJSX.DiscoverySpinner & JSXBase.HTMLAttributes<HTMLDiscoverySpinnerElement>;
            "discovery-tile": LocalJSX.DiscoveryTile & JSXBase.HTMLAttributes<HTMLDiscoveryTileElement>;
            "discovery-tile-result": LocalJSX.DiscoveryTileResult & JSXBase.HTMLAttributes<HTMLDiscoveryTileResultElement>;
        }
    }
}
