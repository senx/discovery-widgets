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

import {DiscoveryEvent} from '../model/discoveryEvent';
import {GTSLib} from './gts.lib';
import {Param} from '../model/param';
import {DataModel} from '../model/dataModel';
import {cloneDeep} from 'lodash'

export class Utils {
  static clone = (inObject) => {
    return cloneDeep(inObject);
  }

  static throttle(func, delay) {
    let isRunning;
    return (...args) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const context = this;        // store the context of the object that owns this function
      if (!isRunning) {
        isRunning = true;
        func.apply(context, args) // execute the function with the context of the object that owns it
        setTimeout(() => isRunning = false, delay);
      }
    }
  }

  static httpPost(theUrl, payload, headers: { [key: string]: string; }) {
    return new Promise((resolve, reject) => {
      const xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
          resolve({data: xmlHttp.responseText, headers: xmlHttp.getAllResponseHeaders()});
        } else if (xmlHttp.readyState === 4 && xmlHttp.status >= 400) {
          reject(xmlHttp.statusText)
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
    return {...new Param(), ...options as Param, ...options2}
  }

  static sanitize(data: string | DataModel) {
    if (typeof data === 'string') return '["' + data + '"]';
    else return data
  }

  static mergeDeep<T>(base: T, ext: any) {
    const obj = {...base};
    const extended = {...ext} as T;
    for (const prop in extended || {}) {
      // If property is an object, merge properties
      if (Object.prototype.toString.call(extended[prop]) === '[object Object]') {
        obj[prop] = Utils.mergeDeep<T>(obj[prop], extended[prop]);
      } else {
        obj[prop] = extended[prop];
      }
    }
    return obj;
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
        - parseInt(getComputedStyle(el, null).getPropertyValue('padding-right'), 10)
    }
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
    }
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
            break;
          case 'style': // map css selector -> content
            parsed.style = evt.value;
            break;
          case 'xpath':
            parsed.xpath = {selector: evt.selector, value: evt.value};
            break;
          case 'popup':
            parsed.popup = evt.value;
            break;
          case 'variable':
            parsed.vars = evt.value;
            break;
          case 'audio':
            parsed.audio = evt.value;
            break;
          case 'zoom':
            parsed.zoom = evt.value;
            break;
          case 'focus':
            parsed.focus = evt.value;
            break;
          case 'margin':
            parsed.margin = evt.value;
            break;
          case 'bounds':
            parsed.bounds = evt.value;
            break;
          case 'title':
            parsed.title = evt.value;
            break;
          case 'description':
            parsed.description = evt.value;
            break;
          case 'selected':
            parsed.selected = parsed.selected || {};
            parsed.selected[evt.selector] = evt.value;
            break;
          default:
          // nothing
        }
      }
    }
    return parsed;
  }

  static parseXML(xmlString, contentType) {
    const parser = new DOMParser();
    // Parse a simple Invalid XML source to get namespace of <parsererror>:
    const docError = parser.parseFromString('INVALID', contentType);
    const parsererrorNS = docError.getElementsByTagName('parsererror')[0].namespaceURI;
    // Parse xmlString:
    // (XMLDocument object)
    const doc = parser.parseFromString(xmlString, contentType);
    if (doc.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0) {
      throw new Error('Error parsing XML');
    }
    return doc;
  }
}
