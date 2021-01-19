import readme from '../discovery-tile/readme.md';

export default {
  title: 'Components/Area Chart',
  notes: readme,
  argTypes: {
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
const Template = ({url, ws, language, type}) => `<div style="width: 100%; height: 500px;">
    <discovery-tile url="${url}" type="${type}" language="${language}" debug="true" >${ws}</discovery-tile>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  language: 'warpscript',
  type: 'area',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
export const SmoothedArea = Template.bind({});
SmoothedArea.args = {
  ...InitialUsage.args,
  type: 'spline-area',
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -20 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`
}
export const MixedChart = Template.bind({});
MixedChart.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'data' STORE
{ 'data' $data 'params' [ { 'type' 'area' } { 'type' 'step' } { 'type' 'line' } { 'type' 'spline-area' } ] }`
};
