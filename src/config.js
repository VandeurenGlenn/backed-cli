'use strict';
const {readFileSync} = require('fs');
const path = require('path');
const {merge} = require('lodash');
import logger from './logger.js';

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
export default class Config {
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
      async function * generator(fn) {
        const pkg = await fn('package.json').catch(error => {
          if (global.debug) {
            logger.error(error)
          }
        });
        const config = await fn('backed.json').catch(error => {
          if (global.debug) {
            logger.warn('backed.json::not found, ignore this when using backed in package.json')
          }
        });
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
      }
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
