'use strict';
const fs = require('backed-fs');
const webup = require('webup');
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
  copy,
  serve,
  watch
};
