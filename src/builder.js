'use strict';
const {rollup} = require('rollup');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
let cache;

const backedBuilder = config => {
  console.log(`${config.name}::build starting`);
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
    console.log(`${config.name}::build finished`);
  });
};
export default backedBuilder;
