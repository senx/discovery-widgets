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
  title: 'Charts/Line'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'line',
  unit: 'my unit',
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};

export const WithCustomTimeZone = Usage.bind({});
WithCustomTimeZone.args = {
  ...InitialUsage.args,
  options: {...new Param(), timeZone: 'America/Buenos_Aires'}
};

export const WithAutoTimeZone = Usage.bind({});
WithAutoTimeZone.args = {
  ...InitialUsage.args,
  options: {...new Param(), timeZone: 'AUTO'}
};


export const WithFullDateFormatAndCustomFormat = Usage.bind({});
WithFullDateFormatAndCustomFormat.args = {
  ...InitialUsage.args,
  options: {...new Param(), timeFormat: 'ddd Qo MMM YY HH:mm:ss', fullDateDisplay: true}
};

export const withNaN = Usage.bind({});
withNaN.args = {
  ...InitialUsage.args,
  ws: `NEWGTS
NOW NaN NaN NaN 42 ADDVALUE
NOW  1 s + NaN NaN NaN 38 ADDVALUE
NOW  9 s + NaN NaN NaN 40 ADDVALUE
NOW  10 s + NaN NaN NaN 48 ADDVALUE
[ SWAP mapper.todouble 0 0 0 ] MAP
[ SWAP bucketizer.last 0 1 s 0 ] BUCKETIZE
[ NaN NaN NaN NaN ] FILLVALUE
SORT`
};

export const InitialUsageWithLegend = Usage.bind({});
InitialUsageWithLegend.args = {
  ...Usage.args,
  type: 'line',
  unit: 'my unit',
  ws: `1 40 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME  'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {...new Param(), showLegend: true}
};

export const InitialUsageWithFullDateDisplay = Usage.bind({});
InitialUsageWithFullDateDisplay.args = {
  ...Usage.args,
  type: 'line',
  unit: 'my unit',
  ws: `1 40 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME  'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {...new Param(), fullDateDisplay: true}
};

export const WithXRange = Usage.bind({});
WithXRange.args = {
  ...Usage.args,
  type: 'line',
  ws: `
  {
  'data' [ 1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR ]
  'globalParams' { 'bounds' { 'maxDate' NOW 1 m + 'minDate' NOW 1 m - } }
  }`
};

export const InitialUsageWithTimeStamp = InitialUsage.bind({});
InitialUsageWithTimeStamp.args = {
  ...InitialUsage.args,
  ws: `NOW 'now' STORE
1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR`,
  options: {...InitialUsage.args.options, timeMode: 'timestamp'}
};

export const YAutoScale = InitialUsage.bind({});
YAutoScale.args = {
  ...InitialUsage.args,
  ws: `[] '60V2OrGn5k57.LZ0B0Qfsw6bXz9buSB04d1hgv92xfMB70g.8V..4c1yfx52mBN44c1Nafk34fkCD7V26sg7.........1hWNDpKZ0Kxry0FvdPLkB2.7EWzyekxA7DC4.5I2iKeDCk7ZwxV..4gea4XPJIv3eN2KvXVqZ87xL.agNJCcG.U41siTnPNMIS7kqvkZBI_HOXeOHYtYEWwE2Ywi.lArZctRs19Uc1Oec8W9XbqsIO_kB9iv.aSkcZJiq5ag72_0mvJgBJhCKm2PXulPFhK6IMHDRmBCcnw2dEOjMhfP5VceWWauN.j6uPW_1n6J6YAe4IDo1QEon76Y8724yjZlW.hJlbBv1JoCEhwTSPeKPilqFFIDs84v._9PNEAUPXe0wuj.tTee8rPHAPW22LaLB1xCTetMxbNVLNdBlb8Q8XNBsbqsMNbC_g58k_nPIDLw4WBgTiW8_Jk3qoHnDv64CXCnJzJ2ez4LB7fRTP1.N_haEq9.qIzF9SSn6264X9ceVRXnDXQIa1qAPHfQO0w1yBSld8AYX2K3hHc_sSDLNjQvSHhuL1pBqdRsAR2KFxxrJhuz.7._6MBZTRL...Lj.oG..' UNWRAP +! '60V2OrGn5k57.LZ0BGQfsw6bXz9buSB04jvuvdIfmtvpBGg.8V..4c1yfx52mBN44c1Nafk34eVCD7B16sg7.........1hWNDpKZ0Kxry0FPI_n.FB2Vy2zuQEqg.kg9F7a6Hc_BKk3Zub3sKPNU1HHE9ddy4G7B22V1F5NeVVBKQYpsxNnHW79FJ8WGpmg2GsHuhu95tWyfEW0FdeXWfq3FWCKnq.CPOXv9VXZZC6RGvpRHRgoD3fHCpN5Gsu0qIZ2dPkWrVMsx9E92OpF5bk_vi27kUWeeT3HoVDUuXYEAI1IQh.k4kvUT0Xsp3iQM2uNwhWVXYpmrJuhU7HPHr6QW4gSXice1P8Jox86d9R.s_l.vKFna6A3m1F6Mna.AHJHDkPmNp1o1FYplsSDU.qCTdLu8.2NzGok1lN..0Pc2G3.' UNWRAP +! '60V2OrGn5k57.LZ0BWQfsw6bXz9buSB04cXkdsqErdaLNWg.8V..4c1yfx52mBN44c1Nafk34fcCDEJ16sg7.........1hWNDpKZ0Kxry0FBMEa.VN50d6zoqUhNM5ci.ba1N8tm1GJj_7HHOuF6_eOVgp3jMSUFoC2gRWJz1IKSGJr50Y7R._iho_FmIluZhFDXs4kyskWuEPG4AjNwVSBA.7gWYg63U70QU7TC_h8RmEdvg8YHgJE7Zn0KiOH7kn79uy8Brga2Rl5hH3HdSPYbMo2ZPhd3IEJmyqL8ARLmBj2L3gHcbABN1C81NU0JQ9EZfGE0uVlEIYPaY0ML91seTAB0HFTHg_QPOKLV43rHWgvJ82Uct4oJwU3a2B6B3mJFG9Yn4lea3X1fGKre5FEnAktC6QrkE_ksE7EfSB1CM717QLQ_3IWEMAJj.bYpL28KvG7IUYmBHMqsFuKkGHEdDR9r9sUPYaB_j3.1sgzG7JH7OTVue4jyX3_SlBmckPj5I0KTp0wDGiYSgOL_pEEbyHp0aXOCqzYSG4iSlDbUu0n6mr15k28DVUIkGN..0Pu2G3.' UNWRAP +! '60V2OrGn5k57.LZ0BlQfsw6bXz9buSB04dA4bfDoZQrZgF3Q.1N..0P.jezGVwY50GP.a8ew00Qg22X6.WyA1..........fNL2hKO.KUSzVJA6Pq750VJ6kzzGOTpWcFNe.HNT9CqRDZ5oEp7l96Q.Oe1PXm_6En_5HCibVn5XR26.Bf94O2B2m7gxcMWlmRJU7tWmuq2lkzeGxIWYw89rfPiAooBOSVtE3KXhHAkzFCyxHAnF5LysUPiZE_dxo1qQDb2ZAliCAHo0nERlUvn0ZR8idGsGPRioN6XIBlyg5gNxWQgn2sRPWs.UXJWmeIuXG5e_j7VaqsglzBEZwO4UWf43dwn_aDNYQEaApN4BrKCg4VvJTcsojJROWc6uaNZiHW4.RfDa0O2wIZHSwXE.YdUa6qeM7J7gU.EmlMjFb4F..4ikB3F.' UNWRAP +! '60V2OrGn5k57.LZ0C0Qfsw6bXz9buSB04dXrmU1Nl9erk.3Q.1N..0P.jezGVwY50GP.a8ew00Qo22Xf.WyA1..........fNL2hKO.KUSzVJ2sjAN50VJ6kzzGOTpVVd.XNS1XzWm52XsIdk2HARd7Jpo2KKgX0pOAiYt42oYA5eDTui36dDhe3yo2saQud.5QQEdIRyFy6rHBvxw8wEyUB.OeKe23oB6jcWleqo33p4pJ4ALD9_a4oWofiWSLtCbYCVuaH5H9WGEhk5sXoINcxGJeXcP5WkwRzSyXPLyaQLeXSiq2acOGko0mDPWTBWtlPWbtTdqygoeDiYnOq568l.MEvv16_SdXfQxE.pQ1R8JqXqI0xpJIcVua4d0W1Cd9aTd169oJd2SKxx3evVmxz2wpRHtgoG_lyk5NfxM7HPVv4OYfqE5mCkej0JjREGBnRkSo5cLjAb8Fu5vUv.CxAex964F..4jFB3F.' UNWRAP +! '60V2OrGn5k57.LZ0CGQfsw6bXz9buSB04iUddN9VVvz_hk3Q.1N..0P.jezGVwY50GP.a8ew00Pc2IXD00yA1..........fNL2hKO.KUSzVJ66Pq750VJ6kzzGOTpV5.mZ18WoeMcES0TKKRXDt3XQaYPmXsijSKuhLfROaoaZgTfadt5hgSd1V2ycDK4DcvRP0wmKhMC5CDwmVRcBWn5VOijW1._M4PXlXbIBMo2HBNEPRd7wx_Ol7xg2gUVZLVz4TbAa.cT73.kD4fcEOno5XHPVi7BsJJ_mCPX8Btke9zJiZImcuJ6Y7AeP5Lp0h7Juh0sOPudW1Xbgnw7HG0wpYXdQtj.DAuuaMmkXbQ3kvHByOT48f8PtsWwandHLFbmserR1uNIlagicja5tb_EN2eLQ0ki.kWYuNXHlb2i.AXNcYHE9cTf1d52kZn6MCVvYp.6BYHWnImRJkqlOYPJoRlX85Y9hkdnPPyuCHaQehzwda_6nbY9LzcNmXFVL_t_ROO6a1gf97xEW5hNyyuF7plPAPEGG90LlWHtmv0mAzZOg5wOFpK3u_e5OYmwasvBDTopCkhZpPOot.JiS5KWi1BhylcQFwJCeV8ESdg9Jgohh_x5c0syiQS5.GkyZIf6oSJjcLhERMQhxGedzJo2a8dOzTXS8E8qQ3VA2OpBsbb6YCGWplF0JvXTmvHZwPYsUVxV4994TPi6WW6mahp3GGWxzUh3at8r5u.3weki8HDeFAbDCcLEom.9J0iHJ5ecg0cfLeD1gN...Le.oG..' UNWRAP +! '60V2OrGn5k57.LZ0CWQfsw6bXz9buSB04gjpsEzwe7MjKlg.8V..4c1yfx52mBN44c1Nafk34e.CDBw16sg7.........1hWNDpKZ0Kxry0FTN.00.IzItypWsLud.XNS9Wg7Bg5aDs6T6M2KC6D4uEZF9R3oipl7B7TaCc3ch7MfKoyo242Xzk2CQh9.RCgr6ZQdcSWJDGuQ9sOI1MDNBlM.y4zz6_s739Bjjuz5Vc1.q.nhdlGlIWn.JOiDFVLFpL0MRsdfN0knexXCbNNKE36wwhWDfcAOaRYJbWInpImwYeeaq.wGueuZ8PydpTR6HIGpUWm2ibueTmQ9ZURiQge3NKb_tP.cmrk2mk2JsTRyj1KCQWH9Tuq0qsnPGzfx5ZnoA9DcrpANE2Ko7DdlIRFPGWaIwXOJuhLfHPZPWtH2cT8lL3GeoE8vtY_.fKYvlzCQ10ZwnumQ7QdfeDvikRbXHoogNJGOP3yREuXSUd3nMUJBsyHb2hkTODyPLJct5J.FcQPV0BL...Lc.oG..' UNWRAP +! '60V2OrGn5k57.LZ0ClQfsw6bXz9buSB04gTezCU3ownTB0g.8V..4c1yfx52mBN44c1Nafk34eNCD9N16sg7.........1hWNDpKZ0Kxry0FTHshVN50FU2zx4_vLBVYGR1ZFqJUq1FNYr8ngSWGlJU.2aAKoOd3SFSSvJIlAIOr24mcZ8y1J4LFQf7UXgasI34KIOnCqEHFshj03EtoIco3U.tIxNugw15R1qXUzb6bUZ8qZuyIjbaJKb4EQgsT21aT_X3u3A_pR89k6986FVsXhfq.IFP_teYXDMB.GvswVog5XlvXsVAIlB48khnQFkErkgnq7RhgLfdg9892CLLGb_CVDX2d.gQYCbNNKEuXA8ODowJrBCiuWoMN2UUNcf9fPO8YN5Obsn.Q8iyC82xoRj2VXDz0aag6GyVBUd8uuGpQQe9_Xm3dYWGQ0pzTdaJe6PktZrVH.3LqJWRS4V..4eNC3F.' UNWRAP +! 500 LTTB`,
};

export const YMinMaxScale = InitialUsage.bind({});
YMinMaxScale.args = {
  ...InitialUsage.args,
  ws: `[] '60V2OrGn5k57.LZ0B0Qfsw6bXz9buSB04d1hgv92xfMB70g.8V..4c1yfx52mBN44c1Nafk34fkCD7V26sg7.........1hWNDpKZ0Kxry0FvdPLkB2.7EWzyekxA7DC4.5I2iKeDCk7ZwxV..4gea4XPJIv3eN2KvXVqZ87xL.agNJCcG.U41siTnPNMIS7kqvkZBI_HOXeOHYtYEWwE2Ywi.lArZctRs19Uc1Oec8W9XbqsIO_kB9iv.aSkcZJiq5ag72_0mvJgBJhCKm2PXulPFhK6IMHDRmBCcnw2dEOjMhfP5VceWWauN.j6uPW_1n6J6YAe4IDo1QEon76Y8724yjZlW.hJlbBv1JoCEhwTSPeKPilqFFIDs84v._9PNEAUPXe0wuj.tTee8rPHAPW22LaLB1xCTetMxbNVLNdBlb8Q8XNBsbqsMNbC_g58k_nPIDLw4WBgTiW8_Jk3qoHnDv64CXCnJzJ2ez4LB7fRTP1.N_haEq9.qIzF9SSn6264X9ceVRXnDXQIa1qAPHfQO0w1yBSld8AYX2K3hHc_sSDLNjQvSHhuL1pBqdRsAR2KFxxrJhuz.7._6MBZTRL...Lj.oG..' UNWRAP +! '60V2OrGn5k57.LZ0BGQfsw6bXz9buSB04jvuvdIfmtvpBGg.8V..4c1yfx52mBN44c1Nafk34eVCD7B16sg7.........1hWNDpKZ0Kxry0FPI_n.FB2Vy2zuQEqg.kg9F7a6Hc_BKk3Zub3sKPNU1HHE9ddy4G7B22V1F5NeVVBKQYpsxNnHW79FJ8WGpmg2GsHuhu95tWyfEW0FdeXWfq3FWCKnq.CPOXv9VXZZC6RGvpRHRgoD3fHCpN5Gsu0qIZ2dPkWrVMsx9E92OpF5bk_vi27kUWeeT3HoVDUuXYEAI1IQh.k4kvUT0Xsp3iQM2uNwhWVXYpmrJuhU7HPHr6QW4gSXice1P8Jox86d9R.s_l.vKFna6A3m1F6Mna.AHJHDkPmNp1o1FYplsSDU.qCTdLu8.2NzGok1lN..0Pc2G3.' UNWRAP +! '60V2OrGn5k57.LZ0BWQfsw6bXz9buSB04cXkdsqErdaLNWg.8V..4c1yfx52mBN44c1Nafk34fcCDEJ16sg7.........1hWNDpKZ0Kxry0FBMEa.VN50d6zoqUhNM5ci.ba1N8tm1GJj_7HHOuF6_eOVgp3jMSUFoC2gRWJz1IKSGJr50Y7R._iho_FmIluZhFDXs4kyskWuEPG4AjNwVSBA.7gWYg63U70QU7TC_h8RmEdvg8YHgJE7Zn0KiOH7kn79uy8Brga2Rl5hH3HdSPYbMo2ZPhd3IEJmyqL8ARLmBj2L3gHcbABN1C81NU0JQ9EZfGE0uVlEIYPaY0ML91seTAB0HFTHg_QPOKLV43rHWgvJ82Uct4oJwU3a2B6B3mJFG9Yn4lea3X1fGKre5FEnAktC6QrkE_ksE7EfSB1CM717QLQ_3IWEMAJj.bYpL28KvG7IUYmBHMqsFuKkGHEdDR9r9sUPYaB_j3.1sgzG7JH7OTVue4jyX3_SlBmckPj5I0KTp0wDGiYSgOL_pEEbyHp0aXOCqzYSG4iSlDbUu0n6mr15k28DVUIkGN..0Pu2G3.' UNWRAP +! '60V2OrGn5k57.LZ0BlQfsw6bXz9buSB04dA4bfDoZQrZgF3Q.1N..0P.jezGVwY50GP.a8ew00Qg22X6.WyA1..........fNL2hKO.KUSzVJA6Pq750VJ6kzzGOTpWcFNe.HNT9CqRDZ5oEp7l96Q.Oe1PXm_6En_5HCibVn5XR26.Bf94O2B2m7gxcMWlmRJU7tWmuq2lkzeGxIWYw89rfPiAooBOSVtE3KXhHAkzFCyxHAnF5LysUPiZE_dxo1qQDb2ZAliCAHo0nERlUvn0ZR8idGsGPRioN6XIBlyg5gNxWQgn2sRPWs.UXJWmeIuXG5e_j7VaqsglzBEZwO4UWf43dwn_aDNYQEaApN4BrKCg4VvJTcsojJROWc6uaNZiHW4.RfDa0O2wIZHSwXE.YdUa6qeM7J7gU.EmlMjFb4F..4ikB3F.' UNWRAP +! '60V2OrGn5k57.LZ0C0Qfsw6bXz9buSB04dXrmU1Nl9erk.3Q.1N..0P.jezGVwY50GP.a8ew00Qo22Xf.WyA1..........fNL2hKO.KUSzVJ2sjAN50VJ6kzzGOTpVVd.XNS1XzWm52XsIdk2HARd7Jpo2KKgX0pOAiYt42oYA5eDTui36dDhe3yo2saQud.5QQEdIRyFy6rHBvxw8wEyUB.OeKe23oB6jcWleqo33p4pJ4ALD9_a4oWofiWSLtCbYCVuaH5H9WGEhk5sXoINcxGJeXcP5WkwRzSyXPLyaQLeXSiq2acOGko0mDPWTBWtlPWbtTdqygoeDiYnOq568l.MEvv16_SdXfQxE.pQ1R8JqXqI0xpJIcVua4d0W1Cd9aTd169oJd2SKxx3evVmxz2wpRHtgoG_lyk5NfxM7HPVv4OYfqE5mCkej0JjREGBnRkSo5cLjAb8Fu5vUv.CxAex964F..4jFB3F.' UNWRAP +! '60V2OrGn5k57.LZ0CGQfsw6bXz9buSB04iUddN9VVvz_hk3Q.1N..0P.jezGVwY50GP.a8ew00Pc2IXD00yA1..........fNL2hKO.KUSzVJ66Pq750VJ6kzzGOTpV5.mZ18WoeMcES0TKKRXDt3XQaYPmXsijSKuhLfROaoaZgTfadt5hgSd1V2ycDK4DcvRP0wmKhMC5CDwmVRcBWn5VOijW1._M4PXlXbIBMo2HBNEPRd7wx_Ol7xg2gUVZLVz4TbAa.cT73.kD4fcEOno5XHPVi7BsJJ_mCPX8Btke9zJiZImcuJ6Y7AeP5Lp0h7Juh0sOPudW1Xbgnw7HG0wpYXdQtj.DAuuaMmkXbQ3kvHByOT48f8PtsWwandHLFbmserR1uNIlagicja5tb_EN2eLQ0ki.kWYuNXHlb2i.AXNcYHE9cTf1d52kZn6MCVvYp.6BYHWnImRJkqlOYPJoRlX85Y9hkdnPPyuCHaQehzwda_6nbY9LzcNmXFVL_t_ROO6a1gf97xEW5hNyyuF7plPAPEGG90LlWHtmv0mAzZOg5wOFpK3u_e5OYmwasvBDTopCkhZpPOot.JiS5KWi1BhylcQFwJCeV8ESdg9Jgohh_x5c0syiQS5.GkyZIf6oSJjcLhERMQhxGedzJo2a8dOzTXS8E8qQ3VA2OpBsbb6YCGWplF0JvXTmvHZwPYsUVxV4994TPi6WW6mahp3GGWxzUh3at8r5u.3weki8HDeFAbDCcLEom.9J0iHJ5ecg0cfLeD1gN...Le.oG..' UNWRAP +! '60V2OrGn5k57.LZ0CWQfsw6bXz9buSB04gjpsEzwe7MjKlg.8V..4c1yfx52mBN44c1Nafk34e.CDBw16sg7.........1hWNDpKZ0Kxry0FTN.00.IzItypWsLud.XNS9Wg7Bg5aDs6T6M2KC6D4uEZF9R3oipl7B7TaCc3ch7MfKoyo242Xzk2CQh9.RCgr6ZQdcSWJDGuQ9sOI1MDNBlM.y4zz6_s739Bjjuz5Vc1.q.nhdlGlIWn.JOiDFVLFpL0MRsdfN0knexXCbNNKE36wwhWDfcAOaRYJbWInpImwYeeaq.wGueuZ8PydpTR6HIGpUWm2ibueTmQ9ZURiQge3NKb_tP.cmrk2mk2JsTRyj1KCQWH9Tuq0qsnPGzfx5ZnoA9DcrpANE2Ko7DdlIRFPGWaIwXOJuhLfHPZPWtH2cT8lL3GeoE8vtY_.fKYvlzCQ10ZwnumQ7QdfeDvikRbXHoogNJGOP3yREuXSUd3nMUJBsyHb2hkTODyPLJct5J.FcQPV0BL...Lc.oG..' UNWRAP +! '60V2OrGn5k57.LZ0ClQfsw6bXz9buSB04gTezCU3ownTB0g.8V..4c1yfx52mBN44c1Nafk34eNCD9N16sg7.........1hWNDpKZ0Kxry0FTHshVN50FU2zx4_vLBVYGR1ZFqJUq1FNYr8ngSWGlJU.2aAKoOd3SFSSvJIlAIOr24mcZ8y1J4LFQf7UXgasI34KIOnCqEHFshj03EtoIco3U.tIxNugw15R1qXUzb6bUZ8qZuyIjbaJKb4EQgsT21aT_X3u3A_pR89k6986FVsXhfq.IFP_teYXDMB.GvswVog5XlvXsVAIlB48khnQFkErkgnq7RhgLfdg9892CLLGb_CVDX2d.gQYCbNNKEuXA8ODowJrBCiuWoMN2UUNcf9fPO8YN5Obsn.Q8iyC82xoRj2VXDz0aag6GyVBUd8uuGpQQe9_Xm3dYWGQ0pzTdaJe6PktZrVH.3LqJWRS4V..4eNC3F.' UNWRAP +! 500 LTTB`,
  options: {...InitialUsage.args.options, bounds: {yRanges: [380, 415]}}
};

export const FlowsSample = Usage.bind({});
FlowsSample.args = {
  ...InitialUsage.args,
  language: 'flows',
  ws: `l = [];
FOR(1,4, () => {
  g = NEWGTS();
  FOR(1,10, (i) => {
    ts = (RAND() + i) * STU() + NOW();
    g = ADDVALUE(g, ts, NaN, NaN, NaN, RAND());
  });
  l = APPEND(l, [ g ])
}, false);
return l`
};

export const SimpleLineChart = Usage.bind({});
SimpleLineChart.args = {
  ...InitialUsage.args,
  ws: `[
  NEWGTS 'Date' RENAME // Commenting that makes it work
  1000 NaN NaN NaN 2.5 ADDVALUE
  2000 NaN NaN NaN 2.5 ADDVALUE
  3000 NaN NaN NaN 2.5 ADDVALUE
  4000 NaN NaN NaN 2.5 ADDVALUE

  NEWGTS '1' RENAME
  1000 NaN NaN NaN 1 ADDVALUE
  2000 NaN NaN NaN 2 ADDVALUE
  3000 NaN NaN NaN 3 ADDVALUE
  4000 NaN NaN NaN 4 ADDVALUE

  NEWGTS '2' RENAME
  1000 NaN NaN NaN 4 ADDVALUE
  2000 NaN NaN NaN 3 ADDVALUE
  3000 NaN NaN NaN 2 ADDVALUE
  4000 NaN NaN NaN 1 ADDVALUE
]`
}

export const RealUseCase = Usage.bind({});
RealUseCase.args = {
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
}

export const SplineChart = Usage.bind({});
SplineChart.args = {
  ...InitialUsage.args,
  type: 'spline'
}
export const StepChart = Usage.bind({});
StepChart.args = {
  ...InitialUsage.args,
  type: 'step'
}
export const StepBeforeChart = Usage.bind({});
StepBeforeChart.args = {
  ...InitialUsage.args,
  type: 'step-before'
}
export const StepAfterChart = Usage.bind({});
StepAfterChart.args = {
  ...InitialUsage.args,
  type: 'step-after'
}

export const SmallArea = ({url, ws, lang}) => `<div class="card" style="width: 300px; height: 200px;">
    <div class="card-body">
        <discovery-tile url="${url}" type="line" lang="${lang}">${ws}</discovery-tile>
    </div>
</div>`;

SmallArea.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0 $TOKEN AUTHENTICATE 100000000 MAXOPS
  1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`
};

export const amzairAaaTestXM1 = Usage.bind({});
amzairAaaTestXM1.args = {
  ...InitialUsage.args,
  ws: `@amzair/aaaTestXM1`
};

export const amzairAaaTestXM2 = Usage.bind({});
amzairAaaTestXM2.args = {
  ...InitialUsage.args,
  ws: `@amzair/aaaTestXM2`
};

export const multiYAxis = Usage.bind({});
multiYAxis.args = {
  ...InitialUsage.args,
  ws: `1 4 <% 'i' STORE NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND $i 2 * * ADDVALUE DROP %> FOR
  $g
%> FOR STACKTOLIST 'data' STORE
{ 'data' $data 'params' [ { 'yAxis' 0 'unit' 'a' } { 'yAxis' 0 'unit' 'a' } { 'yAxis' 1 'unit' 'b' } { 'yAxis' 2 'unit' 'c' } ] }
`
};

export const multiXAxis = Usage.bind({});
multiXAxis.args = {
  ...InitialUsage.args,
  ws: `1 4 <% 'i' STORE NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + 1 d * NOW + $i w - NaN NaN NaN RAND $i 2 * * ADDVALUE DROP %> FOR
  $g
%> FOR STACKTOLIST 'data' STORE
{ 'data' $data 'params' [ { 'xAxis' 0  } { 'xAxis' 1 } { 'xAxis' 1 } { 'xAxis' 2 } ] }
`
};


export const multiYAxisWithEmptyGTS = Usage.bind({});
multiYAxisWithEmptyGTS.args = {
  ...InitialUsage.args,
  ws: `NEWGTS 'data' RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
 { 'data' [ NEWGTS 'empty' RENAME $g ] 'params' [ { 'yAxis' 0 } { 'yAxis' 1 } ] }`
};

export const emptyGTS = Usage.bind({});
emptyGTS.args = {
  ...InitialUsage.args,
  ws: `NEWGTS 'data' RENAME`
};


export const multiXAxisWithEmptyGTS = Usage.bind({});
multiXAxisWithEmptyGTS.args = {
  ...InitialUsage.args,
  ws: `NEWGTS 'data' RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
 { 'data' [ $g NEWGTS 'empty' RENAME ] 'params' [ { 'xAxis' 0 } { 'xAxis' 1 } ] }`
};

export const AutoRefresh = Usage.bind({});
AutoRefresh.args = {
  ...InitialUsage.args,
  type: 'line',
  ws: `NEWGTS 'g' STORE
  1 1000 <%
    'ts' STORE
    NOW $ts STU * 50.0 / - 'ts' STORE
    $g $ts NaN NaN NaN $ts 50 * STU / 60.0 / SIN ADDVALUE DROP %> FOR
  $g`,
  options: {...new Param(), autoRefresh: 1, showLoader: false}
};


export const FocusPoints = ({url, ws, lang, options}) => `<div class="card" style="width: 100%; height: 500px;">
    <div class="card-body">
        <discovery-tile url="${url}" type="line" lang="${lang}"
        options='${JSON.stringify(options)}'
         id="chart" debug>${ws}</discovery-tile>
    </div>
    <div class="card-footer"><button id="btn" class="btn btn-primary">Focus</button></div>
</div>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart');
  document.querySelector('#btn').addEventListener('click', () => {
    // noinspection JSUnresolvedFunction
    chart.setFocus('data-[23]', 4).then(()=>{
    })
  })

}
</script>
`;

FocusPoints.args = {
  ...InitialUsage.args,
  ws: `1 4 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $ts NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {...new Param(), timeMode: 'custom'}
};

export const FocusPointWithDate = ({url, ws, lang, options}) => `<div class="card" style="width: 100%; height: 500px;">
    <div class="card-body">
        <discovery-tile url="${url}" type="line" lang="${lang}"
        options='${JSON.stringify(options)}'
         id="chart" debug>${ws}</discovery-tile>
    </div>
    <div class="card-footer"><button id="btn" class="btn btn-primary">Focus</button></div>
</div>
 <script>
window.onload = () => {
  const chart = document.querySelector('#chart');
  document.querySelector('#btn').addEventListener('click', () => {
    // noinspection JSUnresolvedFunction
    chart.setFocus('.*', 1515419993763851).then(()=>{
    })
  })

}
</script>
`;

FocusPointWithDate.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
      [ SWAP mapper.rate 1 0 0 ] MAP
      [ SWAP bucketizer.mean $NOW 1 h 0 ] BUCKETIZE`,
  options: {...new Param()}
};


export const FocusPointWithFullDate = FocusPointWithDate.bind({});

FocusPointWithFullDate.args = {
  ...InitialUsage.args,
  ws: `@training/dataset0
      // warp.store.hbase.puts.committed is the number of datapoints committed to
      // HBase since the restart of the Store daemon
      [ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW 10 d ] FETCH SORT
      [ SWAP mapper.rate 1 0 0 ] MAP
      [ SWAP bucketizer.mean $NOW 1 h 0 ] BUCKETIZE`,
  options: {...new Param(), fullDateDisplay: true}
};

export const WithThreshold = Usage.bind({});
WithThreshold.args = {
  ...Usage.args,
  type: 'line',
  unit: 'my unit',
  ws: `1 4 <% DROP NEWGTS 'g' STORE
  1 10 <% 'ts' STORE $g $ts RAND + STU * NOW + NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g %> FOR`,
  options: {
    ...new Param(),
    thresholds: [{value: 0.25, color: '#77BE69', fill: true}, {value: 0.5, color: '#ff9900'}, {value: 0.75}]
  }
};

export const WithMarkers = Usage.bind({});
WithMarkers.args = {
  ...Usage.args,
  type: 'line',
  ws: `1 2 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 100 <% 'ts' STORE $g $ts NaN NaN NaN RAND 100 * ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'gts' STORE
  { 'data' $gts 'params' [
    {
      'pieces' [
        { 'color' '#77BE69' 'lte' 33 }
        { 'color' '#ff9900' 'gte' 33 'lte' 66 }
        { 'gte' 66 }
      ]
    }
    { 'datasetColor' '#c6c6c6' }
  ]
}
  `,
  options: {
    ...new Param(),
    timeMode: 'timestamp',
    markers: [
      {start: 5, value: 10, color: '#77BE69', type: 'dotted', fill: true, name: 'area 51'},
      {value: 20, color: '#ff9900', type: 'solid'},
      {value: 30, name: 'Hello'}
    ],
    thresholds: [
      {value: 25, color: '#77BE69', fill: true},
      {value: 50, color: '#ff9900'},
      {value: 75, name: 'Danger'}
    ]
  }
};

export const WithMarkersAndMultiYAxis = Usage.bind({});
WithMarkersAndMultiYAxis.args = {
  ...WithMarkers.args,
  ws: `1 2 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 100 <% 'ts' STORE $g $ts NaN NaN NaN RAND 100 * ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'gts' STORE
  { 'data' $gts 'params' [
    { 'yAxis' 0
      'pieces' [
        { 'color' '#77BE69' 'lte' 33 }
        { 'color' '#ff9900' 'gte' 33 'lte' 66 }
        { 'gte' 66 }
      ]
    }
    { 'yAxis' 1 'datasetColor' '#c6c6c6' }
  ]
}
  `
};


export const WithPieces = Usage.bind({});
WithPieces.args = {
  ...Usage.args,
  type: 'line',
  options: { ...new Param(),    timeMode: 'timestamp'},
  ws: `0 1 <% 'i' STORE NEWGTS 'data-' $i TOSTRING + RENAME 'g' STORE
  1 100 <% 'ts' STORE $g $ts $i 100 * +  NaN NaN NaN RAND 100 * ADDVALUE DROP %> FOR
  $g %> FOR STACKTOLIST 'gts' STORE
  { 'data' $gts 'params' [
    {
      'xpieces' true
      'pieces' [ { 'color' '#FF00FF' 'gte' 33 'lte' 66 } ]
    }
    {
      'xpieces' false
      'pieces' [ { 'color' '#dc143c' 'gte' 33 'lte' 66 } ]
    }
  ]
}
  `
};
