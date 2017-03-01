'use strict';
const express = require('express');

const app = express();

const glob = require('glob');

import logger from './logger.js';

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

export default class Server {

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
