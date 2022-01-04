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

// noinspection JSUnusedGlobalSymbols

// noinspection JSUnusedGlobalSymbols

import tile from './discovery.tile.stories';

export default {
  ...tile,
  title: 'Charts/Empty'
};
const Template = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
id="myDash"
@draw="${event => console.error('foo', 'bar', event)}"
cols="${cols}" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>
<script>
document.querySelector('#myDash').addEventListener('discoveryEvent', e => {
  console.log(e.detail)
})
</script>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  url: 'https://sandbox.senx.io/api/v0/exec',
  cols: 12,
  cellHeight: 220,
  ws: `{
    'title' 'Dashboard with timer'
    'vars' {
      'start' NOW
    }
    'tiles' [
      {
        'endpoint' 'wss://sandbox.senx.io/api/v0/mobius' // Uses WebSockets
        'options' { 'autoRefresh' 1000 'timeMode' 'custom' } // refresh each second
        'x' 0 'y' 0 'w' 1 'h' 1
        'type' 'empty'
        'macro' <%
          NOW 'now' STORE
          { 'data' '' 'events' [ { 'tags' [ 'start' ] 'type' 'variable' 'value' { 'start' $now }  } ] }
        %>
      }

      {
    'title' 'Timer'
    'options' { 'eventHandler' 'type=variable,tag=start' }
    'x' 1 'y' 0 'w' 1 'h' 1
    'type' 'display'
    'macro' <%
        $start 'Europe/Paris' ->TSELEMENTS [ 3 5 ] SUBLIST <% TOSTRING 'v' STORE <% $v SIZE 2 < %> <% '0' $v + %> <% $v %> IFTE %> F LMAP ':' JOIN
    %>
  }
    ]
  }`
};
