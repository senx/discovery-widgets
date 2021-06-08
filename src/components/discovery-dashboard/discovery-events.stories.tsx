import {Param} from "../../model/param";
import {action, configureActions} from '@storybook/addon-actions';

configureActions({
  depth: 10,
// Limit the number of items logged into the actions panel
  limit: 5,
  allowFunction: true
});

export default {
  title: 'UI/Events',
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
  'discoveryEvent',
  'draw',
].forEach(evt => window.addEventListener(evt, (e: CustomEvent) => action(evt)(e.detail)));

// @ts-ignore
const Template = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
cols="${cols}" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>`;

export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  cols: 12,
  cellHeight: 220,
  ws: `{
  'title' 'My Dashboard With events'
     'tiles' [
       {
         'type' 'display'
         'title' 'Event data receiver'
         'w' 2 'h' 1 'x' 2 'y' 0
         'data' ''
         'options' { 'eventHandler' 'type=data,tag=random' }
       }
       {
         'type' 'display'
         'title' 'Event style receiver'
         'w' 2 'h' 1 'x' 4 'y' 0
         'data' 'status'
         'options' { 'eventHandler' 'type=style,tag=random' }
       }
       {
         'type' 'gauge'
         'title' 'Event data receiver'
         'w' 2 'h' 1 'x' 6 'y' 0
         'data' ''
         'options' { 'eventHandler' 'type=data,tag=random' }
       }
       {
         'type' 'svg'
         'title' 'Event style and xpath receiver'
         'w' 4 'h' 2 'x' 8 'y' 0
         'macro' <% @xav/piotr %>
         'options' { 'eventHandler' 'type=(style|xpath),tag=svg' }
       }
       {
         'type' 'display'
         'title' 'Event emitter'
         'w' 2 'h' 1 'x' 0 'y' 0
         'options' {  'autoRefresh' 2 }
         'macro' <% {
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            'data' $v
            'events' [
              { 'tags' [ 'random' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
              { 'tags' [ 'random' ] 'type' 'style'
                'value' {
                  '.discovery-tile' 'background-color: ' $color + ' !important;' +
                  '.value' 'color: ' $color2 + ';' +
                }
              }
              { 'tags' [ 'svg' ] 'type' 'style'
                'value' {
                  'div > div > svg > g > g:nth-child(2) > circle:nth-child(7)' 'fill: ' $color2 + ' !important;' +
                }
              }

              { 'tags' [ 'svg' ] 'type' 'xpath'
                'value' '<' 'ellipse rx="' + $v TOSTRING +  '" ry="' + $v TOSTRING + '" style="stroke:none;fill: ' + $color2 + ';" cx="50" cy="200"' + '/>' +
                'selector' '/svg/g/g[2]/ellipse[1]'
              }
             { 'tags' [ 'svg' ] 'type' 'xpath'
                'value' { 'rx' $v 'ry' $v }
                'selector' '/svg/g/g[2]/ellipse[3]'
              }
             ]
           }
          %>
       }
     ]
   }`,
  options: new Param()
}
export const UsageWithActionButtons = Template.bind({});
UsageWithActionButtons.args = {
  ...Usage.args,
  ws: `{
    'title' 'My Dashboard With events'
    'tiles' [
      {
        'type' 'display'
        'title' 'Event style and data receiver'
         'w' 3 'h' 1 'x' 4 'y' 0
         'data' ''
         'options' { 'eventHandler' 'type=(style|data),tag=random' }
       }
       {
         'type' 'button'
         'title' 'Event emitter'
         'options' {
           'button' { 'label' 'Green' }
           'customStyles' {
              '*'
              <'
                --warp-view-button-border-color: #77BE69;
                --warp-view-button-bg-color: #77BE69;
                --warp-view-button-label-color: #fff;'
                --warp-view-font-color: #77BE69;
              '>
              '.discovery-tile' 'background-color: #77BE6955 !important;'
              '.discovery-tile h2' 'color: #77BE69 !important;'
           }
         }
         'w' 2 'h' 1 'x' 0 'y' 0
         'macro' <% { 'data' <%
            '#77BE6955' 'color' STORE
            '#77BE69' 'color2' STORE
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'random' ] 'type' 'style'
                  'value' {
                    '.discovery-tile' 'background-color: ' $color + ' !important;' +
                    '.value' 'color: ' $color2 + ';' +
                  }
                }
                { 'tags' [ 'random' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
               ]
             }
          %> } %>
       }
       {
         'type' 'button'
         'title' 'Event emitter'
         'options' {
          'button' { 'label' 'Red' }

           'customStyles' {
              '*'
              <'
                --warp-view-button-border-color: #F24865;
                --warp-view-button-bg-color: #F24865;
                --warp-view-button-label-color: #fff;'
                --warp-view-font-color: #F24865;
              '>
              '.discovery-tile' 'background-color: #F2486555 !important;'
              '.discovery-tile h2' 'color: #F24865 !important;'
           }
         }
         'w' 2 'h' 1 'x' 2 'y' 0
         'macro' <% { 'data' <%
            '#F2486555' 'color' STORE
            '#F24865' 'color2' STORE
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'random' ] 'type' 'style'
                  'value' {
                    '.discovery-tile' 'background-color: ' $color + ' !important;' +
                    '.value' 'color: ' $color2 + ';' +
                  }
                }
                { 'tags' [ 'random' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
               ]
             }
          %> } %>
       }
     ]
  }`
}

// @ts-ignore
const ScadaTemplate = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-scada url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-scada>
</div>
</div>`;

export const ScadaVersion = ScadaTemplate.bind({});
ScadaVersion.args = {
  ...Usage.args,
  ws: `{
  'title' 'My Scada With events'
     'tiles' [
       {
         'type' 'display'
         'title' 'Event data receiver'
         'w' 300 'h' 150 'x' 0 'y' 260
         'data' ''
         'options' { 'eventHandler' 'type=data,tag=random' }
       }
       {
         'type' 'display'
         'title' 'Event style receiver'
         'w' 300 'h' 150 'x' 0 'y' 420
         'data' 'status'
         'options' { 'eventHandler' 'type=style,tag=random' }
       }
       {
         'type' 'gauge'
         'title' 'Event data receiver'
         'w' 300 'h' 250 'x' 0 'y' 0
         'data' ''
         'options' { 'eventHandler' 'type=data,tag=random' }
       }
       {
         'type' 'svg'
         'title' 'Event style and xpath receiver'
         'w' 500 'h' 570 'x' 310 'y' 0
         'macro' <% @xav/piotr %>
         'options' { 'eventHandler' 'type=(style|xpath),tag=svg' }
       }
       {
         'type' 'display'
         'title' 'Event emitter'
         'w' 300 'h' 150 'x' 820 'y' 0
         'options' {  'autoRefresh' 2 }
         'macro' <% {
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            'data' $v
            'events' [
              { 'tags' [ 'random' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
              { 'tags' [ 'random' ] 'type' 'style'
                'value' {
                  '.discovery-tile' 'background-color: ' $color + ' !important;' +
                  '.value' 'color: ' $color2 + ';' +
                }
              }
              { 'tags' [ 'svg' ] 'type' 'style'
                'value' {
                  'div > div > svg > g > g:nth-child(2) > circle:nth-child(7)' 'fill: ' $color2 + ' !important;' +
                }
              }

              { 'tags' [ 'svg' ] 'type' 'xpath'
                'value' '<' 'ellipse rx="' + $v TOSTRING +  '" ry="' + $v TOSTRING + '" style="stroke:none;fill: ' + $color2 + ';" cx="50" cy="200"' + '/>' +
                'selector' '/svg/g/g[2]/ellipse[1]'
              }
             { 'tags' [ 'svg' ] 'type' 'xpath'
                'value' { 'rx' $v 'ry' $v }
                'selector' '/svg/g/g[2]/ellipse[3]'
              }
             ]
           }
          %>
       }
     ]
   }`,
  options: new Param()
}
