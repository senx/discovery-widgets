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
import cssColorNames from 'css-color-names'
import isCssColorName from 'is-css-color-name'

/* eslint-disable @typescript-eslint/naming-convention */
export enum Colors {
  // noinspection JSUnusedGlobalSymbols
  COHESIVE = 'COHESIVE',
  COHESIVE_2 = 'COHESIVE_2',
  BELIZE = 'BELIZE',
  VIRIDIS = 'VIRIDIS',
  MAGMA = 'MAGMA',
  INFERNO = 'INFERNO',
  PLASMA = 'PLASMA',
  YL_OR_RD = 'YL_OR_RD',
  YL_GN_BU = 'YL_GN_BU',
  BU_GN = 'BU_GN',
  WARP10 = 'WARP10',
  NINETEEN_EIGHTY_FOUR = 'NINETEEN_EIGHTY_FOUR',
  ATLANTIS = 'ATLANTIS',
  DO_ANDROIDS_DREAM = 'DO_ANDROIDS_DREAM',
  DELOREAN = 'DELOREAN',
  CTHULHU = 'CTHULHU',
  ECTOPLASM = 'ECTOPLASM',
  T_MAX_400_FILM = 'T_MAX_400_FILM',
  MATRIX = 'MATRIX',
  CHARTANA = 'CHARTANA',
  VINTAGE = 'VINTAGE',
  CHALK = 'CHALK',
}

// noinspection JSUnusedGlobalSymbols
export enum HeatMaps {
  COHESIVE = 'COHESIVE',
  COHESIVE_2 = 'COHESIVE_2',
  BELIZE = 'BELIZE',
  VIRIDIS = 'VIRIDIS',
  MAGMA = 'MAGMA',
  INFERNO = 'INFERNO',
  PLASMA = 'PLASMA',
  YL_OR_RD = 'YL_OR_RD',
  YL_GN_BU = 'YL_GN_BU',
  BU_GN = 'BU_GN',
  NINETEEN_EIGHTY_FOUR = 'NINETEEN_EIGHTY_FOUR',
  ATLANTIS = 'ATLANTIS',
  DO_ANDROIDS_DREAM = 'DO_ANDROIDS_DREAM',
  DELOREAN = 'DELOREAN',
  CTHULHU = 'CTHULHU',
  ECTOPLASM = 'ECTOPLASM',
  T_MAX_400_FILM = 'T_MAX_400_FILM',
  MATRIX = 'MATRIX',
  CHALK = 'CHALK',
  VINTAGE = 'VINTAGE',
  DEFAULT = 'DEFAULT',
}

export class ColorLib {
  static color = {
    COHESIVE: ['#F2D354', '#E4612F', '#D32C2E', '#6D2627', '#6C7F55', '#934FC6', '#F07A5D', '#ED8371', '#94E751',
      '#C457F7', '#973AF7', '#B6FF7A', '#C7FFD5', '#90E4D0', '#E09234', '#D2FF91', '#17B201'],
    COHESIVE_2: ['#6F694E', '#65D0B2', '#D8F546', '#FF724B', '#D6523E', '#F9F470', '#F4BC78', '#B1D637', '#FFCFC8',
      '#56CDAB', '#CFDD22', '#B3F5D2', '#97DB29', '#9DC5EE', '#CFC0F5', '#EDEA29', '#5EC027', '#386C94'],
    BELIZE: ['#5899DA', '#E8743B', '#19A979', '#ED4A7B', '#945ECF', '#13A4B4', '#525DF4', '#BF399E', '#6C8893',
      '#EE6868', '#2F6497'],
    VIRIDIS: ['#440154', '#481f70', '#443983', '#3b528b', '#31688e', '#287c8e', '#21918c', '#20a486', '#35b779',
      '#5ec962', '#90d743', '#c8e020',],
    MAGMA: ['#000004', '#100b2d', '#2c115f', '#51127c', '#721f81', '#932b80', '#b73779', '#d8456c', '#f1605d',
      '#fc8961', '#feb078', '#fed799',],
    INFERNO: ['#000004', '#110a30', '#320a5e', '#57106e', '#781c6d', '#9a2865', '#bc3754', '#d84c3e', '#ed6925',
      '#f98e09', '#fbb61a', '#f4df53',],
    PLASMA: ['#0d0887', '#3a049a', '#5c01a6', '#7e03a8', '#9c179e', '#b52f8c', '#cc4778', '#de5f65', '#ed7953',
      '#f89540', '#fdb42f', '#fbd524',],
    YL_OR_RD: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026',],
    YL_GN_BU: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58',],
    BU_GN: ['#f7fcfd', '#ebf7fa', '#dcf2f2', '#c8eae4', '#aadfd2', '#88d1bc', '#68c2a3', '#4eb485', '#37a266',
      '#228c49', '#0d7635', '#025f27',],
    WARP10: [
      '#ff9900', '#E53935', '#F4511E', '#D81B60',
      '#00ACC1', '#1E88E5', '#43A047', '#FFB300',
      '#6D4C41', '#FDD835', '#00897B', '#3949AB',
      '#5E35B1', '#8E24AA', '#C0CA33', '#039BE5',
      '#7CB342', '#004eff'],
    NINETEEN_EIGHTY_FOUR: ['#fc9ca2', '#fb747d', '#fa4c58', '#f92432', '#e30613', '#c70512', '#9f040e', '#77030b', '#500207'],
    ATLANTIS: ['#edf2fb', '#e2eafc', '#d7e3fc', '#ccdbfd', '#c1d3fe', '#b6ccfe', '#abc4ff'],
    DO_ANDROIDS_DREAM: ['#d8f3dc', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788', '#40916c', '#2d6a4f', '#1b4332',
      '#081c15'],
    DELOREAN: ['#b98b73', '#cb997e', '#ddbea9', '#ffe8d6', '#d4c7b0', '#b7b7a4', '#a5a58d', '#6b705c', '#3f4238'],
    CTHULHU: ['#004c6d', '#006083', '#007599', '#008bad', '#00a1c1', '#00b8d3', '#00cfe3', '#00e7f2', '#00ffff'],
    ECTOPLASM: ['#006466', '#065a60', '#0b525b', '#144552', '#1b3a4b', '#212f45', '#272640', '#312244', '#3e1f47', '#4d194d'],
    T_MAX_400_FILM: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'],
    MATRIX: ['#025f27', '#025f27', '#0d7635', '#228c49', '#37a266', '#4eb485', '#68c2a3', '#88d1bc'],
    CHARTANA: ['#77BE69', '#FADE2B', '#F24865', '#5694F2',
      '#FF9830', '#B876D9'],
    CHALK: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff',
      '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2'],
    VINTAGE: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'
    ]
  };

  static heatMaps = {
    COHESIVE: ColorLib.color.COHESIVE,
    COHESIVE_2: ColorLib.color.COHESIVE_2,
    VIRIDIS: ColorLib.color.VIRIDIS,
    MAGMA: ColorLib.color.MAGMA,
    INFERNO: ColorLib.color.INFERNO,
    PLASMA: ColorLib.color.PLASMA,
    YL_OR_RD: ColorLib.color.YL_OR_RD,
    YL_GN_BU: ColorLib.color.YL_GN_BU,
    BU_GN: ColorLib.color.BU_GN,
    NINETEEN_EIGHTY_FOUR: ColorLib.color.NINETEEN_EIGHTY_FOUR,
    ATLANTIS: ColorLib.color.ATLANTIS,
    DO_ANDROIDS_DREAM: ColorLib.color.DO_ANDROIDS_DREAM,
    DELOREAN: ColorLib.color.DELOREAN,
    CTHULHU: ColorLib.color.CTHULHU,
    ECTOPLASM: ColorLib.color.ECTOPLASM,
    T_MAX_400_FILM: ColorLib.color.T_MAX_400_FILM,
    MATRIX: ColorLib.color.MATRIX,
    DEFAULT: ['#bf444c', '#d88273', '#f6efa6']
  };


  static getHeatMap(scheme: string) {
    return ColorLib.heatMaps[scheme] || ColorLib.heatMaps.DEFAULT;
  }

  static getColor(i: number, scheme: string | string[]) {
    if (typeof scheme === 'string') {
      if (!ColorLib.color[scheme]) {
        scheme = 'WARP10';
      }
      return ColorLib.color[scheme][i % 2 === 0
        ? i % ColorLib.color[scheme].length
        : ColorLib.color[scheme].length - i % ColorLib.color[scheme].length
        ];
    } else {
      return scheme[i % 2 === 0 ? i % scheme.length : scheme.length - i % scheme.length];
    }
  }

  static sanitizeColor(color: string) {
    if ((color ?? '').startsWith('#')) {
      return color;
    } else if ((color ?? '').startsWith('rgb(')) {
      const rex = /^rgb\((\d+), ?(\d+), ?(\d+)\)/gi
      const res = rex.exec(color);
      if (!res || res.length < 4) return color;
      return ColorLib.rgb2hex(parseInt(res[1], 10), parseInt(res[2], 10), parseInt(res[3], 10))
    } else if ((color ?? '').startsWith('rgba(')) {
      const rex = /^rgba\((\d+), ?(\d+), ?(\d+), ?\d\)/gi
      const res = rex.exec(color);
      if (!res || res.length < 4) return color;
      return ColorLib.rgb2hex(res[1], res[2], res[3]);
    } else {
      return isCssColorName(color ?? '') ? cssColorNames[color.toLowerCase()] : color === 'transparent' ? '#ffffffff' : color;
    }
  }

  static hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  static transparentize(color: string, alpha = 0.5): string {
    color = ColorLib.sanitizeColor(color ?? '');
    return 'rgba(' + ColorLib.hexToRgb(color ?? '').concat(alpha).join(',') + ')';
  }

  static hsvGradientFromRgbColors(c1: { r: number; g: number; b: number; h: any; s: any; v: any; }, c2: {
    r: number;
    g: number;
    b: number;
    h: any;
    s: any;
    v: any;
  }, steps: any) {
    const c1hsv = ColorLib.rgb2hsv(c1.r, c1.g, c1.b);
    const c2hsv = ColorLib.rgb2hsv(c2.r, c2.g, c2.b);
    c1.h = c1hsv[0];
    c1.s = c1hsv[1];
    c1.v = c1hsv[2];
    c2.h = c2hsv[0];
    c2.s = c2hsv[1];
    c2.v = c2hsv[2];
    const gradient = ColorLib.hsvGradient(c1, c2, steps);
    for (const item of gradient) {
      if (item) {
        item.rgb = ColorLib.hsv2rgb(item.h, item.s, item.v);
        item.r = Math.floor(item.rgb[0]);
        item.g = Math.floor(item.rgb[1]);
        item.b = Math.floor(item.rgb[2]);
      }
    }
    return gradient;
  }

  private static rgb2hsv(r: number, g: number, b: number) {
    // Normalize
    const normR = r / 255.0;
    const normG = g / 255.0;
    const normB = b / 255.0;
    const M = Math.max(normR, normG, normB);
    const m = Math.min(normR, normG, normB);
    const d = M - m;
    let h: number;
    let s: number;
    const v = M;
    if (d === 0) {
      h = 0;
      s = 0;
    } else {
      s = d / v;
      switch (M) {
        case normR:
          h = ((normG - normB) + d * (normG < normB ? 6 : 0)) / 6 * d;
          break;
        case normG:
          h = ((normB - normR) + d * 2) / 6 * d;
          break;
        case normB:
          h = ((normR - normG) + d * 4) / 6 * d;
          break;
      }
    }
    return [h, s, v];
  }

  private static hsvGradient(c1: any, c2: any, steps: any) {
    const gradient = new Array(steps);
    // determine clockwise and counter-clockwise distance between hues
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const distCCW = (c1.h >= c2.h) ? c1.h - c2.h : 1 + c1.h - c2.h;
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const distCW = (c1.h >= c2.h) ? 1 + c2.h - c1.h : c2.h - c1.h;
    // make gradient for this part
    for (let i = 0; i < steps; i++) {
      // interpolate h, s, b
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      let h = (distCW <= distCCW) ? c1.h + (distCW * i / (steps - 1)) : c1.h - (distCCW * i / (steps - 1));
      if (h < 0) {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        h = 1 + h;
      }
      if (h > 1) {
        h = h - 1;
      }
      const s = (1 - i / (steps - 1)) * c1.s + i / (steps - 1) * c2.s;
      const v = (1 - i / (steps - 1)) * c1.v + i / (steps - 1) * c2.v;
      // add to gradient array
      gradient[i] = {h, s, v};
    }
    return gradient;
  }

  private static hsv2rgb(h: any, s: any, v: any) {
    let r: number;
    let g: number;
    let b: number;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return [r * 255, g * 255, b * 255];
  }

  static rgb2hex(r: string | number, g: string | number, b: string | number) {
    const componentToHex = (c: string | number) => {
      // noinspection TypeScriptValidateJSTypes
      const hex = c.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    }
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
  }
}
