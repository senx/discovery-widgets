/*
 *   Copyright 2022-2024 SenX S.A.S.
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

import {ChartType} from '../model/types';

export class LangUtils {
  static prepare(ws: string, vars: any = {}, skippedVars: string[], type: ChartType, lang: ('warpscript' | 'flows') = 'warpscript') {
    switch (lang) {
      case 'flows':
        return LangUtils.generateFlows(ws, vars, skippedVars, type)
      case 'warpscript':
        return LangUtils.generateWarpscript(ws, vars, skippedVars, type)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static generateFlows(ws: string, vars: any, skippedVars: string[], type: ChartType) {
    const varsStr = Object.keys(vars || {})
      .filter(k => !(skippedVars || []).includes(k))
      .map(k => LangUtils.generateFlowsVars(k, vars[k])).join('\n') + '\n';
    return `<'
${varsStr}
${ws}
'>
FLOWS`;
  }

  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static generateWarpscript(ws: string, vars: any, skippedVars: string[], type: ChartType) {
    const varsStr = Object.keys(vars ?? {})
      .filter(k => !(skippedVars ?? []).includes(k))
      .map(k => LangUtils.generateWarpscriptVars(k, vars[k])).join('\n') + '\n';
    return `
${varsStr}
${ws}
`;
  }
}
