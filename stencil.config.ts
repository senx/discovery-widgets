import {Config} from '@stencil/core';
import {sass} from '@stencil/sass';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  plugins: [
    sass()
  ],
  enableCache: true,
  buildEs5: 'prod',
  rollupPlugins: {
    after: [
      nodePolyfills(),
    ]
  },
  namespace: 'discovery',
  globalStyle: './src/styles.css',
  outputTargets: [
    {
      type: 'dist-custom-elements-bundle',
    },
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
};
