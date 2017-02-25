'use strict';
const {rollup} = require('rollup');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
let cache;

export default class Builder {
  build(config) {
    if (config.format && typeof config.format === 'object') {
      const formats = config.format;
      for (let format of formats) {
        this.bundle(config, format);
      }
    } else {
      this.bundle(config, config.format);
    }
  }

  bundle(config, format) {
    let dest = config.dest;
    if (format !== 'iffe') {
      switch (format) {
        case 'cjs':
          dest = dest.replace('.js', '-node.js');
          break;
        case 'es':
        case 'amd':
          dest = dest.replace('.js', `-${format}.js`);
          break;
      }
    }
    rollup({
      entry: `${process.cwd()}/${config.src}`,
    // Use the previous bundle as starting point.
      cache: cache
    }).then(bundle => {
    // Cache our bundle for later use (optional)
      cache = bundle;
      bundle.write({
        format: format,
        moduleName: config.moduleName,
        sourceMap: config.sourceMap,
        plugins: [
          json(),
          babel(config.babel || {})
        ],
        dest: `${process.cwd()}/${dest}`
      }).catch(err => {
        console.error(err);
      });
      console.log(`${config.name}::build finished`);
    });
  }
}
