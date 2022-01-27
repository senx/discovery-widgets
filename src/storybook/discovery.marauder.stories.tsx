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

export default {
  ...tile,
  title: 'Charts/Marauder\'s Map'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'marauder',
  ws: `
  'yaw2XlsczxtKdzZpxYA5DXvE0w9sRQHjJPnyJ2MVZrjf1HK7bH82rkVfuhdkxYuLT1kGGC6DpsFskCTfReqgVsN4nFbpZqLlmgDRncN9oJtEHTkYMDDiQADNpyE5OHww90Ia3SYge3ORSk.NwvjOX.' 'token' STORE
  $token AUTHENTICATE
  20000000 LIMIT
  100000000 MAXOPS
  2000000 MAXPIXELS
  [ $token 'fr.trains' {  } NOW 12 h ] FETCH
  [ 1 ] { 1 'train' } MVINDEXSPLIT FLATTEN ->GTS VALUELIST FLATTEN 'data' STORE
  {
    'data' $data
    'globalParams' {
      'map' {
        'step' 10 m
        'delay' 1000 // ms
      }
    }
  }`
};

export const TimestampUsage = Usage.bind({});
TimestampUsage.args= {
  ...InitialUsage.args,
  options: { ... new Param(), timeMode: 'timestamp'}
}


export const Bus = Usage.bind({});
Bus.args= {
  ...InitialUsage.args,
  ws: `
    'yaw2XlsczxtKdzZpxYA5DXvE0w9sRQHjJPnyJ2MVZrjf1HK7bH82rkVfuhdkxYuLT1kGGC6DpsFskCTfReqgVsN4nFbpZqLlmgDRncN9oJtEHTkYMDDiQADNpyE5OHww90Ia3SYge3ORSk.NwvjOX.' 'token' STORE
    $token AUTHENTICATE
    10000000 MAXOPS

    [ $token
              'fr.bibus.bus.gtfs'
              {  } NOW 12 h ] FETCH 'data' STORE
    {
      'data' $data
      'globalParams' {
        'map' {
          'step' 1 m
          'delay' 100 // ms
          'mapType' 'CARTODB'
        }
      }
    }`
}
