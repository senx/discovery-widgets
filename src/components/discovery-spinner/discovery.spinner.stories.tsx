import readme from '../discovery-tile/readme.md';

export default {
  title: 'Utils/Spinner',
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
const Template = ({message}) => `<div class="card" style="width: 100%;">
  <div class="card-body">
    <discovery-spinner>${message}</discovery-spinner>
  </div>
</div>`;
export const InitialUsage = Template.bind({});
InitialUsage.args = {
  message: 'loading ...'
};

