import tile, {Usage} from '../discovery-tile/discovery.tile.stories';

export default {
  ...tile,
  title: 'Components/Gauge'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'gauge',
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -1 ] FETCH`
};

export const CustomDataFormat = Usage.bind({});
CustomDataFormat.args = {
  ...InitialUsage.args,
  ws: `0 3 <% 'j' STORE
    NEWGTS 'serie' $j TOSTRING + RENAME NOW NaN NaN NaN RAND ADDVALUE
%> FOR 4 ->LIST <%
  'gts' STORE
  {
    'key' $gts NAME
    'value' $gts VALUES 0 GET
  }
%> F LMAP
'data' STORE
{ 'data' $data 'params' [ { 'maxValue' 5 } { 'maxValue' 2 } { 'maxValue' 1 } ] }`
}

export const SingleValueAndCustomStyle =  ({url, ws, lang, options, unit, title}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color: #35b779;
    --warp-view-chart-label-color: #35b779;
   --warp-view-font-color: white;
    --warp-view-bg-color: #443983;
    }
</style>
    <discovery-tile url="${url}" type="gauge" lang="${lang}"
        unit="°C" chart-title="${title}"
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
SingleValueAndCustomStyle.args = {
  ...InitialUsage.args,
  title: 'My Gauge',
  options: {...Usage.args.options, scheme: 'VIRIDIS'},
  ws: `{ 'data' 42 'params' [ { 'maxValue' 100 } ] }`
}

