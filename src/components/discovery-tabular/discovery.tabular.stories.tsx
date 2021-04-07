import tile, {Usage} from '../discovery-tile/discovery.tile.stories';
import {Param} from "../../model/param";
import {Colors} from "../../utils/color-lib";

export default {
  ...tile,
  title: 'UI/Tabular data'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'tabular',
  ws: `0 2 <% 'j' STORE
  NEWGTS 'serie' $j TOSTRING + RENAME 'g' STORE
  1 1000 <%
    'ts' STORE
    NOW $ts STU * 50.0 / - 'ts' STORE
    $g $ts NaN NaN NaN $ts 50 * STU / 60.0 / SIN ADDVALUE DROP %> FOR
  $g
%> FOR`
};

export const CustomData = Usage.bind({});
CustomData.args = {
  ...InitialUsage.args,
  ws: `{
'title' 'Test'
'columns'  [ 'Name' 'A' 'B' 'C' 'D' ]
'rows' [
  [ 'label X' 15 56 44 22 ]
  [ 'label Y' 1 5 4 2 ]
  [ 'label Z' 14 45 78 12 ]
]
} 'values' STORE
{ 'data' $values }`
};

export const WithAutoRefresh = Usage.bind({});
WithAutoRefresh.args = {
  ...InitialUsage.args,
  ws: `NEWGTS 'serie' RENAME 'g' STORE
  1 1000 <%
    'ts' STORE
    NOW $ts STU * 50.0 / - 'ts' STORE
    $g $ts NaN NaN NaN $ts 50 * STU / 60.0 / SIN ADDVALUE DROP %> FOR
  $g`,
  options: {...new Param(), autoRefresh: 1}
}

export const WithCustomStyle = ({url, ws, lang, options, unit, title, type}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
<style>
:root {
    --wc-split-gutter-color: #404040;
    --warp-view-pagination-bg-color: #343a40 !important;
    --warp-view-pagination-border-color: #6c757d;
    --warp-view-datagrid-odd-bg-color: rgba(255, 255, 255, .05);
    --warp-view-datagrid-odd-color: #ffffff;
    --warp-view-datagrid-even-bg-color: #212529;
    --warp-view-datagrid-even-color: #ffffff;
    color: #ffffff;
    --warp-view-font-color: #ffffff;
    --warp-view-chart-label-color: #ffffff;
    --gts-stack-font-color: #ffffff;
    --warp-view-resize-handle-color: #111111;
    --warp-view-chart-legend-bg: #000;
    --gts-labelvalue-font-color: #ccc;
    --gts-separator-font-color: #fff;
    --gts-labelname-font-color: rgb(105, 223, 184);
    --gts-classname-font-color: rgb(126, 189, 245);
    --warp-view-chart-legend-color: #fff;
    --wc-tab-header-color: #fff;
    --wc-tab-header-selected-color: #404040;
    }
</style>
    <discovery-tile url="${url}" type="${type}" lang="${lang}"
        unit="${unit || ''}" chart-title="${title || ''}" debug
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
WithCustomStyle.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.ATLANTIS},
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};

export const  CustomStyleAndAutoRefresh= WithCustomStyle.bind({});
CustomStyleAndAutoRefresh.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.CHARTANA, autoRefresh: 10},
  ws: `0 2 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR`
};
