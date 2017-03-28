#!/usr/bin/env node
(function () {
'use strict';

function __asyncGen(g){var q=[],T=["next","throw","return"],I={};for(var i=0;i<3;i++){I[T[i]]=a.bind(0,i);}I[Symbol?Symbol.asyncIterator||(Symbol.asyncIterator=Symbol()):"@@asyncIterator"]=function (){return this};function a(t,v){return new Promise(function(s,j){q.push([s,j,v,t]);q.length===1&&c(v,t);})}function c(v,t){try{var r=g[T[t|0]](v),w=r.value&&r.value.__await;w?Promise.resolve(w).then(c,d):n(r,0);}catch(e){n(e,1);}}function d(e){c(e,1);}function n(r,s){q.shift()[s](r);q.length&&c(q[0][2],q[0][3]);}return I}

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

const {readFileSync} = require('fs');
const path = require('path');
const {merge} = require('lodash');
/**
 * @param {string} config.name name off your project
 * @param {string} config.server.entry path to where your build is located
 * @param {string} config.server.entry path to where your build is located
 * @param {string} config.server.docs path to where your docs are located
 * @param {string} config.server.bowerPath path to bower_components
 * @param {string} config.server.nodeModulesPath path to node_modules
 * @param {string} config.server.demo path to the demo
 * @param {string} config.server.index path to your index.html file we serve a helper/docs index by default (not support for now)
 * @param {array} config.server.use static files to include [{path: some/path, static: some//path}] when static is undefined path will be used.
 */
class Config {
  constructor() {
    return new Promise((resolve, reject) => {
      this.importConfig().then(config => {
        this.name = config.name;
        this.cleanup = config.cleanup || true;
        this.babel = config.babel || true;
        if (config.bundles) {
          for (let bundle of config.bundles) {
            bundle.plugins = this.setupPlugins(bundle.plugins);
          }
        }
        resolve(this.updateConfig(config));
      });
    });
  }

  setupPlugins(plugins={}) {
    const defaults = ['babel', 'cleanup'];
    for (let key of defaults) {
      if (this[key] && !plugins[key]) {
        plugins[key] = {};
      }
    }
    return plugins;
  }

  get bundles() {
    return [
      {
        src: `src/${this.name}.js`,
        dest: `dist/${this.name}.js`,
        plugins: this.setupPlugins(),
        format: 'es'
      }
    ]
  }

  get server() {
    return {
      port: 3000,
      entry: '/',
      demo: 'demo',
      docs: 'docs',
      bowerPath: 'bower_components',
      nodeModulesPath: 'node_modules',
      index: null};
  }

  get watch() {
    return {
      src: ['./src'],
      options: {}
    };
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
      function  generator(fn) {return __asyncGen(function*(){
        const pkg = yield{__await: fn('package.json').catch(error => {
          if (global.debug) {
            logger.error(error);
          }
        })};
        const config = yield{__await: fn('backed.json').catch(error => {
          if (global.debug) {
            logger.warn('backed.json::not found, ignore this when using backed in package.json');
          }
        })};
        if (!config && !pkg) {
          logger.warn('No backed.json or backed section in package.json, using default options.');
          return resolve({name: process.cwd()});
        }
        if (config) {
          let name = config.name;
          if (!name && pkg && pkg.name && !pkg.backed) {
            return resolve(merge(config, {name: pkg.name}));
          } else if (!name && !pkg) {
            return resolve(merge(config, {name: process.cwd()}))
          }
        }
        if(pkg && pkg.backed) {
          return resolve(merge(pkg.backed, {name: pkg.name}));
        }
      }())}
      const it = generator(this.require);
      it.next();
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
    return undefined;
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
    return undefined;
  }

  /**
   * @param {object} config - the config to be updated
   * @param {string} name - the name of the element, component, etc
   *
   * @example
   * config.updateConfig({
   *   bundles: [{
   *     src: 'src',
   *     dest: 'dist'
   *   }]
   * });
   *
   * @todo create method for building atom app with atom-builder
   * @todo implement element, app & atom-app config
   * @todo handle sourceMap at bundle level
   */
  updateConfig(config, name) {
    config.sourceMap = config.sourceMap || true;
    config.bundles = merge(this.bundles, config.bundles);
    config.server = merge(this.server, config.server);
    config.watch = merge(this.watch, config.watch);
    global.config = config;
    return config;
  }
}

const {rollup} = require('rollup');
const path$1 = require('path');
const {fork} = require('child_process');
const logger$1 = require('backed-logger');
let iterator;
let cache;
let warnings = [];

const logWorker = fork(path$1.join(__dirname, 'workers/log-worker.js'));

function  bundler(bundles, fn, cb) {return __asyncGen(function*(){
  let fns = [];
  for (let bundle of bundles) {
    let dest = bundle.dest;
    bundle = bundle.bundle || bundle;
    bundle.dest = dest;
    fns.push(fn(bundle));
  }

  yield{__await: Promise.all(fns).then(bundles => {
    // TODO: Decide to implement or not, a method for transforming content
    // TODO: When not transforming, return bundles.code or bundles...
    logWorker.kill('SIGINT');
    if (global.debug) {
      for (let warning of warnings) {
        logger$1.warn(warning);
      }
    }
    cb(bundles);
  }).catch(error => {logger$1.warn(error);})};
}())}
class Builder {

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
    return new Promise((resolve, reject) => {
    logWorker.send('start');
    logWorker.send(logger$1._chalk('building', 'cyan'));
    this.promiseBundles(config).then(bundles => {
      iterator = bundler(bundles, this.bundle, bundles => {
        resolve(bundles);
      });
      iterator.next();
    }).catch(error => {
      logger$1.warn(error);
      reject(error);
    });
    });
  }

  handleFormats(bundle) {
    return new Promise((resolve, reject) => {
      try {
        const format = bundle.format;
        let dest = bundle.dest;
        let formats = [];
        // TODO: Check for two iife configs, throw error!
        if (bundle.shouldRename) {
          switch (format) {
            case 'iife':
              if (!bundle.moduleName) {
                bundle.moduleName = this.toJsProp(bundle.name);
              }
              break;
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

  forBundles(bundles, cb) {
    for (let bundle of bundles) {
      cb(bundle);
    }
  }

  /**
   * Checks if another bundle has the same destintation, when true,
   * checks if the formats are the same
   * @param {array} bundles
   *
   * @example
   * [{
   *    dest: 'dist/index.js',
   *    format: 'es'
   *  }, {
   *    dest: 'dist/index.js',
   *    format: 'es'
   *  }]
   * // would result in true
   */
  compareBundles(bundles, cb) {
    this.forBundles(bundles, bundle => {
      // itterate trough the bundles
      for (let i of bundles) {
        // ensure we are not comaring against the same bundle
        if (bundles.indexOf(i) !== bundles.indexOf(bundle)) {
          // compare destination between the current bundle & other bundles;
          if (i.dest === bundle.dest) {
            // compare the format
            if (i.format !== bundle.format) {
              // rename dest so we don't conflict with other bundles
              bundle.shouldRename = true;
              return cb(bundle);
            }
          }
        }
      }
      cb(bundle);
    });
  }

  promiseBundles(config) {
    return new Promise((resolve, reject) => {
      let formats = [];
      let bundles = config.bundles;
      try {
        this.compareBundles(bundles, bundle => {
          bundle.name = bundle.name || config.name;
          bundle.babel = bundle.babel || config.babel;
          bundle.sourceMap = bundle.sourceMap || config.sourceMap;
          if (config.format && typeof config.format !== 'string' && !bundle.format) {
            for (let format of config.format) {
              bundle.format = format;
              formats.push(this.handleFormats(bundle));
            }
          } else {
            formats.push(this.handleFormats(bundle));
          }
        });
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
    return new Promise((resolve, reject) => {
      let plugins = [];
      let requiredPlugins = {};
      for (let plugin of Object.keys(config.plugins)) {
        let required;
        try {
          required = require(`rollup-plugin-${plugin}`);
        } catch (error) {
          try {
            required = require(path$1.join(process.cwd(), `/node_modules/rollup-plugin-${plugin}`));
          } catch (error) {
            reject(error);
          }
        }
        const conf = config.plugins[plugin];
        requiredPlugins[plugin] = required;

        plugins.push(requiredPlugins[plugin](conf));
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
        setTimeout(() => {
          logWorker.send(logger$1._chalk(`${config.name}::build finished`, 'cyan'));
          logWorker.send('done');
          logWorker.on('message', () => {
            resolve(bundle);
          });
        }, 100);
      }).catch(err => {
        const code = err.code;
        logWorker.send('pauze');
        logger$1.error(err);
        if (code === 'PLUGIN_ERROR' || code === 'UNRESOLVED_ENTRY') {
          logWorker.kill('SIGINT');
        } else {
          logger$1.warn('trying to resume the build ...');
          logWorker.send('resume');
        }
        reject(err);
      });
    });
  }
}
var builder = new Builder();

const express = require('express');
const http = require('http');
const reload = require('reload');
const glob = require('glob');

const app = express();
const server = http.createServer(app);
const reloadServer = reload(server, app);
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
 * @param {object} config - configuration
 * @param {string} config.entry path to where your build is located
 * @param {string} config.docs path to where your docs are located
 * @param {string} config.bowerPath path to bower_components
 * @param {string} config.nodeModulesPath path to node_modules
 * @param {string} config.demo path to the demo
 * @param {string} config.index path to your index.html file we serve a helper/docs index by default (not support for now)
 * @param {array} config.use static files to include [{path: some/path, static: some//path}] when static is undefined path will be used.
 */
  serve(config = {
    entry: '/',
    demo: 'demo',
    docs: 'docs',
    use: [{path: null, static: null}],
    bowerPath: 'bower_components',
    nodeModulesPath: 'node_modules',
    index: null}) {
    if (config) {
      this.handleOldOptions(config);
      if (config.use) {
        for (let use of config.use) {
          app.use(use.path, express.static(this.appLocation(use.static || use.path)));
        }
      }

      app.use('/', express.static(
        this.appLocation(config.entry)));

      app.use('/bower_components', express.static(
        this.appLocation(config.bowerPath, 'bower_components')));

      app.use('/node_modules', express.static(
        this.appLocation(config.nodeModulesPath, 'node_modules')));

      app.use('/demo/node_modules', express.static(
        this.appLocation(config.nodeModulesPath, 'node_modules')));

      app.use('/demo', express.static(
        this.appLocation(config.demo, 'demo')));

      app.use('/docs', express.static(
        this.appLocation(config.docs, 'docs')));

      app.use('/package.json', express.static(
        this.appLocation('package.json')
      ));

      // serve backed-cli documentation
      app.use('/backed-cli/docs', express.static(
        __dirname.replace('bin', 'docs')));

      // serve backed documentation
      app.use('/backed/docs', express.static(
        this.appLocation('node_modules/backed/docs')));

      // TODO: Add option to override index
      app.use('/', express.static(__dirname.replace('bin', 'node_modules\\backed-client\\dist')));

      // TODO: implement copyrighted by package author & package name if no file is found
      src(process.cwd() + '/license.*').then(files => {
        app.use('/license', express.static(files[0]));
      });

      server.listen(3000, error => {
        if (error) {
          return logger.warn(error);
        }
        logger.log(`${global.config.name}::serving app from http://localhost:${config.port}/${config.entry.replace('/', '')}`);
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
    } else if (options.bowerPath) {
      logger.warn('server.bowerPath::deprecated: removal planned @1.0.0+');
    }
  }

  reload() {
    reloadServer.reload();
  }
}
var server$1 = new Server();

const {fork: fork$1} = require('child_process');
const chokidar = require('chokidar');
const path$2 = require('path');
const EventEmitter = require('events');
const {readFileSync: readFileSync$1, writeFileSync} = require('fs');
// const {merge} = require('lodash');
const time = () => {
  return new Date().toLocaleTimeString();
};

/**
 * @extends EventEmitter
 */
class Watcher extends EventEmitter {

  /**
   * @param {object} config {@link Config}
   */
  watch(config) {
    return new Promise((resolve, reject) => {
      if (!config.watch) {
        logger.warn('nothing to watch');
        reject('nothing to watch');
        return process.kill(process.pid, 'SIGINT');
      }
      logger.log(`[${time()}] ${logger._chalk('Configuring demo', 'cyan')}`);

      if (config.server) {
        let demoPath = path$2.join(process.cwd(), config.server.demo);

        if (!demoPath.includes('index.html')) {
          demoPath = path$2.join(demoPath, 'index.html');
        }
        let demo = readFileSync$1(demoPath, 'utf-8');
        if (!demo.includes('/reload/reload.js')) {
          demo = demo.replace('</body>', '\t<script src="/reload/reload.js"></script>\n</body>');
          writeFileSync(demoPath, demo);
        }
      }

      logger.log(`[${time()}] ${logger._chalk('Starting initial build', 'cyan')}`);
      this.runWorker(config);

      logger.log(`[${time()}] ${logger._chalk('Watching files for changes', 'cyan')}`);
      const watcher = chokidar.watch(config.watch.src, config.watch.options);
      watcher.on('change', () => {
        this.runWorker(config);
      });

      resolve();
    });
  }

  runWorker(config) {
    let worker;
    worker = fork$1(path$2.join(__dirname, 'workers/watcher-worker.js'));
    worker.on('message', message => {
      logger.log(`[${time()}] ${logger._chalk('Reloading browser', 'cyan')}`);
      this.emit(message);
    });
    worker.send(config);
  }

  // on(event, fn) {
  //   this.on(event, fn);
  // }

    // this.watcher = chokidar.watch(config.watchers, config.options);
    // this.watcher.on('change', path => logger.log(`File ${path} has been changed`));
}
var watcher = new Watcher();

const {writeFile, mkdir} = require('fs');
const vinylRead = require('vinyl-read');
const path$3 = require('path');
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
    let dest = path$3.win32.parse(file.path).dir;
    dest = dest.replace(`${process.cwd()}\\`, '');
    dest = dest.split(path$3.sep);
    if (dest.length > 1) {
      dest[0] = file.dest;
    } else {
      dest[0] = file.dest;
    }
    dest.push(path$3.win32.basename(file.path));
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
          file.dest = path$3.win32.normalize(dest);
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
            if (global.debug) {
              logger.warn(
                  `subdirectory(s)::not existing
                  Backed will now try to create ${file.dest}`
                );
            }
            const dest = path$3.win32.dirname(file.dest);
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
  .option('-w, --watch', 'watch for file changes & rebuild on change')
  .option('-b, --build', 'build your app/component')
  .option('-s, --serve', 'serve your app/component')
  .option('-c, --copy', 'copy files from your app/component src folder to it distribution folder')
  .option('-d, --debug', 'show all warnings')
  .parse(process.argv);

let watch = commander.watch;
let build = commander.build;
let copy = commander.build || commander.copy;
let serve = commander.serve;
global.debug = commander.debug;
/**
 * @param {object} config {@link Config}
 */
function  run(config) {return __asyncGen(function*(){
  if (build) {
    yield{__await: builder.build(config)};
  }

  if (copy) {
    yield{__await: utils.copySources(config.sources)};
  }

  if (watch) {
    watcher.on('reload', () => {
      server$1.reload();
    });
    yield{__await: watcher.watch(config)};
  }

  if (serve) {
    yield{__await: server$1.serve(config.server)};
  }
}())}

new Config().then(config => {
  global.debug = commander.debug || config.debug;
  let it = run(config);
  it.next();
});

}());
