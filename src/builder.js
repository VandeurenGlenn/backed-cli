'use strict';
const {rollup} = require('rollup');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
let cache;

const importConfig = () => {
  let config;
  try {
    config = require('backed.json');
    return config;
  } catch (error) {
    return console.warn('Backed::backed.json not found, checkout https://github.com/basicelements/backed-cli for more info');
  }
};

const backedBuilder = () => {
  const config = importConfig();

  return rollup({
    entry: config.src,
    // Use the previous bundle as starting point.
    cache: cache
  }).then(bundle => {
    // Cache our bundle for later use (optional)
    cache = bundle;

    bundle.write({
      format: config.format || 'es',
      sourceMap: config.sourceMap || true,
      plugins: [
        json(),
        babel()
      ],
      dest: config.dest
    });
  });
};
export default backedBuilder;
