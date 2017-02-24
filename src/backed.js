process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

import Builder from './builder.js';
import Server from './server.js';
import Config from './config.js';
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
