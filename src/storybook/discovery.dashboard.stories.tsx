import {Param} from "../model/param";
import {action, configureActions} from '@storybook/addon-actions';
import {ColorLib} from "../utils/color-lib";

configureActions({
  depth: 10,
// Limit the number of items logged into the actions panel
  limit: 5,
  allowFunction: true
});

export default {
  title: 'Dashboards/Dashboard',
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
  'rendered',
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
  cols: 8,
  cellHeight: 220,
  ws: `{
  'title' 'My Dashboard'
  'description' 'Dashboard over 8 columns (default is 12)'
     'tiles' [
       {
         'type' 'display'
         'w' 2 'h' 1 'x' 3 'y' 0
         'data' 'Hello Discovery'
       }
        {
         'type' 'area'
         'w' 3 'h' 1 'x' 0 'y' 0
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
         'title' 'Title'
         'w' 3 'h' 1 'x' 5 'y' 0
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
         'w' 8 'h' 1 'x' 0 'y' 2
         'options' { 'timeMode' 'timestamp' }
         'data' [
           NEWGTS 'annot1' RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
           NEWGTS 'annot2' RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
           NEWGTS 'annot3' RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
         ]
       }
        {
          'type' 'circle'
          'unit' '%25'
          'w' 1 'h' 1 'x' 0 'y' 1
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
          'w' 1 'h' 1 'x' 1 'y' 1
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
          'w' 1 'h' 1 'x' 2 'y' 1
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
         'w' 3 'h' 1 'x' 3 'y' 1
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
         'type' 'map'
         'w' 2 'h' 1 'x' 6 'y' 1
         'endpoint' 'https://sandbox.senx.io/api/v0/exec'
         'data'
           NEWGTS 'g' STORE
0 10 <% 'ts' STORE $g NOW $ts 10000 - * RAND 10 * RAND 10 * RAND RAND ADDVALUE DROP %> FOR
{
  'data' $g
  'globalParams' {
    'map' {
      'mapType' 'STADIA_DARK'
    }
  }
}
       }
     ]
   }`,
  options: new Param()
}


export const TileOverFlow = Usage.bind({});
TileOverFlow.args = {
  ...Usage.args,
  cols: 12,
  ws: `{
        'title' 'Covid Tracker'
        'cellHeight' 120
        'options' {
          'scheme' 'CHARTANA'
          'customStyles' {
            '.discovery-dashboard-main'
            <'
            --wc-split-gutter-color: #404040;
            --warp-view-pagination-bg-color: #343a40 !important;
            --warp-view-pagination-border-color: #6c757d;
            --warp-view-datagrid-odd-bg-color: rgba(255, 255, 255, .05);
            --warp-view-datagrid-odd-color: #FFFFFF;
            --warp-view-datagrid-even-bg-color: #212529;
            --warp-view-datagrid-even-color: #FFFFFF;
            --warp-view-font-color: #FFFFFF;
            --warp-view-chart-label-color: #FFFFFF;
            --gts-stack-font-color: #FFFFFF;
            --warp-view-resize-handle-color: #111111;
            --warp-view-chart-legend-bg: #000;
            --gts-labelvalue-font-color: #ccc;
            --gts-separator-font-color: #FFFFFF;
            --gts-labelname-font-color: rgb(105, 223, 184);
            --gts-classname-font-color: rgb(126, 189, 245);
            --warp-view-chart-legend-color: #FFFFFF;
            --wc-tab-header-color: #FFFFFF;
            --wc-tab-header-selected-color: #404040;
            --warp-view-tile-background: #40404066;
            --warp-view-font-color: #fff;
            font-size: 12px !important;
            background-color: #FAFBFF !important;
            line-height: 1.52 !important;
            background: linear-gradient(40deg, #3BBC7D, #1D434C) !important;
            '>
            }
         }
        'vars' {
            'token' 'zizNn2DCXw0qtsbWx_F4WvA9ORyQBAtDScaTVaGGqJ1f5DMhE1ijFr6JDQQhPncn1bE4WQZrUN.ZIaJtCl_SOlx9oZ8H0e83U3afcX.iUPodyj.vqSgjHgToKfeO1_ZaG5fNfi3e7l71mlmJhs8Fl.'
            'country' 'France'
            'mapping' {
                1 'total_cases'
                2 'new_cases'
                3 'new_cases_smoothed'
                4 'total_deaths'
                5 'new_deaths'
                6 'new_deaths_smoothed'
                7 'total_cases_per_million'
                8 'new_cases_per_million'
                9 'new_cases_smoothed_per_million'
                10 'total_deaths_per_million'
                11 'new_deaths_per_million'
                12 'new_deaths_smoothed_per_million'
                13 'reproduction_rate'
                14 'icu_patients'
                15 'icu_patients_per_million'
                16 'hosp_patients'
                17 'hosp_patients_per_million'
                18 'weekly_icu_admissions'
                19 'weekly_icu_admissions_per_million'
                20 'weekly_hosp_admissions'
                21 'weekly_hosp_admissions_per_million'
                22 'new_tests'
                23 'total_tests'
                24 'total_tests_per_thousand'
                25 'new_tests_per_thousand'
                26 'new_tests_smoothed'
                27 'new_tests_smoothed_per_thousand'
                28 'positive_rate'
                29 'tests_per_case'
                30 'tests_units'
                31 'total_vaccinations'
                32 'people_vaccinated'
                33 'people_fully_vaccinated'
                34 'new_vaccinations'
                35 'new_vaccinations_smoothed'
                36 'total_vaccinations_per_hundred'
                37 'people_vaccinated_per_hundred'
                38 'people_fully_vaccinated_per_hundred'
                39 'new_vaccinations_smoothed_per_millions'
                40 'tringency_index'
                41 'population'
                42 'population_density'
                43 'median_age'
                44 'aged_65_older'
                45 'aged_70_older'
                46 'gdp_per_capita'
                47 'extreme_poverty'
                48 'cardiovasc_death_rate'
                49 'diabetes_prevalence'
                50 'female_smokers'
                51 'male_smokers'
                52 'handwashing_facilities'
                53 'hospital_beds_per_thousand'
                54 'life_expectancy'
                55 'human_development_index'
                56 'excess_mortality'
              }
        }
        'tiles' [
            {
                'title' 'Country'
                'x' 0 'y' 0 'w' 2 'h' 1
                'type' 'input:autocomplete'
                'macro' <% [ $token '~.*' {} ] FINDSETS STACKTOLIST 1 GET 'country' GET LSORT 'data' STORE
                    {
                        'data' $data
                        'globalParams' { 'input' { 'value' $country } }
                        'events' [ { 'type' 'variable' 'tags' [ 'country' ] 'selector' 'country' }  ]
                    }
                %>
            }
            {
                'title' 'Deaths/Cases per million'
                'x' 2 'y' 0 'w' 3 'h' 2
                'type' 'area'
                'options' { 'eventHandler' 'type=(variable),tag=country' }
                'macro' <%
                    [ $token 'covid'  { 'country' $country }  NOW 365 d 5 * ] FETCH
                    [ 8 11 39 ] $mapping MVTICKSPLIT FLATTEN ->GTS VALUELIST FLATTEN
                    [ SWAP bucketizer.sum NOW 1 d 0 ] BUCKETIZE
                    [ SWAP mapper.mean 7 0 0 ] MAP
                    [ SWAP mapper.abs 0 0 0 ] MAP 'gts' STORE
                    [ $gts [] $mapping '8' GET filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE
                    [ $gts [] $mapping '11' GET filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE
                %>
            }
            {
                'title' 'Vaccination'
                'x' 5 'y' 0 'w' 3 'h' 2
                'type' 'area'
                'options' { 'eventHandler' 'type=(variable),tag=country' }
                'macro' <%
                    [ $token 'covid'  { 'country' $country }  NOW 365 d 5 * ] FETCH
                    [ 32 33 41 ] $mapping MVTICKSPLIT FLATTEN ->GTS VALUELIST FLATTEN
                    [ SWAP bucketizer.sum NOW 1 d 0 ] BUCKETIZE 'gts' STORE
                    [ $gts [] $mapping '32' GET filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE
                    [ $gts [] $mapping '33' GET filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE
                    [ $gts [] $mapping '41' GET filter.byclass ] FILTER [ SWAP [] reducer.sum ] REDUCE
                    STACKTOLIST 'data' STORE
                    { 'data' $data 'params' [ { 'type' 'area' } { 'type' 'area' } { 'type' 'line' } ] }
                %>
            }
            {
                'title' 'ICU patients'
                'x' 8 'y' 0 'w' 4 'h' 2
                'type' 'bar'
                'options' { 'eventHandler' 'type=(variable),tag=country' }
                'macro' <%
                    [ $token 'covid'  { 'country' $country }  NOW 365 d 5 * ] FETCH
                    [ 14 ] $mapping MVTICKSPLIT FLATTEN ->GTS VALUELIST FLATTEN
                    [ SWAP bucketizer.mean NOW 7 d 0 ] BUCKETIZE [ SWAP [] reducer.sum ] REDUCE
                %>
            }
            {
              'title' 'Deaths'
              'x' 0 'y' 1 'w' 2 'h' 1
              'type' 'display'
              'options' { 'eventHandler' 'type=(variable),tag=country' }
              'macro' <%
                [ $token 'covid'  { 'country' $country }  NOW -1 ] FETCH
                [ 4 ] MVTICKSPLIT 0 GET VALUES 0 GET 'v' STORE
                { 'data' [ $v ] 'globalParams' { 'timeMode' 'custom' } }
              %>
            }
            {
              'x' 4 'y' 2 'w' 8 'h' 4
              'options'  { 'scheme' 'CHARTANA' 'map'  { 'mapType' 'GRAYSCALE' } }
              'type' 'map'
              'macro' <%
                [ $token 'covid'  {}  NOW -1 ] FETCH
                [ 4 ] $mapping MVTICKSPLIT FLATTEN ->GTS VALUELIST FLATTEN 'data' STORE
                [] 'last' STORE
                $data <%
                  [ SWAP bucketizer.last NOW 0 1 ] BUCKETIZE 0 GET VALUES 0 GET 'lastValue' STORE
                  $last $lastValue +! DROP
                %> FOREACH
                $last MAX 'max' STORE
                [] 'params' STORE
                $data <%
                  $params {
                    'key' 'Total death'
                    'render' 'weightedDots'
                    "color" "#f44336cc"
                    "borderColor" "#f44336"
                    "maxValue" $max
                    "minValue" 0
                  } +! DROP
                %> FOREACH
                { 'data' $data 'params' $params 'globalParams' { "map" { "startZoom" 4 } } }
            %>
          }
          {
              'title' 'Deaths per million top 10 countries'
              'x' 0 'y' 2 'w' 4 'h' 4
              'type' 'rose'
              'options' { 'eventHandler' 'type=(variable),tag=country' }
              'macro' <%
                [ $token 'covid'  { 'country' $country }  ] FINDSETS STACKTOLIST 1 GET 'continent' GET 0 GET 'continent' STORE
                [ $token 'covid'  { 'continent' $continent }  NOW -1 ] FETCH [ 10 ] $mapping MVTICKSPLIT FLATTEN  <%
                  'g' STORE $g LABELS 'country' GET 'c' STORE $g $c RENAME { NULL NULL } RELABEL
                %> F LMAP
                <%
                  [ 'a' 'b' ] STORE
                  <% $a VALUES 0 GET $b VALUES 0 GET > %>
                  <% -1 %> <% 1 %> IFTE
                %> SORTWITH  [ 0 10 ] SUBLIST
              %>
            }
        ]
    }`
}

export const CustomStyle = ({url, ws, options, title}) => `<div>
<style>
:root {
    --warp-view-chart-grid-color: blue;
    --warp-view-chart-label-color: red;
    --warp-view-font-color: white;
    --warp-view-tile-border: none;
    --warp-view-tile-shadow: none;
    }
</style>
    <div class="card" style="width: 100%;min-height: 500px; background-color: #404040">
        <div class="card-body">
            <discovery-dashboard url="${url}"
                dashboard-title="${title ? title : ''}" cols="8"
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
  ws: `{
  'title' 'Discovery test'
  'description' 'little test dashboard'
  'options' { 'autoRefresh' 5 }
  'tiles' [    // Tiles here
    {
      'title' 'FLoWS test'
      'x' 0 'y' 0 'w' 10 'h' 2
      'type' 'area'
      'macro' <%
        // FLoWS here
        <'
        g = NEWGTS()
        RENAME(g, "test")
        FOR(0, 100, (i) => {
        ADDVALUE(g, i, NaN, NaN, NaN, SIN(i / 5.0 + RAND()));
        });
        return g
        '>
        FLOWS

      %>
    }
  ]
}`,
  options: {autoRefresh: 5}
}
export const withWebSoket = Usage.bind({});
withWebSoket.args = {
  ...Usage.args,
  ws: `{
  'title' 'Discovery WebSocket'
  'description' 'little test dashboard'
  'tiles' [    // Tiles here
    {
      'title' 'WebSocket test'
      'x' 0 'y' 0 'w' 10 'h' 2
      'type' 'area'
      'options' { 'autoRefresh' 200 }
      'endpoint' 'wss://warp.senx.io/api/v0/mobius'
      'macro' <%
        NEWGTS 'data' RENAME 'gts' STORE
        NOW  'now' STORE
        $now 10 s - $now
        <% 200 ms + %>
        <%
          'i' STORE
          $i 1e-6 * SIN 'v' STORE
          $gts $i RAND 10.0 * RAND 10.0 * NaN $v ADDVALUE DROP
        %> FORSTEP
        $gts SORT 'data' STORE
        { 'data' $data 'globalParams' { 'type' <% $now 1 s / 2 % 0 == %> <% 'scatter' %> <% 'area' %> IFTE } }
      %>
    }
  ]
}`,
  options: new Param()
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
        'x' 6 'y' 0 'w' 6 'h' 4
        'data' '6x4'
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

export const AnnotationResize = Usage.bind({});
AnnotationResize.args = {
  ...Usage.args,

  cols: 12,
  cellHeight: 220,
  ws: `{
  'title' 'Resizing'
     'tiles' [

        {
         'type' 'annotation'
         'w' 8 'h' 1 'x' 3 'y' 0
         'options' { 'timeMode' 'timestamp' }
         'data'
         [ 0 10 <%
            'i' STORE
            NEWGTS 'annot' $i TOSTRING + RENAME 1 500 <% RAND 0.09 < <% NaN NaN NaN T ADDVALUE %> <% DROP %> IFTE %> FOR
            %> FOR
         ]
       }
        {
          'type' 'circle'
          'unit' '%25'
          'w' 3 'h' 1 'x' 0 'y' 0
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
     ]
   }`,
  options: new Param()
}
