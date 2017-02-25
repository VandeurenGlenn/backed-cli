process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

import Builder from './builder.js';
import Server from './server.js';
import Config from './config.js';
import Utils from './utils.js';
const config = new Config();
const utils = new Utils();

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
  .option('-c, --copy', 'copy files from your app/component src folder to it distribution folder')
  .parse(process.argv);

let build = commander.build;
let copy = commander.build || commander.copy;
let serve = commander.serve;

if (build) {
  if (hasConfig()) {
    const builder = new Builder(config);
    builder.build(config);
  }
}
if (copy) {
  utils.copySources(config.sources);
}
if (serve) {
  if (hasConfig()) {
    const server = new Server();
    server.serve(config.server, config.name);
  }
}
