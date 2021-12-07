/*
 *   Copyright 2021  SenX S.A.S.
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

import readme from '../components/discovery-tile/readme.md';
import {Usage} from "./discovery.tile.stories";
import {Param} from "../model/param";

export default {
  title: 'UI/SVG Display',
  notes: readme,
  argTypes: {
    message: {control: 'text'}
  },
  parameters: {
    docs: {
      description: {
        component: readme
      }
    },
  }
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'svg',
  ws: `@xav/svg`
}
export const PiotrEdition = Usage.bind({});
PiotrEdition.args = {
  ...InitialUsage.args,
  ws: `@xav/piotr`
}
export const DynamicSVG = Usage.bind({});
DynamicSVG.args = {
  ...InitialUsage.args,
  options: { ... new Param(), autoRefresh: 5},
  ws: `
<% RAND 0.5 > %>
<%
  'red' 'color' STORE
%> <%
  'green'  'color' STORE
%> IFTE
'<' 'svg width="400" height="180">' +
'<' + 'rect x="50" y="20" rx="20" ry="20" width="150" height="150" style="fill:{{color}};stroke:black;stroke-width:5;opacity:0.5" />' +
'<' + '/svg>' +
{
  'color' $color
}
TEMPLATE
  `
}

