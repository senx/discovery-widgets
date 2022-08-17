# discovery-bar



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default                              |
| --------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `debug`   | `debug`   |             | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `false`                              |
| `height`  | `height`  |             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`                          |
| `options` | `options` |             | `Param \| string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `{...new Param(), timeMode: 'date'}` |
| `result`  | `result`  |             | `DataModel \| string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`                          |
| `type`    | `type`    |             | `"line" \| "area" \| "scatter" \| "step-area" \| "spline-area" \| "spline" \| "step" \| "step-after" \| "step-before" \| "annotation" \| "bar" \| "display" \| "image" \| "map" \| "gauge" \| "linear-gauge" \| "circle" \| "compass" \| "pie" \| "plot" \| "doughnut" \| "rose" \| "tabular" \| "svg" \| "input:text" \| "input:list" \| "input:secret" \| "input:autocomplete" \| "input:slider" \| "input:date" \| "input:date-range" \| "input:multi" \| "input:multi-cb" \| "button" \| "button:radio" \| "hidden" \| "calendar" \| "heatmap" \| "profile"` | `undefined`                          |
| `unit`    | `unit`    |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`                          |
| `width`   | `width`   |             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`                          |


## Events

| Event                | Description | Type                                                                     |
| -------------------- | ----------- | ------------------------------------------------------------------------ |
| `dataPointOver`      |             | `CustomEvent<any>`                                                       |
| `dataZoom`           |             | `CustomEvent<{ start: number; end: number; min: number; max: number; }>` |
| `draw`               |             | `CustomEvent<void>`                                                      |
| `leftMarginComputed` |             | `CustomEvent<number>`                                                    |
| `timeBounds`         |             | `CustomEvent<any>`                                                       |


## Methods

### `export(type?: 'png' | 'svg') => Promise<string>`



#### Returns

Type: `Promise<string>`



### `hide(regexp: string) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `resize() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setFocus(regexp: string, ts: number) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setZoom(dataZoom: { start: number; end: number; }) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `show(regexp: string) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `unFocus() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [discovery-tile-result](../discovery-tile-result)

### Depends on

- [discovery-spinner](../discovery-spinner)

### Graph
```mermaid
graph TD;
  discovery-bar --> discovery-spinner
  discovery-tile-result --> discovery-bar
  style discovery-bar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
