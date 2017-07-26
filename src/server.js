'use strict';
const express = require('express');
const http = require('http');
const reload = require('reload');
const glob = require('glob');

const app = express();
const server = http.createServer(app);
const reloadServer = reload(server, app);
const logger = require('backed-logger');

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
    return new Promise((resolve, reject) => {
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
          logger.log(`${global.config.name}::serving from http://localhost:${config.port}/${config.entry.replace('/', '')}`);
        });
      } else {
        reject(logger.warn(`${global.config.name}::server config not found [example](https://raw.githubusercontent.com/VandeurenGlenn/backed-cli/master/config/backed.json)`));
      }
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
export default new Server();
