import {Tile} from "./tile";
import {Param} from "./param";

export class Dashboard {
  title: string;
  type: 'dashboard' | 'scada' = 'dashboard';
  description: string;
  tiles: Tile[] = [];
  options?: Param;
  cols: 12;
  cellHeight: 220;
}
