  'use strict';
  const {rollup} = require('rollup');
  import logger from './logger.js';
  let cache;

  export default class Builder {

    constructor(config, iterator) {
      this.build(config).then(() => {
        iterator.next();
      });
    }

    build(config) {
      return new Promise((resolve, reject) => {
        if (config.src) {
          logger.warn(`Deprecated::src, support ends @0.2.0 [visit](https://github.com/vandeurenglenn/backed-cli#README) to learn more or take a look at the [example](https://github.com/vandeurenglenn/backed-cli/config/backed.json)`);
          this.handleFormats(config).then(through => {
            this.bundle(through).then(() => {
              resolve();
            });
          });
        } else {
          this.promiseBundles(config).then(bundles => {
            let promises = [];
            for (let bundle of bundles) {
              promises.push(this.bundle(bundle));
            }
            Promise.all(promises).then(() => {
              resolve();
            });
          }).catch(error => {
            reject(error);
          });
        }
      });
    }

    handleFormats(config) {
      return new Promise((resolve, reject) => {
        try {
          if (config.format && typeof config.format !== 'string') {
            for (let format of config.format) {
              let dest = config.dest;
              if (format !== 'iife') {
                switch (format) {
                  case 'cjs':
                    dest = dest.replace('.js', '-node.js');
                    break;
                  case 'es':
                  case 'amd':
                    dest = dest.replace('.js', `-${format}.js`);
                    break;
                  default:
                    break;
                  // do nothing
                }
              }
              config.dest = dest;
              config.format = format;
              resolve(config);
            }
          } else {
            resolve(config);
          }
        } catch (err) {
          reject(err);
        }
      });
    }

    promiseBundles(config) {
      return new Promise((resolve, reject) => {
        let bundles = [];
        try {
          for (let bundle of config.bundles) {
            bundle.name = bundle.babel || config.name;
            bundle.babel = bundle.babel || config.babel;
            bundle.format = bundle.format || config.format || 'es';
            bundles.push(this.handleFormats(bundle));
          }

          Promise.all(bundles).then(bundles => {
            resolve(bundles);
          });
        } catch (err) {
          reject(err);
        }
      });
    }

  /**
   * @param {object} config
   * @param {string} config.src path/to/js
   * @param {string} config.dest destination to write to
   * @param {string} config.format format to build ['es', 'iife', 'amd', 'cjs']
   * @param {string} config.name the name of your element/app
   * @param {string} config.moduleName the moduleName for your element/app (not needed for es & cjs)
   * @param {boolean} config.sourceMap Wether or not to build sourceMaps defaults to 'true'
   * @param {object} config.plugins rollup plugins to use [see](https://github.com/rollup/rollup/wiki/Plugins)
   */
    bundle(config = {src: null, dest: 'bundle.js', format: 'iife', name: null, plugins: [], moduleName: null, sourceMap: true}) {
      rollup({
        entry: `${process.cwd()}/${config.src}`,
        // Use the previous bundle as starting point.
        onwarn: warning => {
          logger.warn(warning);
        },
        cache: cache
      }).then(bundle => {
      // Cache our bundle for later use (optional)
        cache = bundle;
        bundle.write({
          format: config.format,
          moduleName: config.moduleName,
          sourceMap: config.sourceMap,
          plugins: config.plugins,
          dest: `${process.cwd()}/${config.dest}`
        });
        logger.succes(`${global.config.name}::build finished`);
      }).catch(err => {
        logger.error(err);
      });
    }
}
