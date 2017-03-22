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
  const path = require('path');
  const {fork} = require('child_process');
  let iterator$1;
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
    setTimeout(() => {
      logWorker.kill('SIGINT');
      _it.next();
    }, 50);
    if (global.debug) {
      for (let warning of warnings) {
        logger.warn(warning);
      }
    }
  }
  class Builder {

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
        iterator$1 = bundler(bundles, this.bundle);
        iterator$1.next();
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
        iterator$1.next();
      }).catch(err => {
        const code = err.code;
        logWorker.send('pauze');
        logger.error(err);
        if (code === 'PLUGIN_ERROR' || code === 'UNRESOLVED_ENTRY') {
          logWorker.kill('SIGINT');
        } else {
          logger.warn('trying to resume the build ...');
          logWorker.send('resume');
        }
      });
    }
}

const express = require('express');

const app = express();

const glob = require('glob');

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
 * @param {string} server.bowerPath path to bower_components
 * @param {string} server.nodeModulesPath path to node_modules
 * @param {string} server.demo path to the demo
 * @param {string} server.index path to your index.html file we serve a helper/docs index by default (not support for now)
 * @param {array} server.use static files to include [{path: some/path, static: some//path}] when static is undefined path will be used.
 */
  serve(server = {
    entry: '/',
    demo: 'demo',
    docs: 'docs',
    use: [{path: null, static: null}],
    bowerPath: 'bower_components',
    nodeModulesPath: 'node_modules',
    index: null}) {
    if (server) {
      this.handleOldOptions(server);
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
        this.appLocation(server.entry)));

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
      return logger.warn(`${global.config.name}::server config not found [example](https://raw.githubusercontent.com/VandeurenGlenn/backed-cli/master/config/backed.json)`);
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

  handleOldOptions(options) {
    if (options.path || options.elementLocation) {
      logger.warn(`${options.path ? 'server.path' : 'server.elementLocation'} is no longer supported, [visit](https://github.com/vandeurenglenn/backed-cli#serve) to learn more'`);
    }
  }
}

const {readFileSync} = require('fs');
const path$1 = require('path');
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
          name: path$1.posix.basename(__dirname.replace('/bin', ''))
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
const path$2 = require('path');
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
    let dest = path$2.win32.parse(file.path).dir;
    dest = dest.replace(`${process.cwd()}\\`, '');
    dest = dest.split(path$2.sep);
    if (dest.length > 1) {
      dest[0] = file.dest;
    } else {
      dest[0] = file.dest;
    }
    dest.push(path$2.win32.basename(file.path));
    file.dest = dest.toString().replace(/,/g, '\\');

    // return console.log(file.dest);
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
          file.dest = path$2.win32.normalize(dest);
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
    // console.log(file);
    return new Promise((resolve, reject) => {
      if (file) {
        writeFile(file.dest, file.contents, err => {
          if (err) {
            console.log(err);
            if (global.debug) {
              logger.warn(
                  `subdirectory(s)::not existing
                  Backed will now try to create ${file.dest}`
                );
            }
            const dest = path$2.win32.dirname(file.dest);
            const paths = dest.split('\\');
            let prepath = '';
            for (let path of paths) {
              prepath += `${path}\\`;
              mkdir(process.cwd() + '\\' + prepath, err => {
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
