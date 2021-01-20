import readme from './readme.md';
import {Param} from "../../model/param";

const options = new Param()
export default {
  title: 'Components/Tile',
  notes: readme,
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['line', 'area', 'spline', 'step', 'step-after', 'step-before', 'spline-area', 'annotation', 'bar']
      }
    },
    language: {
      control: {
        type: 'select', options: ['warpscript', 'flows']
      }
    },
    url: {control: 'text'},
    ws: {control: 'text'},
    options: {control: 'object'}
  },
  parameters: {
    actions: {
      handles: ['statusHeaders discovery-tile'],
    },
    docs: {
      description: {
        component: readme
      }
    },
  }
};
const Template = ({url, ws, language, type, options}) => `<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;

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

export const customStyle = ({url, ws, lang, options}) => `<div style="width: 100%; height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color:blue;
    --warp-view-chart-label-color: red;
    }
</style>
    <discovery-tile url="${url}" type="line" lang="${lang}"
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
  ...Usage.args,ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 30 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'data' STORE
  { 'data' $data 'params' [ { 'datasetColor' '#dc3545' } { 'datasetColor' '#ff9900' } { 'type' 'area' 'datasetColor' '#90d743' } { 'datasetColor' 'white' } ] }
  `,
  options: {...options, bgColor: '#404040'}
}
