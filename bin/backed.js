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
        logger.warn(`Deprecated::[visit](https://github.com/vandeurenglenn/backed-cli#README) to learn more or take a look at the [example](https://github.com/vandeurenglenn/backed-cli/config/backed.json)`);
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
        logger.succes(`${config.name}::build finished`);
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
 * @param {string} name - name of the element
 * @param {string} server.entry path to where your build is located
 * @param {string} server.path src path of the component
 * @param {string} server.bowerPath path to bower_components
 * @param {string} server.nodeModulesPath path to node_modules
 * @param {string} server.elementLocation path to your element (in the browser)
 * @param {string} server.demo path to the demo
 * @param {string} server.index path to your index.html file we serve a helper/docs index by default
 */
  serve(server, name) {
    app.use('/bower_components', express.static(
      this.appLocation(server.bowerPath, 'bower_components')));

    app.use('/node_modules', express.static(
      this.appLocation(server.nodeModulesPath, 'node_modules')));

    app.use(`/${server.elementLocation}`, express.static(
      this.appLocation(server.path, 'some-element.js')));

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
        return console.warn(error);
      }
      console.log(`${name}::serving app from ${server.entry}`);
    });
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
    return this.updateConfig(config);
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
  importNpmName() {
    try {
      return JSON.parse(readFileSync(`${process.cwd()}/package.json`)).name;
    } catch (err) {
      console.warn('no package.json file found');
      return null;
    }
  }

  /**
   * @return {string} name from 'bower.json'
   */
  importBowerName() {
    try {
      return JSON.parse(readFileSync(`${process.cwd()}/bower.json`)).name;
    } catch (err) {
      console.warn('no bower.json file found');
      return null;
    }
  }

  /**
   * @param {object} config - the config to be updated
   * @param {string} name - the name of the element, component, etc (will read from package.json or bower.json when not defined)
   */
  updateConfig(config) {
    config.name = config.name || this.importNpmName() || this.importBowerName();
    config.format = config.format || 'es';
    config.sourceMap = config.sourceMap || true;
    config.server = config.server || {};
    config.server.elementLocation =
      config.server.elementLocation || `${config.name}.js`;
    global.config = config;
    return config;
  }
}

const {readFile, writeFile, mkdir} = require('fs');
const glob$1 = require('glob');

var Utils = class {
  /**
   * @param {object} sources {src: ["some/glob/exp"], dest: "some/dest"}
   */
  copySources(sources) {
    return new Promise((resolve, reject) => {
      if (sources) {
        for (let src of sources.src) {
          glob$1(String(src), (err, files) => {
            if (err) {
              reject(err);
            }
            let promises = [];
            for (let file of files) {
              const base = file.replace(/\/(?:.(?!\/))+$/, '');
              const dest = sources.dest += file.replace(base, '');
              promises.push(this.copy(file, dest));
            }
            Promise.all(promises).then(() => {
              resolve();
            });
          });
        }
      } else {
        resolve();
      }
    });
  }

  /**
   * @param {string} src "some/src/path"
   * @param {string} dest "some/dest/path"
   */
  copy(src, dest) {
    return new Promise(resolve => {
      // TODO: decide to clean dest dir or not
      this.read({src: src, dest: dest}).then(source => {
        this.write(source).then(() => {
          resolve();
        });
      });
    });
  }

  /**
   * @param {object} source {src: "some/src/path", dest: "some/dest/path"}
   */
  read(source) {
    return new Promise((resolve, reject) => {
      readFile(source.src, (err, data) => {
        if (err) {
          reject(err);
        }
        source.data = data;
        resolve(source);
      });
    });
  }

  /**
   * @param {object} source {src: "some/src/path", dest: "some/dest/path"}
   */
  write(source) {
    return new Promise((resolve, reject) => {
      writeFile(source.dest, source.data, err => {
        if (err) {
          const dest = source.dest.replace(/\/(?:.(?!\/))+$/, '');
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
          this.write(source).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
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
  .parse(process.argv);

let build = commander.build;
let copy = commander.build || commander.copy;
let serve = commander.serve;

if (hasConfig()) {
  if (build) {
    const builder = new Builder(config);
    builder.build(config);
  }
  if (copy) {
    utils.copySources(config.sources).then(() => {
      logger.success(`${config.name}::copy finished`);
    });
  }
  if (serve) {
    const server = new Server();
    server.serve(config.server, config.name);
  }
}

}());
