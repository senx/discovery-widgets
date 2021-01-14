export function format(first: string, middle: string, last: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

export class Utils {
  static WARP10 = [
    '#ff9900',
    '#004eff',
    '#E53935',
    '#7CB342',
    '#F4511E',
    '#039BE5',
    '#D81B60',
    '#C0CA33',
    '#6D4C41',
    '#8E24AA',
    '#00ACC1',
    '#FDD835',
    '#5E35B1',
    '#00897B',
    '#FFB300',
    '#3949AB',
    '#43A047',
    '#1E88E5',
  ];

  static getColor(i: number) {
    return Utils.WARP10[i % Utils.WARP10.length];
  }


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

}
