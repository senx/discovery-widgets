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

import {Param} from "../model/param";
import {action} from '@storybook/addon-actions';
import tile from "./discovery.tile.stories";

export default {
  ...tile,
  title: 'Events/PNG export',
};

[
  'statusHeaders',
  'statusError',
  'execResult',
  'discoveryEvent',
  'draw',
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

// @ts-ignore
const Template = ({url, ws, options, title, type, unit}) => `
<div class="row row-cols-1 row-cols-md-2" style="height: 300px">
<div class="col-6" style="height: 300px">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="${type}"
          id="chart1"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
  </div>
<div class="col-6"  style="height: 300px">
   <div class="card h-100">
      <div class="card-body text-center">
         <img src="" style="width: auto; height: auto; max-height: 300px" id="chart-img" alt="">
      </div>
  </div>
  </div>
</div>
<div class="row mt-3">
    <div class="col-6">
        <button class="btn btn-primary" id="exportChart1">Export chart 1</button>
    </div>
    <div class="col-6">
    </div>
</div>
<script>
function saveBase64AsFile(base64, fileName) {
    const link = document.createElement("a");
    document.body.appendChild(link); // for Firefox
    link.setAttribute("href", base64);
    link.setAttribute("download", fileName);
    link.click();
}

window.onload = () => {
  const chart = document.querySelector('#chart1');
  const img = document.querySelector('#chart-img');

  chart.addEventListener('draw', e=> {
    console.log(e)
    chart.export('png').then(png =>  img.setAttribute('src', png));
  })

  document.querySelector('#exportChart1').addEventListener('click', () => {
    chart.export('png').then(png => saveBase64AsFile(png, 'myChjart1.png'));
  })

}
</script>`;
export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  type: 'area',
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {...new Param(), showControls: true}
}

export const Display = Template.bind({});
Display.args = {
  ...Usage.args,
  type: 'display',
  ws: `42`
}

export const Map = Template.bind({});
Map.args = {
  ...Usage.args,
  type: 'map',
  ws: `NEWGTS 'g' STORE
1 6 <% 'ts' STORE $g $ts RAND 100 * RAND 100 * RAND 100 * RAND 100 * ADDVALUE DROP %> FOR
$g`,
}

// @ts-ignore
const DashboardTemplate = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@rendered="${event => console.error('foo', 'bar', event)}"
cols="${cols}" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>`;

export const WithinDashbord = DashboardTemplate.bind({});
WithinDashbord.args = {
  cols: 12,
  cellHeight: 220,
  options: new Param(),
  url: 'https://warp.senx.io/api/v0/exec',
  ws: `{
     'title' 'My Dashboard with zoom sync'
     'tiles' [
        {
          'type' 'bar' 'x' 0 'y' 0 'w' 6 'h' 1
          'options' { 'eventHandler' 'type=zoom,tag=chart1' }
          'macro' <%
            NOW 'now' STORE
            [ 1 4 <% DROP NEWGTS 'g' STORE
              1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
              $g
            %> FOR ] 'data' STORE
            {
              'data' $data
              'events' [
                { 'tags' [ 'chart2' ] 'type' 'zoom' }
              ]
            }
          %>
        }
        {
          'type' 'line' 'x' 6 'y' 0 'w' 6 'h' 1
          'options' { 'eventHandler' 'type=zoom,tag=chart2' }
          'macro' <%
            NOW 'now' STORE
            [ 1 4 <% DROP NEWGTS 'g' STORE
              1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
              $g
            %> FOR ] 'data' STORE
            {
              'data' $data
              'events' [
                { 'tags' [ 'chart1' ] 'type' 'zoom' }
              ]
            }
          %>
        }
     ]
  }`
}
