# discovery-button



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type                      | Default        |
| ---------- | ---------- | ----------- | ------------------------- | -------------- |
| `debug`    | `debug`    |             | `boolean`                 | `false`        |
| `height`   | `height`   |             | `number`                  | `undefined`    |
| `language` | `language` |             | `"flows" \| "warpscript"` | `'warpscript'` |
| `options`  | `options`  |             | `Param \| string`         | `new Param()`  |
| `result`   | `result`   |             | `DataModel \| string`     | `undefined`    |
| `type`     | `type`     |             | `string`                  | `undefined`    |
| `url`      | `url`      |             | `string`                  | `undefined`    |
| `vars`     | `vars`     |             | `string`                  | `'{}'`         |
| `width`    | `width`    |             | `number`                  | `undefined`    |


## Events

| Event            | Description | Type                          |
| ---------------- | ----------- | ----------------------------- |
| `discoveryEvent` |             | `CustomEvent<DiscoveryEvent>` |
| `draw`           |             | `CustomEvent<void>`           |
| `execError`      |             | `CustomEvent<any>`            |
| `execResult`     |             | `CustomEvent<any[]>`          |
| `statusError`    |             | `CustomEvent<any>`            |


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

### Graph
```mermaid
graph TD;
  discovery-tile-result --> discovery-button
  style discovery-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
