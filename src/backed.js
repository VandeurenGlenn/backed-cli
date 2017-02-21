process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

import builder from './builder.js';

commander
  .version(version)
  .option('-b, --build', 'build your app/component')
  .parse(process.argv);

let build = commander.build;

if (build) {
  builder();
}
