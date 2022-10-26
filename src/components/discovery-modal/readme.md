# discovery-modal



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                | Default       |
| --------- | --------- | ----------- | ------------------- | ------------- |
| `data`    | --        |             | `Dashboard \| Tile` | `undefined`   |
| `debug`   | `debug`   |             | `boolean`           | `false`       |
| `options` | `options` |             | `Param \| string`   | `new Param()` |
| `url`     | `url`     |             | `string`            | `undefined`   |


## Methods

### `open() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [discovery-dashboard](../discovery-dashboard)

### Depends on

- [discovery-tile](../discovery-tile)
- [discovery-tile-result](../discovery-tile-result)
- [discovery-dashboard](../discovery-dashboard)

### Graph
```mermaid
graph TD;
  discovery-modal --> discovery-tile
  discovery-modal --> discovery-tile-result
  discovery-modal --> discovery-dashboard
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
  discovery-tile-result --> discovery-linear-gauge
  discovery-tile-result --> discovery-pie
  discovery-tile-result --> discovery-tabular
  discovery-tile-result --> discovery-svg
  discovery-tile-result --> discovery-input
  discovery-tile-result --> discovery-hidden
  discovery-tile-result --> discovery-calendar
  discovery-tile-result --> discovery-heatmap
  discovery-tile-result --> discovery-profile
  discovery-line --> discovery-spinner
  discovery-annotation --> discovery-spinner
  discovery-bar --> discovery-spinner
  discovery-display --> discovery-spinner
  discovery-image --> discovery-spinner
  discovery-gauge --> discovery-spinner
  discovery-linear-gauge --> discovery-spinner
  discovery-pie --> discovery-spinner
  discovery-tabular --> discovery-spinner
  discovery-tabular --> discovery-pageable
  discovery-svg --> discovery-spinner
  discovery-input --> discovery-slider
  discovery-input --> discovery-input-chips
  discovery-input-chips --> discovery-input-chips-chip
  discovery-calendar --> discovery-spinner
  discovery-heatmap --> discovery-spinner
  discovery-profile --> discovery-spinner
  discovery-dashboard --> discovery-modal
  style discovery-modal fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
