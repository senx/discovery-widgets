# discovery-tabular



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                  | Default                                |
| --------- | --------- | ----------- | --------------------- | -------------------------------------- |
| `debug`   | `debug`   |             | `boolean`             | `false`                                |
| `height`  | `height`  |             | `number`              | `undefined`                            |
| `options` | `options` |             | `Param \| string`     | `{ ...new Param(), timeMode: 'date' }` |
| `result`  | `result`  |             | `DataModel \| string` | `undefined`                            |
| `type`    | `type`    |             | `string`              | `undefined`                            |
| `unit`    | `unit`    |             | `string`              | `undefined`                            |
| `width`   | `width`   |             | `number`              | `undefined`                            |


## Events

| Event               | Description | Type                          |
| ------------------- | ----------- | ----------------------------- |
| `dataPointOver`     |             | `CustomEvent<any>`            |
| `dataPointSelected` |             | `CustomEvent<any>`            |
| `discoveryEvent`    |             | `CustomEvent<DiscoveryEvent>` |
| `draw`              |             | `CustomEvent<void>`           |


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
- [discovery-pageable](discovery-pageable)

### Graph
```mermaid
graph TD;
  discovery-tabular --> discovery-spinner
  discovery-tabular --> discovery-pageable
  discovery-tile-result --> discovery-tabular
  style discovery-tabular fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
