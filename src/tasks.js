'use strict';
const fs = require('backed-fs');
const {readFile} = require('fs');
const webup = require('webup');
const uglifyEs = require('uglify-es');
import builder from './../node_modules/backed-builder/src/builder.js';
import server from './server.js';
import watcher from './watcher.js';

const build = config => {
  return new Promise((resolve, reject) => {
    if (config.entry && config.sources) {
      return webup(config).then(() => {
        return resolve();
      });
    }
    builder.build(config).then(() => resolve());
  });
};

const read = src => {
  return new Promise((resolve, reject) => {
    readFile(src, 'utf-8', (error, code) => {
      if (error) {
        reject(error);
      }
      resolve(code);
    });
  });
};

const uglify = config => {
  return new Promise((resolve, reject) => {
    async function generator() {
      for (const bundle of config.bundles) {
        const file = await read(bundle.dest);
        const result = uglifyEs.minify(file, {compress: true});
        const done = await fs.write({contents: result.code}, bundle.dest.replace('.js', '.min.js'));
      }
      resolve();
    }
    generator();
  });
};

const copy = config => {
  return new Promise((resolve, reject) => {
    return fs.copySources(config.copy).then(() => {
      return resolve();
    });
  });
};

const serve = config => {
  return server.serve(config.server);
};

const watch = config => {
  watcher.on('reload', () => {
    server.reload();
  });
  return watcher.watch(config);
};

export default {
  build,
  uglify,
  copy,
  serve,
  watch
};
