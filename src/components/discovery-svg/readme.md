# discovery-svg



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default       |
| ------------ | ------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `chartTitle` | `chart-title` |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`   |
| `debug`      | `debug`       |             | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`       |
| `height`     | `height`      |             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`   |
| `options`    | `options`     |             | `Param \| string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `new Param()` |
| `result`     | `result`      |             | `DataModel \| string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `undefined`   |
| `start`      | `start`       |             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`   |
| `type`       | `type`        |             | `"line" \| "area" \| "scatter" \| "step-area" \| "spline-area" \| "spline" \| "step" \| "step-after" \| "step-before" \| "annotation" \| "bar" \| "display" \| "image" \| "map" \| "gauge" \| "linear-gauge" \| "circle" \| "compass" \| "pie" \| "plot" \| "doughnut" \| "rose" \| "tabular" \| "svg" \| "input:text" \| "input:list" \| "input:secret" \| "input:autocomplete" \| "input:slider" \| "input:date" \| "input:date-range" \| "input:multi" \| "input:multi-cb" \| "button" \| "button:radio" \| "hidden" \| "calendar" \| "heatmap"` | `undefined`   |
| `unit`       | `unit`        |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `''`          |
| `url`        | `url`         |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`   |
| `width`      | `width`       |             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`   |


## Events

| Event  | Description | Type                |
| ------ | ----------- | ------------------- |
| `draw` |             | `CustomEvent<void>` |


## Methods

### `export(type?: 'png' | 'svg') => Promise<string | string[]>`



#### Returns

Type: `Promise<string | string[]>`



### `resize() => Promise<void>`



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
  discovery-svg --> discovery-spinner
  discovery-tile-result --> discovery-svg
  style discovery-svg fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
