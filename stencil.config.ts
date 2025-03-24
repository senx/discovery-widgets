import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  plugins: [sass({
    silenceDeprecations: ['import']
  })],
  enableCache: true,
  buildEs5: 'prod',
  rollupPlugins: { after: [nodePolyfills()] },
  namespace: 'discovery',
  globalStyle: './src/styles.css',
  globalScript: './src/discovery.ts',
  outputTargets: [
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        { src: 'scss' },
      ],
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
