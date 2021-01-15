import readme from '../discovery-tile/readme.md';

export default {
  title: 'Components/Line Chart',
  notes: readme,
  argTypes: {
    lang: {
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
const Template = ({url, ws, lang}) => `<div style="width: 100%; height: 500px;">
    <discovery-tile url="${url}" type="line" lang="${lang}" debug="true">${ws}</discovery-tile>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  lang: 'warpscript',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};

export const SmallArea = ({url, ws, lang}) => `<div style="width: 300px; height: 200px;">
    <discovery-tile url="${url}" type="line" lang="${lang}">${ws}</discovery-tile>
</div>`;
SmallArea.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  lang: 'warpscript',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
export const amzairAaaTestXM1 = Template.bind({});
amzairAaaTestXM1.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  lang: 'warpscript',
  ws: `@amzair/aaaTestXM1`
};
