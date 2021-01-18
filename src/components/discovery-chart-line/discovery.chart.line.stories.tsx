import readme from '../discovery-tile/readme.md';

export default {
  title: 'Components/Line Chart',
  notes: readme,
  argTypes: {
    type: {
      control: {
        type: 'select', options: ['line', 'area', 'spline', 'step', 'step-after', 'step-before']
      }
    },
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
const Template = ({url, ws, lang, type}) => `<div class="uk-card uk-card-body">
<div style="width: 100%; height: 500px;">
    <discovery-tile url="${url}" type="${type}" lang="${lang}" debug="true">${ws}</discovery-tile>
</div>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  lang: 'warpscript',
  type: 'line',
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};

export const SimpleLineChart = Template.bind({});
SimpleLineChart.args = {
  ...InitialUsage.args,
  ws: `[
  NEWGTS 'Date' RENAME // Commenting that makes it work
  1000 NaN NaN NaN 2.5 ADDVALUE
  2000 NaN NaN NaN 2.5 ADDVALUE
  3000 NaN NaN NaN 2.5 ADDVALUE
  4000 NaN NaN NaN 2.5 ADDVALUE

  NEWGTS '1' RENAME
  1000 NaN NaN NaN 1 ADDVALUE
  2000 NaN NaN NaN 2 ADDVALUE
  3000 NaN NaN NaN 3 ADDVALUE
  4000 NaN NaN NaN 4 ADDVALUE

  NEWGTS '2' RENAME
  1000 NaN NaN NaN 4 ADDVALUE
  2000 NaN NaN NaN 3 ADDVALUE
  3000 NaN NaN NaN 2 ADDVALUE
  4000 NaN NaN NaN 1 ADDVALUE
]`
}

export const RealUseCase = Template.bind({});
RealUseCase.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -20 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`
}

export const SplineChart = Template.bind({});
SplineChart.args = {
  ...InitialUsage.args,
  type: 'spline'
}
export const StepChart = Template.bind({});
StepChart.args = {
  ...InitialUsage.args,
  type: 'step'
}
export const StepBeforeChart = Template.bind({});
StepBeforeChart.args = {
  ...InitialUsage.args,
  type: 'step-before'
}
export const StepAfterChart = Template.bind({});
StepAfterChart.args = {
  ...InitialUsage.args,
  type: 'step-after'
}

export const SmallArea = ({url, ws, lang}) => `<div style="width: 300px; height: 200px;">
    <discovery-tile url="${url}" type="line" lang="${lang}">${ws}</discovery-tile>
</div>`;
SmallArea.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
export const amzairAaaTestXM1 = Template.bind({});
amzairAaaTestXM1.args = {
  ...InitialUsage.args,
  ws: `@amzair/aaaTestXM1`
};
