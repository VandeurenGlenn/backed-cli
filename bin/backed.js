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
  const json = require('rollup-plugin-json');
  const _babel = require('rollup-plugin-babel');
  let cache;

  class Builder {
    build(config) {
      if (config.src) {
        logger.warn(`Deprecated::src, support ends @0.2.0 [visit](https://github.com/vandeurenglenn/backed-cli#README) to learn more or take a look at the [example](https://github.com/vandeurenglenn/backed-cli/config/backed.json)`);
        this.handleFormats(config).then(through => {
          this.bundle(through);
        });
      } else {
        this.promiseBundles(config).then(bundles => {
          for (let bundle of bundles) {
            this.bundle(bundle);
          }
        }).catch(err => {
          logger.error(err);
        });
      }
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
   * @param {object} config.babel babel configuration [see](http://babeljs.io/docs/usage/babelrc/)
   */
    bundle(config = {src: null, dest: 'bundle.js', format: 'iife', name: null, babel: {}, moduleName: null, sourceMap: true}) {
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
          plugins: [
            json(),
            _babel(config.babel)
          ],
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
      for (let use of server.use) {
        app.use(use.path, express.static(this.appLocation(use.static || use.path)));
      }
      app.use('/bower_components', express.static(
        this.appLocation(server.bowerPath, 'bower_components')));

      app.use('/node_modules', express.static(
        this.appLocation(server.nodeModulesPath, 'node_modules')));

      // app.use(`/${server.elementLocation}`, express.static(
      //   this.appLocation(server.path, 'some-element.js')));

      app.use('/dist', express.static(
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
        logger.log(`${global.config.name}::serving app from ${server.entry}`);
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

class Config {
  constructor() {
    let config = this.importConfig();
    const name = this.importPackageName() || this.importBowerName();
    return this.updateConfig(config, name);
  }

  /**
   * wrapper around cjs require
   * try's to read file from current working directory
   * @param {string} path path to file/module
   * @return {object|array|function|class} module or file
   */
  require(path) {
    let root = process.cwd();
    root += `/${path}`;
    try {
      return require(root);
    } catch (error) {
      return console.warn(error);
    }
  }

  /**
   * @return {object} value of 'backed.json'
   */
  importConfig() {
    return this.require('backed.json');
  }

  /**
   * @return {string} name from 'package.json'
   */
  importPackageName() {
    return JSON.parse(readFileSync(`${process.cwd()}/package.json`)).name;
  }

  /**
   * @return {string} name from 'package.json'
   */
  importBowerName() {
    return JSON.parse(readFileSync(`${process.cwd()}/bower.json`)).name;
  }

  /**
   * @param {object} config - the config to be updated
   * @param {string} name - the name of the element, component, etc
   */
  updateConfig(config, name) {
    config.name = config.name || name;
    config.format = config.format || 'es';
    config.sourceMap = config.sourceMap || true;
    config.server = config.server || {};
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
const path = require('path');
var Utils = class {
  /**
   * @param {object} sources {src: ["some/glob/exp"], dest: "some/dest"}
   */
  copySources(sources) {
    if (sources) {
      let promises = [];
      for (let source of sources) {
        promises.push(this.copy(source.src, source.dest));
      }
      return Promise.all(promises).then(() => {
        logger.succes(`${global.config.name}::copy finished`);
      });
    }
    return;
  }

  /**
   * returns a destination using [vinyl](https://github.com/gulpjs/vinyl) info
   */
  destinationFromFile(file) {
    let dest = file.path;
    dest = dest.replace(`${file.cwd}\\`, '');
    dest = dest.split(path.sep);
    if (dest.length > 1) {
      dest[0] = file.dest;
    } else {
      dest[1] = dest[0];
      dest[0] = dest;
    }
    let index = dest.length - 1;
    if (path.extname(dest[index]) !== '' || dest[index].match(/\B\W(.*)/g)) {
      file.dest = dest.toString().replace(/,/g, '/');
      return file;
    }
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

const config = new Config();
const utils = new Utils();

const hasConfig = () => {
  if (global.config === undefined) {
    return false;
  }
  return true;
};

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

if (hasConfig()) {
  global.debug = debug || config.debug;
  if (build) {
    const builder = new Builder(config);
    builder.build(config);
  }
  if (copy) {
    utils.copySources(config.sources);
  }
  if (serve) {
    const server = new Server();
    server.serve(config.server);
  }
}

}());
