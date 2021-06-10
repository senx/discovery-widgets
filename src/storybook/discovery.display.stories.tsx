import tile, {Usage} from './discovery.tile.stories';
import {Param} from "../model/param";

export default {
  ...tile,
  title: 'UI/Display'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'display',
  unit: '°C',
  ws: `{ 'data' 42 'globalParams' {
  'timeMode' 'custom'
  'bgColor' 'darkblue'
  'fontColor' 'cyan'
} }`
};

export const displayDate = Usage.bind({});
displayDate.args = {
  ...Usage.args,
  type: 'display',
  ws: `{ 'data' NOW 'globalParams' { 'timeMode' 'date' } }`
}

export const displayDuration = Usage.bind({});
displayDuration.args = {
  ...Usage.args,
  type: 'display',
  ws: `{ 'data' NOW 5 s - 'globalParams' { 'timeMode' 'duration' } }`
}

export const displayLongText = Usage.bind({});
displayLongText.args = {
  ...Usage.args,
  type: 'display',
  ws: `{
        'data'
        <'
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent iaculis dictum dolor sit amet dapibus. Vivamus mattis elit eu
        pretium porttitor. Duis eleifend gravida tortor eu tempus. Mauris dui arcu, ultricies et lobortis pharetra, pulvinar quis velit.
        Maecenas vitae felis a nisi mollis consectetur at et lectus. Nullam sit amet ex pellentesque, aliquet velit quis, tempus ex.
        Vestibulum vel nunc augue. Curabitur sagittis vitae justo non lobortis. Maecenas porttitor nisl id augue feugiat hendrerit.
        '>
        'globalParams' { 'bgColor' '#1e88e5' 'fontColor' 'white' 'timeMode' 'custom' } }`
}

export const displayHTML = Usage.bind({});
displayHTML.args = {
  ...Usage.args,
  type: 'display',
  ws: `{
  'data' '<a href="https://warp10.io/" target="_blank">Warp 10</a>'
  'globalParams' { 'bgColor' '#f57f17' 'fontColor' '#bc5100' 'timeMode' 'custom' }
}`
}

export const displayLink = Usage.bind({});
displayLink.args = {
  ...Usage.args,
  type: 'display',
  ws: `{
  'data' { 'text' 'SenX.io' 'url' 'https://senx.io' }
  'globalParams' { 'bgColor' '#f57f17' 'fontColor' '#bc5100' }
}`
}

export const displayOnlyText = Usage.bind({});
displayOnlyText.args = {
  ...Usage.args,
  type: 'display',
  ws: `{
  'data' { 'text' 'SenX.io' }
  'globalParams' { 'bgColor' '#f57f17' 'fontColor' '#bc5100' }
}`
}


export const WithAutoRefreshAndColorChange = Usage.bind({});
WithAutoRefreshAndColorChange.args = {
  ...InitialUsage.args,
  title: 'My Usage',
  type: 'display',
  unit: '%',
  ws: `RAND 100 * ROUND 'v' STORE
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
  }`,
  options: { ... new Param(), autoRefresh: 5}
}

