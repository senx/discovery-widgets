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
import {Param} from "../model/param";
import {Colors} from "../utils/color-lib";

export default {
  ...tile,
  title: 'Charts/Pie'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'pie',
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};

export const RealUseCase = Usage.bind({});
RealUseCase.args = {
  ...InitialUsage.args,
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
}

export const CustomData = Usage.bind({});
CustomData.args = {
  ...InitialUsage.args,
  ws: `[
  0 2 <% 'j' STORE
   { 'key' 'series-' $j TOSTRING + 'value' RAND }
%> FOR
]`
};

export const CustomDataMap = Usage.bind({});
CustomDataMap.args = {
  ...InitialUsage.args,
  ws: `{
  0 2 <% 'j' STORE
   'series-' $j TOSTRING +  RAND
%> FOR
}`
};

export const PieChartWithAutoRefresh = Usage.bind({});
PieChartWithAutoRefresh.args = {
  ...InitialUsage.args,
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`,
  options: {...new Param(), autoRefresh: 1}
}

export const WithCustomStyle = ({url, ws, lang, options, unit, title, type}) => `
<div style="height: 600px;width: 100%;min-height: 100px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
<style>
:root {
    --warp-view-chart-grid-color: #35b779;
    --warp-view-chart-label-color: #35b779;
   --warp-view-font-color: white;
    --warp-view-bg-color: #1C1E25;
    }
</style>
    <discovery-tile url="${url}" type="${type}" lang="${lang}"
        unit="${unit || ''}" chart-title="${title || ''}" debug
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
    </div>
    </div>
</div>`;
WithCustomStyle.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.ATLANTIS},
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};
export const SmallArea = ({url, ws, lang, options, unit, title, type}) => `
<div style="height: 300px;width: 200px;min-height: 100px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
    <discovery-tile url="${url}" type="${type}" lang="${lang}"
        unit="${unit || ''}" chart-title="${title || ''}" debug
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
    </div>
    </div>
</div>`;
SmallArea.args = {
  ...InitialUsage.args,
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};

export const CustomStyleAndAutoRefresh = WithCustomStyle.bind({});
CustomStyleAndAutoRefresh.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.CHARTANA, autoRefresh: 10},
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};
