'use strict';
const {readFileSync} = require('fs');
const path = require('path');
import logger from './logger.js';

export default class Config {
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
