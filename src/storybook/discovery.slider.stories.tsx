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

import readme from '../components/discovery-slider/readme.md';

import {action} from "@storybook/addon-actions";
import {Param} from "../model/param";

export default {
  title: 'UI/Slider',
  notes: readme,
  argTypes: {
    options: {control: 'object'},
  },
  parameters: {
    docs: {
      description: {
        component: readme
      }
    },
  }
};

[
  'valueChanged',
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

const Template = ({options}) => `
<div class="card" style="width: 100%;">
  <div class="card-body">
    <discovery-slider
        options='${JSON.stringify(options)}'
        debug
    ></discovery-slider>
  </div>
</div>`;

export const InitialUsage = Template.bind({});
InitialUsage.args = {
  options: {
    ...new Param(),
    input: {
      min: 0,
      max: 100,
      value: 42,
      step: 10,
    }
  }
};

export const WithDates = InitialUsage.bind({});
WithDates.args = {
  options: {
    ...new Param(),
    timeMode: 'date',
    input: {
      min: 1643291469951990,
      max: 1643896256873055,
      value: 1643723480406273,
      step: 86400000000,
      progress: true
    }
  }
};

export const Test = InitialUsage.bind({});
Test.args = {
  options: {
    ...new Param(),
    input: {
      min: 0,
      max: 48,
      value: 15,
    }
  }
};


const SetValueTemplate = ({options, progress}) => `
<div class="card" style="width: 100%;">
  <div class="card-body">
    <discovery-slider
        id="slider"
        options='${JSON.stringify(options)}'
        progress="${progress}"
        debug
    ></discovery-slider>
    <div class="card-footer">
    <button id="btn" class="btn btn-primary">Set</button>
    </div>
</div>
</div>
 <script>
window.onload = () => {
  const slider = document.querySelector('#slider');
  document.querySelector('#btn').addEventListener('click', () => {
    // noinspection JSUnresolvedFunction
    slider.setValue(1643723480406273).then(()=>{
    })
  })

}
</script>`;

export const SetValue = SetValueTemplate.bind({});
SetValue.args = {
  options: {
    ...new Param(),
    timeMode: 'date',
    input: {
      min: 1643291469951990,
      max: 1643896256873055,
      value: 1643723480406273,
      step: 86400000000
    }
  }
};


export const SliderInputWithCustomStyle = ({options}) => `
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
        <discovery-slider
        id="slider"
        options='${JSON.stringify(options)}'
        debug
    ></discovery-slider>
    </div>
</div>`;
SliderInputWithCustomStyle.args = {
  ...InitialUsage.args,
  options: {
    ...new Param(),
    input: {
      min: 0,
      max: 100,
      value: 42,
      step: 10,
      progress: true
    }
  }
}
