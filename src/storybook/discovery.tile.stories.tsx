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
        'scatter', 'step-area'].sort(),
      control: {
        type: 'select',
        labels: [
          'line', 'area', 'spline', 'step', 'step-after', 'step-before', 'spline-area', 'annotation', 'bar', 'display',
          'gauge', 'circle', 'map', 'pie', 'rose', 'doughnut', 'tabular', 'plot', 'linear-gauge', 'button', 'input:text',
          'input:list', 'input:secret', 'input:autocomplete', 'input:slider', 'input:date', 'input:date-range', 'image',
          'scatter', 'step-area'].sort()
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
  ws: `1 4 <% DROP NEWGTS 'g' STORE
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
export const AutoRefresh = Template.bind({});
AutoRefresh.args = {
  ...Usage.args,
  options: {...new Param(), autoRefresh: 5}
}

export const customStyle = ({url, ws, lang, options, unit, title}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
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


const TileResultTemplate = ({result, options}) => `
<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
            <discovery-tile-result options="${JSON.stringify(options)}" type="line"
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

  document.querySelector('#btn').addEventListener('click', e => {
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


const TileResultChangeTypeTemplate = ({result, options}) => `
<div style="height: 600px;width: 100%;min-height: 300px; resize: both; padding: 10px; overflow: hidden;">
  <div class="card" style="height: 100%;width: 100%;min-height: 100%;">
      <div class="card-body">
            <discovery-tile-result options="${JSON.stringify(options)}" type="line"
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
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart1');

  document.querySelector('#btn').addEventListener('click', e => {
    chart.setAttribute('type', "line")
  })

  document.querySelector('#btn2').addEventListener('click', e => {
    chart.setAttribute('type', "area")
  })

  document.querySelector('#btn3').addEventListener('click', e => {
    chart.setAttribute('type', "bar")
  })

  document.querySelector('#btn4').addEventListener('click', e => {
    chart.setAttribute('type', "pie")
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
  document.querySelector('#show').addEventListener('click', e => {
    chart.show('gts-2{}')
  });
  document.querySelector('#hide').addEventListener('click', e => {
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
