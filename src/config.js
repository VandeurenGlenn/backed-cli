'use strict';
const {readFileSync} = require('fs');

export default class Config {
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
    config.server.elementLocation =
      config.server.elementLocation || `${config.name}.js`;
    global.config = config;
    return config;
  }
}
