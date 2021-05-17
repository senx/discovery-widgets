import {Param} from "./param";
import {DataModel} from "./dataModel";

export class Tile {
  type: string;
  w: number;
  h: number;
  x: number;
  y: number;
  z?: number;
  data?: string|DataModel;
  title?: string;
  macro?: string;
  endpoint?: string;
  unit?: string;
  options: Param = new Param();
}
