/*
 *   Copyright 2022  SenX S.A.S.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import tile, {Usage} from './discovery.tile.stories';
import {Param} from "../model/param";
import {HeatMaps} from "../utils/color-lib";

export default {
  ...tile,
  title: 'Charts/Calendar'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'calendar',
  options: {...new Param(), scheme: HeatMaps.DEFAULT},
  ws: `
    NEWGTS 'serie' RENAME 'g' STORE
   1 500 <% 'i' STORE $g NOW $i d - NaN NaN NaN RAND ADDVALUE DROP %> FOR
   $g SORT`
};

export const Localize = Usage.bind({});
Localize.args = {
  ...InitialUsage.args,
  options: {
    ...new Param(), scheme: HeatMaps.DO_ANDROIDS_DREAM, calendar: {
      firstDay: 1,
      dayLabel: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      monthLabel: ['Jan.', 'Fev.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Dec'],
    }
  },

}
export const MultiGTSUsage = Usage.bind({});
MultiGTSUsage.args = {
  ...InitialUsage.args,
  ws: `0 1 <% 'j' STORE
    NEWGTS 'serie-' $j TOSTRING + RENAME 'g' STORE
   1 200 <% 'i' STORE $g NOW $i d - NaN NaN NaN RAND ADDVALUE DROP %> FOR
   $g SORT %> FOR STACKTOLIST 'data' STORE
{ 'data' $data 'params' [ { 'scheme'  'CTHULHU' } { 'scheme'  'MATRIX' } ] }
   `
};

export const RealData = Usage.bind({});
RealData.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
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
