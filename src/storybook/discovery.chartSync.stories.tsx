// noinspection JSUnusedGlobalSymbols

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

import {Param} from "../model/param";
import {action} from '@storybook/addon-actions';
import tile from "./discovery.tile.stories";

export default {
  ...tile,
  title: 'Events/Charts Sync',
};

[
  'statusHeaders',
  'statusError',
  'execResult',
  'discoveryEvent',
  'draw',
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

// @ts-ignore
const ZoomSyncUsageTemplate = ({url, ws, options, title, type, unit}) => `
<div class="row" style="height: 300px">
<div class="col-6">
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
<script>
  const chart1 = document.querySelector('#chart1');
  const chart2 = document.querySelector('#chart2');
  chart1.addEventListener('dataZoom', event => {
    console.log('chart1', event.detail);
    // noinspection JSUnresolvedFunction
    chart2.setZoom(event.detail)
  });
  chart2.addEventListener('dataZoom', event => {
    console.log('chart2', event.detail);
    // noinspection JSUnresolvedFunction
    chart1.setZoom(event.detail)
  });
</script>`;
export const ZoomSyncUsage = ZoomSyncUsageTemplate.bind({});
ZoomSyncUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  type: 'area',
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: new Param()
}

// @ts-ignore
const ZoomSyncDashboardTemplate = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
cols="${cols}" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>`;

export const ZoomSyncWithinDashbord = ZoomSyncDashboardTemplate.bind({});
ZoomSyncWithinDashbord.args = {
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
const FocusSyncUsageTemplate = ({url, ws, options, title, type1, type2, unit}) => `
<div class="row" style="height: 300px">
<div class="col-6">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="${type1}"
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
          <discovery-tile url="${url}" type="${type2}"
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
<script>
  const chart1 = document.querySelector('#chart1');
  const chart2 = document.querySelector('#chart2');
  chart1.addEventListener('mouseout', () => {
    // noinspection JSUnresolvedFunction
    chart2.unFocus();
  })
  chart2.addEventListener('mouseout', () => {
    // noinspection JSUnresolvedFunction
    chart1.unFocus();
  })
  chart1.addEventListener('dataPointOver', event => {
    // noinspection JSUnresolvedFunction
    chart2.setFocus(event.detail.name, event.detail.date, event.detail.value);
    console.log(event)
  });
  chart2.addEventListener('dataPointOver', event => {
    // noinspection JSUnresolvedFunction
    chart1.setFocus(event.detail.name, event.detail.date, event.detail.value);
    console.log(event)
  });
</script>`;
export const FocusSyncUsage = FocusSyncUsageTemplate.bind({});
FocusSyncUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  type1: 'area',
  type2: 'bar',
  ws: `NEWGTS 'g' STORE
0 10 <% 'ts' STORE $g NOW ->TSELEMENTS [ 0 5 ] SUBLIST TSELEMENTS-> $ts s - RAND RAND RAND RAND ADDVALUE DROP %> FOR
$g`,
  options: {...new Param()}
}



const FocusSyncUsageWithAnnotationTemplate = ({url, ws, options, title, unit}) => `
<div class="row" >

<div class="col-12" style="height: 150px">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="annotation"
          id="chart2"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
  </div>
<div class="col-12" style="height: 600px">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="line"
          id="chart1"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
  </div>
</div>
<script>
  const chart1 = document.querySelector('#chart1');
  const chart2 = document.querySelector('#chart2');

  chart1.addEventListener('leftMarginComputed', event => {
    chart2.setAttribute('options', JSON.stringify({...JSON.parse('${JSON.stringify(options)}'), leftMargin: event.detail || 10}))
  })
  chart1.addEventListener('mouseout', () => {
    // noinspection JSUnresolvedFunction
    chart2.unFocus();
  })
  chart2.addEventListener('mouseout', () => {
    // noinspection JSUnresolvedFunction
    chart1.unFocus();
  })
  chart1.addEventListener('dataPointOver', event => {
    // noinspection JSUnresolvedFunction
    chart2.setFocus(event.detail.name, event.detail.date, event.detail.value);
  });
  chart2.addEventListener('dataPointOver', event => {
    // noinspection JSUnresolvedFunction
    chart1.setFocus(event.detail.name, event.detail.date, event.detail.value);
  });
</script>`;
export const FocusSyncUsageWithAnnotation = FocusSyncUsageWithAnnotationTemplate.bind({});
FocusSyncUsageWithAnnotation.args = {
  url: 'https://warp.senx.io/api/v0/exec',
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
      %> LMAP`,

  options: {...new Param()}
}

const FocusSyncUsageWithMapTemplate = ({url, ws, options, title, unit}) => `
<div class="row" >

<div class="col-12" style="height: 150px">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="line"
          id="chart2"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
  </div>
<div class="col-12" style="height: 600px">
   <div class="card h-100">
      <div class="card-body">
          <discovery-tile url="${url}" type="map"
          id="chart1"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
  </div>
</div>
<script>
  const chart1 = document.querySelector('#chart1');
  const chart2 = document.querySelector('#chart2');
  chart1.addEventListener('mouseout', () => {
    // noinspection JSUnresolvedFunction
    chart2.unFocus();
  })
  chart2.addEventListener('mouseout', () => {
    // noinspection JSUnresolvedFunction
    chart1.unFocus();
  })
  chart1.addEventListener('dataPointOver', event => {
    // noinspection JSUnresolvedFunction
    chart2.setFocus(event.detail.name, event.detail.date, event.detail.value);
  });
  chart2.addEventListener('dataPointOver', event => {
    // noinspection JSUnresolvedFunction
    chart1.setFocus(event.detail.name, event.detail.date, event.detail.value);
  });
</script>`;
export const FocusSyncUsageWithMap = FocusSyncUsageWithMapTemplate.bind({});
FocusSyncUsageWithMap.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  ws: `NEWGTS 'g' STORE
0 10 <% 'ts' STORE $g NOW ->TSELEMENTS [ 0 5 ] SUBLIST TSELEMENTS-> $ts s - RAND RAND RAND RAND ADDVALUE DROP %> FOR
$g`,
  options: {...new Param()}
}



// @ts-ignore
const FocusSyncDashboardTemplate = ({url, ws, options, title, cols, cellHeight}) => `<div class="card bg-dark" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
cols="${cols}" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>`;

export const FocusSyncWithinDashbord = FocusSyncDashboardTemplate.bind({});
FocusSyncWithinDashbord.args = {
  cols: 12,
  cellHeight: 220,
  options: new Param(),
  url: 'https://warp.senx.io/api/v0/exec',
  ws: `{
     'title' 'My Dashboard with focus sync'
     'options' {
        'scheme' 'CHARTANA'
        'map' { 'mapType' 'STADIA_DARK'  }
          'customStyles' {
            '.discovery-dashboard-main'
            <'
    font-size       : 12px;
    line-height     : 1.52;
    background-color: #333540;
    color           : #FFFFFF;

    --wc-split-gutter-color            : #404040;
    --warp-view-pagination-bg-color    : #343a40 !important;
    --warp-view-pagination-border-color: #6c757d;
    --warp-view-datagrid-odd-bg-color  : rgba(255, 255, 255, .05);
    --warp-view-datagrid-odd-color     : #FFFFFF;
    --warp-view-datagrid-even-bg-color : #212529;
    --warp-view-datagrid-even-color    : #FFFFFF;
    --warp-view-font-color             : #FFFFFF;
    --warp-view-chart-label-color      : #FFFFFF;
    --gts-stack-font-color             : #FFFFFF;
    --warp-view-resize-handle-color    : #111111;
    --warp-view-chart-legend-bg        : #000;
    --gts-labelvalue-font-color        : #ccc;
    --gts-separator-font-color         : #FFFFFF;
    --gts-labelname-font-color         : rgb(105, 223, 184);
    --gts-classname-font-color         : rgb(126, 189, 245);
    --warp-view-chart-legend-color     : #FFFFFF;
    --wc-tab-header-color              : #FFFFFF;
    --wc-tab-header-selected-color     : #404040;
    --warp-view-tile-background        : #3A3C46;
            '>
        }
     }
     'tiles' [
        {
          'type' 'area' 'x' 0 'y' 0 'w' 6 'h' 1
          'options' { 'eventHandler' 'type=focus,tag=(chart1|map)' }
          'macro' <%
           NEWGTS 'g' STORE
            0 10 <% 'ts' STORE $g NOW ->TSELEMENTS [ 0 5 ] SUBLIST TSELEMENTS-> $ts s - RAND RAND RAND RAND ADDVALUE DROP %> FOR
            $g 'data' STORE
            {
              'data' $data
              'events' [
                { 'tags' [ 'chart2' ] 'type' 'focus' }
              ]
            }
          %>
        }
        {
          'type' 'area' 'x' 6 'y' 0 'w' 6 'h' 1
          'options' { 'eventHandler' 'type=focus,tag=(chart2|map)' }
          'macro' <%
            NEWGTS 'g' STORE
            0 10 <% 'ts' STORE $g NOW ->TSELEMENTS [ 0 5 ] SUBLIST TSELEMENTS-> $ts s - RAND RAND RAND RAND ADDVALUE DROP %> FOR
            $g 'data' STORE
            {
              'data' $data
              'events' [
                { 'tags' [ 'chart1' ] 'type' 'focus' }
              ]
            }
          %>
        }
        {
          'type' 'map' 'x' 0 'y' 1 'w' 12 'h' 2
          'options' { 'eventHandler' 'type=focus,tag=chart.*' }
          'macro' <%
            NEWGTS 'g' STORE
            0 10 <% 'ts' STORE $g NOW ->TSELEMENTS [ 0 5 ] SUBLIST TSELEMENTS-> $ts s - RAND 50 * RAND  50 * RAND RAND ADDVALUE DROP %> FOR
            $g 'data' STORE
            {
              'data' $data
              'events' [
                { 'tags' [ 'map' ] 'type' 'focus' }
              ]
            }
          %>
        }
     ]
  }`
}
