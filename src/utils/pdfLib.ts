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

import {Dashboard} from '../model/dashboard';
import {Tile} from '../model/tile';
import {jsPDF} from 'jspdf';
import {Logger} from './logger';
import {ColorLib} from './color-lib';

export class PdfLib {

  static async generatePDF(width: number, height: number, dashboard: Dashboard, save = true, output = 'blob', LOG: Logger): Promise<any> {
    try {
      LOG.debug(['generatePDF'], {width, height, dashboard, save, output});
      const doc = new jsPDF({
        unit: 'pt',
        format: [width, height],
        orientation: width > height ? 'landscape' : 'portrait'
      });
      const cellSpacing = 5;
      const xMargin = 10;
      const cellHeight = (dashboard.cellHeight || 220) + 18;
      doc.setFillColor(dashboard.bgColor);
      doc.rect(0, 0, width, height, 'F');
      const fontColor = ColorLib.hexToRgb(dashboard.fontColor) || [0, 0, 0];
      doc.setTextColor(fontColor[0], fontColor[1], fontColor[2]);
      if(!!dashboard.title) {
        doc.setFontSize(32);
        doc.text(dashboard.title, Math.round(width / 2), 30, {align: 'center', lineHeightFactor: 1});
      }
      if(!!dashboard.description) {
        doc.setFontSize(16);
        doc.text(dashboard.description, Math.round(width / 2), 70, {align: 'center', lineHeightFactor: 1});
      }
      LOG.debug(['generatePDF'], 'title and desc done');
      for (const t of (dashboard.tiles as Tile[])) {
        LOG.debug(['generatePDF'], 'generate tile', t);
        const bounds = {
          width: t.w * (width - xMargin * 2) / (dashboard.cols || 12) - cellSpacing * 2,
          height: t.h * cellHeight - (!!t.title ? 30 : 0) - cellSpacing * 2
        };
        const tx = t.x * (width - xMargin * 2) / (dashboard.cols || 12) + bounds.width / 2 + cellSpacing + xMargin;
        doc.setFontSize(18);
        doc.text(t.title || '', tx, t.y * cellHeight + 90 + cellSpacing + 24, {align: 'center', lineHeightFactor: 1});
        doc.setDrawColor('#a0a0a0');
        doc.rect(t.x * (width - xMargin * 2) / (dashboard.cols || 12) + cellSpacing - 1 + xMargin,
          t.y * cellHeight + 90 + cellSpacing - 1,
          bounds.width + 2, bounds.height + (!!t.title ? 30 : 0) + 2, 'S')
        if (!!t.png && t.png !== 'data:,') {
          let png = t.png;
          if (Array.isArray(t.png)) {
            png = t.png[0];
          }
          const resized = PdfLib.fitRectIntoBounds(await PdfLib.getImageDimensions(png), bounds);
          doc.addImage(png,
            t.x * (width - xMargin * 2) / (dashboard.cols || 12) + (bounds.width - resized.width) / 2 + cellSpacing + xMargin,
            t.y * cellHeight + 90 + cellSpacing + (bounds.height - resized.height) / 2 + (!!t.title ? 30 : 0),
            resized.width, resized.height
          );
        }
        LOG.debug(['generatePDF'], 'generate tile done', t);
      }
      if (!!save) {
        LOG.debug(['generatePDF'], 'save');
        doc.save(dashboard.title + '.pdf');
        LOG.debug(['generatePDF'], 'save done');
        return Promise.resolve();
      } else {
        LOG.debug(['generatePDF'], 'out');
        const data = doc.output(output as any, {filename: dashboard.title + '.pdf'});
        LOG.debug(['generatePDF'], 'out done');
        return Promise.resolve({data, filename: dashboard.title + '.pdf'})
      }
    } catch (e) {
      LOG.error(['generatePDF'], e);
      return Promise.reject(e);
    }
  }

  private static async getImageDimensions(file): Promise<any> {
    return new Promise(resolved => {
      const i = new Image();
      i.onload = () => resolved({width: i.width, height: i.height});
      i.src = file
    });
  }

  private static fitRectIntoBounds(rect, bounds) {
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
