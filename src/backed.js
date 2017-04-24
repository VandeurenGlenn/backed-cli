'use strict';
process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');
const fs = require('backed-fs');

import Config from './config.js';
import builder from './../node_modules/backed-builder/src/builder.js';
import server from './server.js';
import watcher from './watcher.js';


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
global.debug = commander.debug
/**
 * @param {object} config {@link Config}
 */
async function * run(config) {
  if (build) {
    await builder.build(config);
  }

  if (copy) {
    await fs.copySources(config.sources);
  }

  if (watch) {
    watcher.on('reload', () => {
      server.reload();
    });
    await watcher.watch(config);
  }

  if (serve) {
    await server.serve(config.server);
  }
}

new Config().then(config => {
  global.debug = commander.debug || config.debug;
  let it = run(config);
  it.next();
});
