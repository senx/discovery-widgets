# discovery-tile-result



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                                                      | Default       |
| --------- | --------- | ----------- | ------------------------------------------------------------------------- | ------------- |
| `debug`   | `debug`   |             | `boolean`                                                                 | `false`       |
| `height`  | `height`  |             | `number`                                                                  | `undefined`   |
| `options` | --        |             | `Param`                                                                   | `new Param()` |
| `result`  | `result`  |             | `string`                                                                  | `undefined`   |
| `start`   | `start`   |             | `number`                                                                  | `undefined`   |
| `type`    | `type`    |             | `"area" \| "line" \| "spline" \| "step" \| "step-after" \| "step-before"` | `undefined`   |
| `width`   | `width`   |             | `number`                                                                  | `undefined`   |


## Dependencies

### Used by

 - [discovery-tile](../discovery-tile)

### Depends on

- [discovery-chart-line](../discovery-chart-line)

### Graph
```mermaid
graph TD;
  discovery-tile-result --> discovery-chart-line
  discovery-tile --> discovery-tile-result
  style discovery-tile-result fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
