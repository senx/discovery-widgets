# Discovery

## Usage

### In a Web Environment

#### With NPM/Yarn

    $ npm install @senx/discovery-widgets

#### With CDN

```html

<script nomodule src="https://unpkg.com/@senx/discovery-widgets/dist/discovery/discovery.js"></script>
<script type="module" src="https://unpkg.com/@senx/discovery-widgets/dist/discovery/discovery.esm.js"></script>
```

#### Usage

```html

<html>
<head>
  <title>Test</title>
</head>
<body>
<discovery-dashboard url="https://warp.senx.io/api/v0/exec" dashboard-title="Test">
  {
  'title' 'Test'
  'description' 'Dashboard test'
  'tiles' [
  {
  'title' 'test'
  'options' { 'autoRefresh' 1 }
  'x' 0 'y' 0 'w' 12 'h' 4
  'type' 'area' 'macro' <%
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
  }
  ]
  }
</discovery-dashboard>
<script nomodule src="https://unpkg.com/@senx/discovery-widgets/dist/discovery/discovery.js"></script>
<script type="module" src="https://unpkg.com/@senx/discovery-widgets/dist/discovery/discovery.esm.js"></script>
</body>
</html>
```

### Within Warp 10

Through a WarpScript:

```
{
    'title' 'Test'
    'description' 'Dashboard test'
    'tiles' [ 
        {
            'title' 'test'
            'options' { 'autoRefresh' 1 }
            'x' 0 'y' 0 'w' 12 'h' 4
            'type' 'area' 'macro' <%
                1 4 <% DROP NEWGTS 'g' STORE
                1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
                $g %> FOR %> 
        }
    ] 
}
@senx/discovery2/render
```

## Configuration

### discovery-dashboard

This is the main Web Component.

#### Attributes

| Property         | Attribute         |  Type                     | Default       | Description |
| ---------------- | ----------------- | ------------------------ | ------------- |-------------|
| `autoRefresh`    | `auto-refresh`    | `number`                 | `-1`          | Reloads the dashboard each x seconds, -1 to disable it |
| `cellHeight`     | `cell-height`     | `number`                 | `220`         | If type = "scada", cell height in pixels |
| `cols`           | `cols`            | `number`                 | `12`          | If type = "scada", number of columns of the grid | 
| `dashboardTitle` | `dashboard-title` | `string`                 | `undefined`   | Title of the dashboard, not mandatory, could be overridden by the dashboard definition (see Dashboard Definition below). | 
| `debug`          | `debug`           | `boolean`                | `false`       | Enable debug messages | 
| `options`        | `options`         | `Param / string`         | `new Param()` | Serialized JSON options (see Params below) | 
| `type`           | `type`            | `"dashboard" / "scada"`  | `'dashboard'` | Dashboard means a grid of `cols` columns, each tile is places in a cell with `x` and `y`. Scada means a free placement of tiles in pixels with  `x`, `y` and `z` |   
| `url`            | `url`             | `string`                 | `undefined`   | exec url of your Warp 10 endpoint |

#### Payload

Insert directly your dashboard definition as a WarpScript inside the HTML tag:

```html

<discovery-dashboard url="https://warp.senx.io/api/v0/exec" dashboard-title="Test">
  {
  'title' 'Test'
  'description' 'Dashboard test'
  'tiles' [
  {
  'title' 'test'
  'options' { 'autoRefresh' 1 }
  'x' 0 'y' 0 'w' 12 'h' 4
  'type' 'area' 'macro' <%
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
  }
  ]
  }
</discovery-dashboard>
``` 

### discovery-tile

This Web component displays a Tile based upon a WarpScript (or FLoWS). The WarpScript is executed when the tile renders.

| Property         | Attribute         |  Type                     | Default       | Description |
| ---------------- | ----------------- | ------------------------ | ------------- |-------------|
| `autoRefresh`    | `auto-refresh`    | `number`                 | `-1`          | Reloads the tile and execute again the script each x seconds, -1 to disable it |
| `chartTitle`     | `chart-title`     | `string`                 | `undefined`   | Title of the Tile, not mandatory, could be overridden by the dashboard definition (see Dashboard Definition below). | 
| `debug`          | `debug`           | `boolean`                | `false`       | Enable debug messages | 
| `options`        | `options`         | `Param / string`         | `new Param()` | Serialized JSON options (see Params below) | 
| `type`           | `type`            | `line, area, scatter, spline-area, spline, step, step-after, step-before, annotation, bar, display, image, map, gauge, linear-gauge, circle, pie, plot, doughnut, rose, tabular, svg, input:text, input:list, input:secret, input:autocomplete, input:slider, input:date, input:date-range, button`  | | Chart type |   
| `url`            | `url`             | `string`                 | `undefined`   | exec url of your Warp 10 endpoint |
| `lang`            | `lang`             | `warpscript, flows`                 | `warpscript`   | Language used  |

````html

<discovery-tile url="warp 10 url"
                unit="°C"
                type="text"
                chart-title="Text">
  { 'data' 42 'globalParams' { 'bgColor' 'darkblue' 'fontColor' 'cyan' } }
</discovery-tile>
````

### discovery-tile-result

This Web component displays a Tile based upon a WarpScript (or FLoWS) execution result (DataModel).

| Property         | Attribute         |  Type                     | Default       | Description |
| ---------------- | ----------------- | ------------------------ | ------------- |-------------|
| `chartTitle`     | `chart-title`     | `string`                 | `undefined`   | Title of the Tile, not mandatory, could be overridden by the dashboard definition (see Dashboard Definition below). | 
| `debug`          | `debug`           | `boolean`                | `false`       | Enable debug messages | 
| `options`        | `options`         | `Param / string`         | `new Param()` | Serialized JSON options (see Params below) | 
| `type`           | `type`            | `line, area, scatter, spline-area, spline, step, step-after, step-before, annotation, bar, display, image, map, gauge, linear-gauge, circle, pie, plot, doughnut, rose, tabular, svg, input:text, input:list, input:secret, input:autocomplete, input:slider, input:date, input:date-range, button`  | | Chart type |   
| `url`            | `url`             | `string`                 | `undefined`   | exec url of your Warp 10 endpoint |
| `height`     | `height`      |  `number`            | | Fixed height of the tile |
| `width`     | `width`      |   `number`          |  | Fixed width of the tile |
| `result`     | `result`      |  `DataModel / string`           |  | Execution result |

````html

<discovery-tile-result url="warp 10 url"
                       unit="°C"
                       type="text"
                       chart-title="Text">
  { 'data' 42 'globalParams' { 'bgColor' 'darkblue' 'fontColor' 'cyan' } }
</discovery-tile-result>
````

#### Params / Options

Options inherit from higher level. You can use options as an attribute in `<discovery-dashboard />`, as a field in the
dashboard definition, as a field in a tile definition and as a field in execution result.

![options](./assets/options.png)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | `string` | | Chart type  (line, area, scatter, spline-area, spline, step, step-after, step-before, annotation, bar, display, image, map, gauge, linear-gauge, circle, pie, plot, doughnut, rose, tabular, svg, input:text, input:list, input:secret, input:autocomplete, input:slider, input:date, input:date-range, button) |
| timeMode | `string` | 'date' | date, timestamp or custom |
| timeZone | `string` | 'UTC' | Timezone |
| timeUnit | `string` | 'us' | Warp 10 time unit (us, ms, ns) |
| scheme | `string` | 'WARP10' | Color scheme (COHESIVE, COHESIVE_2, BELIZE, VIRIDIS, MAGMA, INFERNO, PLASMA, YL_OR_RD, YL_GN_BU, BU_GN, WARP10, NINETEEN_EIGHTY_FOUR, ATLANTIS, DO_ANDROIDS_DREAM, DELOREAN, CTHULHU, ECTOPLASM, T_MAX_400_FILM ) |
| showLegend | `boolean` | false | Display the chart legend |
| unit | `string` | | Unit to be displayed |
| bgColor |  `string` | | Background color of tiles |
| datasetColor | `string` | | Only for the `param` field in execution result. Color of the trace |
| fontColor |  `string` | | Font color in tiles |
| borderColor |  `string` | | Border color in tiles |
| showLegend |  `boolean` | false | Display chart legend |
| responsive |  `boolean` | true | Responsive charts |
| showRangeSelector |  `boolean` | false | Display the skyline below line or area charts |
| autoRefresh |  `number` | -1 | if positive value, will refresh with a request each `autoRefresh` second |
| showErrors |  `boolean` | true | Display errors if any |
| showStatus |  `boolean` | true | Display the Warp 10 execution status |
| expandAnnotation |  `boolean` | false | Expand annotations |
| scheme | `string` | 'WARP10' | Color scheme ( COHESIVE, COHESIVE_2, BELIZE, VIRIDIS, MAGMA, INFERNO, PLASMA, YL_OR_RD, YL_GN_BU, BU_GN, WARP10, NINETEEN_EIGHTY_FOUR, ATLANTIS, DO_ANDROIDS_DREAM, DELOREAN, CTHULHU, ECTOPLASM, T_MAX_400_FILM, MATRIX, CHARTANA) |
| eventHandler | `string` | 'type=Regexp,tag=Regexp' | Only applies on Tiles and Dashboard. See the events chapter below |

### Dashboard definition

| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | `string` | | Dashboard title |
| description | `string` | | Dashboard sub-title |
| tiles | `Tile[]` | | Array of tiles |

### Tile definition

- If the dashboard type is **'dashboard'**, x, y, h and w are expressed in cells. x and y begin at 0, the top left
  corner, w and h begin at 1.
- If the dashboard type is **'scada'**, x, y, h and w are expressed in pixels. x and y begin at 0, the top left corner.
  z represents the z-index.

Data are displayed either with `data` or with `macro`. Auto-refresh for tiles only applies for `macro`.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | `string` | | Chart type  (line, area, scatter, spline-area, spline, step, step-after, step-before, annotation, bar, display, image, map, gauge, linear-gauge, circle, pie, plot, doughnut, rose, tabular, svg, input:text, input:list, input:secret, input:autocomplete, input:slider, input:date, input:date-range, button |
| endpoint | `string` | | exec url of your Warp 10 endpoint |
| title | `string` | | Tile title |
| unit | `string` | | Unit to be displayed |
| x | `number` | | X position of the Tile. |
| y | `number` | | Y position of the Tile. |
| w | `number` | | Width the Tile. |
| h | `number` | | Height the Tile. |
| z | `number` | | Z index the Tile. |
| data | `[]` | | Array of static data computed when the dashboard is rendered. See Execution Result below. |
| macro | `<% macro %>` | | A macro executed when the tile loads in the display. See Execution Result below. |
| options | `Option` | | Options (see above) concerning this tile |

### Execution result (DataModel)

You could either return a single value ( GTS, number or string depending on the chart type), or a complex data
structure:

| Name | Type | Description |
|------|------|-------------|
| data | `GTS`, `GTS[]`, `string`, `number` |  Data to display depending on the chart type |
| globalParams |  `Option` | Global options (see above) concerning this tile |
| params | `Option[]` | List of options (see above) concerning each displayed data depending of the index of this array |
| events | `Events[]` | List of events to emit (see below) |

### Common CSS vars

| Name | Default |
|------|------|
| --gts-classname-font-color | #004eff |
| --gts-labelname-font-color | #19A979 |
| --gts-attrname-font-color | #ED4A7B |
| --gts-separator-font-color | #a0a0a0 |
| --gts-labelvalue-font-color | #000000 |
| --gts-attrvalue-font-color | #000000 |
| --warp-view-font-color | #000000 |

### Specific charts configuration and CSS styles

| Event  | Description | Type                |
| ------ | ----------- | ------------------- |
| `draw` |             | `CustomEvent<void>` |

#### line, area, scatter, spline-area, spline, step, step-after, step-before

| Name | Default |
|------|------|
| --warp-view-chart-label-color | #8e8e8e |
| --warp-view-chart-grid-color | #8e8e8e |

| Name | Type | Description |
|------|------|-------------|
| data | `GTS`, `GTS[]` |  Data to display, numeric GTS only |
| globalParams |  `Option` | Global options (see above) concerning this tile |
| params | `Option[]` | List of options (see above) concerning each displayed dataset depending of the index of this array |
| events | `Events[]` | List of events to emit (see below) |

Supported option per series are:

- datasetColor: Hex CSS color of the series. ie: '#fff00f'
- type: Chart type (line, area, scatter, spline-area, spline, step, step-after, step-before)
- xAxis: In case of multi-X axis support, represents the index of related axis.
- yAxis: In case of multi-Y axis support, represents the index of related axis.

````
1 4 <% 
  DROP NEWGTS 'g' STORE
  1 30 <% 
    'ts' STORE 
    $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP 
  %> FOR
$g %> FOR STACKTOLIST 'data' STORE
{ 
  'data' $data 
  'params' [ 
    { 'datasetColor' '#dc3545' 'xAxis' 0 }
    { 'datasetColor' '#ff9900' 'xAxis' 0 }
    { 'type' 'area' 'datasetColor' '#90d743' 'xAxis' 1 }
    { 'datasetColor' 'white' 'xAxis' 0 }
  ]
}  
````

#### annotation

| Name | Default |
|------|------|
| --warp-view-chart-label-color | #8e8e8e |
| --warp-view-chart-grid-color | #8e8e8e |

| Name | Type | Description |
|------|------|-------------|
| data | `GTS`, `GTS[]` |  Data to display, non-numeric GTS only |
| globalParams |  `Option` | Global options (see above) concerning this tile |
| params | `Option[]` | List of options (see above) concerning each displayed dataset depending of the index of this array |
| events | `Events[]` | List of events to emit (see below) |

Supported option per series are:

- datasetColor: Hex CSS color of the series. ie: '#fff00f'

#### bar

| Name | Default |
|------|------|
| --warp-view-chart-label-color | #8e8e8e |
| --warp-view-chart-grid-color | #8e8e8e |

| Name | Type | Description |
|------|------|-------------|
| data | `GTS`, `GTS[]`, custom data |  Data to display |
| globalParams |  `Option` | Global options (see above) concerning this tile |
| params | `Option[]` | List of options (see above) concerning each displayed dataset depending of the index of this array |
| events | `Events[]` | List of events to emit (see below) |

Supported option per series are:

- datasetColor: Hex CSS color of the series. ie: '#fff00f'
- bar
  - horizontal: Bar chart orientation
  - stacked

Custom data:

````json
{
  "title": "Test",
  "columns":  [ "A", "B", "C", "D" ],
  "rows": [
    [ "label X", 15, 56, 44, 22 ],
    [ "label Y", 1, 5, 4, 2 ],
    [ "label Z", 14, 45, 78, 12 ]
  ]
}
````

#### display

#### image

#### map

#### gauge, circle

#### linear-gauge

#### pie, doughnut, rose

#### plot

#### tabular

#### svg

#### input:text, input:secret

#### input:list, input:autocomplete

#### input:slider

#### input:date

#### input:date-range

#### button

## Events

