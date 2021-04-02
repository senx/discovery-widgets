import tile, {Usage} from '../discovery-tile/discovery.tile.stories';
import {Colors} from "../../utils/color-lib";

export default {
  ...tile,
  title: 'Charts/Area',
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
export const WithCustomStyle = ({url, ws, lang, options, unit, title, type}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color: #35b779;
    --warp-view-chart-label-color: #35b779;
   --warp-view-font-color: white;
    --warp-view-bg-color: #404040;
    }
</style>
    <discovery-tile url="${url}" type="${type}" lang="${lang}"
        unit="${unit || ''}" chart-title="${title || ''}"
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
WithCustomStyle.args = {
  ...Usage.args,
  options: {...Usage.args.options, scheme: Colors.CHARTANA},
  type: 'area',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
