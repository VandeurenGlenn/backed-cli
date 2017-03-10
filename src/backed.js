process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

import Builder from './builder.js';
import Server from './server.js';
import Config from './config.js';
import Utils from './utils.js';
const utils = new Utils();

commander
  .version(version)
  .option('-b, --build', 'build your app/component')
  .option('-s, --serve', 'serve your app/component')
  .option('-c, --copy', 'copy files from your app/component src folder to it distribution folder')
  .option('-d, --debug', 'show all warnings')
  .parse(process.argv);

let build = commander.build;
let copy = commander.build || commander.copy;
let serve = commander.serve;
let debug = commander.debug;
let iterator;

function * run() {
  const config = yield new Config(iterator);
  global.debug = debug || config.debug;

  if (build) {
    yield new Builder(config, iterator);
  }
  if (copy) {
    utils.copySources(config.sources);
  }
  if (serve) {
    const server = new Server();
    server.serve(config.server);
  }
}

iterator = run();
iterator.next();
