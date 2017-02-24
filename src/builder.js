'use strict';
const {rollup} = require('rollup');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
let cache;

export default class Builder {
  build(config) {
    rollup({
      entry: `${process.cwd()}/${config.src}`,
    // Use the previous bundle as starting point.
      cache: cache
    }).then(bundle => {
    // Cache our bundle for later use (optional)
      cache = bundle;
      bundle.write({
        format: config.format,
        moduleName: config.moduleName,
        sourceMap: config.sourceMap,
        plugins: [
          json(),
          babel(config.babel || {})
        ],
        dest: `${process.cwd()}/${config.dest}`
      }).catch(err => {
        console.error(err);
      });
      console.log(`${config.name}::build finished`);
    });
  }
}
