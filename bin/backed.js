#!/usr/bin/env node
(function () {
'use strict';

const {rollup} = require('rollup');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
let cache;

class Builder {
  build(config) {
    if (config.format && typeof config.format === 'object') {
      const formats = config.format;
      for (let format of formats) {
        this.bundle(config, format);
      }
    } else {
      this.bundle(config, config.format);
    }
  }

  bundle(config, format) {
    let dest = config.dest;
    if (format !== 'iffe') {
      switch (format) {
        case 'cjs':
          dest = dest.replace('.js', '-node.js');
          break;
        case 'es':
        case 'amd':
          dest = dest.replace('.js', `-${format}.js`);
          break;
      }
    }
    rollup({
      entry: `${process.cwd()}/${config.src}`,
    // Use the previous bundle as starting point.
      cache: cache
    }).then(bundle => {
    // Cache our bundle for later use (optional)
      cache = bundle;
      bundle.write({
        format: format,
        moduleName: config.moduleName,
        sourceMap: config.sourceMap,
        plugins: [
          json(),
          babel(config.babel || {})
        ],
        dest: `${process.cwd()}/${dest}`
      }).catch(err => {
        console.error(err);
      });
      console.log(`${config.name}::build finished`);
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
    const name = this.importPackageName();
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

process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

const config = new Config();

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
  .parse(process.argv);

let build = commander.build;
let serve = commander.serve;

if (build) {
  if (hasConfig()) {
    const builder = new Builder(config);
    builder.build(config);
  }
} else if (serve) {
  if (hasConfig()) {
    const server = new Server();
    server.serve(config.server, config.name);
  }
}

}());
