import tile, {Usage} from './discovery.tile.stories';

export default {
  ...tile,
  title: 'Charts/Scatter'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'scatter',
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`
};

export const ChartWithCustomData = Usage.bind({});
ChartWithCustomData.args = {
  ...InitialUsage.args,
  type: 'scatter',
  ws: `
  <%
  [
    0 10 <% DROP [ RAND 10 * FLOOR RAND 10 * ] %> FOR
  ]
  %> 'rand' STORE
  {
'title' 'Test'
'data' [
  { 'label' 'A' 'values' @rand }
  { 'label' 'B' 'values' @rand }
 ]
} 'values' STORE
{ 'data' $values 'globalParams' { } }`
}
