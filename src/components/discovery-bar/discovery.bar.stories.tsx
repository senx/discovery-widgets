import tile, {Usage} from '../discovery-tile/discovery.tile.stories';
import {Param} from "../../model/param";

export default {
  ...tile,
  title: 'Charts/Bar'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'bar',
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`
};

export const RealData = Usage.bind({});
RealData.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP bucketizer.last $NOW 1 m 0 ] BUCKETIZE
[ SWAP mapper.delta 1 0 0 ] MAP 'values' STORE
{ 'data' $values }`
}
export const StackedBarChart = Usage.bind({});
StackedBarChart.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP bucketizer.last $NOW 1 m 0 ] BUCKETIZE
[ SWAP mapper.delta 1 0 0 ] MAP 'values' STORE
{ 'data' $values 'globalParams' { 'bar' { 'stacked' true } } }`
}

export const ChartWithCustomData = Usage.bind({});
ChartWithCustomData.args = {
  ...InitialUsage.args,
  ws: `{
'title' 'Test'
'columns'  [ 'A' 'B' 'C' 'D' ]
'rows' [
  [ 'label X' 15 56 44 22 ]
  [ 'label Y' 1 5 4 2 ]
  [ 'label Z' 14 45 78 12 ]
]
} 'values' STORE
{ 'data' $values 'globalParams' { } }`
}

export const HorizontalStackedBarChart = Usage.bind({});
HorizontalStackedBarChart.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP bucketizer.last $NOW 1 m 0 ] BUCKETIZE
[ SWAP mapper.delta 1 0 0 ] MAP 'values' STORE
{ 'data' $values 'globalParams' { 'bar' { 'horizontal' true 'stacked' true } } }`
}
export const HorizontalStackedBarChartWithCustomData = Usage.bind({});
HorizontalStackedBarChartWithCustomData.args = {
  ...InitialUsage.args,
  ws: `{
'title' 'Test'
'columns'  [ 'A' 'B' 'C' 'D' ]
'rows' [
  [ 'label X' 15 56 44 22 ]
  [ 'label Y' 1 5 4 2 ]
  [ 'label Z' 14 45 78 12 ]
]
} 'values' STORE
{ 'data' $values 'globalParams' { 'bar' { 'horizontal' true 'stacked' true } } }`
}

export const BarChartWithAutoRefresh = Usage.bind({});
BarChartWithAutoRefresh.args = {
  ...InitialUsage.args,
  type: 'bar',
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`,
  options: {...new Param(), autoRefresh: 1}
}
