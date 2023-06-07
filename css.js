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

const fs = require('fs');
const path = require('path');

const cssVars = [];

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}
const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          fs.readFileSync(file).toString().split('\n').forEach(l => {
            if(/--warp-view-/.test(l)) {
              const res = /(--warp-view-[a-z\-]+)/.exec(l);
              cssVars.push(res[0]);
            }
          })
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('./src', function(err, results) {
  if (err) throw err;

  console.log(cssVars.filter(onlyUnique).sort().map(l => "- " + l).join('\n'));
});
