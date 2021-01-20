import readme from './readme.md';

export default {
  title: 'Components/Tile',
  notes: readme,
  argTypes: {
    type: {
      control: {
        type: 'select', options: ['line', 'area', 'spline', 'step', 'step-after', 'step-before', 'spline-area', 'annotation']
      }
    },
    language: {
      control: {
        type: 'select', options: ['warpscript', 'flows']
      }
    },
    url: {control: 'text'},
    ws: {control: 'text'}
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
const Template = ({url, ws, language, type}) => `
<div style="width: 100%; height: 500px;">
    <discovery-tile url="${url}" type="${type}" language="${language}" debug="true">${ws}</discovery-tile>
</div>`;

export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  language: 'warpscript',
  type: 'line',
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};

export const customStyle = ({url, ws, lang}) => `<div style="width: 100%; height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color:blue;
    --warp-view-chart-label-color: red;
    }
</style>
    <discovery-tile url="${url}" type="line" lang="${lang}">${ws}</discovery-tile>
</div>`;
customStyle.args = {...Usage.args};
