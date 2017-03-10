#!/usr/bin/env node
(function () {
'use strict';

const chalk = require('chalk');
class Logger {
  _chalk(text, color = 'white') {
    return chalk[color](text);
  }

  log(text) {
    console.log(this._chalk(text));
  }

  warn(text) {
    console.warn(this._chalk(text, 'yellow'));
  }

  error(text) {
    console.error(this._chalk(text, 'red'));
  }

  succes(text) {
    console.log(this._chalk(text, 'cyan'));
  }

}
var logger = new Logger();

const {rollup} = require('rollup');
  let cache;

  class Builder {

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

const express = require('express');

const app = express();

const glob = require('glob');

/**
 * glob file path
 * @param {string} string
 */
const src = string => {
  return new Promise((resolve, reject) => {
    glob(string, (error, files) => {
      if (error) {
        reject(error);
      }
      if (files.length > 0) {
        resolve(files);
      }
    });
  });
};

class Server {

/**
 * @param {object} server - configuration
 * @param {string} server.entry path to where your build is located
 * @param {string} server.docs path to where your docs are located
 * @param {string} server.path src path of the component
 * @param {string} server.bowerPath path to bower_components
 * @param {string} server.nodeModulesPath path to node_modules
 * @param {string} server.demo path to the demo
 * @param {string} server.index path to your index.html file we serve a helper/docs index by default
 */
  serve(server) {
    if (server) {
      if (server.elementLocation) {
        logger.warn('Deprecated::server.elementLocation, support ends @0.2.0 [visit](https://github.com/vandeurenglenn/backed-cli#serve) to learn more');
        app.use(`/${server.elementLocation}`, express.static(
          this.appLocation(server.path, 'some-element.js')));
      }
      if (server.use) {
        for (let use of server.use) {
          app.use(use.path, express.static(this.appLocation(use.static || use.path)));
        }
      }
      app.use('/bower_components', express.static(
        this.appLocation(server.bowerPath, 'bower_components')));

      app.use('/node_modules', express.static(
        this.appLocation(server.nodeModulesPath, 'node_modules')));

      // app.use(`/${server.elementLocation}`, express.static(
      //   this.appLocation(server.path, 'some-element.js')));

      app.use('/', express.static(
        this.appLocation(server.entry, 'dist')));

      app.use('/demo', express.static(
        this.appLocation(server.demo, 'demo')));

      app.use('/docs', express.static(
        this.appLocation(server.docs, 'docs')));

      app.use('/package.json', express.static(
        this.appLocation('package.json')
      ));

      app.use('/bower.json', express.static(
        this.appLocation('bower.json')
      ));

      // TODO: Add option to override index
      app.use('/', express.static(__dirname.replace('bin', 'node_modules\\backed-client\\dist')));

        // serve backed
      app.use('/backed/docs', express.static(
        __dirname.replace('bin', 'docs')));

      // TODO: implement copyrighted by package author & package name if no file is found
      src(process.cwd() + '/license.*').then(files => {
        app.use('/license', express.static(files[0]));
      });

      app.listen(3000, error => {
        if (error) {
          return logger.warn(error);
        }
        logger.log(`${global.config.name}::serving app from http://localhost:${server.port}/${server.entry.replace('/', '')}`);
      });
    } else {
      return logger.warn(`${global.config.name}::server config not found [example](https://github.com/vandeurenglenn/backed-cli/config/backed.json)`);
    }
  }

  /**
   * @param {string} path - location of the file
   * @param {string} alternate - returns when path is undefined
   * @param {string} disableAlternate - current working directory is ignored when true, defaults to false
   */
  appLocation(path, alternate, disableAlternate = false) {
    let root = process.cwd();
    if (!path && !disableAlternate) {
      path = alternate;
    } else if (!path && disableAlternate) {
      // when we disable alternate we return the value of alternate
      return alternate;
    }
    root += `\\${path}`;
    return root;
  }
}

const {readFileSync} = require('fs');
const path = require('path');
class Config {
  constructor(iterator) {
    this.importConfig().then(config => {
      const name = this.importPackageName() || this.importBowerName();
      iterator.next(this.updateConfig(config, name));
    });
  }

  /**
   * wrapper around cjs require
   * try's to read file from current working directory
   * @param {string} path path to file/module
   * @return {object|array|function|class} module or file
   */
  require(path) {
    return new Promise((resolve, reject) => {
      let root = process.cwd();
      root += `/${path}`;
      try {
        let required = require(root);
        resolve(required);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @return {object} value of 'backed.json'
   */
  importConfig() {
    return new Promise((resolve, reject) => {
      this.require('backed.json').then(config => {
        resolve(config);
      }).catch(() => {
        logger.warn('backed.json:: not found, using default options.');
        resolve({
          name: path.posix.basename(__dirname.replace('/bin', ''))
        });
      });
    });
  }

  /**
   * @return {string} name from 'package.json'
   */
  importPackageName() {
    try {
      return JSON.parse(readFileSync(`${process.cwd()}/package.json`)).name;
    } catch (e) {
      if (global.debug) {
        logger.warn('no package.json found');
      }
    }
    return null;
  }

  /**
   * @return {string} name from 'bower.json'
   */
  importBowerName() {
    try {
      return JSON.parse(readFileSync(`${process.cwd()}/bower.json`)).name;
    } catch (e) {
      if (global.debug) {
        logger.warn('no bower.json found');
      }
    }
    return null;
  }

  /**
   * @param {object} config - the config to be updated
   * @param {string} name - the name of the element, component, etc
   */
  updateConfig(config, name) {
    config.name = config.name || name;
    config.format = config.format || 'es';
    config.sourceMap = config.sourceMap || true;
    config.server = config.server || {port: 3000, entry: '/', demo: 'demo'};
    // TODO: create method for building atom app with atom-builder
    // TODO: implement element, app & atom-app config
    // config.server.element = config.element || {path: `${config.name}.js`};
    // config.server.app = config.app || {path: `${config.name}.js`};
    global.config = config;
    return config;
  }
}

const {writeFile, mkdir} = require('fs');
const vinylRead = require('vinyl-read');
const path$1 = require('path');
var Utils = class {
  /**
   * @param {object} sources {src: ["some/glob/exp"], dest: "some/dest"}
   */
  copySources(sources) {
    return new Promise((resolve, reject) => {
      if (sources) {
        try {
          let promises = [];
          for (let source of sources) {
            promises.push(this.copy(source.src, source.dest));
          }
          Promise.all(promises).then(() => {
            logger.succes(`${global.config.name}::copy finished`);
            resolve();
          });
        } catch (error) {
          logger.error(error);
          reject(error);
        }
      }
    });
  }

  /**
   * returns a destination using [vinyl](https://github.com/gulpjs/vinyl) info
   */
  destinationFromFile(file) {
    let dest = file.path;
    dest = dest.replace(`${file.base}/`, '');
    dest = dest.split(path$1.sep);
    if (dest.length > 1) {
      dest[0] = file.dest;
    } else {
      dest[1] = dest[0];
      dest[0] = dest;
    }
    file.dest = dest.toString().replace(/,/g, '/');
    return file;
  }

  /**
   * @param {string} src "some/src/path"
   * @param {string} dest "some/dest/path"
   */
  copy(src, dest) {
    return new Promise(resolve => {
      let promises = [];
      vinylRead(src, {
        cwd: process.cwd()
      }).then(files => {
        for (let file of files) {
          file.dest = dest;
          promises.push(this.write(this.destinationFromFile(file)));
        }
        Promise.all(promises).then(() => {
          resolve();
        });
      });
    });
  }

  /**
   * @param {object} file {src: "some/src/path", dest: "some/dest/path"}
   */
  write(file) {
    return new Promise((resolve, reject) => {
      if (file) {
        writeFile(file.dest, file.contents, err => {
          if (err) {
            if (global.debug) {
              logger.warn(
                  `subdirectory(s)::not existing
                  Backed will now try to create ${file.dest}`
                );
            }
            const dest = file.dest.replace(/\/(?:.(?!\/))+$/, '');
            const paths = dest.split('/');
            let prepath = '';
            for (let path of paths) {
              prepath += `${path}/`;
              mkdir(prepath, err => {
                if (err) {
                  if (err.code !== 'EEXIST') {
                    reject(err);
                  }
                }
              });
            }
            this.write(file).then(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
};

process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

const utils = new Utils();

commander
  .version(version)
  .option('-b, --build', 'build your app/component')
  .option('-s, --serve', 'serve your app/component')
  .option('-c, --copy', 'copy files from your app/component src folder to it distribution folder')
  .option('-d, --debug', 'show all warnings')
  .parse(process.argv);

let build = commander.build;
let copy = commander.build || commander.copy;
let serve = commander.serve;
let debug = commander.debug;
let iterator;

function * run() {
  const config = yield new Config(iterator);
  global.debug = debug || config.debug;

  if (build) {
    yield new Builder(config, iterator);
  }
  if (copy) {
    utils.copySources(config.sources);
  }
  if (serve) {
    const server = new Server();
    server.serve(config.server);
  }
}

iterator = run();
iterator.next();

}());
