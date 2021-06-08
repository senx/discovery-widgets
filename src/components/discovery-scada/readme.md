# discovery-scada



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type              | Default       |
| ---------------- | ----------------- | ----------- | ----------------- | ------------- |
| `autoRefresh`    | `auto-refresh`    |             | `number`          | `-1`          |
| `cellHeight`     | `cell-height`     |             | `number`          | `220`         |
| `cols`           | `cols`            |             | `number`          | `12`          |
| `dashboardTitle` | `dashboard-title` |             | `string`          | `undefined`   |
| `debug`          | `debug`           |             | `boolean`         | `false`       |
| `options`        | `options`         |             | `Param \| string` | `new Param()` |
| `url`            | `url`             |             | `string`          | `undefined`   |


## Events

| Event           | Description | Type                    |
| --------------- | ----------- | ----------------------- |
| `statusError`   |             | `CustomEvent<any>`      |
| `statusHeaders` |             | `CustomEvent<string[]>` |


## Dependencies

### Depends on

- [discovery-tile](../discovery-tile)
- [discovery-tile-result](../discovery-tile-result)
- [discovery-spinner](../discovery-spinner)

### Graph
```mermaid
graph TD;
  discovery-scada --> discovery-tile
  discovery-scada --> discovery-tile-result
  discovery-scada --> discovery-spinner
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
  discovery-tile-result --> discovery-plot
  discovery-tile-result --> discovery-svg
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
  discovery-plot --> discovery-spinner
  discovery-svg --> discovery-spinner
  style discovery-scada fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
