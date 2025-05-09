# discovery-input-chips



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute         | Description | Type                                   | Default     |
| ----------------- | ----------------- | ----------- | -------------------------------------- | ----------- |
| `autocomplete`    | --                |             | `(_value: string) => Promise<any>`     | `undefined` |
| `chipDelimiters`  | --                |             | `string[]`                             | `[]`        |
| `chips`           | --                |             | `string[]`                             | `[]`        |
| `constrain_input` | `constrain_input` |             | `boolean`                              | `false`     |
| `containsFn`      | --                |             | `(_value: string) => Promise<boolean>` | `undefined` |
| `disabled`        | `disabled`        |             | `boolean`                              | `false`     |
| `fuzzy_search`    | `fuzzy_search`    |             | `boolean`                              | `false`     |
| `value`           | `value`           |             | `string`                               | `undefined` |


## Events

| Event        | Description | Type                    |
| ------------ | ----------- | ----------------------- |
| `chipChange` |             | `CustomEvent<string[]>` |
| `chipClick`  |             | `CustomEvent<any>`      |
| `chipCreate` |             | `CustomEvent<any>`      |
| `chipInput`  |             | `CustomEvent<void>`     |


## Dependencies

### Used by

 - [discovery-input](..)

### Depends on

- [discovery-input-chips-chip](discovery-input-chips-chip)

### Graph
```mermaid
graph TD;
  discovery-input-chips --> discovery-input-chips-chip
  discovery-input --> discovery-input-chips
  style discovery-input-chips fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
