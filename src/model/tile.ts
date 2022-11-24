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

import {Param} from './param';
import {DataModel} from './dataModel';

export class Tile {
  type: string;
  w: number;
  h: number;
  x: number;
  y: number;
  z?: number;
  data?: string | DataModel;
  title?: string;
  macro?: string;
  endpoint?: string;
  unit?: string;
  options: Param = new Param();
  elem?: HTMLDiscoveryTileElement | HTMLDiscoveryTileResultElement;
  png?: string;
  uid?: string;
  bgColor?: string;
  vars?: any[] | string[];
}
