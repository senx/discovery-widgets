# discovery-tile



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description | Type                                                                                                                                                                                                                                               | Default        |
| ------------- | -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `autoRefresh` | `auto-refresh` |             | `number`                                                                                                                                                                                                                                           | `-1`           |
| `chartTitle`  | `chart-title`  |             | `string`                                                                                                                                                                                                                                           | `undefined`    |
| `debug`       | `debug`        |             | `boolean`                                                                                                                                                                                                                                          | `false`        |
| `language`    | `language`     |             | `"flows" \| "warpscript"`                                                                                                                                                                                                                          | `'warpscript'` |
| `options`     | `options`      |             | `Param \| string`                                                                                                                                                                                                                                  | `new Param()`  |
| `type`        | `type`         |             | `"annotation" \| "area" \| "bar" \| "button" \| "circle" \| "display" \| "doughnut" \| "gauge" \| "image" \| "line" \| "map" \| "pie" \| "rose" \| "scatter" \| "spline" \| "spline-area" \| "step" \| "step-after" \| "step-before" \| "tabular"` | `undefined`    |
| `unit`        | `unit`         |             | `string`                                                                                                                                                                                                                                           | `''`           |
| `url`         | `url`          |             | `string`                                                                                                                                                                                                                                           | `undefined`    |


## Events

| Event           | Description | Type                    |
| --------------- | ----------- | ----------------------- |
| `statusError`   |             | `CustomEvent<any>`      |
| `statusHeaders` |             | `CustomEvent<string[]>` |


## Dependencies

### Used by

 - [discovery-dashboard](../discovery-dashboard)

### Depends on

- [discovery-tile-result](../discovery-tile-result)
- [discovery-spinner](../discovery-spinner)

### Graph
```mermaid
graph TD;
  discovery-tile --> discovery-tile-result
  discovery-tile --> discovery-spinner
  discovery-tile-result --> discovery-line
  discovery-tile-result --> discovery-annotation
  discovery-tile-result --> discovery-bar
  discovery-tile-result --> discovery-display
  discovery-tile-result --> discovery-map
  discovery-tile-result --> discovery-image
  discovery-tile-result --> discovery-button
  discovery-tile-result --> discovery-gauge
  discovery-tile-result --> discovery-pie
  discovery-tile-result --> discovery-tabular
  discovery-line --> discovery-spinner
  discovery-annotation --> discovery-spinner
  discovery-bar --> discovery-spinner
  discovery-display --> discovery-spinner
  discovery-image --> discovery-spinner
  discovery-gauge --> discovery-spinner
  discovery-pie --> discovery-spinner
  discovery-tabular --> discovery-spinner
  discovery-tabular --> discovery-pageable
  discovery-dashboard --> discovery-tile
  style discovery-tile fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
