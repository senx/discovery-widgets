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

export default {
  ...tile,
  title: 'Charts/Scatter'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'scatter',
  ws: `@training/dataset0
  // 'N5Rj8hSF5LE4i6ugbpbywqpPwQVKNpkVrq3.5ffPeQJG.1hgvCOW4DAHHA4oDsLJsMiUF3PdPfXwIkOWRLnhUXHhJD3IZi1UQT4voW0MAeBW.CUP6kagrXdUFZ_RR4AYXbfvzZLh.EkKVV1M3y_cXmGvS9fS7Sev'
  // 'TOKEN' STORE
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

export const FocusPoints = ({url, ws, lang, options}) => `<div class="card" style="width: 100%; height: 500px;">
    <div class="card-body">
        <discovery-tile url="${url}" type="scatter" lang="${lang}"
        options='${JSON.stringify(options)}'
         id="chart" debug>${ws}</discovery-tile>
    </div>
    <div class="card-footer"><button id="btn" class="btn btn-primary">Focus</button></div>
</div>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart');
  document.querySelector('#btn').addEventListener('click', () => {
    // noinspection JSUnresolvedFunction
    chart.setFocus('data-[23]', 4).then(()=>{
    })
  })

}
</script>
`;

FocusPoints.args = {
  ...InitialUsage.args,
  ws: `1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {... new Param(), timeMode: 'custom'}
};

export const FocusPointWithDate = ({url, ws, lang, options}) => `<div class="card" style="width: 100%; height: 500px;">
    <div class="card-body">
        <discovery-tile url="${url}" type="scatter" lang="${lang}"
        options='${JSON.stringify(options)}'
         id="chart" debug>${ws}</discovery-tile>
    </div>
    <div class="card-footer"><button id="btn" class="btn btn-primary">Focus</button></div>
</div>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart');
  document.querySelector('#btn').addEventListener('click', () => {
    // noinspection JSUnresolvedFunction
    chart.setFocus('.*', 1515419993763851).then(()=>{
    })
  })

}
</script>
`;

FocusPointWithDate.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
      [ SWAP mapper.rate 1 0 0 ] MAP
      [ SWAP bucketizer.mean $NOW 1 h 0 ] BUCKETIZE`,
  options: {... new Param()}
};


export const FocusPointWithFullDate = FocusPointWithDate.bind({});

FocusPointWithFullDate.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
      [ SWAP mapper.rate 1 0 0 ] MAP
      [ SWAP bucketizer.mean $NOW 1 h 0 ] BUCKETIZE`,
  options: {... new Param(), fullDateDisplay: true}
};

export const WithThreshold = Usage.bind({});
WithThreshold.args = {
  ...InitialUsage.args,
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {... new Param(), thresholds: [ { value: 0.25, color: '#77BE69', fill: true }, { value: 0.5, color: '#ff9900' } , { value: 0.75 } ]}
};

