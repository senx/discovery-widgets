import {Param} from "./param";
import {DataModel} from "./dataModel";

export class Tile {
  type: string;
  w: number;
  h: number;
  x: number;
  y: number;
  data?: string|DataModel;
  title?: string;
  macro?: string;
  endpoint?: string;
  options: Param = new Param();
}
