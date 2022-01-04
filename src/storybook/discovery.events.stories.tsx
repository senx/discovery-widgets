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

import {Param} from "../model/param";
import {action, configureActions} from '@storybook/addon-actions';

configureActions({
  depth: 10,
// Limit the number of items logged into the actions panel
  limit: 5,
  allowFunction: true
});

export default {
  title: 'Events/Events',
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
id="myDash"
@draw="${event => console.error('foo', 'bar', event)}"
cols="${cols}" cell-height="${cellHeight}"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
</div>
</div>
<script>
document.querySelector('#myDash').addEventListener('discoveryEvent', e => {
  console.log(e.detail)
})
</script>`;

export const Usage = Template.bind({});
Usage.args = {
  url: 'https://warp.senx.io/api/v0/exec',
  cols: 12,
  cellHeight: 220,
  ws: `{
     'title' 'My Dashboard With events'
     'options' {
      'eventHandler' 'type=(style|audio),tag=bg'
      'customStyles' {
            '.discovery-dashboard-wrapper'
            <'
            --warp-view-tile-background: #40404066;
            --warp-view-font-color: #fff;
            '>
          }
     }
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
         'options' {  'autoRefresh' 10 }
         'macro' <% {
            RAND 100 * ROUND 'v' STORE
            <% $v 33 < %> <% '#77BE6955' %>  <% $v 66 < %> <% '#FF983055' %> <% '#F2486555' %> 2 SWITCH 'color' STORE
            <% $v 33 < %> <% '#77BE69' %>  <% $v 66 < %> <% '#FF9830' %> <% '#F24865' %> 2 SWITCH 'color2' STORE

            <% $v 33 < %>
            <% 'https://images.unsplash.com/photo-1580725869538-9b164c27c44f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1489&q=80' %>
            <% $v 66 < %> <% 'https://images.unsplash.com/photo-1428592953211-077101b2021b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80' %>
            <% 'https://images.unsplash.com/photo-1500670602153-5e2dd3c75f20?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1490&q=80' %>
            2 SWITCH 'bg' STORE


            <% $v 33 < %>
            <% 'http://soundbible.com/grab.php?id=1818&type=mp3' %>
            <% $v 66 < %> <% 'http://soundbible.com/grab.php?id=2015&type=mp3' %>
            <% 'http://soundbible.com/grab.php?id=1937&type=mp3' %>
            2 SWITCH 'sound' STORE


            'data' $v
            'events' [
              { 'tags' [ 'random' ] 'type' 'data' 'value' { 'data' $v  'params' [ { 'maxValue' 100 } ]  } }
              { 'tags' [ 'random' ] 'type' 'style'
                'value' {
                  '.discovery-tile' 'background-color: ' $color + ' !important;' +
                  '.value' 'color: ' $color2 + ';' +
                }
              }
              { 'tags' [ 'bg' ] 'type' 'style'
                'value' {
                 '.discovery-dashboard-main' 'transition: background 0.5s ease; background : fixed url(' $bg + ') no-repeat center !important; background-size: cover !important;' +
                }
              }
              { 'tags' [ 'bg' ] 'type' 'audio'
                'value' $sound
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
    'options' { 'eventHandler' 'type=.*,tag=popup' }
    'vars' {
      'myVar' 42
    }
    'tiles' [
      {
        'type' 'display'
        'title' 'Event style and data receiver'
         'w' 4 'h' 1 'x' 4 'y' 0
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
       {
         'type' 'button'
         'title' 'Popup emitter'
         'options' {
          'button' { 'label' 'Data' }
         }
         'w' 2 'h' 1 'x' 0 'y' 1
         'macro' <% { 'data' <%
            { 'data' ''
             'events' [
                { 'tags' [ 'popup' ] 'type' 'popup'
                  'value' {
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
                }
               ]
             }
          %> } %>
       }
       {
         'type' 'button'
         'title' 'Popup emitter'
         'options' {
          'button' { 'label' 'Macro' }
         }
         'w' 2 'h' 1 'x' 2 'y' 1
         'macro' <% { 'data' <%
            { 'data' ''
             'events' [
                { 'tags' [ 'popup' ] 'type' 'popup'
                  'value' {
                     'type' 'area'
                     'w' 3 'h' 1 'x' 0 'y' 0
                     'macro' <% [
                       NEWGTS 'data' RENAME
                       0.0 'v' STORE
                       1 500
                       <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
                       FOR
                     ] %>
                   }
                }
               ]
             }
          %> } %>
       }

       {
         'type' 'button'
         'title' 'Popup emitter'
         'options' {
          'button' { 'label' 'Dashboard' }
         }
         'w' 2 'h' 1 'x' 4 'y' 1
         'macro' <% { 'data' <%
            { 'data' ''
             'events' [
                { 'tags' [ 'popup' ] 'type' 'popup'
                  'value'
                  { 'title' 'My Dashboard' 'tiles' [
                  {
                     'type' 'area'
                     'w' 3 'h' 1 'x' 0 'y' 0
                     'macro' <% [
                       NEWGTS 'data' RENAME
                       0.0 'v' STORE
                       1 500
                       <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
                       FOR
                     ] %>
                   }
                ] }
                }
               ]
             }
          %> } %>
       }

       {
         'type' 'button'
         'title' 'Popup emitter'
         'options' {
          'button' { 'label' 'Scada' }
         }
         'w' 2 'h' 1 'x' 6 'y' 1
         'macro' <% { 'data' <%
            { 'data' ''
             'events' [
                { 'tags' [ 'popup' ] 'type' 'popup'
                  'value'
                  { 'title' 'My Scada' 'type' 'scada' 'tiles' [
                  {
                     'type' 'area'
                     'w' 500 'h' 250 'x' 200 'y' 200 'z' 1
                     'macro' <% [
                       NEWGTS 'data' RENAME
                       0.0 'v' STORE
                       1 500
                       <% 1 s * NOW SWAP - NaN NaN NaN $v RAND 0.5 - + DUP 'v' STORE ADDVALUE %>
                       FOR
                     ] %>
                   }
                ] }
                }
               ]
             }
          %> } %>
       }

       {
         'type' 'input:text'
         'title' 'Input emitter'
         'options' {
          'button' { 'label' 'Send' }
         }
         'w' 2 'h' 1 'x' 8 'y' 0
         'macro' <% { 'data' $myVar 'events' [ { 'tags' [ 'random' ] 'type' 'variable' 'selector' 'myVar' } ] } %>
       }
        {
        'type' 'display'
        'title' 'Event var receiver'
         'w' 2 'h' 1 'x' 8 'y' 1
         'macro' <% $myVar %>
         'options' { 'eventHandler' 'type=(variable),tag=random' }
       }
     ]
  }`
}

// @ts-ignore
const ScadaTemplate = ({url, ws, options, title, cols, cellHeight}) => `<div class="card" style="width: 100%;min-height: 500px">
<div class="card-body">
<discovery-dashboard url="${url}"
dashboard-title="${title ? title : ''}"
@draw="${event => console.error('foo', 'bar', event)}"
type="scada"
debug options='${JSON.stringify(options)}'
>${ws}</discovery-dashboard>
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


export const GTSEvents = Template.bind({});
GTSEvents.args = {
  ... Usage.args,
  ws: `
  'zizNn2DCXw0qtsbWx_F4WvA9ORyQBAtDScaTVaGGqJ1f5DMhE1ijFr6JDQQhPncn1bE4WQZrUN.ZIaJtCl_SOlx9oZ8H0e83U3afcX.iUPodyj.vqSgjHgToKfeO1_ZaG5fNfi3e7l71mlmJhs8Fl.' 'token' STORE
'France'  'country' STORE
[ $token 'covid'  { 'country' $country }  NOW 1 w 5 * ] FETCH WRAP 'fiveYearsOfData' STORE

{
  'title' 'Covid'
  'description' 'The Covid 19 dashboard'
  'vars' {
    'token' $token
    'country' $country
    'fiveYearsOfData' $fiveYearsOfData
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
      'macro' <%
        [ $token '~.*' {} ] FINDSETS STACKTOLIST 1 GET 'country' GET LSORT 'listOfCountries' STORE
        {
          'data' $listOfCountries
          'globalParams' { 'input' { 'value' $country } } // the initial selected value coming from global vars
          'events' [ { 'type' 'variable' 'tags' [ 'country' ] 'selector' 'country' }  ] // Event definition
        }
      %>
    }
{
  'title' 'Deaths/Cases per million'
  'x' 2 'y' 0 'w' 3 'h' 2
  'type' 'area'
  'options' { 'eventHandler' 'type=variable,tag=country' } // event handler
  'macro' <%
    [ $token 'covid' { 'country' $country }  NOW 1 w 5 * ] FETCH WRAP 'wrappedGts' STORE
    $wrappedGts UNWRAP [ 8 11 ] {  8 'new_cases_per_million' 11 'new_deaths_per_million' } MVTICKSPLIT
    <% ->GTS VALUELIST %> F LMAP FLATTEN 'data' STORE
    [ $data bucketizer.sum NOW 1 d 0 ] BUCKETIZE 'data' STORE
    [ $data mapper.mean 7 0 0 ] MAP 'data' STORE
    [ $data mapper.abs 0 0 0 ] MAP 'data' STORE
    {
        'data' $data
        'events' [
          // Event definition
          { 'type' 'variable' 'tags' [ 'history' ] 'value' { 'fiveYearsOfData' $wrappedGts } }
        ]
    }
  %>
}
{
  'title' 'Deaths'
  'x' 0 'y' 1 'w' 2 'h' 1
  'type' 'display'
  'options' { 'eventHandler' 'type=variable,tag=country' }
  'macro' <%
    [ $token 'covid'  { 'country' $country }  NOW -1 ] FETCH // last known value
    [ 4 ] MVTICKSPLIT 0 GET VALUES 0 GET 'v' STORE // value extraction
    { 'data' [ $v ] 'globalParams' { 'timeMode' 'custom' } } // Tile parameters,
  %>
}
{
  'title' 'Vaccination'
  'x' 5 'y' 0 'w' 3 'h' 2
  'type' 'area'
  'options' { 'eventHandler' 'type=variable,tag=history' } // Regexp
  'macro' <%
    $fiveYearsOfData UNWRAP [ 32 33 41 ] $mapping MVTICKSPLIT // It's more easy to use the mapping var
    <% ->GTS VALUELIST %> F LMAP FLATTEN 'data' STORE // we extract fields as GTS
    [ $data bucketizer.sum NOW 1 d 0 ] BUCKETIZE 'data' STORE  // daily sum
    {
      'data' $data
      'params' [
        { 'type' 'area' } // field 32 (people_vaccinated) as an area chart
        { 'type' 'area' } // field 33 (people_fully_vaccinated) as an area chart
        { 'type' 'line' } // field 41 (population) as a line chart
      ]
    }
  %>
}
{
  'title' 'ICU patients'
  'x' 8 'y' 0 'w' 4 'h' 2
  'type' 'area'
  'options' { 'eventHandler' 'type=variable,tag=history' } // Regexp
  'macro' <%
    $fiveYearsOfData UNWRAP [ 15 ] $mapping MVTICKSPLIT //
    <% ->GTS VALUELIST %> F LMAP FLATTEN 'data' STORE
    [ $data bucketizer.sum NOW 1 d 0 ] BUCKETIZE 'data' STORE
    [ $data mapper.mean 7 0 0 ] MAP 'data' STORE
    { 'data' $data  'params' [ { 'datasetColor' '#29ABE2' } ] }
  %>
}
]
}
  `
}

export const Variables = Template.bind({});
Variables.args = {
  ...Usage.args,
  ws: `{
     'title' 'My Dashboard With events'
     'vars' {
        'now' NOW
     }
     'tiles' [
       {
         'type' 'display'
         'title' 'Event data receiver'
         'w' 2 'h' 1 'x' 2 'y' 0
         'macro' <% $now %>
         'options' { 'eventHandler' 'type=variable,tag=random' }
       }
       {
         'type' 'display'
         'title' 'Event emitter'
         'w' 2 'h' 1 'x' 0 'y' 0
         'options' {  'autoRefresh' 1 }
         'macro' <% {
            'data' NOW
            'events' [
              { 'tags' [ 'random' ] 'type' 'variable' 'value' { 'now' NOW } }
             ]
           }
          %>
       }
     ]
   }`,
  options: new Param()
}

export const MapTracking = Template.bind({});
MapTracking.args = {
  ...Usage.args,
  ws: `
   [ "60VCRq4iS53iS68WNqh_RWg1X.FiNM0k82_YCYSWDLCYAL7tNI3hC2RkOHosCnVnAIBmO5BrOIO_DI0WBFJiSMKdO1FtNnNrNI_YNmpXDL3lAIFrB5JhD2RsBmonBaGYCqJqOIZkNI3LxyTQtgPszwzs.GQlmgDTVUiMb6NQ.1P3hPUlf_w.P7g_6sg7.........3qOTInJulU6glOGLWH_HvcKOH_9HeKKxpOoHp8moxJadA9oqBZuYA5j2RNFNorqcalY6qEBY6rBqBZmpcOgEpzUtqhyftTzrewntriTRnvETRvn52arIg1W87_ShLsttBIDcdXF3or2aSM6jBwhZtE9Rnxhyc1vA9L_4hfiSqstAxzmFllKgKhASQhrp3o.ZfPSzr0ESv0qf8.68euAtaWMgM5be7yXUVyMqTDxE3b3TdzL1Igoyg99lUmX9rxRUMGgXQuqRFdTO7Msc9CtwGy14Om_SW2a9xPjZ3G1BmxTNziEGI7e_I60.xmoC4Upx02iIT5wyKSggb8byDCCSXns8FajboCj0bsyMHMxTt3eKogD5xo.JAl02_qGkKa.MKCd9InlKtaBcozBvwCZ8TIsRqpdDUc06YwcMnQ.l5wFPn7kOz7hdQNT7PKBbHAjrkRNncawV0VnEUmKnSI7f2HkSAzzRiOmUWJUGbzj4kQZkQuTA5cAEs_k4cIYSx_yO6isxIcF7QGJrx_mLjCt4KlTYogMt7bOKRq6liDUULvfP.WdMhc9nC28VUSzuCCQ7m8dH87kfhxdwttXBhvnzYg.wbhQSccTiPw9_x5q0UbZr0N2UZoEXP2wkmiZYDYE4qzNoL4LJyNyBOP1U02UtZJhppHMMKtw.skyIPPZC9Zt9Z.K.2yQZMYGAnzJ0lEcPz5odcFAS2KuLO6MGXHay83D1FT_gA27y3oVsOXVm5C9W_sGZ1F.1JW49nxLKt_9XD8S9Hy3R1LYroCeGN5FKYpdH5SHn3iQ3lC2Cs2UcQxOEErtgSNJxupN.Bskyf2U8gC.Ri9.fms.E8I1ML9LtsQAHZ4O2bccCjpqE6hoIQHThKL1Jf46ly4pFCfmn2MWymqKuljGgloFxBEm5tyP4qrki1V8g6lo5HU7RjzxSd0PHBaN5yy3swxrMi_nfSV93cZW1O.bEAw3Abu_11.A5JVfADgvU8rcJRo6J79qQxr6PVNdAxiA4tFdkMndbF_0K.bcPIKCwqCqUQx3NruF1J7VAcmhiZXFWDKlcagTsYsHAzrTxyNqyk9qCt9uH0xXRhvNWmUzdn8BipF6MGZQb_29ZJUFUGaHBczY91UZ.l7MaYCjJzAsYh0R7lflWLNo6wlNttMHiXk53i6ttZt40qUsREKocV0NhU9HssgI_fr9FopnX9AwwxRMe3NfEiPe8U0.kvWrvySzOpdayJ31kxE2BIqKEomsqgFsnA4zTLzz8qGX6pmhm4qHHihBIHT9NYjtFKsX4TMRxFf2RlC6mg4aY4INUEXizkNB5liq2TFnocosHXNKTp6byG2XnraPV7cMP8r8qVYH5UbOPDEmyfT6WrylkOQxACCScWv3DGxIs1Z9U0SSPBB6y9054vs1GHMiK2ZLB6WuNHYQsl8BwWSiQ6.OelWTumZ4ECI4UJka0Ksxt2U6BMTiHZPB1mttK.sscrN4A9g.RA_M7SG1pHoV_HX1WAU.yplcIhHGENwxVemSQRDvroBZPHQe2l2T_7WpRPyCstew7xiKLI4TrIpfMsdgwRiNibf7jmyo.JbMWEIV5RhTyRMH5RHawfgXMiflyiMgr.ofDl8PFRAs87b4usaaj.JaxG8uaR7mLOvSSk37Rn3FogXPWOJ0VM8zsn6rktgL1xjs.I3Q_5VZuQr_o6N.R7A6SwypuxXWrmt1V8mZlpzLhVp854N1FDe1rs_gJax1rVBNW0UtHbj7PlZ3O.xhF07Yc9RQ7P5Y1Sh.lFoEChUKrjtvJzKZh1.k1WncegyyKwCMBA3K81xwHy6tgYiAMxOH3xVaBLM_y_7KozWA5d1mFBrcxFwOL9cx2Enn2auHgBQR1WZC.CbnUl5FVDASR5ICmuaUU_cvynRy90XVLR03UHWlL7ccfczdc5s6OE9NaQGr6tpfcrAIIht.7aAzadiITsTeUcP7Pq6u7rG.k9dtvTBTnFluLA7JQ9BG4HGIitxgIitL.mNPaRxaCRvBj3_cFJa1WFTVWBEjp.LPGn2aT74K8czRQiCtJWrS8klwAHexkN7V7bVOngs9m4mEilMUQux1XK85UcFup_TIZKtA7Ck.LRso2brjh_sliPV6qKGOtEr4kKWqrQUZYT0MFKsqCom98fMWa95C6t0USRYMyxNYIBJdW7ILOHarlRWWuJVM1xceS0m_88n0xGkZqHLxRvZnVMiweuLcOxolDbJOnhWeUWNcZ_da8VDso.ZVH_MlWjSwh2rLXQrN7_1jcsCm0fZcMX6i9MmoBBSDoufeL83jQIjszXvu_ql_IqOYFaIErk2hEfrM8Tufqhico3_To9zyZ7cSEX_dpkG6.86Fhnv_qQabmI10b3Tzu4FuRi.I1gv7wCX.F8ujh9JGqlUMbVwobnCXFClm744rfUFtpLCDtVSZrowF4.3NP26yRLfkmxfTmX4rIlLsiPfZR0QtkD8nmaP58qoL4xoQLRWGarTADSSvr5XVWC9CT8ujp0sk_viCxSF5wTJoElYmZh2znni0YDmJ6DeCSxLuBxN_d0wj.58tiIZc5woNkIgB7Y4Ih5UjSDxXuLVOo9hYnBv4jS9UiJb6GmB6.SOUBssLrfW3NE_h.0Z9qnzLkafaq8ElT2s3HJWvjfuJjGbZUlL8QzK54yWSHGmz.vm6C0nFjn8uKfDt67DZCgGdnhOEbqu29qbb0K54qJop5Yymi7XDAxa27BoDXIirjSp6wos2VWrfJfB9BQ6WbjVl4eBvuDle3UkmvYX1e0eSGqoy5g1S4H7prhpxHShBvHif97cVe0eRJf9.cAd5wl0d8t08IR5i3yy96JnWsF39ZuJTB5drVmN2eriKvAEcytSgnwnA2J1ZmrAUDv2ljn2YaO_.PHIbPBrTe1QSgxVmhwo.SOzFDPZskmFIUn_jW.jPrG2OqOjwkYsfzmgscAdUjUwfOx_0jsxeVEYyPQWgfvUc.E9vXb93TdwNDJm2uLJKKSSRZvNpf8meeCm4l6bqIwhIgf5OP49.1_VTusxxeUtJzhO3j8gkNjLZFiltTggbI13PqQug4iSH0suy2bT1N_bgkXbJ6NV1BwVeTeKJSuHXg9btgzhP23PWbd9XjYu3r_W3Y1khYPH0HrcvokdS39MMz3PMZa8gMa88MLhcN6FIHXkyZOq8Fl2fM5EWVLuOIk_OSJYQeu_dZcr7p_FCyim82.wp4F_afVxbkxbiryJFxEmef3OPia87A2V3e_9jjHgCT0FlaYZ0SamKyH_MpFJbUo8X0H9Woc2fIN4tGCfmz1YNPuLu9ez3taxCOzcZ.K9RLH1uSRP8kWsz0c16KAyHZk6jw6Fze5TlqjHLs94PIxnE_8oVba9PSbdPpLL895UaCVH8Qqcyh6yAkcUlOs1NbawQE4hEP7NQtccYstN6oZMje5EkYcKB6gvYzaNmxBOWGJEZJNmVxWBOqUmRWKfZz6X3Oi9Bnq8fk1J1FXQuJZSU1dad0rryxF9VtvgSMkhc1z2.0n_3n6Q6QMaRTelm9Y3TqOtaUfaJHjLrGRhnjQmV6tIhkOX8GoSd4skuwk9dK6zo4SLJIdr7fE3GL0Zp74HKBhcnJHz16GLfTsIjt6KlDWVhbdb7xPCqnqLSK1E5SO.um9kq8CEL5fMWHBvM9JH7hT5E6WiPl.QY8ftR.86L9W24QXXkG9Taejl0MLf_QhvEuQhb5NPK.m20xClg5XD2ERV1Vm0AbwxNpsZy0WPnFffsokfKIQlw5TZSNAndZiWDgnQuy.tRHX5XSjhqdvNhdz_vDU2ItUiMviBzFlz17ms3JcuebA_1eLbEtX1xc3RFUv9Vq1lxgND0tA8bZtvCfjBNJrVwW4AOguzmmU3OyhoJpbS3VYpTDQunDu9iJ7ils8YcJQquS5zYLzAkoZLFhdtAUAEh66d61Pa02u1igKTlE4xboF5A0BWIL5FWUzMmRvu1HwTAtYbnm8WUGWEQfSY5ate4PxB4rmhdDvv6Pf1vb2h4_DllrEtmzM7Ixw.d3KUHK_faoD4t4EeKLRjav7EMBgQ0WA7e6_jOjL8udKS.AKRKhjGgtiO5GbyLmnmsqtav63nK9nVQhYQOEgLSAcz2WCHIDyC0HPvpBmfknE9j_JirNP2nOIvAmJQEaYgXMCxmTGrolyrxtbwbKuqf2n6arakhkZtIqQTbYA_6Lxq_QUuguyUOBQsqF4WpoatK_p2DHe14FsveE60jCewAEV9EJ42KuXLuxjcEyaWlX_w2Jhig_KhCjHAjrK8YVWWx7.qMxDZmwiAxlG.fOhIf8JbIISkdcWSIGp7GfrT5dqq7x5xL_QivL46PGL7XEygpUOaiSTPt6VUC4.IAfLyzAXJbGoNGih_7MukEpfZkKMl8g9YA4X3qClvqcbxJJm7y7LgWOHkUJIxpHWMiK82nDXCn1zanjAO_n1fZuNFJwv2kZ5_HOBZwDWqJalIRLO3twuwhzAmnPbF5um0syqbl7X3_4H_18TPU5St4EFCiLNW_NmAvhnblkjTwKOgxHjRfJB_XwAHtPbE3WQ12uDlMJd2Y.6zhtR6HSNI5wlGaMmoFHLE.MjNNnsRSPqqkwLDoA8Pdrt.L_Vt3og7QLTtXbI1zyhc.0rpQxuDHh6s_j3gVFAnH8NlrMKVQm3Wq3vVMxNkgB39j3E9ycTeHwrzz0kxlJ6YZa5qIA1ofJJt31A9ejcx6TuqzaBl4GQc0GrrtcZbLQTz51x86FNgNjGSdBdrzL2J0IkDQShHkgZKiKbczEEp0NWhExv8HMoXY4Y6MC3dTJA4L927gd1xz4VLclTiTpvLkOwbirf3v.5cRm7zNA_tIrRCZ7OKhA9LnhaEZJ92bfu8AOdRhpZi9VbTQKHFSghwCNnZDQh0F37owC7RAxL5DH0D5LBDO3GROMoougNm99AMWsfn3Sy3sOJd6497sqtUzpdZ85TeJR2ei7yXSt4zsrInldDm971GQh_S3cXy9BJPs9QJH1JswzKyzBjng0l596wcnPpdltYgKDGqhy2ofJxn36rAj9PzIvcg8PugEOP9E.jAyhDEvu2X2HQVjFDinwyzc_MkSbxxR7F4g9283AtHSKmeyhrVQM.T9UASP5nbNDSBv0WHS3Ydtvo5pL5F8vZwNJ7yWggAp8IFMcpa1V9VyD5GsJ8yLsdiw3mPhUq0IkiLHGR0Q4jGpPcfUsbmJFaj7Atk1F1puBqNuFHZRQ_xenItxiAKuXn0Wc_F8lCW1yiRJMd5NbwKBdm7nIQhmW7tvQtvvG1TOk.SyqisqAWuGybFfdYcu266Mva5R8e6ifCA_ZdyEX5YwHSb8KlxPsZ0ceuYiFBDZcpBVi_sFZ9a5MOXiLT_sIVCh.o2hOaRnZqGGLKb4UgWIJUhIxN6mp1xiNEm0J9TukiFUTZQxcuLCADGOepBo9_y9rvSoxNX1Hsf5zJkRAnX9uLVjG9dBlqQuxmJ72e.lly6MWqx2HNnRzZTZ3XkX_ZuWAOL6O7KGvbVX7fCDMWQOmdaxl54nxc8MNVf8AIXSxV.BjehOUUdeucDfwu6tNT7DV1VB1w6s__iDs10U_JTiPNjDH6NKSrtxEmUn7hb1NWcyV4T4hvVzzDj8wdBOYG_7JCPdlZQtYBSZfj9gfzsYoKxNONUA5haB7Dn5V1RrKFBnuf5VGpbrlxoK_Xuq7fRHIkA14ajSGRVbhBzowBBO90sN9B3ral1O7wWmrnIBdQl0YMKGMMyS.wWTXt.vsagUhSVKjWh02oCnIdmGls0fomfH60bHRCTvqKne.MIhy4UtYJxYoXeV8J85YXNartSXXRJd.q67eDnN7f0dqyBFlzxnGUjZTRviNfVFU1_UwSIoWu6Yp_UvHe2QA_nAuR3Pr7ysGoDAH7Ecq1Lxd6Q2n.YTt_0iDouuJ.7nwhustAp3p2G_uRGko_jXvcP8CmNvQNCrvk.eWC1oWhL0beQCC0.E8BlUIn.ETYjUljfFzVOZq_vLwCG0LVNv8kjGtQILNwrFGtk.vbl8SlqJ_mrphD7HGljIud3ffynVLnh3b7FevHQrv0P31IH0DNIDryIOTPPbeyit6rlfSIYIhrRWlgRRvXcFBRdYtxZpPQvY2WRqpqwd_jOQ_g3bDTIOlj87mQdy7Ub9Qlb7q5dY9zqouBomOeu9hNQP.ZEy_Dzm5m8TwsL8VzrftrO04mgLw1nZZRH0MbewSMD1.ETeHPyy3cwrULVAhoT7C5wW4VzpBWv.067oVv9p_GFMxpk83fYaI9zUDej1XEa7ZFFZAfA4We7PxIHPAi.AnsY7UsYLzFxvAd_OCGc..0QR0G3." ]
   UNWRAP 0.01 TIMESCALE  'data' STORE
  $data FIRSTTICK 'first' STORE
$data NOW $first - TIMESHIFT 'data' STORE
  {
  'title' 'Santa'
  'vars' {
    'start' NOW
    'gts' $data WRAP
  }
  'tiles' [
  {
  'options' {
    'eventHandler' 'type=variable,tag=start'
    'map' { }
  }
  'x' 1 'y' 0 'w' 11 'h' 3
  'type' 'map' 'macro' <%
    $gts UNWRAP $start MINLONG TIMECLIP 'g' STORE
    $g 0 GET DUP LASTTICK ATTICK [ 1 2 ] SUBLIST 'loc' STORE
    {
      'data' $g
      'params' [ { 'marker' 'sleigh' 'render' 'path' 'line' true 'color' '#DC143C'  } ]
      'globalParams' {
        'map' {
          'startLat' $loc 0 GET
          'startLong' $loc 1 GET
          'startZoom' 5
          'track' true
        }
      }
    }
  %>
  }
  {
    'title' 'Date'
    'options' { 'autoRefresh' 1 'timeMode' 'custom' }
    'x' 0 'y' 0 'w' 1 'h' 1
    'type' 'display' 'macro' <%
      { 'data'
      NOW 'now' STORE
        $now ->TSELEMENTS [ 3 5 ] SUBLIST <% TOSTRING 'v' STORE <% $v SIZE 2 < %> <% '0' $v + %> <% $v %> IFTE %> F LMAP ':' JOIN
        'events' [ { 'tags' [ 'start' ] 'type' 'variable' 'value' { 'start' $now }  } ] }
    %>
  }
  ]
  }`,
  options: new Param()
}
