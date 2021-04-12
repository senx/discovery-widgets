import tile, {Usage} from '../discovery-tile/discovery.tile.stories';
import {Param} from "../../model/param";
import {Colors} from "../../utils/color-lib";

export default {
  ...tile,
  title: 'Charts/Plot'
};
export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'plot',
  ws: `@training/dataset0
// warp.store.hbase.puts.committed is the number of datapoints committed to
// HBase since the restart of the Store daemon
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH
[ SWAP mapper.rate 1 0 0 ] MAP
// Keep only 1000 datapoints per GTS
1000 LTTB DUP
// Detect 5 anomalies per GTS using an ESD (Extreme Studentized Deviate) Test
5 false ESDTEST
// Convert the ticks identified by ESDTEST into an annotation GTS
<%
  DROP // excude element index
  NEWGTS // create a new GTS
  SWAP // get timestamp list
  <% NaN NaN NaN 'anomaly' ADDVALUE %> FOREACH // for each timestamp
%> LMAP 2 ->LIST // Put our GTS in a list
ZIP // merge into a list of GTS
// Now rename and relabel the anomaly GTS
<%
  DROP // exclude element index
  LIST-> // flatten list
  DROP // exclude number of elements of our list
  SWAP // put our fetched GTS on the top
  DUP // duplicate the GTS
  NAME // get the className of the GTS
  ':anomaly' + 'name' STORE // suffix the name
  DUP LABELS 'labels' STORE // duplicate the GTS and get labels
  SWAP // put the anomaly GTS on the top of the stack
  $name RENAME // rename the GTS
  $labels RELABEL // put labels
  2 ->LIST // put both GTS in a list
%> LMAP`
};
export const MixedStyle = InitialUsage.bind({});
MixedStyle.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
// warp.store.hbase.puts.committed is the number of datapoints committed to
// HBase since the restart of the Store daemon
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH
[ SWAP mapper.rate 1 0 0 ] MAP
// Keep only 1000 datapoints per GTS
1000 LTTB DUP
// Detect 5 anomalies per GTS using an ESD (Extreme Studentized Deviate) Test
5 false ESDTEST
// Convert the ticks identified by ESDTEST into an annotation GTS
<%
  DROP // excude element index
  NEWGTS // create a new GTS
  SWAP // get timestamp list
  <% NaN NaN NaN 'anomaly' ADDVALUE %> FOREACH // for each timestamp
%> LMAP 2 ->LIST // Put our GTS in a list
ZIP // merge into a list of GTS
// Now rename and relabel the anomaly GTS
<%
  DROP // exclude element index
  LIST-> // flatten list
  DROP // exclude number of elements of our list
  SWAP // put our fetched GTS on the top
  DUP // duplicate the GTS
  NAME // get the className of the GTS
  ':anomaly' + 'name' STORE // suffix the name
  DUP LABELS 'labels' STORE // duplicate the GTS and get labels
  SWAP // put the anomaly GTS on the top of the stack
  $name RENAME // rename the GTS
  $labels RELABEL // put labels
  2 ->LIST // put both GTS in a list
%> LMAP 'data' STORE
{ 'data' $data 'params' [ { 'type' 'area' } {} { 'type' 'step' } {} { 'type' 'line' } {} { 'type' 'spline-area' } {} ] }`
};

export const WithCustomStyle = ({url, ws, lang, options, unit, title}) => `<div style="width: 100%; min-height: 500px;background-color: #404040">
<style>
:root {
    --warp-view-chart-grid-color: #35b779;
    --warp-view-chart-label-color: #35b779;
   --warp-view-font-color: white;
    --warp-view-bg-color: #404040;
    }
</style>
    <discovery-tile url="${url}" type="plot" lang="${lang}"
        unit="${unit || ''}" chart-title="${title || ''}"
    options='${JSON.stringify(options)}'>${ws}</discovery-tile>
</div>`;
WithCustomStyle.args = {
  ...InitialUsage.args,
  options: {...Usage.args.options, scheme: Colors.VIRIDIS}
}
