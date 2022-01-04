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

import readme from '../components/discovery-tile/readme.md';

export default {
  title: 'UI/Spinner',
  notes: readme,
  argTypes: {
    message: {control: 'text'}
  },
  parameters: {
    docs: {
      description: {
        component: readme
      }
    },
  }
};
const Template = ({message}) => `<div class="card" style="width: 100%;">
  <div class="card-body">
    <discovery-spinner>${message}</discovery-spinner>
  </div>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  message: 'Data loading ...'
};

const Template2 = ({message}) => `<div class="card" style="width: 100%;">
  <div class="card-body">
    <discovery-spinner message="${message}"></discovery-spinner>
  </div>
</div>`;
export const MassageAsAttribute = Template2.bind({});
MassageAsAttribute.args = {
  message: 'Data loading ...'
};
