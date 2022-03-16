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

import tile, {Usage} from './discovery.tile.stories';
import {Param} from "../model/param";

export default {
  ...tile,
  title: 'UI/Input'
};

export const TextInputInitialUsage = Usage.bind({});
TextInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:text',
  ws: `{ 'data' 42  'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const TextInputWithButton = TextInputInitialUsage.bind({});
TextInputWithButton.args = {
  ...TextInputInitialUsage.args,
  options: {
    ...new Param(), input: {
      showButton: true
    }
  }
}

export const TextInputWithAValue = Usage.bind({});
TextInputWithAValue.args = {
  ...TextInputInitialUsage.args,
  ws: `42`
};

export const TextInputWithCustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-input-border-color: #c8e020;
  --warp-view-input-bg-color: #3b528b;
  --warp-view-input-border-radius: 20px;
  --warp-view-input-label-color: #c8e020;

  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
TextInputWithCustomStyle.args = {
  ...TextInputWithAValue.args
}

export const SecretInputInitialUsage = Usage.bind({});
SecretInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:secret',
  ws: `{ 'data' 42  'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const ListInputInitialUsage = Usage.bind({});
ListInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:list',
  ws: `{
  'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
  'globalParams' { 'input' { 'value' 'cranky' } }
  'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const ListInputInitialWithNumbers = Usage.bind({});
ListInputInitialWithNumbers.args = {
  ...Usage.args,
  type: 'input:list',
  ws: `{
  'data' [ 2017 2018 2019 2020 ]
  'globalParams' { 'input' { 'value' 2018 } }
  'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const ListInputWithCustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-input-border-color: #c8e020;
  --warp-view-input-bg-color: #3b528b;
  --warp-view-input-border-radius: 20px;
  --warp-view-input-label-color: #c8e020;

  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
ListInputWithCustomStyle.args = {
  ...ListInputInitialUsage.args
}

export const MultiInputInitialUsage = Usage.bind({});
MultiInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:multi',
  ws: `{
  'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
  'globalParams' { 'input' { 'value' [ 'cranky' 'angry' ] } }
  'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const MultiInputWithButton = Usage.bind({});
MultiInputWithButton.args = {
  ...MultiInputInitialUsage.args,
  options: {...new Param(), input: {showButton: true}}
};

export const MultiCBInputInitialUsage = Usage.bind({});
MultiCBInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:multi-cb',
  ws: `{
  'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
  'globalParams' { 'input' { 'value' [ 'cranky' 'angry' ] } }
  'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const MultiCBInputWithButton = Usage.bind({});
MultiCBInputWithButton.args = {
  ...MultiCBInputInitialUsage.args,
  title: "Checkboxes selection",
  options: {...new Param(), input: {showButton: true, showFilter: true}}
};

export const AutocompleteInputInitialUsage = Usage.bind({});
AutocompleteInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:autocomplete',
  ws: `{
  'data' [ "admiring" "adoring" "agitated" "amazing" "angry" "awesome" "backstabbing" "berserk" "big" "boring" "clever" "cocky" "compassionate" "condescending" "cranky" "desperate" "determined" "distracted" "dreamy" "drunk" "ecstatic" "elated" "elegant" "evil" "fervent" "focused" "furious" "gigantic" "gloomy" "goofy" "grave" "happy" "high" "hopeful" "hungry" "insane" "jolly" "jovial" "kickass" "lonely" "loving" "mad" "modest" "naughty" "nauseous" "nostalgic" "pedantic" "pensive" "prickly" "reverent" "romantic" "sad" "serene" "sharp" "sick" "silly" "sleepy" "small" "stoic" "stupefied" "suspicious" "tender" "thirsty" "tiny" "trusting"  ]
   'globalParams' { 'input' { 'value' 'focused' } }
   'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const AutocompleteInputWithButton = Usage.bind({});
AutocompleteInputWithButton.args = {
  ...AutocompleteInputInitialUsage.args,
  options: {...new Param(), input: {showButton: true, showFilter: true}}
};

export const AutocompleteInputWithCustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-input-border-color: #c8e020;
  --warp-view-input-bg-color: #3b528b;
  --warp-view-input-border-radius: 20px;
  --warp-view-input-label-color: #c8e020;

  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
AutocompleteInputWithCustomStyle.args = {
  ...AutocompleteInputInitialUsage.args
}

export const SliderInputInitialUsage = Usage.bind({});
SliderInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:slider',
  ws: `{ 'data' 42 'globalParams' { 'input' { 'min' 0 'max' 50 } } 'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const SliderInputWithCustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
   --warp-view-handle-bg-color:      #c8e020;
  --warp-view-input-border-color: #e53b2c;
  --warp-view-input-bg-color: #3b528b;
  --warp-view-input-label-color: #c8e020;
  --warp-view-active-input-bg-color: #e342f5;
  --warp-view-tooltip-bg-color: #311a40;
  --warp-view-tooltip-label-color: #ffffff;
  --warp-view-tooltip-border-color: #9e8819;
    --warp-view-chart-grid-color: blue;
    --warp-view-chart-label-color: teal;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
SliderInputWithCustomStyle.args = {
  ...SliderInputInitialUsage.args
}
export const DateInputInitialUsage = Usage.bind({});
DateInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:date',
  ws: `{ 'data' NOW ->TSELEMENTS [ 0 2 ] SUBLIST TSELEMENTS-> 'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`,
  options: {...new Param(),
    timeFormat: 'ddd DD MMM YY HH:mm:ss',
    fullDateDisplay: false
  }
};

export const DateInputWithCustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-input-border-color: #c8e020;
  --warp-view-input-bg-color: #3b528b;
  --warp-view-input-border-radius: 20px;
  --warp-view-input-label-color: #c8e020;

  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
DateInputWithCustomStyle.args = {
  ...DateInputInitialUsage.args
}

export const DateRangeInputInitialUsage = Usage.bind({});
DateRangeInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:date-range',
  ws: `{ 'data' [ NOW 10 d - NOW ] 'events' [
    { 'type' 'variable' 'tags' 'myVar' 'selector' 'myVar' }
  ] }`
};

export const DateRangeInputWithCustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-input-border-color: #c8e020;
  --warp-view-input-bg-color: #3b528b;
  --warp-view-input-border-radius: 20px;
  --warp-view-input-label-color: #c8e020;

  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
DateRangeInputWithCustomStyle.args = {
  ...DateRangeInputInitialUsage.args
}
