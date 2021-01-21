import tile, {Usage} from '../discovery-tile/discovery.tile.stories';

export default {
  ...tile,
  title: 'Components/Area',
};
export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'area',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
export const SmoothedArea = Usage.bind({});
SmoothedArea.args = {
  ...Usage.args,
  type: 'spline-area',
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -20 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`
}
export const MixedChart = Usage.bind({});
MixedChart.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'data' STORE
{ 'data' $data 'params' [ { 'type' 'area' } { 'type' 'step' } { 'type' 'line' } { 'type' 'spline-area' } ] }`
};
