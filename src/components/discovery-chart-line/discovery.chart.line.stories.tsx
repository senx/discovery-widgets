import readme from '../discovery-tile/readme.md';

export default {
  title: 'Components/Line Chart',
  notes: readme,
  argTypes: {
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
const Template = ({url, ws}) => `<div style="width: 100%; height: 500px;">
    <discovery-tile url="${url}" type="line"
    >${ws}</discovery-tile>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
