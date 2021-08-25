import {Param} from "../model/param";
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
          { 'type' 'variable' 'tags' [ 'history' ] 'selector' 'fiveYearsOfData' 'value' { 'fiveYearsOfData' $wrappedGts } }
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
