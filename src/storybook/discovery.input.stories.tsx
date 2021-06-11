import tile, {Usage} from './discovery.tile.stories';

export default {
  ...tile,
  title: 'UI/Input'
};

export const TextInputInitialUsage = Usage.bind({});
TextInputInitialUsage.args = {
  ...Usage.args,
  type: 'input:text',
  ws: `{ 'data' 42  'events' [
    { 'type' 'variable' 'tags' 'myVar' }
  ] }`
};


export const TextInputWithAValue = Usage.bind({});
TextInputWithAValue.args = {
  ...TextInputInitialUsage.args,
  ws: `42`
};
/*
export const CustomStyle = ({url, ws, language, type, options}) => `
<style>
:root {
  --warp-view-button-border-color: #c8e020;
  --warp-view-button-bg-color: #3b528b;
  --warp-view-button-label-color: #c8e020;
  --warp-view-button-width: 500px;
  --warp-view-button-border-radius: 20px;
  }
</style>
<div class="card" style="width: 100%;min-height: 500px">
    <div class="card-body">
        <discovery-tile url="${url}" type="${type}" language="${language}"
        debug="true" options='${JSON.stringify(options)}'
        >${ws}</discovery-tile>
    </div>
</div>`;
CustomStyle.args = {
  ...InitialUsage.args
}*/
