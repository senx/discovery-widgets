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

import {ChartType} from "../model/types";

export class LangUtils {
  static prepare(ws: string, vars: any = {}, skipedVars: string[], type: ChartType, lang: ('warpscript' | 'flows') = 'warpscript') {
    switch (lang) {
      case "flows":
        return LangUtils.generateFlows(ws, vars, skipedVars, type)
      case "warpscript":
        return LangUtils.generateWarpscript(ws, vars, skipedVars, type)
    }
  }

  private static generateFlowsVars(key: string, value: any) {
    if (typeof value === 'string') {
      return `${key} = "${value}"`;
    } else if (typeof value === 'number') {
      return `${key} = "${value}"`;
    } else {
      if (value.hasOwnProperty('type') && value.hasOwnProperty('value')) {
        if (value.type === 'string') {
          return `${key} = "${value.value}"`;
        } else {
          return `${key} = ${value.value}`;
        }
      } else {
        return `${key} =  JSON->('${encodeURIComponent(JSON.stringify(value))}')`;
      }
    }
  }

  private static generateWarpscriptVars(key: string, value: any): string {
    if (typeof value === 'string') {
      return `"${value}" "${key}" STORE`;
    } else if (typeof value === 'number') {
      return `${value} "${key}" STORE`;
    } else {
      if (value.hasOwnProperty('type') && value.hasOwnProperty('value')) {
        if (value.type === 'string') {
          return `"${value.value}" "${key}" STORE`;
        } else {
          return `${value.value} "${key}" STORE`;
        }
      } else {
        return `
<'
${JSON.stringify(value)}
'>
 JSON-> "${key}" STORE`;
      }
    }
  }

  // noinspection JSUnusedLocalSymbols
  private static generateFlows(ws: string, vars: any, skipedVars: string[], type: ChartType) {
    const varsStr = Object.keys(vars || {})
      .filter(k => !(skipedVars || []).includes(k))
      .map(k => LangUtils.generateFlowsVars(k, vars[k])).join("\n") + "\n";
    return `<'
${varsStr}
${ws}
'>
FLOWS`;
  }

  // noinspection JSUnusedLocalSymbols
  private static generateWarpscript(ws: string, vars: any, skipedVars: string[], type: ChartType) {
    let addOn = '';
    const varsStr = Object.keys(vars || {})
      .filter(k => !(skipedVars || []).includes(k))
      .map(k => LangUtils.generateWarpscriptVars(k, vars[k])).join("\n") + "\n";
    switch (type) {
      case 'marauder':
        addOn += `
'dataStruct' STORE
$dataStruct 'data' GET 'data' STORE
$dataStruct 'globalParams' GET 'globalParams' STORE
<% $globalParams ISNULL %> <% { } 'globalParams' STORE %> IFT
$globalParams 'map' GET 'map' STORE
<% $map ISNULL %> <% { 'step' 10 m } 'map' STORE %> IFT
$map 'step' GET 'b' STORE
$data LASTTICK 'last' STORE
$data FIRSTTICK 'first' STORE

[ $data bucketizer.mean $last 0 1 ] BUCKETIZE
[ SWAP [] reducer.mean ] REDUCE 0 GET LOCATIONS 2 ->LIST FLATTEN LIST-> DROP [ 'lat' 'long' ] STORE

[ $data bucketizer.last $last $b 0 ] BUCKETIZE 'gts' STORE
$b 5 * 5 [ 'quietperiod' 'minvalues' ]  STORE
// Force minvalues to be at leas 2
2 $minvalues MAX 'minvalues' STORE
// Now compute the overall bounding box
$data BBOX
// Zip extrema together
ZIP
// Compute global extrema
LIST-> DROP MAX 4 ROLL MIN 4 ROLL MIN 4 ROLL MAX 4 ROLL
// store lower left / upper right coordinates
[ 'lllat' 'lllon' 'urlat' 'urlon' ] STORE
// Compute per unit offset in both lat and lon so we get the finest
// resolution when storing lat/lon offset from ll corner on 32 bits
$urlat $lllat - 65535.0 / 'latstep' STORE
$urlon $lllon - 65535.0 / 'lonstep' STORE
// Check that all GTS are bucketized with the same parameters
$gts 0 GET BUCKETSPAN 'bucketspan' STORE
$gts 0 GET LASTBUCKET 'lastbucket' STORE
$gts 0 GET BUCKETCOUNT 'bucketcount' STORE
$bucketspan 0 != $lastbucket 0 != && 'GTS MUST be bucketized' ASSERTMSG
// Replace values with 0
[ $gts 0.0 mapper.replace 0 0 0 ] MAP 'gts' STORE
$gts <%
  'g' STORE
  $g BUCKETSPAN $bucketspan  ==
  $g LASTBUCKET $lastbucket ==
  && 'GTS MUST all have the same bucketization parameters' ASSERTMSG
  // update bucketcount
  $bucketcount $g BUCKETCOUNT MAX 'bucketcount' STORE
  // Split 'gts' according to 'quietperiod'
  $g $quietperiod $minvalues '.split' TIMESPLIT
  // Now iterate over the splits, bucketizing them with the same parameters
  // as the GTS they come from and interpolating missing values
  <%
    [ SWAP NULL $lastbucket $bucketspan 0 ] BUCKETIZE
    INTERPOLATE
  %> F LMAP
  // Merge the splits back
  MERGE
  // Rebucketize
  [ SWAP NULL $lastbucket $bucketspan 0 ] BUCKETIZE
%> F LMAP
FLATTEN 'gts' STORE
// Now set the value of each data point to 32 bits representing offset
// of the position from the ll corner
[ $gts UNBUCKETIZE
  <%
    [ 4 5 ] SUBLIST FLATTEN
    DUP SIZE 2 ==
    <%
      LIST-> DROP
      $lllon - TODOUBLE $lonstep / ROUND TOLONG 0xFFFF & SWAP
      $lllat - TODOUBLE $latstep / ROUND TOLONG 0xFFFF & 16 << SWAP |
      0 NaN NaN NaN 5 ROLL
    %> <% DROP 0 NaN NaN NaN NULL %> IFTE
  %> MACROMAPPER 0 0 0 ] MAP
NONEMPTY 'data' STORE
$data <% LABELS %> F LMAP 'infos' STORE
//
// Now shift and scale the ticks so we end up with indices
//
$data $lastbucket $bucketcount 1 - $bucketspan * - -1 * TIMESHIFT
1.0 $bucketspan / TIMESCALE 'gts' STORE
//
// Create image
//
$bucketcount $gts SIZE '2D' PGraphics
Ppixels

// Update the pixels with the GTS values
$gts
<%
  'y' STORE
  <%
    LIST-> [ 'x' NULL NULL NULL 'v' NULL ] STORE
    $v $y $bucketcount * $x + SET
  %> FOREACH
%> T FOREACH
// Count null elements
0 POPR0
DUP <% 0 == <% PUSHR0 1 + POPR0 %> IFT %> FOREACH
PupdatePixels
{
  'iTXt' [
    {
      'keyword' 'Discovery'
      'text' {
        'type' 'MM'
        'v' 0
        'lllat' $lllat
        'lllon' $lllon
        'urlat' $urlat
        'urlon' $urlon
        'latstep' $latstep
        'lonstep' $lonstep
        'lastbucket' $lastbucket
        'bucketspan' $bucketspan MSTU TODOUBLE /
        'bucketcount' $bucketcount
        'gts' $gts SIZE
        'positions' $gts SIZE $bucketcount * PUSHR0 -
        'infos' $infos
        'last' $last
        'first' $first
      } ->JSON
      'compressionFlag' true
    }
  ]
}
Pencode 'img' STORE
{ 'data' [ $img $lat $long ] 'globalParams' $globalParams }`
        break;
      default:
        break;
    }

    return `
${varsStr}
${ws}
${addOn}
`;
  }
}
