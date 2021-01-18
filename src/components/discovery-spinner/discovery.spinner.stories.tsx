import readme from '../discovery-tile/readme.md';

export default {
  title: 'Components/Spinner',
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
const Template = ({message}) => `<div style="width: 100%; height: 500px;">
    <discovery-spinner>${message}</discovery-spinner>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  message: 'loading ...'
};

