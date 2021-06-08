import {Param} from "../../model/param";
import {action, configureActions} from '@storybook/addon-actions';
import {ColorLib} from "../../utils/color-lib";

configureActions({
  depth: 10,
// Limit the number of items logged into the actions panel
  limit: 5,
  allowFunction: true
});

export default {
  title: 'UI/Scada',
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
<discovery-scada url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-scada>
</div>
</div>`;

export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  ws: `{
  'title' 'My Scada'
  'description' 'Dashboard in absolute position'
     'tiles' [
       {
         'type' 'svg'
         'w' 1500 'h' 700 'x' 0 'y' 0 'z' 0
         'data' [ @xav/nuclear ]
       }
       {
         'type' 'area'
         'w' 270 'h' 100 'x' 1138 'y' 238 'z' 9
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ]
       }
       {
         'type' 'line'
         'w' 220 'h' 150 'x' 620 'y' 60 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'macro' <%
           NEWGTS 'macro' RENAME
           0.0 'v' STORE
           1 20
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         %>
       }
       {
         'type' 'line'
         'w' 220 'h' 120 'x' 860 'y' 100 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'macro' <%
           NEWGTS 'macro' RENAME
           0.0 'v' STORE
           1 20
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         %>
       }
       {
          'type' 'gauge'
          'unit' '%25'
         'w' 140 'h' 120 'x' 880 'y' 207 'z' 2
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'params' [
      {
        'maxValue' 100
        'datasetColor'
        <% $v 33 < %> <% '#77BE69' %>
        <% $v 66 < %> <% '#FF9830' %>
        <% '#F24865' %> 2 SWITCH
      }
    ]
  }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 420 'y' 375 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'globalParams' {
      'bgColor'
      <% $v 33 < %> <% '#77BE69' %>
      <% $v 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 640 'y' 320 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'globalParams' {
      'bgColor'
      <% $v 33 < %> <% '#77BE69' %>
      <% $v 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 780 'y' 320 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'globalParams' {
      'bgColor'
      <% $v 33 < %> <% '#77BE69' %>
      <% $v 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 880 'y' 580 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'globalParams' {
      'bgColor'
      <% $v 33 < %> <% '#77BE69' %>
      <% $v 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 540 'y' 550 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'globalParams' {
      'bgColor'
      <% $v 33 < %> <% '#77BE69' %>
      <% $v 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 1270 'y' 370 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'globalParams' {
      'bgColor'
      <% $v 33 < %> <% '#77BE69' %>
      <% $v 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
          'type' 'linear-gauge'
          'options' { 'gauge' { 'horizontal' true } }
          'unit' '%25'
         'w' 150 'h' 80 'x' 1230 'y' 523 'z' 5
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'params' [
      {
        'maxValue' 100
        'datasetColor'
        <% $v 33 < %> <% '#77BE69' %>
        <% $v 66 < %> <% '#FF9830' %>
        <% '#F24865' %> 2 SWITCH
      }
    ]
  }
       }

       {
          'type' 'linear-gauge'
          'unit' '%25'
          'options' { 'gauge' { 'horizontal' true } }
         'w' 340 'h' 80 'x' 1122 'y' 585 'z' 2
          'data'
            RAND 100 * ROUND 'v' STORE
  {
    'data' $v
    'params' [
      {
        'maxValue' 100
        'datasetColor'
        <% $v 33 < %> <% '#77BE69' %>
        <% $v 66 < %> <% '#FF9830' %>
        <% '#F24865' %> 2 SWITCH
      }
    ]
  }
       }

       {
         'type' 'bar'
         'w' 350 'h' 150 'x' 120 'y' 180 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 5
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ]
       }

       {
         'type' 'area'
         'w' 180 'h' 100 'x' 900 'y' 420 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 5
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
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
    --warp-view-tile-border: none;
    --warp-view-tile-shadow: none;
    --warp-view-tile-background: linear-gradient(0deg, rgba(0,0,0,0.8827906162464986) 0%, rgba(29,0,45,0.5718662464985995) 100%);
    --warp-view-scada-background: url('https://previews.123rf.com/images/necnec/necnec1701/necnec170100023/70662057-mechanical-engineering-drawing-engineering-drawing-background-vector-illustration-.jpg') no-repeat;
    }
</style>
    <div class="card" style="width: 100%;min-height: 500px; background-color: #404040">
        <div class="card-body">
            <discovery-scada url="${url}"
                dashboard-title="${title ? title : ''}" cols="8"
                @draw="${event => console.error('foo', 'bar', event)}"
                debug options='${JSON.stringify(options)}'
            >${ws}</discovery-scada>
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

export const wihEvents = ({url, ws, options, title}) => `<div>
<style>
:root {
    --warp-view-tile-border: none;
    --warp-view-tile-shadow: none;
    --warp-view-font-color: white;
     }
</style>
    <div class="card" style="width: 100%;min-height: 500px; background-color: #404040">
        <div class="card-body">
            <discovery-scada url="${url}"
                dashboard-title="${title ? title : ''}" cols="8"
                @draw="${event => console.error('foo', 'bar', event)}"
                debug options='${JSON.stringify(options)}'
            >${ws}</discovery-scada>
        </div>
    </div>
</div>
`;
wihEvents.args = {
  ...Usage.args,
  ws: `
  {
  'title' 'My Scada'
  'options' { 'scheme' 'BELIZE' }
  'description' 'Events handling'
     'tiles' [

       {
         'type' 'svg'
         'w' 1500 'h' 700 'x' 0 'y' 0 'z' 0
         'options' {
            'eventHandler' 'type=xpath,tag=(power|command)'
            'customStyles' {
              'path, .st4, .st5, .st6, .st9' 'stroke: white !important;'
              '.st13' 'fill: #404040 !important'
            }
          }
         'data' [ @xav/nuclear ]
       }
       {
         'type' 'area'
         'w' 270 'h' 100 'x' 1138 'y' 238 'z' 9
         'options' { 'autoRefresh' 2 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }
       {
         'type' 'line'
         'w' 220 'h' 150 'x' 620 'y' 60 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'options' { 'autoRefresh' 2 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }
       {
         'type' 'line'
         'w' 220 'h' 120 'x' 860 'y' 100 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'options' { 'autoRefresh' 2 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }
       {
          'type' 'gauge'
          'unit' '%25'
         'options' { 'autoRefresh' 1 }
          'w' 140 'h' 120 'x' 880 'y' 207 'z' 2
          'macro' <%
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            {
              'data' $v
              'params' [ { 'maxValue' 100 'datasetColor' $color2 } ]
              'events' [
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/g[4]/polygon'
                'value' { 'style' 'fill: ' $color2 + ';' + }
                }
              ]
            } %>
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 420 'y' 375 'z' 5
         'options' { 'autoRefresh' 2 }
         'macro' <%
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            {
              'data' $v
              'globalParams' { 'bgColor' $color 'fontColor' $color2 }
              'events' [
                { 'tags' [ 'input' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
                { 'tags' [ 'input' ] 'type' 'style'
                  'value' {
                    '.discovery-tile' 'background-color: ' $color + ' !important;' +
                    '.value' 'color: ' $color2 + ';' +
                  }
                }
              ]
            } %>
            }


       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 640 'y' 320 'z' 5
          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=input' }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 780 'y' 320 'z' 5
          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=input' }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 880 'y' 580 'z' 5
          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=output' }
       }
       {
          'type' 'display'
          'unit' '°C'
          'w' 50 'h' 50 'x' 540 'y' 550 'z' 5
         'options' { 'autoRefresh' 2 }
         'macro' <%
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            {
              'data' $v
              'globalParams' { 'bgColor' $color 'fontColor' $color2 }
              'events' [
                { 'tags' [ 'output' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
                { 'tags' [ 'output' ] 'type' 'style'
                  'value' {
                    '.discovery-tile' 'background-color: ' $color + ' !important;' +
                    '.value' 'color: ' $color2 + ';' +
                  }
                }
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/g[15]/g/circle[2]'
                'value' { 'style' 'fill: ' $color + }
                }
              ]
            } %>
            }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 1270 'y' 370 'z' 5

          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=input' }
       }
       {
          'type' 'linear-gauge'
          'unit' '%25'
         'w' 150 'h' 80 'x' 1230 'y' 523 'z' 5
          'options' { 'eventHandler' 'type=data,tag=output'  'gauge' { 'horizontal' true }  }
         'data' { 'data' 0 'params' [ { 'maxValue' 100 } ] }
       }

       {
          'type' 'linear-gauge'
          'unit' '%25'
          'options' { 'gauge' { 'horizontal' true } 'autoRefresh' 1 }
         'w' 340 'h' 80 'x' 1122 'y' 585 'z' 2
          'macro' <%  RAND 100 * ROUND 'v' STORE

                  <% $v 33 < %> <% '#77BE69' %>
                  <% $v 66 < %> <% '#FF9830' %>
                  <% '#F24865' %> 2 SWITCH 'color' STORE
              { 'data' $v 'params' [ {
                'maxValue' 100
                'datasetColor' $color
              }
            ]
              'events' [
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/g[19]/g'
                'value' { 'style' 'transform-box: fill-box;transform-origin: center;transform: rotate(' $v TOSTRING + 'deg);' + }
                }
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/polygon[3]'
                'value' { 'style' 'transform: translate(' $v 2 / 30 - TOSTRING + 'px);fill :' + $color + }
                }
              ]

            }
            %>
       }

       {
         'type' 'bar'
         'w' 350 'h' 150 'x' 120 'y' 180 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'options' { 'autoRefresh' 1 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 5
           <% 1 s * NOW SWAP - NaN NaN NaN RAND 100 * DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }

       {
         'type' 'area'
         'w' 180 'h' 100 'x' 900 'y' 420 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 5
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ]
       }

       {
         'type' 'button'
         'title' 'Commands'
         'options' {
           'button' { 'label' 'Pump on' }
           'customStyles' {
              '*'
              <'
                --warp-view-button-border-color: #77BE69;
                --warp-view-button-bg-color: #77BE69;
                --warp-view-button-label-color: #fff;'
                --warp-view-font-color: #77BE69;
              '>
              '.discovery-tile h2' 'color: #fff !important;'
           }
         }
         'w' 200 'h' 150 'x' 10 'y' 10
         'macro' <% { 'data' <%
            '#77BE6955' 'color' STORE
            '#77BE69' 'color2' STORE
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'command' ] 'type' 'xpath'
                'selector' '//*[@id="Calque_1"]/g[15]/rect'
                  'value' { 'style' 'stroke: ' $color2 + ' !important;' + }
                }
               ]
             }
          %> } %>
       }
       {
         'type' 'button'
         'options' {
           'button' { 'label' 'Pump off' }
           'customStyles' {
              '*'
              <'
                --warp-view-button-border-color: #F24865;
                --warp-view-button-bg-color: #F24865;
                --warp-view-button-label-color: #fff;'
                --warp-view-font-color: #F24865;
              '>
              '.discovery-tile h2' 'color: #fff !important;'
           }
         }
         'w' 200 'h' 150 'x' 10 'y' 110
         'macro' <% { 'data' <%
            '#F2486555' 'color' STORE
            '#F24865' 'color2' STORE
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'command' ] 'type' 'xpath'
                'selector' '//*[@id="Calque_1"]/g[15]/rect'
                  'value' { 'style' 'stroke: ' $color2 + ' !important;' + }
                }
               ]
             }
          %> } %>
       }
     ]
   }`
}

export const wihEventsInLightMode = ({url, ws, options, title}) => `<div>
<style>
:root {
    --warp-view-tile-border: none;
    --warp-view-tile-shadow: none;
     }
</style>
    <div class="card" style="width: 100%;min-height: 500px;">
        <div class="card-body">
            <discovery-scada url="${url}"
                dashboard-title="${title ? title : ''}" cols="8"
                @draw="${event => console.error('foo', 'bar', event)}"
                debug options='${JSON.stringify(options)}'
            >${ws}</discovery-scada>
        </div>
    </div>
</div>
`;
wihEventsInLightMode.args = {
  ...wihEvents.args,
  ws: `
  {
  'title' 'My Scada'
  'options' { 'scheme' 'CHARTANA' }
  'description' 'Events handling'
     'tiles' [

       {
         'type' 'svg'
         'w' 1500 'h' 700 'x' 0 'y' 0 'z' 0
         'options' { 'eventHandler' 'type=xpath,tag=(power|command)' }
         'data' [ @xav/nuclear2 ]
       }
       {
         'type' 'area'
         'w' 270 'h' 100 'x' 1138 'y' 238 'z' 9
         'options' { 'autoRefresh' 2 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }
       {
         'type' 'line'
         'w' 220 'h' 150 'x' 620 'y' 60 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'options' { 'autoRefresh' 2 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }
       {
         'type' 'line'
         'w' 220 'h' 120 'x' 860 'y' 100 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'options' { 'autoRefresh' 2 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 50
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }
       {
          'type' 'gauge'
          'unit' '%25'
         'options' { 'autoRefresh' 1 }
          'w' 140 'h' 120 'x' 880 'y' 207 'z' 2
          'macro' <%
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            {
              'data' $v
              'params' [ { 'maxValue' 100 'datasetColor' $color2 } ]
              'events' [
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/g[5]/polygon'
                'value' { 'style' 'fill: ' $color2 + ';' + }
                }
              ]
            } %>
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 420 'y' 375 'z' 5
         'options' { 'autoRefresh' 2 }
         'macro' <%
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            {
              'data' $v
              'globalParams' { 'bgColor' $color 'fontColor' $color2 }
              'events' [
                { 'tags' [ 'input' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
                { 'tags' [ 'input' ] 'type' 'style'
                  'value' {
                    '.discovery-tile' 'background-color: ' $color + ' !important;' +
                    '.value' 'color: ' $color2 + ';' +
                  }
                }
              ]
            } %>
            }


       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 640 'y' 320 'z' 5
          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=input' }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 780 'y' 320 'z' 5
          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=input' }
       }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 880 'y' 580 'z' 5
          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=output' }
       }
       {
          'type' 'display'
          'unit' '°C'
          'w' 50 'h' 50 'x' 540 'y' 550 'z' 5
         'options' { 'autoRefresh' 2 }
         'macro' <%
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE
            {
              'data' $v
              'globalParams' { 'bgColor' $color 'fontColor' $color2 }
              'events' [
                { 'tags' [ 'output' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
                { 'tags' [ 'output' ] 'type' 'style'
                  'value' {
                    '.discovery-tile' 'background-color: ' $color + ' !important;' +
                    '.value' 'color: ' $color2 + ';' +
                  }
                }
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/g[17]/g/circle[2]'
                'value' { 'style' 'fill: ' $color + }
                }
              ]
            } %>
            }
       {
          'type' 'display'
          'unit' '°C'
         'w' 50 'h' 50 'x' 1270 'y' 370 'z' 5

          'data' 0
         'options' { 'eventHandler' 'type=(data|style),tag=input' }
       }
       {
          'type' 'linear-gauge'
          'unit' '%25'
         'w' 150 'h' 80 'x' 1230 'y' 523 'z' 5
          'options' { 'eventHandler' 'type=data,tag=output'  'gauge' { 'horizontal' true }  }
         'data' { 'data' 0 'params' [ { 'maxValue' 100 } ] }
       }

       {
          'type' 'linear-gauge'
          'unit' '%25'
          'options' { 'gauge' { 'horizontal' true } 'autoRefresh' 1 }
         'w' 340 'h' 80 'x' 1122 'y' 585 'z' 2
          'macro' <%  RAND 100 * ROUND 'v' STORE

                  <% $v 33 < %> <% '#77BE69' %>
                  <% $v 66 < %> <% '#FF9830' %>
                  <% '#F24865' %> 2 SWITCH 'color' STORE
              { 'data' $v 'params' [ {
                'maxValue' 100
                'datasetColor' $color
              }
            ]
              'events' [
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/g[21]/g'
                'value' { 'style' 'transform-box: fill-box;transform-origin: center;transform: rotate(' $v TOSTRING + 'deg);' + }
                }
                {
                'tags' [ 'power' ] 'type' 'xpath' 'selector' '//*[@id="Calque_1"]/polygon'
                'value' { 'style' 'transform: translate(' $v 2 / 30 - TOSTRING + 'px);fill :' + $color + }
                }
              ]

            }
            %>
       }

       {
         'type' 'bar'
         'w' 350 'h' 150 'x' 120 'y' 180 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'options' { 'autoRefresh' 1 }
         'macro' <% [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 5
           <% 1 s * NOW SWAP - NaN NaN NaN RAND 100 * DUP 'v' STORE ADDVALUE %>
           FOR
         ] %>
       }

       {
         'type' 'area'
         'w' 180 'h' 100 'x' 900 'y' 420 'z' 2
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 5
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ]
       }

       {
         'type' 'button'
         'title' 'Commands'
         'options' {
           'button' { 'label' 'Pump on' }
           'customStyles' {
              '*'
              <'
                --warp-view-button-border-color: #77BE69;
                --warp-view-button-bg-color: #77BE69;
                --warp-view-button-label-color: #fff;'
                --warp-view-font-color: #77BE69;
              '>
              '.discovery-tile h2' 'color: #fff !important;'
           }
         }
         'w' 200 'h' 150 'x' 10 'y' 10
         'macro' <% { 'data' <%
            '#77BE6955' 'color' STORE
            '#77BE69' 'color2' STORE
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'command' ] 'type' 'xpath'
                'selector' '//*[@id="Calque_1"]/g[17]/rect'
                  'value' { 'style' 'stroke: ' $color2 + ' !important;' + }
                }
               ]
             }
          %> } %>
       }
       {
         'type' 'button'
         'options' {
           'button' { 'label' 'Pump off' }
           'customStyles' {
              '*'
              <'
                --warp-view-button-border-color: #F24865;
                --warp-view-button-bg-color: #F24865;
                --warp-view-button-label-color: #fff;'
                --warp-view-font-color: #F24865;
              '>
              '.discovery-tile h2' 'color: #fff !important;'
           }
         }
         'w' 200 'h' 150 'x' 10 'y' 110
         'macro' <% { 'data' <%
            '#F2486555' 'color' STORE
            '#F24865' 'color2' STORE
            RAND 100 * ROUND 'v' STORE
            { 'data' ''
             'events' [
                { 'tags' [ 'command' ] 'type' 'xpath'
                'selector' '//*[@id="Calque_1"]/g[17]/rect'
                  'value' { 'style' 'stroke: ' $color2 + ' !important;' + }
                }
               ]
             }
          %> } %>
       }
     ]
   }`
}
