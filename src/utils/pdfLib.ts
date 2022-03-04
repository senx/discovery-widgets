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

import {Dashboard} from "../model/dashboard";
import {Tile} from "../model/tile";
import {jsPDF} from "jspdf";

export class PdfLib {

  static async generatePDF(width: number, height: number, dashboard: Dashboard): Promise<void> {
    const doc = new jsPDF({
      unit: "pt",
      format: [width, height],
      orientation: width > height ? 'landscape' : 'portrait'
    });
    doc.setFontSize(32);
    doc.text(dashboard.title, Math.round(width / 2), 30, {align: 'center'});
    doc.setFontSize(16);
    doc.text(dashboard.description, Math.round(width / 2), 70, {align: 'center'});
    const cellHeight = dashboard.cellHeight || 220;
    for (const t of (dashboard.tiles as Tile[])) {
      if (!!t.png) {
        const bounds = {width: t.w * width / (dashboard.cols || 12) - 20, height: t.h * cellHeight - 20};
        const resized = PdfLib.fitRectIntoBounds(await PdfLib.getImageDimensions(t.png), bounds);
        doc.addImage(t.png,
          t.x * width / (dashboard.cols || 12) + (bounds.width - resized.width) / 2,
          t.y * cellHeight + 90 + (bounds.height - resized.height) / 2,
          resized.width, resized.height
        );
      }
    }
    doc.save(dashboard.title + ".pdf");
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
