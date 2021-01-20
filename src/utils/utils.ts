export class Utils {

  static httpPost(theUrl, payload) {
    return new Promise((resolve, reject) => {
      const xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          resolve({data: xmlHttp.responseText, headers: xmlHttp.getAllResponseHeaders()});
        } else if (xmlHttp.readyState == 4 && xmlHttp.status >= 400) {
          reject(xmlHttp.statusText)
        }
      }
      xmlHttp.open("POST", theUrl, true); // true for asynchronous
      xmlHttp.send(payload);
    });
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
}
