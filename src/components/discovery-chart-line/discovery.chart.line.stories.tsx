import tile, {Usage} from '../discovery-tile/discovery.tile.stories';

export default {
  ...tile,
  title: 'Components/Line Chart'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'line',
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};
export const FlowsSample = Usage.bind({});
FlowsSample.args = {
  ...InitialUsage.args,
  language: 'flows',
  ws: `l = [];
FOR(1,4, () => {
  g = NEWGTS();
  FOR(1,10, (i) => {
    ts = (RAND() + i) * STU() + NOW();
    g = ADDVALUE(g, ts, NaN, NaN, NaN, RAND());
  });
  l = APPEND(l, [ g ])
}, false);
return l`
};

export const SimpleLineChart = Usage.bind({});
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

export const RealUseCase = Usage.bind({});
RealUseCase.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -20 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`
}

export const SplineChart = Usage.bind({});
SplineChart.args = {
  ...InitialUsage.args,
  type: 'spline'
}
export const StepChart = Usage.bind({});
StepChart.args = {
  ...InitialUsage.args,
  type: 'step'
}
export const StepBeforeChart = Usage.bind({});
StepBeforeChart.args = {
  ...InitialUsage.args,
  type: 'step-before'
}
export const StepAfterChart = Usage.bind({});
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
export const amzairAaaTestXM1 = Usage.bind({});
amzairAaaTestXM1.args = {
  ...InitialUsage.args,
  ws: `@amzair/aaaTestXM1`
};

