import tile, {Usage} from './discovery.tile.stories';

export default {
  ...tile,
  title: 'Charts/Scatter'
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'scatter',
  ws: `@training/dataset0
[ $TOKEN '~warp.*committed' { 'cell' 'prod' } $NOW -10 ] FETCH
false RESETS
[ SWAP mapper.delta 1 0 0 ] MAP`
};
