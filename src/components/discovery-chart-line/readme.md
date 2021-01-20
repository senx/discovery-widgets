# discovery-chart-line



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                                                                                       | Default       |
| --------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| `debug`   | `debug`   |             | `boolean`                                                                                                  | `false`       |
| `height`  | `height`  |             | `number`                                                                                                   | `undefined`   |
| `options` | --        |             | `Param`                                                                                                    | `new Param()` |
| `result`  | `result`  |             | `string`                                                                                                   | `undefined`   |
| `type`    | `type`    |             | `"annotation" \| "area" \| "line" \| "spline" \| "spline-area" \| "step" \| "step-after" \| "step-before"` | `undefined`   |
| `width`   | `width`   |             | `number`                                                                                                   | `undefined`   |


## Events

| Event  | Description | Type                |
| ------ | ----------- | ------------------- |
| `draw` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [discovery-tile-result](../discovery-tile-result)

### Depends on

- [discovery-spinner](../discovery-spinner)

### Graph
```mermaid
graph TD;
  discovery-chart-line --> discovery-spinner
  discovery-tile-result --> discovery-chart-line
  style discovery-chart-line fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
