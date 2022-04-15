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
  title: 'Charts/Bar'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'bar',
  unit: 'my unit',
  ws: `NOW 'now' STORE
1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME  'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`
};

export const WithCustomTimeZone = Usage.bind({});
WithCustomTimeZone.args = {
  ...InitialUsage.args,
  options: {...new Param(), timeZone: 'America/Buenos_Aires'}
};

export const WithAutoTimeZone = Usage.bind({});
WithAutoTimeZone.args = {
  ...InitialUsage.args,
  options: {...new Param(), timeZone: 'AUTO'}
};

export const WithFullDateFormatAndCustomFormat = Usage.bind({});
WithFullDateFormatAndCustomFormat.args = {
  ...InitialUsage.args,
  options: {...new Param(), timeFormat: 'ddd DD MMM YY HH:mm:ss', fullDateDisplay: true}
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
  ...InitialUsage.args,
  type: 'bar',
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
      [ SWAP mapper.rate 1 0 0 ] MAP
      [ SWAP bucketizer.mean $NOW 30 m 0 ] BUCKETIZE
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

export const InitialUsageWithLegend = Usage.bind({});
InitialUsageWithLegend.args = {
  ...InitialUsage.args,
  options: {...new Param(), showLegend: true}
};

export const InitialUsageWithTimeStamp = InitialUsage.bind({});
InitialUsageWithTimeStamp.args = {
  ...InitialUsage.args,
  type: 'bar',
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`,
  options: {...InitialUsage.args.options, timeMode: 'timestamp'}
};

export const RealData = Usage.bind({});
RealData.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP bucketizer.last $NOW 1 m 0 ] BUCKETIZE
[ SWAP mapper.delta 1 0 0 ] MAP 'values' STORE
{ 'data' $values }`
}
export const StackedBarChart = Usage.bind({});
StackedBarChart.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP bucketizer.last $NOW 1 m 0 ] BUCKETIZE
[ SWAP mapper.delta 1 0 0 ] MAP 'values' STORE
{ 'data' $values 'globalParams' { 'bar' { 'stacked' true } } }`
}

export const ChartWithCustomData = Usage.bind({});
ChartWithCustomData.args = {
  ...InitialUsage.args,
  ws: `{
'title' 'Test'
'columns'  [ 'A' 'B' 'C' 'D' ]
'rows' [
  [ 'label X' 15 56 44 22 ]
  [ 'label Y' 1 5 4 2 ]
  [ 'label Z' 14 45 78 12 ]
]
} 'values' STORE
{ 'data' $values 'globalParams' { } }`
}

export const ChartWithCustomDataAndLegend = Usage.bind({});
ChartWithCustomDataAndLegend.args = {
  ...ChartWithCustomData.args,
  options: {...new Param(), showLegend: true}
}

export const HorizontalStackedBarChart = Usage.bind({});
HorizontalStackedBarChart.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP bucketizer.last $NOW 1 m 0 ] BUCKETIZE
[ SWAP mapper.delta 1 0 0 ] MAP 'values' STORE
{ 'data' $values 'globalParams' { 'bar' { 'horizontal' true 'stacked' true } } }`
}

export const HorizontalStackedBarChartAndLegend = Usage.bind({});
HorizontalStackedBarChartAndLegend.args = {
  ...HorizontalStackedBarChart.args,
  options: {...new Param(), showLegend: true}
}

export const HorizontalStackedBarChartWithCustomData = Usage.bind({});
HorizontalStackedBarChartWithCustomData.args = {
  ...InitialUsage.args,
  ws: `{
'title' 'Test'
'columns'  [ 'A' 'B' 'C' 'D' ]
'rows' [
  [ 'label X' 15 56 44 22 ]
  [ 'label Y' 1 5 4 2 ]
  [ 'label Z' 14 45 78 12 ]
]
} 'values' STORE
{ 'data' $values 'globalParams' { 'bar' { 'horizontal' true 'stacked' true } } }`
}

export const BarChartWithAutoRefresh = Usage.bind({});
BarChartWithAutoRefresh.args = {
  ...InitialUsage.args,
  type: 'bar',
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`,
  options: {...new Param(), autoRefresh: 1}
}

export const WithCustomStyle = ({url, ws, language, options, unit, title, type}) => `
<div style="height: 600px;width: 100%;min-height: 600px;background-color: #404040;">
<style>
:root {
    --warp-view-chart-grid-color: #35b779;
    --warp-view-chart-label-color: #35b779;
   --warp-view-font-color: white;
    --warp-view-bg-color: #1C1E25;
    }
</style>
<div class="card" style="height: 100%;width: 100%;min-height: 100%;background-color: #404040">
      <div class="card-body">
          <discovery-tile url="${url}" type="${type}" language="${language}"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
</div>`;
WithCustomStyle.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.ATLANTIS},
  ws: `NOW 'now' STORE
  [ 1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME  'g' STORE
    1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
    $g
  %> FOR ] 'data' STORE
  { 'data' $data 'params' [ { 'datasetColor' '#ff9900' } ] 'globalParams' { 'bar' { 'stacked' true } } }

  `
};

export const CustomStyleAndAutoRefresh = WithCustomStyle.bind({});
CustomStyleAndAutoRefresh.args = {
  ...Usage.args,
  type: 'bar',
  options: {...Usage.args.options, scheme: Colors.CHARTANA, autoRefresh: 10},
  ws: `NEWGTS 'g' STORE
  1 200 <%
    'ts' STORE
    NOW $ts STU * 50.0 / - ABS 'ts' STORE
    $g $ts NaN NaN NaN $ts 50 * STU / 60.0 / SIN ABS ADDVALUE DROP %> FOR
  $g`
};

// noinspection JSUnresolvedFunction
const FocusPointsTemplate = ({url, ws, lang, options}) => `<div class="card" style="width: 100%; height: 500px;">
    <div class="card-body">
        <discovery-tile url="${url}" type="bar" lang="${lang}"
        options='${JSON.stringify(options)}'
         id="chart" debug>${ws}</discovery-tile>
    </div>
    <div class="card-footer"><button id="btn" class="btn btn-primary">Focus</button></div>
</div>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart');
  document.querySelector('#btn').addEventListener('click', () => {
    chart.setFocus('data-[23]', 4).then(()=>{
    })
  });
}
</script>
`;

export const FocusPoints = FocusPointsTemplate.bind({});
FocusPoints.args = {
  ...InitialUsage.args,
  ws: `1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {...new Param(), timeMode: 'custom'}
};

export const WithThreshold = Usage.bind({});
WithThreshold.args = {
  ...InitialUsage.args,
  unit: 'my unit',
  ws: `1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
 0 10 <% 'ts' STORE $g NOW ->TSELEMENTS [ 0 5 ] SUBLIST TSELEMENTS-> $ts s - RAND 50 * RAND  50 * RAND RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {
    ...new Param(),
    thresholds: [{value: 0.25, color: '#77BE69', fill: true}, {value: 0.5, color: '#ff9900'}, {value: 0.75}]
  }
};


export const StackedHorizontalCustomDataWithThreshold = Usage.bind({});
StackedHorizontalCustomDataWithThreshold.args = {
  ...InitialUsage.args,
  unit: 'my unit',
  ws: `{
'title' 'Test'
'columns'  [ 'A' 'B' 'C' 'D' ]
'rows' [
  [ 'label X' 15 56 44 22 ]
  [ 'label Y' 1 5 4 2 ]
  [ 'label Z' 14 45 78 12 ]
]
} 'values' STORE
{ 'data' $values }`,
  options: {
    ...new Param(),
    bar: {horizontal: true, stacked: true},
    thresholds: [{value: 30, color: '#77BE69', fill: true}, {value: 60, color: '#ff9900'}, {value: 120}]
  }
};

export const YMinMaxScale = InitialUsage.bind({});
YMinMaxScale.args = {
  ...InitialUsage.args,
  ws: `
  NOW 'now' STORE
1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME  'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND 100 * ADDVALUE DROP %> FOR
  $g
%> FOR
  `,
  options: {...InitialUsage.args.options, bounds: { yRanges: [ -20,  200] } }
};

export const WithXRange = Usage.bind({});
WithXRange.args = {
  ...InitialUsage.args,
  ws: `
  {
  'data' [ 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR ]
  'globalParams' { 'bounds' { 'maxDate' NOW 1 m + 'minDate' NOW 1 m - } }
  }`
};
