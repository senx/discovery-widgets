# discovery-display



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                  | Default       |
| --------- | --------- | ----------- | --------------------- | ------------- |
| `debug`   | `debug`   |             | `boolean`             | `false`       |
| `height`  | `height`  |             | `number`              | `undefined`   |
| `options` | `options` |             | `Param \| string`     | `new Param()` |
| `result`  | `result`  |             | `DataModel \| string` | `undefined`   |
| `type`    | `type`    |             | `string`              | `undefined`   |
| `unit`    | `unit`    |             | `string`              | `''`          |
| `width`   | `width`   |             | `number`              | `undefined`   |


## Events

| Event  | Description | Type                |
| ------ | ----------- | ------------------- |
| `draw` |             | `CustomEvent<void>` |


## Methods

### `export(type?: "png" | "svg") => Promise<string>`



#### Parameters

| Name   | Type             | Description |
| ------ | ---------------- | ----------- |
| `type` | `"svg" \| "png"` |             |

#### Returns

Type: `Promise<string>`



### `resize() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [discovery-tile-result](../discovery-tile-result)

### Depends on

- [discovery-spinner](../discovery-spinner)
- [discovery-tile-result](../discovery-tile-result)

### Graph
```mermaid
graph TD;
  discovery-display --> discovery-spinner
  discovery-display --> discovery-tile-result
  discovery-tile-result --> discovery-display
  discovery-line --> discovery-spinner
  discovery-annotation --> discovery-spinner
  discovery-bar --> discovery-spinner
  discovery-bar-polar --> discovery-spinner
  discovery-boxplot --> discovery-spinner
  discovery-image --> discovery-spinner
  discovery-gauge --> discovery-spinner
  discovery-linear-gauge --> discovery-spinner
  discovery-pie --> discovery-spinner
  discovery-tabular --> discovery-spinner
  discovery-tabular --> discovery-pageable
  discovery-svg --> discovery-spinner
  discovery-input --> discovery-input-date-range
  discovery-input --> discovery-slider
  discovery-input --> discovery-input-chips
  discovery-input-chips --> discovery-input-chips-chip
  discovery-calendar --> discovery-spinner
  discovery-heatmap --> discovery-spinner
  discovery-profile --> discovery-spinner
  discovery-dashboard --> discovery-tile
  discovery-dashboard --> discovery-tile-result
  discovery-dashboard --> discovery-modal
  discovery-dashboard --> discovery-spinner
  discovery-tile --> discovery-tile-result
  discovery-tile --> discovery-spinner
  discovery-modal --> discovery-tile
  discovery-modal --> discovery-tile-result
  discovery-modal --> discovery-dashboard
  style discovery-display fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
