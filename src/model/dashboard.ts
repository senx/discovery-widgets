import {Tile} from "./tile";
import {Param} from "./param";

export class Dashboard {
  title: string;
  type: 'dashboard' | 'scada' = 'dashboard';
  description: string;
  tiles: Tile[] | string = [];
  vars: { [key: string]: any; } = {};
  options?: Param;
  cols: 12;
  cellHeight: 220;
}
