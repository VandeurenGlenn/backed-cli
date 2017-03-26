process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

import Config from './config.js';
import builder from './../node_modules/backed-builder/dist/builder-es.js';
import server from './server.js';
import watcher from './watcher.js';
import Utils from './utils.js';
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
let debug = commander.debug;

async function * run(config) {
  global.debug = debug || config.debug;

  if (build) {
    await builder.build(config);
  }

  if (copy) {
    await utils.copySources(config.sources);
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
  let it = run(config);
  it.next();
});
