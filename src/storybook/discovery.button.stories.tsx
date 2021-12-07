/*
 *   Copyright 2021  SenX S.A.S.
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
  title: 'UI/Button'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'button',
  ws: `{ 'data' <% 2 2 + %> 'globalParams' { 'button' { 'label' 'Execute' } } }`
};


export const JustAMacro = Usage.bind({});
JustAMacro.args = {
  ...Usage.args,
  type: 'button',
  ws: `<% 2 2 + %>`
};


export const AFullEvent = Usage.bind({});
AFullEvent.args = {
  ...Usage.args,
  type: 'button',
  ws: `
  { 'data' <%
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'random' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
               ]
             }
          %> }
  `
};

export const CustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        id="myBtn"
        >${ws}</discovery-tile>
    </div>
</div>
<script>
document.querySelector('#myBtn').addEventListener('discoveryEvent', e => {
  console.log(e.detail)
})
</script>
`;
CustomStyle.args = {
  ...AFullEvent.args
}
