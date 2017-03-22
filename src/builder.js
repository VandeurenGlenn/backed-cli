  'use strict';
  const {rollup} = require('rollup');
  const path = require('path');
  const {fork} = require('child_process');
  import logger from './logger.js';
  let iterator;
  let cache;
  let warnings = [];
  let _it;

  const logWorker = fork(path.join(__dirname, 'workers/log-worker.js'));

  function * bundler(bundles, fn) {
    for (let bundle of bundles) {
      let dest = bundle.dest;
      let format = bundle.format;
      bundle = bundle.bundle || bundle;
      bundle.dest = dest;
      bundle.format = format;
      yield fn(bundle);
    }
    logWorker.kill('SIGINT');
    if (global.debug) {
      for (let warning of warnings) {
        logger.warn(warning);
      }
    }
  }
  export default class Builder {

    constructor(config, it) {
      logWorker.send(logger._chalk('building', 'cyan'));
      logWorker.send('start');
      this.build(config);
      _it = it;
    }

    /**
     * convert hyphen to a javascript property srting
     */
    toJsProp(string) {
      let parts = string.split('-');
      if (parts.length > 1) {
        string = parts[0];
        for (let part of parts) {
          if (parts[0] !== part) {
            var upper = part.charAt(0).toUpperCase();
            string += upper + part.slice(1).toLowerCase();
          }
        }
      }
      return string;
    }

    build(config) {
      this.promiseBundles(config).then(bundles => {
        iterator = bundler(bundles, this.bundle);
        iterator.next();
      }).catch(error => {
        logger.warn(error);
      });
    }

    handleFormats(bundle, format) {
      return new Promise((resolve, reject) => {
        try {
          let dest = bundle.dest;
          if (format === 'iife' && !bundle.moduleName) {
            bundle.moduleName = this.toJsProp(bundle.name);
          } else {
            switch (format) {
              case 'cjs':
                dest = bundle.dest.replace('.js', '-node.js');
                break;
              case 'es':
              case 'amd':
                dest = bundle.dest.replace('.js', `-${format}.js`);
                break;
              default:
                break;
                    // do nothing
            }
          }
          resolve({bundle: bundle, dest: dest, format: format});
        } catch (err) {
          reject(err);
        }
      });
    }

    handleFormat(bundle, format = undefined) {
      return new Promise(resolve => {
        if (format) {
          bundle.format = format;
        }
        if (bundle.format === 'iife' && !bundle.moduleName) {
          bundle.moduleName = this.toJsProp(bundle.name);
        }
        resolve(bundle);
      });
    }

    promiseBundles(config) {
      return new Promise((resolve, reject) => {
        let formats = [];
        let bundles = config.bundles;
        try {
          for (let bundle of bundles) {
            bundle.name = bundle.name || config.name;
            bundle.babel = bundle.babel || config.babel;
            bundle.sourceMap = bundle.sourceMap || config.sourceMap;
            if (config.format && typeof config.format !== 'string' && !bundle.format) {
              for (let format of config.format) {
                formats.push(this.handleFormats(bundle, format));
              }
            } else if (bundle.format) {
              formats.push(this.handleFormat(bundle));
            } else if (!bundle.format) {
              formats.push(this.handleFormat(bundle, config.format));
            }
          }
          Promise.all(formats).then(bundles => {
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
      let plugins = config.plugins || [];
      if (config.babel) {
        const babel = require('rollup-plugin-babel');
        plugins.push(babel(config.babel));
      }
      rollup({
        entry: `${process.cwd()}/${config.src}`,
        plugins: plugins,
        cache: cache,
        // Use the previous bundle as starting point.
        onwarn: warning => {
          warnings.push(warning);
        }
      }).then(bundle => {
        cache = bundle;
        bundle.write({
          // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
          format: config.format,
          moduleName: config.moduleName,
          sourceMap: config.sourceMap,
          dest: `${process.cwd()}/${config.dest}`
        });
        logWorker.send(logger._chalk(`${global.config.name}::build finished`, 'cyan'));
        iterator.next();
      });
    }
}
