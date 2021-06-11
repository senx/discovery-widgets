import {DiscoveryEvent} from "../model/discoveryEvent";
import {GTSLib} from "./gts.lib";
import {Param} from "../model/param";
import {DataModel} from "../model/dataModel";

export class Utils {

  static httpPost(theUrl, payload) {
    return new Promise((resolve, reject) => {
      const xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
          resolve({data: xmlHttp.responseText, headers: xmlHttp.getAllResponseHeaders()});
        } else if (xmlHttp.readyState === 4 && xmlHttp.status >= 400) {
          reject(xmlHttp.statusText)
        }
      }
      xmlHttp.open("POST", theUrl, true); // true for asynchronous
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
    const obj = {...base} as T;
    const extended = {...ext} as T;
    for (const prop in extended || {}) {
      // If property is an object, merge properties
      if (Object.prototype.toString.call(extended[prop]) === '[object Object]') {
        obj[prop] = Utils.mergeDeep<T>(obj[prop], extended[prop]);
      } else {
        obj[prop] = extended[prop];
      }
    }
    return obj as T;
  }

  static fraction2r(rl0, rl1, v) {
    return v * (rl1 - rl0);
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

  static parseEventData(evt: DiscoveryEvent, eventHandler: string) {
    const parsed = {style: undefined, data: undefined, xpath: undefined, popup: undefined, vars: undefined}
    if (eventHandler) {
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
      const tagRex = new RegExp(tag);
      if ((evt.tags || []).some(t => tagRex.test(t)) && new RegExp(type).test(evt.type || '')) {
        switch (evt.type) {
          case "data":
            parsed.data = GTSLib.getData(evt.value);
            break;
          case "style": // map css selector -> content
            parsed.style = evt.value;
            break;
          case 'xpath':
            parsed.xpath = { selector: evt.selector, value: evt.value };
            break;
          case 'popup':
            parsed.popup =  evt.value;
            break;
          case 'variable':
            parsed.vars =  evt.value;
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
    const parsererrorNS = docError.getElementsByTagName("parsererror")[0].namespaceURI;
    // Parse xmlString:
    // (XMLDocument object)
    const doc = parser.parseFromString(xmlString, contentType);
    if (doc.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0) {
      throw new Error('Error parsing XML');
    }
    return doc;
  }
}
