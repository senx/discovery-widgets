# discovery-slider



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type              | Default                                |
| ---------- | ---------- | ----------- | ----------------- | -------------------------------------- |
| `debug`    | `debug`    |             | `boolean`         | `undefined`                            |
| `options`  | `options`  |             | `Param \| string` | `{ ...new Param(), timeMode: 'date' }` |
| `progress` | `progress` |             | `boolean`         | `undefined`                            |


## Events

| Event          | Description | Type                  |
| -------------- | ----------- | --------------------- |
| `startDrag`    |             | `CustomEvent<void>`   |
| `valueChanged` |             | `CustomEvent<number>` |


## Methods

### `export(type: "png" | "svg", bgColor: string) => Promise<string>`



#### Parameters

| Name      | Type             | Description |
| --------- | ---------------- | ----------- |
| `type`    | `"png" \| "svg"` |             |
| `bgColor` | `string`         |             |

#### Returns

Type: `Promise<string>`



### `setValue(value: number | number[]) => Promise<void>`



#### Parameters

| Name    | Type                 | Description |
| ------- | -------------------- | ----------- |
| `value` | `number \| number[]` |             |

#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [discovery-input](../discovery-input)

### Graph
```mermaid
graph TD;
  discovery-input --> discovery-slider
  style discovery-slider fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
