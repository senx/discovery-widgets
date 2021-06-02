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
         'w' 1500 'h' 1000 'x' 0 'y' 0 'z' 1
         'data' [ @xav/powerplant ]
       }
       {
         'type' 'area'
         'w' 500 'h' 200 'x' 890 'y' 10 'z' 9
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
         'title' 'Power'
         'w' 300 'h' 150 'x' 800 'y' 600 'z' 2
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
          'type' 'circle'
          'unit' '%25'
         'w' 100 'h' 100 'x' 650 'y' 500 'z' 2
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
          'unit' '%25'
         'w' 50 'h' 50 'x' 320 'y' 585 'z' 5
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
          'type' 'gauge'
          'unit' '%25'
         'w' 100 'h' 100 'x' 450 'y' 585 'z' 2
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
         'w' 600 'h' 300 'x' 30 'y' 10 'z' 2
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

export const polymorphic = Usage.bind({});
polymorphic.args = {
  ...Usage.args,
  cols: 12,
  cellHeight: 110,
  ws: `
  RAND 100 * ROUND 'value' STORE
  {
  'title' 'My Polymorphic Dashboard'
  'description' 'Change over a random value each 10 seconds with 1 second tile refresh'
     'tiles' [
       {
         'type' 'area'
         'w' 6 'h' 3 'x' 0 'y' 2
         'data' { 'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 500
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] 'params' [ {
      'datasetColor'
      <% $value 33 < %> <% '#77BE69' %>
      <% $value 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
    } ]
         }
       }
       {
       'type' 'rose'
       'w' 2 'h' 2 'x' 1 'y' 0
         'options' { 'scheme' 'ECTOPLASM'  'autoRefresh' 1 }
       'macro' <% NOW 'now' STORE
1 4 <% 'i' STORE NEWGTS 'serie #' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR %>
}
       <% $value 50.0 <= %>
       <%
       {
         'type' 'line'
         'title' 'Value <= 50'
         'w' 5 'h' 2 'x' 3 'y' 0
         'options' {  'autoRefresh' 1 }
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
         'type' 'scatter'
         'title' 'Value <= 50'
         'options' { 'scheme' 'ECTOPLASM' 'autoRefresh' 1 }
         'w' 5 'h' 2 'x' 8 'y' 0
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'macro' <%  NEWGTS 0.0 'v' STORE 1 50 <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %> FOR %>
       }
       %>
       <%
       {
         'type' 'bar'
         'title' 'Value > 50'
         'w' 9 'h' 2 'x' 3 'y' 0
         'options' { 'scheme' 'CTHULHU'  'autoRefresh' 1 }
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'macro' <%
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 30
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         %>
       }
       %>
       IFTE

       {
          'type' 'gauge'
          'unit' '%25'
          'w' 1 'h' 1 'x' 0 'y' 0
          'data'  {
    'data' $value
    'params' [
      {
        'maxValue' 100
        'datasetColor'
        <% $value 33 < %> <% '#77BE69' %>
        <% $value 66 < %> <% '#FF9830' %>
        <% '#F24865' %> 2 SWITCH
      }
    ]
  }
       }
       {
          'type' 'display'
          'unit' '%25'
          'w' 1 'h' 1 'x' 0 'y' 1
          'data'
  {
    'data' $value
    'globalParams' {
      'bgColor'
      <% $value 33 < %> <% '#77BE69' %>
      <% $value 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
         'type' 'map'
         'w' 6 'h' 3 'x' 6 'y' 2
         'options' { 'scheme' 'VIRIDIS' 'map' { 'mapType' 'STADIA' } 'autoRefresh' 1 }
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'macro' <%
         NEWGTS 'mapgts' STORE
         0 10 <% 'ts' STORE $mapgts NOW $ts 10000 - * RAND 10 * RAND 10 * RAND RAND ADDVALUE DROP %> FOR
         $mapgts %>
       }
     ]
   }`,
  options: {autoRefresh: 10}
}

export const staticPolymorphic = Usage.bind({});
staticPolymorphic.args = {
  ...polymorphic.args,
  ws: `
  18 'value' STORE
  {
  'title' 'My Polymorphic Dashboard'
  'description' 'Change over a random value each 5 seconds'
     'tiles' [
       {
         'type' 'area'
         'w' 6 'h' 3 'x' 0 'y' 2
         'data' { 'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 500
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ] 'params' [ {
      'datasetColor'
      <% $value 33 < %> <% '#77BE69' %>
      <% $value 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
    } ]
         }
       }
       {
       'type' 'rose'
       'w' 2 'h' 2 'x' 1 'y' 0
         'options' { 'scheme' 'ECTOPLASM' }
       'data' [ NOW 'now' STORE
1 4 <% 'i' STORE NEWGTS 'serie #' $i TOSTRING + RENAME 'g' STORE
  1 10 <% 'ts' STORE $g $now $ts STU * - NaN NaN NaN RAND ADDVALUE DROP %> FOR
  $g
%> FOR ]
}
       <% $value 50.0 <= %>
       <%
       {
         'type' 'line'
         'title' 'Value <= 50'
         'w' 4 'h' 2 'x' 3 'y' 0
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
         'type' 'scatter'
         'title' 'Value <= 50'
         'options' { 'scheme' 'ECTOPLASM' }
         'w' 5 'h' 2 'x' 7 'y' 0
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data' [ NEWGTS 0.0 'v' STORE 1 50 <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %> FOR ]
       }
       %>
       <%
       {
         'type' 'bar'
         'title' 'Value > 50'
         'w' 9 'h' 2 'x' 3 'y' 0
         'options' { 'scheme' 'CTHULHU' }
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data' [
           NEWGTS 'data' RENAME
           0.0 'v' STORE
           1 30
           <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
           FOR
         ]
       }
       %>
       IFTE

       {
          'type' 'gauge'
          'unit' '%25'
          'w' 1 'h' 1 'x' 0 'y' 0
          'data'  {
    'data' $value
    'params' [
      {
        'maxValue' 100
        'datasetColor'
        <% $value 33 < %> <% '#77BE69' %>
        <% $value 66 < %> <% '#FF9830' %>
        <% '#F24865' %> 2 SWITCH
      }
    ]
  }
       }
       {
          'type' 'display'
          'unit' '%25'
          'w' 1 'h' 1 'x' 0 'y' 1
          'data'
  {
    'data' $value
    'globalParams' {
      'bgColor'
      <% $value 33 < %> <% '#77BE69' %>
      <% $value 66 < %> <% '#FF9830' %>
      <% '#F24865' %> 2 SWITCH
      'timeMode' 'custom'
      'fontColor' 'white'
    }
  }
       }
       {
         'type' 'map'
         'w' 6 'h' 3 'x' 6 'y' 2
         'options' { 'scheme' 'VIRIDIS' }
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data'
           NEWGTS 'g' STORE
0 10 <% 'ts' STORE $g NOW $ts 10000 - * RAND 10 * RAND 10 * RAND RAND ADDVALUE DROP %> FOR
{
  'data' $g
  'globalParams' {
    'map' {
      'mapType' 'STADIA'
    }
  }
}
       }
     ]
   }`,

  options: {autoRefresh: -1}
}

export const differentSizesAndPositionAndCustomCellHeight = Usage.bind({});
differentSizesAndPositionAndCustomCellHeight.args = {
  ...Usage.args,
  cols: 12,
  cellHeight: 110,
  ws: `
  {
    'title' 'Test'
    'tiles' [
      {
        'type' 'display'
        'x' 0 'y' 0 'w' 1 'h' 1
        'data' '1x1'
      }
      {
        'type' 'display'
        'x' 1 'y' 0 'w' 2 'h' 2
        'data' '2x2'
      }
      {
        'type' 'display'
        'x' 3 'y' 0 'w' 1 'h' 2
        'data' '1x2'
      }
      {
        'type' 'display'
        'x' 4 'y' 1 'w' 2 'h' 1
        'data' '2x1'
      }
      {
        'type' 'display'
        'x' 6 'y' 0 'w' 6 'h' 2
        'data' '6x2'
      }
      {
        'type' 'display'
        'x' 0 'y' 1 'w' 1 'h' 1
        'data' '1x1'
      }
      {
        'type' 'display'
        'x' 1 'y' 2 'w' 2 'h' 2
        'data' '2x2'
      }
      {
        'type' 'display'
        'x' 3 'y' 2 'w' 1 'h' 2
        'data' '1x2'
      }
    ]
  }
  `,
  options: {...Usage.args.options, scheme: ColorLib.color.CHARTANA}
}

export const Raspi1WithGeneralOptions = Usage.bind({});
Raspi1WithGeneralOptions.args = {
  ...Usage.args,
  options: {},
  ws: `
// Variables
'9MnLoloG1kgCdf4fZi.FmpBYcngX0Xr_NHskCI6cQn.hK2SmNIYoP5lD8VHThFA9wq0FU5rE2geBdC62LnplZpDqudWu4KtDogsBM9PglhqP9lHjI5aIPjJzanaiFdwpAcMOZHre7TF' 'token' STORE
'2592000000000' 'duration' STORE
'rasp1-1' 'hname' STORE
{
  'title' 'Raspi-1'
  'description' 'Raspi-1'
  'options' { 'scheme' 'CHARTANA' }
  'autoRefresh' 30
  'tiles' [
    {
      'title' 'Disks'
      'x' 0 'y' 0 'w' 3 'h' 1
      'type' 'gauge' 'unit' 'Gb'
      'data' [ $token '~linux.df.bytes.(capacity|free)' { 'hname' $hname 'device' '~/dev/.*' } NOW -1 ] FETCH
        [ SWAP bucketizer.last NOW 0 1 ] BUCKETIZE [ 'device' 'mountpoint' ] PARTITION  'gts' STORE
        [] 'data' STORE
        [] 'params' STORE
        $gts KEYLIST <%
          'k' STORE
          {
            $gts $k GET
            <% 'g' STORE
              $g NAME 'linux.df.bytes.' '' REPLACE
              $g VALUES REVERSE 0 GET
            %> FOREACH
          } 'vals' STORE
          $data {
            'key'  $k 'device' GET ' (' + $k 'mountpoint' GET + ')' +
            'value'  $vals 'capacity' GET $vals 'free' GET - 1024 / 1024 / 1024.0 / 100 * ROUND 100.0 /
          } +! DROP
          $params { 'maxValue' $vals 'capacity' GET  1024 / 1024 / 1024 /  } +! DROP
      %> ASREGS FOREACH
      { 'data' $data 'params' $params }
    }
    {
        'title' 'Network'
        'x' 0 'y' 1 'w' 3 'h' 1
        'type' 'area'
        'data' [ $token '~linux.proc.net.dev.(receive|transmit).bytes' { 'hname' $hname 'iface' 'eth0' } NOW $duration TOLONG ] FETCH
          false RESETS 'gts' STORE
          [
            [ $gts [] 'linux.proc.net.dev.receive.bytes' filter.byclass ] FILTER
            [ $gts [] 'linux.proc.net.dev.transmit.bytes' filter.byclass ] FILTER
          ] FLATTEN [ SWAP bucketizer.mean NOW 1 h 0 ] BUCKETIZE
          [ SWAP mapper.delta 1 0 0 ] MAP
    }
    {
        'title' 'Load'
        'x' 3 'y' 1 'w' 9 'h' 1
        'type' 'area'
        'data' <%
          [ $token '~linux.proc.stat.userhz.(user|nice|system|idle|iowait)' { 'hname' $hname 'cpu' 'cpu' } NOW $duration TOLONG ] FETCH
          [ SWAP bucketizer.mean NOW 1 h 0 ] BUCKETIZE 'gts' STORE
          [ $gts [] '~linux.proc.stat.userhz.(user|nice|system|idle|iowait)' filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE 0 GET 'cpuGTS' STORE
          [ $gts [] 'linux.proc.stat.userhz.idle' filter.byclass ] FILTER 0 GET 'idleGTS' STORE
          [ $gts [] '~linux.proc.stat.userhz.(iowait|idle)' filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE 0 GET 'iowaitGTS' STORE
          [ $gts [] '~linux.proc.stat.userhz.(system|idle)' filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE 0 GET 'systemGTS' STORE
          [
            [ [ $cpuGTS $idleGTS ] [] <%
              'd' STORE
              $d 7 GET 0 GET 'cpu' STORE
              $d 7 GET 1 GET 'idle' STORE
              1000.0 $cpu $idle - * $cpu 5  + / 10 / 'v' STORE
              [ $d 0 GET NaN NaN NaN $v ]
            %> ASREGS MACROREDUCER ] REDUCE 0 GET 'CPU' RENAME
          [ [ $iowaitGTS $idleGTS ] [] <%
            'd' STORE
            $d 7 GET 0 GET 'cpu' STORE
            $d 7 GET 1 GET 'idle' STORE
            1000.0 $cpu $idle - * $cpu 5  + / 10 / 'v' STORE
            [ $d 0 GET NaN NaN NaN $v ]
          %> ASREGS MACROREDUCER ] REDUCE 0 GET 'Disk IO' RENAME
          [ [ $systemGTS $idleGTS ] [] <%
            'd' STORE
            $d 7 GET 0 GET 'cpu' STORE
            $d 7 GET 1 GET 'idle' STORE
            1000.0 $cpu $idle - * $cpu 5  + / 10 / 'v' STORE
            [ $d 0 GET NaN NaN NaN $v ]
          %> ASREGS MACROREDUCER ] REDUCE 0 GET 'System' RENAME
        ] %>  <% [] %> <% %> TRY
    }
    {
      'title' 'RAM/Swap'
      'x' 3 'y' 0 'w' 9 'h' 1
      'type' 'area'
      'data' [ $token '~linux.proc.meminfo.(MemFree|SwapFree)' { 'hname' $hname } NOW  $duration TOLONG ] FETCH
        [ SWAP bucketizer.mean NOW 1 h 0 ] BUCKETIZE
        [ SWAP 1.0 1024.0 1024.0 * 1024.0 * / mapper.mul 0 0 0 ] MAP
    }
  ]
}`
}

