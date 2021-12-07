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

import tile, {Usage} from './discovery.tile.stories';

export default {
  ...tile,
  title: 'UI/Image'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'image',
  ws: `//draw tangents along the curve
300 200 '2D3' PGraphics
255 Pbackground
16 PtextSize

50 'x1' STORE
50 'y1' STORE
200 'x2' STORE
130 'y2' STORE

100 'cx1' STORE
40 'cy1' STORE

110 'cx2' STORE
140 'cy2' STORE


4 PstrokeWeight
$x1 $y1 Ppoint //first anchor
$x2 $y2 Ppoint //second anchor

2 PstrokeWeight
$x1 $y1 $cx1 $cy1 Pline
$x2 $y2 $cx2 $cy2 Pline

2 PstrokeWeight
0xffff0000 Pstroke
$x1 $y1 $cx1 $cy1 $cx2 $cy2 $x2 $y2 Pbezier

0 10
<%
10.0 / 't' STORE

$x1 $cx1 $cx2 $x2 $t PbezierPoint 'x' STORE
$y1 $cy1 $cy2 $y2 $t PbezierPoint 'y' STORE
$x1 $cx1 $cx2 $x2 $t PbezierTangent 'tx' STORE
$y1 $cy1 $cy2 $y2 $t PbezierTangent 'ty' STORE
$ty $tx ATAN2 PI 2.0 / - 'angle' STORE
0xff009f00 Pstroke
$x
$y
$x $angle COS 12 * +
$y $angle SIN 12 * +
Pline

0x9f009f00 Pfill
PnoStroke
'CENTER' PellipseMode
$x $y 5 5 Pellipse
%> FOR
Pencode`
};

