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

import {action, configureActions} from '@storybook/addon-actions';
import {Usage} from "./discovery.dashboard.stories";

configureActions({
  depth: 10,
// Limit the number of items logged into the actions panel
  limit: 5,
  allowFunction: true
});

// noinspection JSUnusedGlobalSymbols
export default {
  title: 'Exports/PDF',
  argTypes: {
    url: {control: 'text'},
    ws: {control: 'text'},
    title: {control: 'text'},
    options: {control: 'object'},
    onDraw: {action: 'clicked'}
  },
};

[
  'statusHeaders',
  'statusError',
  'execResult',
  'draw',
  'rendered',
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

const KitchenSinkTemplate = ({url, ws, options, title, cellHeight}) => `
    <button id="pdf" class="btn btn-primary">PDF in new TAB</button>
<div class="card"  style="min-width: 100%;">
<div class="card-body">
<discovery-dashboard url="${url}"
id="dash"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
cols="12" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>
</div>
<!--suppress JSUnresolvedFunction -->
<script>
    const dash = document.getElementById('dash');
    document.getElementById('pdf').addEventListener('click', () => {
      dash.getPDF(false, 'blob').then(data => {
        console.log("PDF done");
       const file = new Blob([data.data], {type: 'application/pdf'});
       const fileURL = URL.createObjectURL(file);
       window.open(fileURL, data.filename);
      }).catch(e => console.error(e));
    });
</script>`;


export const KitchenSink = KitchenSinkTemplate.bind({});
KitchenSink.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  type: 'dashboard',
  cellHeight: 120,
  ws: `{
  'title' 'My Dashboard'
  'description' 'Kitchen Sink'
  'tiles' [
    { 'type' 'display' 'data' 'Charts' 'x' 0 'y' 0 'w' 12 'h' 1 }
    {
      'type' 'line'
      'title' 'line'
      'x' 0 'y' 1 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'area'
      'title' 'area'
      'x' 4 'y' 1 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'scatter'
      'title' 'scatter'
      'x' 8 'y' 1 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'step-area'
      'title' 'step-area'
      'x' 0 'y' 3 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'spline-area'
      'title' 'spline-area'
      'x' 4 'y' 3 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'spline'
      'title' 'spline'
      'x' 8 'y' 3 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'step'
      'title' 'step'
      'x' 0 'y' 5 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'step-before'
      'title' 'step-before'
      'x' 4 'y' 5 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'step-after'
      'title' 'step-after'
      'x' 8 'y' 5 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'annotation'
      'title' 'annotation'
      'x' 0 'y' 7 'w' 4 'h' 2
      'macro' <% 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN T ADDVALUE DROP %> FOR
  $g %> FOR %>
    }
    {
      'type' 'bar'
      'title' 'bar'
      'x' 4 'y' 7 'w' 4 'h' 2
      'macro' <% NOW 'now' STORE
1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME  'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR %>
    }
    {
      'type' 'gauge'
      'title' 'gauge'
      'x' 8 'y' 7 'w' 4 'h' 2
      'data' { 'data' RAND 100 * ROUND 'params' [ { 'maxValue' 100 } ] }
    }
    {
      'type' 'circle'
      'title' 'circle'
      'x' 0 'y' 9 'w' 4 'h' 2
      'data' { 'data' RAND 100 * ROUND 'params' [ { 'maxValue' 100 } ] }
    }
    {
      'type' 'compass'
      'title' 'compass'
      'x' 4 'y' 9 'w' 4 'h' 2
      'data' { 'data' RAND 100 * ROUND 'params' [ { 'maxValue' 100 } ] }
    }
    {
      'type' 'linear-gauge'
      'title' 'linear-gauge'
      'x' 8 'y' 9 'w' 4 'h' 2
      'data' { 'data' 42 'params' [ { 'maxValue' 100 } ] }
    }
    {
      'type' 'pie'
      'title' 'pie'
      'x' 0 'y' 11 'w' 4 'h' 2
      'macro' <% 0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR %>
    }
    {
      'type' 'doughnut'
      'title' 'doughnut'
      'x' 4 'y' 11 'w' 4 'h' 2
      'macro' <% 0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR %>
    }
    {
      'type' 'rose'
      'title' 'rose'
      'x' 8 'y' 11 'w' 4 'h' 2
      'macro' <% 0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR %>
    }

    { 'type' 'display' 'data' 'Displays' 'x' 0 'y' 13 'w' 12 'h' 1 }
    {
      'type' 'display'
      'title' 'display'
      'x' 0 'y' 14 'w' 4 'h' 2
      'data' RAND 100 * ROUND
    }
    {
      'type' 'image'
      'title' 'image'
      'x' 4 'y' 14 'w' 4 'h' 2
      'macro' <% 300 200 '2D3' PGraphics
255 Pbackground
16 PtextSize

50 'x1' STORE
50 'y1' STORE
200 'x2' STORE
130 'y2' STORE

100 'cx1' STORE
40 'cy1' STORE

110 'cx2' STORE
140 'cy2' STORE


4 PstrokeWeight
$x1 $y1 Ppoint //first anchor
$x2 $y2 Ppoint //second anchor

2 PstrokeWeight
$x1 $y1 $cx1 $cy1 Pline
$x2 $y2 $cx2 $cy2 Pline

2 PstrokeWeight
0xffff0000 Pstroke
$x1 $y1 $cx1 $cy1 $cx2 $cy2 $x2 $y2 Pbezier

0 10
<%
10.0 / 't' STORE

$x1 $cx1 $cx2 $x2 $t PbezierPoint 'x' STORE
$y1 $cy1 $cy2 $y2 $t PbezierPoint 'y' STORE
$x1 $cx1 $cx2 $x2 $t PbezierTangent 'tx' STORE
$y1 $cy1 $cy2 $y2 $t PbezierTangent 'ty' STORE
$ty $tx ATAN2 PI 2.0 / - 'angle' STORE
0xff009f00 Pstroke
$x
$y
$x $angle COS 12 * +
$y $angle SIN 12 * +
Pline

0x9f009f00 Pfill
PnoStroke
'CENTER' PellipseMode
$x $y 5 5 Pellipse
%> FOR
Pencode %>
    }
    {
      'type' 'svg'
      'title' 'svg'
      'x' 8 'y' 14 'w' 4 'h' 2
      'macro' <%
     @xav/nuclear
             %>
    }
    {
      'type' 'tabular'
      'title' 'tabular'
      'x' 0 'y' 16 'w' 6 'h' 2
      'macro' <% 0 2 <% 'j' STORE
  NEWGTS 'serie' $j TOSTRING + RENAME 'g' STORE
  1 1000 <%
    'ts' STORE
    NOW $ts STU * 50.0 / - 'ts' STORE
    $g $ts NaN NaN NaN $ts 50 * STU / 60.0 / SIN ADDVALUE DROP %> FOR
  $g
%> FOR %>
    }
    {
      'type' 'calendar'
      'title' 'calendar'
      'x' 6 'y' 16 'w' 6 'h' 2
      'macro' <% NEWGTS 'serie' RENAME 'g' STORE
   1 500 <% 'i' STORE $g NOW $i d - NaN NaN NaN RAND ADDVALUE DROP %> FOR
   $g SORT %>
    }
    { 'type' 'display' 'data' 'Maps' 'x' 0 'y' 18 'w' 12 'h' 1 }
    {
      'type' 'map'
      'title' 'map'
      'x' 0 'y' 19 'w' 6 'h' 4
      'macro' <% NEWGTS 'g' STORE
1 6 <% 'ts' STORE $g $ts RAND 30 * RAND 30 * RAND RAND ADDVALUE DROP %> FOR
$g %>
    }
    {
      'type' 'marauder'
      'title' 'marauder'
      'x' 6 'y' 19 'w' 6 'h' 4
      'macro' <%  'yaw2XlsczxtKdzZpxYA5DXvE0w9sRQHjJPnyJ2MVZrjf1HK7bH82rkVfuhdkxYuLT1kGGC6DpsFskCTfReqgVsN4nFbpZqLlmgDRncN9oJtEHTkYMDDiQADNpyE5OHww90Ia3SYge3ORSk.NwvjOX.' 'token' STORE
  $token AUTHENTICATE
  20000000 LIMIT
  100000000 MAXOPS
  2000000 MAXPIXELS
  [ $token 'fr.trains' {  } NOW 12 h ] FETCH
  [ 1 ] { 1 'train' } MVINDEXSPLIT FLATTEN ->GTS VALUELIST FLATTEN [ 0 50 ] SUBLIST 'data' STORE
  {
    'data' $data
    'globalParams' {
      'map' {
        'step' 10 m
        'delay' 1000 // ms
      }
    }
  } %>
    }
    { 'type' 'display' 'data' 'Inputs' 'x' 0 'y' 23 'w' 12 'h' 1 }
    {
      'type' 'input:text'
      'title' 'input:text'
      'x' 0 'y' 24 'w' 4 'h' 1
      'macro' <% { 'data' 'Hello' } %>
    }
    {
      'type' 'input:secret'
      'title' 'input:secret'
      'x' 4 'y' 24 'w' 4 'h' 1
      'macro' <% { 'data' 'Hello' } %>
    }
    {
      'type' 'input:list'
      'title' 'input:list'
      'x' 8 'y' 24 'w' 4 'h' 1
      'macro' <%
      {
        'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
        'globalParams' { 'input' { 'value' 'cranky' } }
      }
      %>
    }
    {
      'type' 'input:autocomplete'
      'title' 'input:autocomplete'
      'x' 0 'y' 25 'w' 4 'h' 1
      'macro' <%
      {
        'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
        'globalParams' { 'input' { 'value' 'cranky' } }
      }
      %>
    }
    {
      'type' 'input:slider'
      'title' 'input:slider'
      'x' 0 'y' 26 'w' 4 'h' 1
      'macro' <%
      { 'data' 42 'globalParams' { 'input' { 'min' 0 'max' 50 } } }
      %>
    }
    {
      'type' 'input:multi'
      'title' 'input:multi'
      'x' 4 'y' 25 'w' 4 'h' 2
      'macro' <%
      {
        'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
        'globalParams' { 'input' { 'value' [ 'cranky' 'angry' ] } }
      }
      %>
    }
    {
      'type' 'input:multi-cb'
      'title' 'input:multi-cb'
      'x' 8 'y' 25 'w' 4 'h' 2
      'macro' <%
      {
        'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
        'globalParams' { 'input' { 'value' [ 'cranky' 'angry' ] } }
      }
      %>
    }
    {
      'type' 'input:date'
      'title' 'input:date'
      'x' 0 'y' 27 'w' 4 'h' 2
      'macro' <%
      {
        'data' NOW
      }
      %>
    }
    {
      'type' 'input:date-range'
      'title' 'input:date-range'
      'x' 4 'y' 27 'w' 4 'h' 2
      'macro' <%
      {
        'data' [ NOW 10 d - NOW ]
      }
      %>
    }
    {
      'type' 'button'
      'title' 'button'
      'x' 8 'y' 27 'w' 4 'h' 2
      'macro' <% 2 2 + %>
    }
  ]
}`
}


const KitchenSinkDarkTemplate = ({url, ws, options, title, cellHeight}) => `
<style>
:root {
--warp-view-dashboard-background:  #333540;
    --wc-split-gutter-color: #404040;
    --warp-view-pagination-bg-color: #343a40 !important;
    --warp-view-pagination-border-color: #6c757d;
    --warp-view-datagrid-odd-bg-color: rgba(255, 255, 255, .05);
    --warp-view-datagrid-odd-color: #FFFFFF;
    --warp-view-datagrid-even-bg-color: #212529;
    --warp-view-datagrid-even-color: #FFFFFF;
    --warp-view-font-color: #FFFFFF;
    --warp-view-chart-label-color: #FFFFFF;
    --gts-stack-font-color: #FFFFFF;
    --warp-view-resize-handle-color: #111111;
    --warp-view-chart-legend-bg: #000;
    --gts-labelvalue-font-color: #ccc;
    --gts-separator-font-color: #FFFFFF;
    --gts-labelname-font-color: rgb(105, 223, 184);
    --gts-classname-font-color: rgb(126, 189, 245);
    --warp-view-chart-legend-color: #FFFFFF;
    --wc-tab-header-color: #FFFFFF;
    --wc-tab-header-selected-color: #404040;
    --warp-view-tile-background: #3A3C46;
    --warp-view-modal-bg-color: #333540;
  }
</style>
    <button id="pdf" class="btn btn-primary">PDF in new TAB</button>
<div class="card"  style="min-width: 100%;">
<div class="card-body">
<discovery-dashboard url="${url}"
id="dash"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
cols="12" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>
</div>
<!--suppress JSUnresolvedFunction -->
<script>
    const dash = document.getElementById('dash');
    document.getElementById('pdf').addEventListener('click', () => {
      dash.getPDF(false, 'blob').then(data => {
        console.log("PDF done");
       const file = new Blob([data.data], {type: 'application/pdf'});
       const fileURL = URL.createObjectURL(file);
       window.open(fileURL, data.filename);
      }).catch(e => console.error(e));
    });
</script>`;


export const KitchenSinkDark = KitchenSinkDarkTemplate.bind({});
KitchenSinkDark.args = {
  ...KitchenSink.args
}


const TemplatePdf = ({url, ws, options, title, cols, cellHeight}) => `
<div class="card" style="width: 100%;min-height: 500px">
  <div class="card-body">
    <discovery-dashboard url="${url}"
    id="dash"
    dashboard-title="${title ? title : ''}"
    @draw="${event => console.error('foo', 'bar', event)}"
    cols="${cols}" cell-height="${cellHeight}"
    debug options='${JSON.stringify(options)}'
    >${ws}</discovery-dashboard>
    <pre><code id="code"></code></pre>
  </div>
   <div class="card-footer">
    <button id="struct" class="btn btn-primary">Get Struct</button>
    <button id="pdf" class="btn btn-primary">PDF in new TAB</button>
    <button id="pdfDL" class="btn btn-primary">PDF Download</button>
  </div>
</div>
<!--suppress JSUnresolvedFunction -->
<script>
    const dash = document.getElementById('dash');
    document.getElementById('struct').addEventListener('click', () => {
      dash.getDashboardStructure().then(r => {
        console.log(r);
        document.getElementById('code').innerText = JSON.stringify(r, null, 2);
      });
    });
    document.getElementById('pdf').addEventListener('click', () => {
      dash.getPDF(false, 'blob').then(data => {
       console.log(data);
        const file = new Blob([data.data], {type: 'application/pdf'});

       const fileURL = URL.createObjectURL(file);

       window.open(fileURL, data.filename);
      });
    });
    document.getElementById('pdfDL').addEventListener('click', () => dash.getPDF().then(data => console.log(data)));
</script>
`;

export const PdfExport = TemplatePdf.bind({});
PdfExport.args = {
  ...Usage.args,
  cellHeight: 180
}
