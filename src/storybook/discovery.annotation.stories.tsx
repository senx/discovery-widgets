import tile, {Usage} from './discovery.tile.stories';
import {Param} from "../model/param";
import {Colors} from "../utils/color-lib";

export default {
  ...tile,
  title: 'Charts/Annotation'
};
export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'annotation',
  ws: `0 5 <% 'j' STORE
  NEWGTS 'serie' $j TOSTRING + RENAME 'gts' STORE
  0 30 <%
   'ts' STORE $gts $ts RAND + STU * NOW +  NaN NaN NaN "t" ADDVALUE DROP
  %> FOR
  $gts
%> FOR`
};
export const WithXRange = Usage.bind({});
WithXRange.args = {
  ...Usage.args,
  type: 'annotation',
  ws: `
  {
  'data' [ 0 5 <% 'j' STORE
  NEWGTS 'serie' $j TOSTRING + RENAME 'gts' STORE
  0 30 <%
   'ts' STORE $gts $ts RAND + STU * NOW +  NaN NaN NaN "t" ADDVALUE DROP
  %> FOR
  $gts
%> FOR ]
  'globalParams' { 'bounds' { 'maxDate' NOW 1 m + 'minDate' NOW 1 m - } }
  }`
};

export const TestCase1 = Usage.bind({});
TestCase1.args = {
  ...InitialUsage.args,
  ws: `"2000-01-01T00:00:00.0Z" TOTIMESTAMP 'start' STORE
                NEWGTS 'booleanone' RENAME
                0 24
                <%
                'h' STORE
                $start $h h + $h $h NaN $h 2 % 0 == ADDVALUE
                %>
                FOR

                NEWGTS 'stringone' RENAME
                0 24
                <%
                'h' STORE
                $start $h h + 24 $h - $h NaN
                $h 2 % 0 ==
                <% 'iß true' %>
                <% 'ïs fælse' %> IFTE ADDVALUE

                %> FOR`
}
export const TestCase2 = Usage.bind({});
TestCase2.args = {
  ...InitialUsage.args,
  ws: `"2000-01-01T00:00:00.0Z" TOTIMESTAMP 'start' STORE
NEWGTS 'emptyone, stack bottom' RENAME
NEWGTS 'booleanone' RENAME
0 24
<%
'h' STORE
$start $h h + NaN NaN NaN $h 2 % 0 == ADDVALUE
%>
FOR
NEWGTS 'empty one, middle of stack' RENAME
NEWGTS 'stringone' RENAME
0 24
<%
'h' STORE
$start $h h + NaN NaN NaN
$h 2 % 0 ==
<% 'iß true' %>
<% 'ïs fælse' %> IFTE ADDVALUE

%> FOR
NEWGTS 'emptyone, stack top' RENAME`
}

export const SwitchToTimestamp = Usage.bind({});
SwitchToTimestamp.args = {
  ...InitialUsage.args,
  options: {... new Param(), timeMode: 'timestamp'},
  ws: `NEWGTS 'boolannotation, not ordered' RENAME
-5 NaN NaN NaN T ADDVALUE
4 NaN NaN NaN T ADDVALUE
2 NaN NaN NaN T ADDVALUE
-10 NaN NaN NaN T ADDVALUE
0 NaN NaN NaN T ADDVALUE
'g' STORE
$g CLONE 'boolannotation, sorted' RENAME SORT`
}

export const WithAutoRefresh = Usage.bind({});
WithAutoRefresh.args = {
  ...InitialUsage.args,
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <%     'ts' STORE
   $g NOW RAND 10 * $ts + STU * - NaN NaN NaN T ADDVALUE DROP
   %> FOR
     $g
%> FOR`,
  options: {...new Param(), autoRefresh: 1}
}

export const WithCustomStyle = ({url, ws, lang, options, unit, title}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color: #35b779;
    --warp-view-chart-label-color: #35b779;
   --warp-view-font-color: white;
    --warp-view-bg-color: #404040;
    }
</style>
    <discovery-tile url="${url}" type="annotation" lang="${lang}"
        unit="${unit || ''}" chart-title="${title || ''}"
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
WithCustomStyle.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.VIRIDIS},
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <%     'ts' STORE
   $g NOW RAND 10 * $ts + STU * - NaN NaN NaN T ADDVALUE DROP
   %> FOR
     $g
%> FOR`
}
