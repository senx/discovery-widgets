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
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { GTSLib } from './gts.lib';
import { Param } from '../model/param';
import { cloneDeep, merge } from 'lodash';
import { DataModel, DiscoveryEvent } from '../model/types';

export class Utils {

  static getNavigatorLanguage = () => {
    let lang = 'en';
    if (navigator.languages && navigator.languages.length) {
      lang = navigator.languages[0];
    } else {
      // eslint-disable-next-line @typescript-eslint/dot-notation,dot-notation
      lang = navigator['userLanguage'] || navigator.language || navigator['browserLanguage'] || 'en';
    }
    return lang.split('-')[0].toLowerCase();
  };

  static clone(inObject: any): any {
    return cloneDeep(inObject);
  }

  static throttle(func: any, delay: number, ctx?: any) {
    let isRunning: boolean;
    return (...args: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const context = ctx || this;        // store the context of the object that owns this function
      if (!isRunning) {
        isRunning = true;
        func.apply(context, args); // execute the function with the context of the object that owns it
        setTimeout(() => isRunning = false, delay);
      }
    };
  }

  static httpPost(theUrl: string, payload: string, headers: { [key: string]: string; }): Promise<{
    data: any,
    headers: { [key: string]: string; },
    status: {
      ops: number,
      elapsed: number,
      fetched: number
    }
  }> {
    return new Promise((resolve, reject) => {
      const xmlHttp = new XMLHttpRequest();
      const resHeaders = {};
      xmlHttp.onreadystatechange = () => {
        xmlHttp.getAllResponseHeaders().split('\n').forEach(header => {
          if (header.trim() !== '') {
            const h = header.split(':');
            resHeaders[h[0].trim().toLowerCase()] = h[1].trim().replace('\r', '');
          }
        });
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
          resolve({
            data: xmlHttp.responseText,
            headers: resHeaders,
            status: {
              ops: parseInt(resHeaders['x-warp10-ops'], 10),
              elapsed: parseInt(resHeaders['x-warp10-elapsed'], 10),
              fetched: parseInt(resHeaders['x-warp10-fetched'], 10),
            },
          });
        } else if (xmlHttp.readyState === 4 && xmlHttp.status === 403) {
          reject({
            statusText: xmlHttp.statusText,
            status: xmlHttp.status,
            url: theUrl,
            headers: resHeaders,
            message: `Not Authorized`,
          });
        } else if (xmlHttp.readyState === 4 && xmlHttp.status >= 500) {
          if (resHeaders['x-warp10-error-line'] && resHeaders['x-warp10-error-message']) {
            reject({
              statusText: xmlHttp.statusText,
              status: xmlHttp.status,
              url: theUrl,
              headers: resHeaders,
              message: `line #${resHeaders['x-warp10-error-line']}: ${resHeaders['x-warp10-error-message']}`,
              detail: {
                mess: resHeaders['x-warp10-error-message'],
                line: resHeaders['x-warp10-error-line'],
              },
            });
          } else {
            reject({
              statusText: xmlHttp.statusText,
              status: xmlHttp.status,
              url: theUrl,
              headers: resHeaders,
              message: `WarpScript Error without message`,
            });
          }
        } else if (xmlHttp.readyState === 4 && xmlHttp.status === 0) {
          reject({
            statusText: theUrl + ' is unreachable',
            status: 404,
            url: theUrl,
            headers: resHeaders,
            message: theUrl + ' is unreachable',
            detail: {
              mess: theUrl + ' is unreachable',
              line: -1,
            },
          });
        }
      };
      xmlHttp.open('POST', theUrl, true); // true for asynchronous
      xmlHttp.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
      Object.keys(headers || {})
        .filter(h => h.toLowerCase() !== 'accept' && h.toLowerCase() !== 'content-type')
        .forEach(h => xmlHttp.setRequestHeader(h, headers[h]));
      xmlHttp.send(payload);
    });
  }

  static merge(options: Param | string, options2: Param) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    return { ...new Param(), ...options as Param, ...options2 };
  }

  static sanitize(data: string | DataModel) {
    if (typeof data === 'string') return '["' + data + '"]';
    else return data;
  }

  static mergeDeep<T>(base: T, ext: any): T {
    return merge(base, ext);
  }

  static getLabelColor(el: HTMLElement) {
    return Utils.getCSSColor(el, '--warp-view-chart-label-color', '#8e8e8e').trim();
  }

  static getGridColor(el: HTMLElement) {
    return Utils.getCSSColor(el, '--warp-view-chart-grid-color', '#8e8e8e').trim();
  }

  static getCSSColor(el: HTMLElement, property: string, defColor: string) {
    const color = getComputedStyle(el).getPropertyValue(property).trim();
    return color === '' ? defColor : color;
  }

  static getContentBounds(el: HTMLElement): { w: number, h: number } {
    return {
      h: el.clientHeight
        - parseInt(getComputedStyle(el, null).getPropertyValue('padding-top'), 10)
        - parseInt(getComputedStyle(el, null).getPropertyValue('padding-bottom'), 10),
      w: el.clientWidth
        - parseInt(getComputedStyle(el, null).getPropertyValue('padding-left'), 10)
        - parseInt(getComputedStyle(el, null).getPropertyValue('padding-right'), 10),
    };
  }

  static unsescape(str: string) {
    return str.replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, '\'')
      .replace(/&amp;/g, '&');
  }

  static parseEventData(evt: DiscoveryEvent, eventHandler: string, id: string) {
    const parsed = {
      style: undefined,
      data: undefined,
      xpath: undefined,
      popup: undefined,
      vars: undefined,
      audio: undefined,
      zoom: undefined,
      focus: undefined,
      margin: undefined,
      bounds: undefined,
      title: undefined,
      description: undefined,
      selected: undefined,
      link: undefined,
      hasEvent: false,
      poi: [],
    };
    if (eventHandler && evt.source !== id) {
      let tag = '.*';
      let type = '.*';
      eventHandler.split(',').forEach(eh => {
        if (eh.startsWith('tag')) {
          tag = eh.split('=')[1];
        }
        if (eh.startsWith('type')) {
          type = eh.split('=')[1];
        }
      });
      const tagRex = new RegExp('^' + tag + '$');
      if (evt.tags && typeof evt.tags === 'string') {
        evt.tags = [evt.tags];
      }
      if ((evt.tags || []).some(t => tagRex.test(t)) && new RegExp(type).test(evt.type || '')) {
        switch (evt.type) {
          case 'data':
            parsed.data = GTSLib.getData(evt.value);
            parsed.hasEvent = true;
            break;
          case 'style': // map css selector -> content
            parsed.style = evt.value;
            parsed.hasEvent = true;
            break;
          case 'xpath':
            parsed.xpath = { selector: evt.selector, value: evt.value };
            parsed.hasEvent = true;
            break;
          case 'popup':
            parsed.popup = evt.value;
            parsed.hasEvent = true;
            break;
          case 'variable':
            parsed.vars = evt.value;
            parsed.hasEvent = true;
            break;
          case 'audio':
            parsed.audio = evt.value;
            parsed.hasEvent = true;
            break;
          case 'zoom':
            parsed.zoom = evt.value;
            if (evt.selector) {
              const v: any = {};
              v[evt.selector] = evt.value;
              parsed.vars = v;
            }
            parsed.hasEvent = true;
            break;
          case 'focus':
            parsed.focus = evt.value;
            if (evt.selector) {
              const v: any = {};
              v[evt.selector] = evt.value;
              parsed.vars = v;
            }
            parsed.hasEvent = true;
            break;
          case 'margin':
            parsed.margin = evt.value;
            parsed.hasEvent = true;
            break;
          case 'bounds':
            parsed.bounds = evt.value;
            if (evt.selector) {
              const v: any = {};
              v[evt.selector] = evt.value;
              parsed.vars = v;
            }
            parsed.hasEvent = true;
            break;
          case 'title':
            parsed.title = evt.value;
            parsed.hasEvent = true;
            break;
          case 'description':
            parsed.description = evt.value;
            parsed.hasEvent = true;
            break;
          case 'link':
            parsed.link = typeof evt.value === 'string'
              ? { link: evt.value, target: 'self' }
              : { ...evt.value };
            parsed.hasEvent = true;
            break;
          case 'selected':
            parsed.selected = parsed.selected || {};
            parsed.selected[evt.selector] = evt.value;
            parsed.hasEvent = true;
            break;
          case 'poi':
            parsed.poi = evt.value;
            if (evt.selector) {
              const v: any = {};
              v[evt.selector] = evt.value;
              parsed.vars = v;
            }
            parsed.hasEvent = true;
            break;
          default:
          // nothing
        }
      }
    }
    return parsed;
  }

  static parseXML(xmlString: string, contentType: DOMParserSupportedType) {
    const parser = new DOMParser();
    // Parse a simple Invalid XML source to get namespace of <parsererror>:
    const docError = parser.parseFromString('INVALID', contentType);
    const parserErrorNS = docError.getElementsByTagName('parsererror')[0].namespaceURI;
    // Parse xmlString:
    // (XMLDocument object)
    const doc = parser.parseFromString(xmlString, contentType);
    if (doc.getElementsByTagNameNS(parserErrorNS, 'parsererror').length > 0) {
      throw new Error('Error parsing XML');
    }
    return doc;
  }

  /**
   * Compute the backend url if it is a relative one
   *
   * @param url
   */
  static getUrl(url: string): string {
    if (!url.toLowerCase().startsWith('http') && !url.toLowerCase().startsWith('ws')) {
      const { host, pathname, port, protocol, search } = window.location;
      let urlComputed = protocol + '//' + host + (port !== '' ? ':' + port : '');
      urlComputed += url.startsWith('/') ? url : pathname + (pathname.endsWith('/') ? '' : '/') + url;
      return urlComputed + search;
    } else {
      return url;
    }
  }

  static deepEqual(object1: any, object2: any) {
    if (!object1 || !object2) {
      return false;
    }
    const keys1 = Object.keys(object1 ?? {});
    const keys2 = Object.keys(object2 ?? {});
    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const val1 = object1[key];
      const val2 = object2[key];
      const areObjects = Utils.isObject(val1) && Utils.isObject(val2);
      if (areObjects && !Utils.deepEqual(val1, val2) || !areObjects && val1 !== val2) {
        return false;
      }
    }

    return true;
  }

  static isObject(object: any) {
    return object != null && typeof object === 'object';
  }
}
