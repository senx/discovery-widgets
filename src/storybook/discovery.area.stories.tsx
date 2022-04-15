/*
 *   Copyright 2022  SenX S.A.S.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import tile, {Usage} from './discovery.tile.stories';
import {Colors} from "../utils/color-lib";
import {Param} from "../model/param";

export default {
  ...tile,
  title: 'Charts/Area',
};
export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'area',
  ws: `1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};

export const InitialUsageWithRangeSlider = Usage.bind({});
InitialUsageWithRangeSlider.args = {
  ...InitialUsage.args,
  options: {... new Param(), showRangeSelector: true}
};

export const InitialUsageWithRangeSliderAndLegend = Usage.bind({});
InitialUsageWithRangeSliderAndLegend.args = {
  ...InitialUsage.args,
  options: {... new Param(), showRangeSelector: true, showLegend: true}
};

export const WithCustomNames = Usage.bind({});
WithCustomNames.args = {
  ...InitialUsage.args,
  ws: `1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'data' STORE
  { 'data' $data 'params' [ { 'key' 'My temp sensor' } { 'key' 'My humidity sensor' } NULL { 'key' 'My other sensor' } ] }
  `
};

export const InitialUsageWithMixedData = Usage.bind({});
InitialUsageWithMixedData.args = {
  ...Usage.args,
  type: 'area',
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
      [ SWAP mapper.rate 1 0 0 ] MAP
      // Keep only 1000 datapoints per GTS
      1000 LTTB DUP
      // Detect 5 anomalies per GTS using an ESD (Extreme Studentized Deviate) Test
      5 false ESDTEST
      // Convert the ticks identified by ESDTEST into an annotation GTS
      <%
      DROP // excude element index
      NEWGTS // create a new GTS
      SWAP // get timestamp list
      <% NaN NaN NaN 'anomaly' ADDVALUE %> FOREACH // for each timestamp
      %> LMAP 2 ->LIST // Put our GTS in a list
      ZIP // merge into a list of GTS
      // Now rename and relabel the anomaly GTS
      <%
      DROP // exclude element index
      LIST-> // flatten list
      DROP // exclude number of elements of our list
      SWAP // put our fetched GTS on the top
      DUP // duplicate the GTS
      NAME // get the className of the GTS
      ':anomaly' + 'name' STORE // suffix the name
      DUP LABELS 'labels' STORE // duplicate the GTS and get labels
      SWAP // put the anomaly GTS on the top of the stack
      $name RENAME // rename the GTS
      $labels RELABEL // put labels
      2 ->LIST // put both GTS in a list
      %> LMAP`
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
export const SteppedAreaWithoutYAxis = Usage.bind({});
SteppedAreaWithoutYAxis.args = {
  ...Usage.args,
  type: 'step-area',
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -20 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`,
  options: { ... new Param(), hideYAxis: true}
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
