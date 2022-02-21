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

import readme from '../components/discovery-tile/readme.md';
import {Param} from "../model/param";
import {action, configureActions} from '@storybook/addon-actions';

configureActions({
  depth: 10,
  // Limit the number of items logged into the actions panel
  limit: 20,
  allowFunction: true
});
const options = new Param()
export default {
  title: 'UI/Tile',
  notes: readme,
  argTypes: {
    type: {
      options: [
        'line', 'area', 'spline', 'step', 'step-after', 'step-before', 'spline-area', 'annotation', 'bar', 'display',
        'gauge', 'circle', 'map', 'pie', 'rose', 'doughnut', 'tabular', 'plot', 'linear-gauge', 'button', 'input:text',
        'input:list', 'input:secret', 'input:autocomplete', 'input:slider', 'input:date', 'input:date-range', 'image',
        'scatter', 'step-area', 'hidden', 'calendar', 'marauder', 'compass', 'input:multi', 'input:multi-cb'].sort(),
      control: {
        type: 'select',
        labels: [
          'line', 'area', 'spline', 'step', 'step-after', 'step-before', 'spline-area', 'annotation', 'bar', 'display',
          'gauge', 'circle', 'map', 'pie', 'rose', 'doughnut', 'tabular', 'plot', 'linear-gauge', 'button', 'input:text',
          'input:list', 'input:secret', 'input:autocomplete', 'input:slider', 'input:date', 'input:date-range', 'image',
          'scatter', 'step-area', 'hidden', 'calendar', 'marauder', 'compass', 'input:multi', 'input:multi-cb'].sort()
      }
    },
    language: {
      options: ['warpscript', 'flows'],
      control: {
        type: 'select', labels: ['WarpScript', 'FLoWS']
      }
    },
    url: {control: 'text'},
    ws: {control: 'text'},
    title: {control: 'text'},
    unit: {control: 'text'},
    options: {control: 'object'},
    onDraw: {action: 'clicked'}
  },
  parameters: {docs: {description: {component: readme}}}
};

[
  'statusHeaders',
  'statusError',
  'execResult',
  'draw',
  'leftMarginComputed',
  'dataZoom',
  'dataPointOver'
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

// @ts-ignore
const Template = ({url, ws, language, type, options, unit, title}) => `
<div style="height: 600px;width: 100%;min-height: 100px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
          <discovery-tile url="${url}" type="${type}" language="${language}"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
      </div>
  </div>
</div>
`;

export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  language: 'warpscript',
  type: 'line',
  ws: `1 4 <% TOSTRING 'i' STORE NEWGTS 'data-' $i + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: new Param()
}
export const UsageWithTitle = Template.bind({});
UsageWithTitle.args = {
  ...Usage.args,
  title: 'Test'
}
export const UsageWithWebSocket = Template.bind({});
UsageWithWebSocket.args = {
  ...Usage.args,
  url: 'wss://warp.senx.io/api/v0/mobius',
  ws: `NEWGTS 'data' RENAME 'gts' STORE
NOW  'now' STORE
$now 10 s - $now
<% 200 ms + %>
<%
  'i' STORE
  $i 1e-6 * SIN 'v' STORE
  $gts $i NaN NaN NaN $v ADDVALUE DROP
%> FORSTEP
$gts SORT`,
  options: {...new Param(), autoRefresh: 200}
}

export const ErrorUseCase = Template.bind({});
ErrorUseCase.args = {
  ...Usage.args,
  type: 'display',
  ws: 'RAND 0.5 > <% "Error message" MSGFAIL %> <% RAND 100 * ROUND %>  IFTE',
  options: {...new Param(), autoRefresh: 5, showErrors: true}
}

export const ErrorUseCaseWithWebSockets = Template.bind({});
ErrorUseCaseWithWebSockets.args = {
  ...Usage.args,
  url: 'wss://warp.senx.io/api/v0/mobius',
  type: 'display',
  ws: 'LINEON RAND 0.5 > <% "Error message" MSGFAIL %> <% RAND 100 * ROUND %>  IFTE',
  options: {...new Param(), autoRefresh: 5000, showErrors: true}
}

export const AutoRefresh = Template.bind({});
AutoRefresh.args = {
  ...Usage.args,
  options: {...new Param(), autoRefresh: 5}
}

export const customStyle = ({url, ws, lang, options, unit, title}) => `
<div style="width: 100%; min-height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color: blue;
    --warp-view-chart-label-color: red;
    }
</style>
    <discovery-tile url="${url}" type="line" lang="${lang}"
        unit="${unit || ''}" title="${title || ''}"
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
customStyle.args = {...Usage.args};

export const colorSchemeAndOptions = Template.bind({});
colorSchemeAndOptions.args = {
  ...Usage.args,
  options: {...options, scheme: 'INFERNO'}
}
export const backgroundAndIndividualLineColors = Template.bind({});
backgroundAndIndividualLineColors.args = {
  ...Usage.args, ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 30 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'data' STORE
  { 'data' $data 'params' [ { 'datasetColor' '#dc3545' } { 'datasetColor' '#ff9900' } { 'type' 'area' 'datasetColor' '#90d743' } { 'datasetColor' 'white' } ] }
  `,
  options: {...options, bgColor: '#404040'}
}

export const resizeHandler = ({url, ws, lang, options, unit, title}) => `<div style="height: 300px;
min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
    <discovery-tile url="${url}" type="line" lang="${lang}"
        unit="${unit || ''}" title="${title || ''}"
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
resizeHandler.args = {...Usage.args};


const TemplateCustomVars = ({url, options}) => `
<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
        <div class="row">
          <div class="col-6" style="height: 150px;">

            <discovery-tile url="${url}" type="display"
            chart-title="custom var : string"
            vars='${JSON.stringify({'myVar': {type: 'string', value: 'Hello'}})}'
            debug options='${JSON.stringify(options)}'
            >$myVar</discovery-tile>
          </div>
            <div class="col-6" style="height: 150px;">

            <discovery-tile url="${url}" type="display"
            chart-title="custom var : eval"
            vars='${JSON.stringify({'myVar': {type: 'eval', value: '24 h'}})}'
            debug options='${JSON.stringify(options)}'
            >$myVar</discovery-tile>
          </div>
      </div>
    </div>
  </div>
</div>
`;
export const externalVars = TemplateCustomVars.bind({});
externalVars.args = {
  ...Usage.args
}


const TileResultTemplate = ({result, options, type = 'line'}) => `
<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
            <discovery-tile-result options="${JSON.stringify(options)}" type="${type}"
            id="chart1"
            debug
            options='${JSON.stringify(options)}'
            result='${JSON.stringify(result)}'
            ></discovery-tile-result>
    </div>
  </div>
</div>
 <button class="btn btn-primary" id="btn">To timestamp</button>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart1');

  document.querySelector('#btn').addEventListener('click', () => {
    chart.setAttribute('options', JSON.stringify({ timeMode: 'timestamp'}))
  })

}
</script>
`;
export const TileResult = TileResultTemplate.bind({});
TileResult.args = {
  ...Usage.args,
  options: {},
  result: [{
    "c": "",
    "l": {},
    "a": {},
    "la": 0,
    "v": [[1634139566040869, 0.04070378699014665], [1634139567040871, 0.6431964144579836], [1634139568040872, 0.0998190270856355], [1634139569040874, 0.9466145094577127], [1634139570040875, 0.3036104996230803]]
  }]
}


const TileResultShowHideTemplate = ({result, options, type = 'line'}) => `
<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body" id="chart">

    </div>
  </div>
</div>
 <button class="btn btn-primary" id="btn">Show</button>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart');

  document.querySelector('#btn').addEventListener('click', () => {
    chart.innerHTML = \`
          <discovery-tile-result options="${JSON.stringify(options)}" type="${type}"
            id="chart1"
            debug
            options='${JSON.stringify(options)}'
            result='${JSON.stringify(result)}'
            ></discovery-tile-result>
    \`
  })

}
</script>
`;
export const TileResultMap = TileResultShowHideTemplate.bind({});
TileResultMap.args = {
  ...Usage.args,
  type: 'map',
  options: {},
  result: [{
    "c": "data-4",
    "l": {},
    "a": {},
    "la": 0,
    "v": [[1638874425143351, 0.9333503153175116, 0.12957919389009476, 0, 0.6214692252667323], [1638874426235975, 0.8102396875619888, 0.553212147206068, 0, 0.9991809468247019], [1638874427411003, 0.3943892056122422, 0.68684047088027, 0, 0.30611902798443436], [1638874428652972, 0.3101623523980379, 0.8860867749899626, 0, 0.40099188920998774], [1638874429183958, 0.3749940264970064, 0.39398113265633583, 0, 0.8188509620282274], [1638874429989633, 0.8929840754717588, 0.6349493656307459, 0, 0.053643100009675315], [1638874431428386, 0.47454509418457747, 0.6029462534934282, 0, 0.8452057094342338], [1638874432716353, 0.15683634672313929, 0.4408657271414995, 0, 0.5897730597827756], [1638874432975268, 0.5844009574502707, 0.2755713276565075, 0, 0.36487681214033096], [1638874434012184, 0.6501024216413498, 0.8931385539472103, 0, 0.15648943956375683]]
  }, {
    "c": "data-3",
    "l": {},
    "a": {},
    "la": 0,
    "v": [[1638874425496592, 0.7274605985730886, 0.26664258912205696, 0, 0.5715378797913053], [1638874426052476, 0.3453022241592407, 0.13697873800992966, 0, 0.17969171804313722], [1638874427703647, 0.9880255116149783, 0.3828219696879387, 0, 0.5914433027908735], [1638874428131872, 0.8842911198735237, 0.5880682077258825, 0, 0.6500874273494488], [1638874429024145, 0.22094160318374634, 0.8648836612701416, 0, 0.765118791593477], [1638874430076636, 0.43914349749684334, 0.2854554355144501, 0, 0.8569927698011852], [1638874431153665, 0.6605493742972612, 0.9087428916245699, 0, 0.10152128984398268], [1638874431761924, 0.8103436231613159, 0.278031500056386, 0, 0.6301387170225387], [1638874433503874, 0.5083680432289839, 0.20716343075037003, 0, 0.526533497413046], [1638874433970809, 0.7196643389761448, 0.896880067884922, 0, 0.49330947849591367]]
  }, {
    "c": "data-2",
    "l": {},
    "a": {},
    "la": 0,
    "v": [[1638874425420402, 0.5883751530200243, 0.4199184291064739, 0, 0.24817525817808817], [1638874425943828, 0.8477049507200718, 0.45070172287523746, 0, 0.3165660562802116], [1638874427443684, 0.6966704316437244, 0.8865637052804232, 0, 0.3783704311806362], [1638874428412589, 0.766467503271997, 0.08556447923183441, 0, 0.24084018028730492], [1638874429135484, 0.22510514594614506, 0.19300497137010098, 0, 0.7252198112368526], [1638874430257644, 0.3508325619623065, 0.9301640186458826, 0, 0.7836950166936083], [1638874430927216, 0.6018570251762867, 0.3411245997995138, 0, 0.9465926681451698], [1638874432708307, 0.7443539891391993, 0.9116916451603174, 0, 0.07118848632078778], [1638874433525707, 0.43223383370786905, 0.9987609274685383, 0, 0.22703661585231805], [1638874434018974, 0.09985801298171282, 0.21764609031379223, 0, 0.053170954507643864]]
  }, {
    "c": "data-1",
    "l": {},
    "a": {},
    "la": 0,
    "v": [[1638874425019617, 0.6615918735042214, 0.9863729774951935, 0, 0.22732960825041237], [1638874426171668, 0.5933896265923977, 0.8567361161112785, 0, 0.8020578196007249], [1638874427622581, 0.9309113072231412, 0.21966101601719856, 0, 0.7454522333634289], [1638874427843605, 0.47368301544338465, 0.4878563527017832, 0, 0.9815735735038906], [1638874429085047, 0.4854786582291126, 0.7445777859538794, 0, 0.6599172481288309], [1638874430733960, 0.9751556860283017, 0.6511946674436331, 0, 0.05403237601411148], [1638874431517324, 0.8262907806783915, 0.5969331599771976, 0, 0.6997291919535762], [1638874432584261, 0.6939010927453637, 0.15462197363376617, 0, 0.0411079978190807], [1638874432964625, 0.2886937838047743, 0.9193515311926603, 0, 0.642726158158874], [1638874434145828, 0.13398421928286552, 0.9868202358484268, 0, 0.7854139919070419]]
  }]
}


const TileResultChangeTypeTemplate = ({result, options}) => `
<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
            <discovery-tile-result options="${JSON.stringify(options)}" type="area"
            id="chart1"
            debug
            options='${JSON.stringify(options)}'
            result='${JSON.stringify(result)}'
            ></discovery-tile-result>
    </div>
  </div>
</div>
 <button class="btn btn-primary" id="btn">Line</button>
 <button class="btn btn-primary" id="btn2">Area</button>
 <button class="btn btn-primary" id="btn3">Bar</button>
 <button class="btn btn-primary" id="btn4">Pie</button>
 <button class="btn btn-primary" id="btn5">Map</button>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart1');

  document.querySelector('#btn').addEventListener('click', () => {
    chart.setAttribute('type', "line")
  })

  document.querySelector('#btn2').addEventListener('click', () => {
    chart.setAttribute('type', "area")
  })

  document.querySelector('#btn3').addEventListener('click', () => {
    chart.setAttribute('type', "bar")
  })

  document.querySelector('#btn4').addEventListener('click', () => {
    chart.setAttribute('type', "pie")
  })

  document.querySelector('#btn5').addEventListener('click', () => {
    chart.setAttribute('type', "map")
  })

}
</script>
`;
export const TileResultChangeType = TileResultChangeTypeTemplate.bind({});
TileResultChangeType.args = {
  ...Usage.args,
  options: {},
  result: [{
    "c": "",
    "l": {},
    "a": {},
    "la": 0,
    "v": [[1634139566040869, 0.04070378699014665], [1634139567040871, 0.6431964144579836], [1634139568040872, 0.0998190270856355], [1634139569040874, 0.9466145094577127], [1634139570040875, 0.3036104996230803]]
  }]
}

const ShowHideTemplate = ({url, ws, language, type, options, unit, title}) => `<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
  <div class="card-body">
  <discovery-tile url="${url}" type="${type}" language="${language}"
  id="chart1"
unit="${unit || ''}"
chart-title="${title || ''}"
@draw="${event => console.error('foo', 'bar', event)}"
debug options='${JSON.stringify(options)}'
  >${ws}</discovery-tile>
</div>
  <div class="card-footer">
 <button class="btn btn-primary" id="show">Show</button>
 <button class="btn btn-primary" id="hide">Hide</button>

</div>
</div>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart1');
  document.querySelector('#show').addEventListener('click', () => {
    chart.show('gts-2{}')
  });
  document.querySelector('#hide').addEventListener('click', () => {
    chart.hide('gts.*')
  });
}
</script>
`;
export const ShowHide = ShowHideTemplate.bind({});
ShowHide.args = {
  ...Usage.args,
  ws: `1 4 <% 'a' STORE NEWGTS 'gts-' $a TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
}


// @ts-ignore
const CombinedTemplate = ({url, ws, language, type, options, unit, title}) => `
<div style="height: auto;width: 100%;min-height: 100px;padding: 10px;">
          <discovery-tile url="${url}" type="annotation" language="${language}"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          id="myAnnotationChart"
          debug options='${JSON.stringify(options)}'
          >${ws}</discovery-tile>
</div>

<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
          <discovery-tile url="${url}" type="${type}" language="${language}"
          unit="${unit || ''}"
          chart-title="${title || ''}"
          @draw="${event => console.error('foo', 'bar', event)}"
          debug options='${JSON.stringify(options)}'
          id="myChart"
          >${ws}</discovery-tile>
</div>
<script>
document.querySelector('#myChart').addEventListener('leftMarginComputed', e => {
  console.log('leftMarginComputed', e.detail);
  document.querySelector('#myAnnotationChart').setAttribute("options", JSON.stringify({... JSON.parse('${JSON.stringify(options)}'), leftMargin: e.detail}))
})
</script>
`;

export const CombinedUsage = CombinedTemplate.bind({});
CombinedUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  language: 'warpscript',
  type: 'line',
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
  options: new Param()
}
