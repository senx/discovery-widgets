import readme from '../discovery-tile/readme.md';
import {Usage} from "../discovery-tile/discovery.tile.stories";

export default {
  title: 'UI/SVG Display',
  notes: readme,
  argTypes: {
    message: {control: 'text'}
  },
  parameters: {
    docs: {
      description: {
        component: readme
      }
    },
  }
};

export const InitialUsage = Usage.bind({});
InitialUsage.args = {
  ...Usage.args,
  type: 'svg',
  ws: `@xav/svg`
}
export const PiotrEdition = Usage.bind({});
PiotrEdition.args = {
  ...InitialUsage.args,
  ws: `@xav/piotr`
}

