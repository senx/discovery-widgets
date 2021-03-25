import tile, {Usage} from '../discovery-tile/discovery.tile.stories';

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
    'i' STORE
    $gts NOW RAND 100000 * -  NaN NaN NaN "t" ADDVALUE DROP
  %> FOR
  $gts
%> FOR`
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
  ws: `NEWGTS 'boolannotation, not ordered' RENAME
-5 NaN NaN NaN T ADDVALUE
4 NaN NaN NaN T ADDVALUE
2 NaN NaN NaN T ADDVALUE
-10 NaN NaN NaN T ADDVALUE
0 NaN NaN NaN T ADDVALUE
'g' STORE
$g CLONE 'boolannotation, sorted' RENAME SORT`
}
