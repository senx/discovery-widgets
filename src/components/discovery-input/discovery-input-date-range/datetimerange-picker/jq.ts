/*
 *   Copyright 2025 SenX S.A.S.
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


// alternate jquery function (subset)
export class JQ {
  addClassSub(el: any, classes: string) {
    const classsList = classes.split(' ');
    for (const item of classsList) {
      el.classList.add(item.trim());
    }
  }

  addClass(el: any, classes: string) {
    if (!el) {
      return;
    }
    if (typeof el.length === 'number') {
      for (const item of el) {
        this.addClassSub(item, classes);
      }
    } else {
      this.addClassSub(el, classes);
    }
  }

  findLast(el: any) {
    if (!el) {
      return null;
    }
    if (typeof el.length === 'number') {
      if (el.length > 0) {
        return el[el.length - 1];
      } else {
        return null;
      }
    } else {
      return el;
    }
  }

  findSelectedOption(el: any) {
    if (!el || !el.options || !el.options.length) {
      return null;
    }
    for (const opt of el.options) {
      if (opt.selected) {
        return opt;
      }
    }
    return null;
  }

  getSelectorFromElement(el: any) { // no original jquery, tiny implements for closest() function.
    if (!el || !(el instanceof Element)) {
      return null;
    }
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      return selector + '#' + el.id;
    }
    for (const clazz of el.classList) {
      selector += `.${clazz}`;
    }
    return selector;
  }

  html(el: HTMLElement, html: string) {
    if (el) {
      el.innerHTML = html;
    }
  }

  offset(el: HTMLElement) {
    if (!el) {
      return { top: 0, left: 0 };
    }
    // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
    // Support: IE <=11 only
    // Running getBoundingClientRect on a
    // disconnected node in IE throws an error
    if (!el.getClientRects().length) {
      return { top: 0, left: 0 };
    }
    // Get document-relative position by adding viewport scroll to viewport-relative gBCR
    const rect = el.getBoundingClientRect();
    const win = el.ownerDocument.defaultView;
    return {
      top: rect.top + win.pageYOffset,
      left: rect.left + win.pageXOffset,
    };
  }

  offSub(el: any, event: string, listener?: any) {
    if (typeof el.length === 'number') {
      for (const item of el) {
        item.removeEventListener(event, listener);
      }
    } else {
      el.removeEventListener(event, listener);
    }
  }

  off(el: any, event: string, param1: any, param2?: any) {
    if (!el) {
      return;
    }
    if (typeof param1 === 'function') { // param is listener
      this.offSub(el, event, param1);
    } else { // param is selector
      if (typeof el.length === 'number') {
        for (const item of el) {
          this.offSub(item.querySelectorAll(param1), event, param2);
        }
      } else {
        this.offSub(el.querySelectorAll(param1), event, param2);
      }
    }
  }

  onSub(el: any, event: string, listener: any) {
    if (typeof el.length === 'number') {
      for (const item of el) {
        item.addEventListener(event, listener);
      }
    } else {
      el.addEventListener(event, listener);
    }
  }

  on(el: any, event: string, param1: any, param2?: any) {
    if (!el) {
      return;
    }
    if (typeof param1 === 'function') { // param1 is listener
      this.onSub(el, event, param1);
    } else { // param1 is selector
      if (typeof el.length === 'number') {
        for (const item of el) {
          this.onSub(item.querySelectorAll(param1), event, param2);
        }
      } else {
        this.onSub(el.querySelectorAll(param1), event, param2);
      }
    }
  }
}