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

(window as any).global = window;
export {Components, JSX} from './components';
export {Param} from './model/param'
export {GTS} from './model/GTS'
export {Tile} from './model/tile'
export {Logger} from './utils/logger';
export {ChartType, MapParams, TimeMode, TimeUnit, Dataset} from './model/types'
export {ChartBounds} from './model/chartBounds';
export {Dashboard} from './model/dashboard';
export {DataModel} from './model/dataModel';
export {DiscoveryEvent} from './model/discoveryEvent';
export {Label} from './model/label';
export {ColorLib, Colors, HeatMaps} from './utils/color-lib';
export {MapLib, MapTypes} from './utils/map-lib';
export {Utils} from './utils/utils';
export {GTSLib} from './utils/gts.lib';
export {PluginDef} from './model/PluginDef';
export {PluginManager} from './utils/PluginManager';
