/*
 *   Copyright 2022-2025 SenX S.A.S.
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

import { jsPDF } from 'jspdf';
import { Logger } from './logger';
import { ColorLib } from './color-lib';
import { Dashboard, Tile } from '../model/types';

export class PdfLib {

  static async generatePDF(
    domRoot: HTMLElement,
    width: number, height: number, dashboard: Dashboard, save = true, output = 'blob',
    isA4: boolean,
    LOG: Logger): Promise<any> {
    try {
      LOG.debug(['generatePDF'], { width, height, dashboard, save, output });
      const doc = new jsPDF({
        unit: 'px',
        format: isA4 ? 'a4' : [width + 40, height + 40],
        compress: true,
        orientation: width > height ? 'landscape' : 'portrait',
      });
      const xMargin = 10;
      doc.setFillColor(dashboard.bgColor);
      doc.rect(0, 0, width + 40, height + 40, 'F');
      const fontColor = ColorLib.hexToRgb(dashboard.fontColor) ?? [0, 0, 0];
      doc.setTextColor(fontColor[0], fontColor[1], fontColor[2]);
      if (dashboard.title) {
        doc.setFontSize(32);
        doc.text(dashboard.title, Math.round(width / 2), 30, { align: 'center', lineHeightFactor: 1 });
      }
      if (dashboard.description) {
        doc.setFontSize(16);
        doc.text(dashboard.description, Math.round(width / 2), 70, { align: 'center', lineHeightFactor: 1 });
      }
      LOG.debug(['generatePDF'], 'title and desc done');
      for (let i = 0; i < (dashboard.tiles ?? []).length; i++) {
        const t = dashboard.tiles[i] as Tile;
        LOG.debug(['generatePDF'], 'generate tile', t);
        const tElem = t.elem ?? domRoot.querySelector(`#chart-${i}`);
        const tBounds = tElem.getBoundingClientRect();

        const tx = tBounds.x - xMargin;
        const ty = tBounds.y - domRoot.getBoundingClientRect().top;
        // Background
        t.bgColor = t.bgColor === 'transparent' ? '#ffffff' : t.bgColor;
        doc.setFillColor(ColorLib.sanitizeColor(t.bgColor));
        doc.rect(tx, ty, tBounds.width + 2, tBounds.height, 'F');
        // border
        doc.setDrawColor('#a0a0a0');
        doc.rect(tx, ty, tBounds.width + 2, tBounds.height, 'S');
        // title
        doc.setFontSize(18);
        doc.text(t.title ?? '', tx + tBounds.width / 2, ty + 24, { align: 'center', lineHeightFactor: 1 });

        // chart
        if (!!t.png && t.png !== 'data:,') {
          let png = t.png;
          if (Array.isArray(t.png)) {
            png = t.png[0];
          }
          const resized = PdfLib.fitRectIntoBounds(await PdfLib.getImageDimensions(png), tBounds);
          doc.addImage(png, tx, ty + (tBounds.height - resized.height), resized.width, resized.height);
        }
        LOG.debug(['generatePDF'], 'generate tile done', t);
      }
      if (save) {
        LOG.debug(['generatePDF'], 'save');
        doc.save(dashboard.title + '.pdf');
        LOG.debug(['generatePDF'], 'save done');
        return Promise.resolve();
      } else {
        LOG.debug(['generatePDF'], 'out');
        const data = doc.output(output as any, { filename: dashboard.title + '.pdf' });
        LOG.debug(['generatePDF'], 'out done');
        return Promise.resolve({ data, filename: dashboard.title + '.pdf' });
      }
    } catch (e) {
      LOG.error(['generatePDF'], e);
      throw e;
    }
  }

  private static async getImageDimensions(file: any): Promise<any> {
    return new Promise(resolved => {
      const i = new Image();
      i.onload = () => resolved({ width: i.width, height: i.height });
      i.src = file;
    });
  }

  private static fitRectIntoBounds(rect: any, bounds: any) {
    const rectRatio = rect.width / rect.height;
    const boundsRatio = bounds.width / bounds.height;
    const newDimensions = {} as any;
    // Rect is more landscape than bounds - fit to width
    if (rectRatio > boundsRatio) {
      newDimensions.width = bounds.width;
      newDimensions.height = rect.height * (bounds.width / rect.width);
    } else {
      // Rect is more portrait than bounds - fit to height
      newDimensions.width = rect.width * (bounds.height / rect.height);
      newDimensions.height = bounds.height;
    }
    return newDimensions;
  }
}
