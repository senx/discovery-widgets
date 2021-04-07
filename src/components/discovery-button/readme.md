# discovery-button



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                                                                                                                                                                                                                               | Default       |
| --------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `debug`   | `debug`   |             | `boolean`                                                                                                                                                                                                                                          | `false`       |
| `height`  | `height`  |             | `number`                                                                                                                                                                                                                                           | `undefined`   |
| `options` | `options` |             | `Param \| string`                                                                                                                                                                                                                                  | `new Param()` |
| `result`  | `result`  |             | `DataModel \| string`                                                                                                                                                                                                                              | `undefined`   |
| `type`    | `type`    |             | `"annotation" \| "area" \| "bar" \| "button" \| "circle" \| "display" \| "doughnut" \| "gauge" \| "image" \| "line" \| "map" \| "pie" \| "rose" \| "scatter" \| "spline" \| "spline-area" \| "step" \| "step-after" \| "step-before" \| "tabular"` | `undefined`   |
| `url`     | `url`     |             | `string`                                                                                                                                                                                                                                           | `undefined`   |
| `width`   | `width`   |             | `number`                                                                                                                                                                                                                                           | `undefined`   |


## Events

| Event         | Description | Type                 |
| ------------- | ----------- | -------------------- |
| `draw`        |             | `CustomEvent<void>`  |
| `execResult`  |             | `CustomEvent<any[]>` |
| `statusError` |             | `CustomEvent<any>`   |


## Dependencies

### Used by

 - [discovery-tile-result](../discovery-tile-result)

### Graph
```mermaid
graph TD;
  discovery-tile-result --> discovery-button
  style discovery-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
