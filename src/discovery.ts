/*
 *   Copyright 2024 SenX S.A.S.
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
import { Logger } from './utils/logger';
import { packageJson } from './utils/package';

export default () => {
  const LOG: Logger = new Logger({ name: 'Discovery by SenX' });
  LOG.info(['Version'], packageJson.version);
  LOG.info(['Info'], packageJson.homepage);
}