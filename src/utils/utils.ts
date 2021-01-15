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
}
