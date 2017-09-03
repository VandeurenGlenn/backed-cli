'use strict';
process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');
const webup = require('webup');
const logger = require('backed-logger');

import Config from './config.js';
import tasks from './tasks.js';

commander
  .version(version)
  .option('-w, --watch', 'watch for file changes & rebuild on change')
  .option('-u, --uglify', 'minimize code ouput')
  .option('-b, --build', 'build your app/component')
  .option('-s, --serve', 'serve your app/component')
  .option('-c, --copy', 'copy files from your app/component src folder to it distribution folder')
  .option('-d, --debug', 'show all warnings')
  .option('-v, --version', 'current version')
  .parse(process.argv);

const commands = {
  build: Boolean(commander.build),
  uglify: Boolean(commander.uglify),
  serve: Boolean(commander.serve) || Boolean(commander.watch),
  watch: Boolean(commander.watch),
  copy: Boolean(commander.build) || Boolean(commander.copy)
};

global.debug = commander.debug;

/**
 * @param {object} config {@link Config}
 */
new Config().then(config => {
  async function run(config) {
    if (config.uglify) {
      commands.uglify = true;
    }
    for (const task of Object.entries(commands)) {
      const name = task[0];
      const enabled = task[1];
      if (enabled) {
        try {
          if (name === 'serve' && commands.watch) {
            tasks[name](config);
          } else {
            const done = await tasks[name](config);
          }
        } catch (e) {
          logger.warn(`task::function ${name} ${e}`);
        }
      }
    }
    process.exit(0);
  }
  run(config);
});
