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

// noinspection JSUnusedGlobalSymbols
export default {
  ...tile,
  title: 'Charts/Doughnut'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'doughnut',
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};

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

export const DoughnutChartWithAutoRefresh = Usage.bind({});
DoughnutChartWithAutoRefresh.args = {
  ...InitialUsage.args,
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`,
  options: {...new Param(), autoRefresh: 1}
}

export const WithCustomStyle = ({url, ws, lang, options, unit, title, type}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
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
</div>`;
WithCustomStyle.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.ATLANTIS},
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};

export const  CustomStyleAndAutoRefresh= WithCustomStyle.bind({});
CustomStyleAndAutoRefresh.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.CHARTANA, autoRefresh: 10},
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};
