/*
 *   Copyright 2023  SenX S.A.S.
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

const pack = require('./package.json');
const fs = require('fs');
const path = require('path');

fs.writeFileSync(path.join('src', 'utils', 'package.ts'), `export const packageJson = {
  version: '${process.env.npm_package_version ?? pack.version}',
  name: '${pack.name}',
  description: '${pack.description}',
  author: '${pack.author}',
  license: '${pack.license}',
  homepage: 'https://discovery.warp10.io/'
}`
, 'utf-8');
