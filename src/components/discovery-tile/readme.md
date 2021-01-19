# discovery-tile



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type                                                                                      | Default        |
| ---------- | ---------- | ----------- | ----------------------------------------------------------------------------------------- | -------------- |
| `debug`    | `debug`    |             | `boolean`                                                                                 | `false`        |
| `language` | `language` |             | `"flows" \| "warpscript"`                                                                 | `'warpscript'` |
| `options`  | --         |             | `Param`                                                                                   | `new Param()`  |
| `type`     | `type`     |             | `"annotation" \| "area" \| "line" \| "spline" \| "step" \| "step-after" \| "step-before"` | `undefined`    |
| `url`      | `url`      |             | `string`                                                                                  | `undefined`    |


## Events

| Event           | Description | Type                    |
| --------------- | ----------- | ----------------------- |
| `statusHeaders` |             | `CustomEvent<string[]>` |


## Dependencies

### Depends on

- [discovery-tile-result](../discovery-tile-result)
- [discovery-spinner](../discovery-spinner)

### Graph
```mermaid
graph TD;
  discovery-tile --> discovery-tile-result
  discovery-tile --> discovery-spinner
  discovery-tile-result --> discovery-chart-line
  discovery-tile-result --> discovery-annotation
  discovery-chart-line --> discovery-spinner
  discovery-annotation --> discovery-spinner
  style discovery-tile fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
