import {Param} from "../model/param";
import {action} from '@storybook/addon-actions';
import tile from "./discovery.tile.stories";

export default {
  ...tile,
  title: 'UI/PNG export',
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
<div class="row" style="height: 300px">
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
<div class="col-6">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="${type}"
          id="chart2"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
  </div>
</div>
<div class="row" >
    <div class="col-6">
        <button class="btn btn-primary" id="exportChart1">Export chart 1</button>
    </div>
    <div class="col-6">
        <button class="btn btn-primary" id="exportChart2">Export chart 2</button>
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

  const chart1 = document.querySelector('#chart1');
  const chart2 = document.querySelector('#chart2');
  document.querySelector('#exportChart1').addEventListener('click', e => {
    chart1.exportPng().then(png => saveBase64AsFile(png, 'myChjart1.png'));
  })
  document.querySelector('#exportChart2').addEventListener('click', e => {
    chart2.exportPng().then(png => saveBase64AsFile(png, 'myChjart2.png'));
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
  options: {... new Param(), showControls: true}
}

// @ts-ignore
const DashboardTemplate = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
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
