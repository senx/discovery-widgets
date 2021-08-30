import readme from '../components/discovery-tile/readme.md';

export default {
  title: 'UI/Spinner',
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
  message: 'Data loading ...'
};

const Template2 = ({message}) => `<div class="card" style="width: 100%;">
  <div class="card-body">
    <discovery-spinner message="${message}"></discovery-spinner>
  </div>
</div>`;
export const MassageAsAttribute = Template2.bind({});
MassageAsAttribute.args = {
  message: 'Data loading ...'
};
