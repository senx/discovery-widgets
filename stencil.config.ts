import {Config} from '@stencil/core';
import {sass} from '@stencil/sass';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  plugins: [
    sass({
      injectGlobalPaths: [
        '~leaflet/dist/leaflet.css'
      ]
    })
  ],
  enableCache: true,
  buildEs5: true,
  rollupPlugins: {
    after: [
      nodePolyfills(),
    ]
  },
  namespace: 'discovery',
  globalStyle: './src/styles.css',
  outputTargets: [
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
