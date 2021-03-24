import {Param} from "../../model/param";
import {action, configureActions} from '@storybook/addon-actions';

configureActions({
  depth: 10,
// Limit the number of items logged into the actions panel
  limit: 5,
  allowFunction: true
});
const options = new Param()
export default {
  title: 'Components/Dashboard',
  argTypes: {
    url: {control: 'text'},
    ws: {control: 'text'},
    title: {control: 'text'},
    options: {control: 'object'},
    onDraw: {action: 'clicked'}
  },
};

[
  'statusHeaders',
  'statusError',
  'execResult',
  'draw',
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

// @ts-ignore
const Template = ({url, ws, options, title}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
cols="8"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>`;

export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  ws: `{
  'title' 'My Dashboard'
  'description' 'Dashboard over 8 columns (default is 12)'
     'tiles' [
       {
         'type' 'display'
         'w' 3 'h' 1 'x' 3 'y' 0
         'data' 'Hello Discovery'
       }
       {
         'type' 'area'
         'w' 4 'h' 2 'x' 0 'y' 1
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 500
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ]
       }
       {
         'type' 'line'
         'w' 4 'h' 2 'x' 5 'y' 1
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'macro' <%
           NEWGTS 'macro' RENAME
           0.0 'v' STORE
           1 500
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         %>
       }
       {
         'type' 'annotation'
         'w' 9 'h' 1 'x' 0 'y' 2
         'data' [
           NEWGTS 'annot1' RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
           NEWGTS 'annot2' RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
           NEWGTS 'annot3' RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
         ]
       }
     ]
   }`,
  options: new Param()
}
export const CustomStyle = ({url, ws, options, title}) => `<div>
<style>
:root {
    --warp-view-chart-grid-color: blue;
    --warp-view-chart-label-color: red;
    --warp-view-font-color: white;
    }
</style>
    <div class="card" style="width: 100%;min-height: 500px; background-color: #404040">
        <div class="card-body">
            <discovery-dashboard url="${url}"
                dashboard-title="${title ? title : ''}"
                @draw="${event => console.error('foo', 'bar', event)}"
                debug options='${JSON.stringify(options)}'
            >${ws}</discovery-dashboard>
        </div>
    </div>
</div>
`;
CustomStyle.args = {
  ...Usage.args,
  options: {...Usage.args.options, scheme: 'BELIZE'}
}

export const withAutoRefresh = Usage.bind({});
withAutoRefresh.args = {
  ...Usage.args,
  options: {autoRefresh: 2}
}

