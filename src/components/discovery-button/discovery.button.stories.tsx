import tile, {Usage} from '../discovery-tile/discovery.tile.stories';

export default {
  ...tile,
  title: 'Components/Button'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'button',
  ws: `{ 'data' <% 2 2 + %> 'globalParams' { 'button' { 'label' 'Execute' } } }`
};

export const CustomStyle = ({url, ws, language, type, options}) => `
<style>
* {
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
}
