import {Tile} from "./tile";
import {Param} from "./param";

export class Dashboard {
  title: string;
  description: string;
  tiles: Tile[] = [];
  options?: Param;
}
