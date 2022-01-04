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
  ws: `
  <% [ 0 10 <% DROP [ RAND 10 * 5 -   RAND 10 * 5 - ] %> FOR ] %> 'rand' STORE
  {
    'title' 'Test'
    'globalParams' { }
    'data' [
      { 'label' 'A' 'values' @rand }
      { 'label' 'B' 'values' @rand }
    ]
  }`
}


export const BubbleChartWithCustomData = Usage.bind({});
BubbleChartWithCustomData.args = {
  ...InitialUsage.args,
  ws: `
  <% [ 0 10 <% DROP [ RAND 10 * 5 -   RAND 10 * 5 - RAND 100 * ] %> FOR ] %> 'rand' STORE
  {
    'title' 'Test'
    'globalParams' { }
    'data' [
      { 'label' 'A' 'values' @rand }
      { 'label' 'B' 'values' @rand }
    ]
  }`
}
