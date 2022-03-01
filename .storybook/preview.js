export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  enableShortcuts: false,
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}
