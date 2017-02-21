#!/usr/bin/env node
(function () {
'use strict';

const {rollup} = require('rollup');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const rootPath = process.cwd();
let cache;

const importConfig = () => {
  let config;
  try {
    config = require(`${rootPath}\\backed.json`);
    return config;
  } catch (error) {
    console.warn('Backed::backed.json not found, checkout https://github.com/basicelements/backed-cli for more info');
    return undefined;
  }
};

const backedBuilder$1 = () => {
  const config = importConfig();
  if (config === undefined) {
    return;
  }
  return rollup({
    entry: config.src,
    // Use the previous bundle as starting point.
    cache: cache
  }).then(bundle => {
    // Cache our bundle for later use (optional)
    cache = bundle;

    bundle.write({
      format: config.format || 'es',
      sourceMap: config.sourceMap || true,
      plugins: [
        json(),
        babel()
      ],
      dest: config.dest
    });
  });
};

process.title = 'backed';
const commander = require('commander');
const {version} = require('./../package.json');

commander
  .version(version)
  .option('-b, --build', 'build your app/component')
  .parse(process.argv);

let build = commander.build;

if (build) {
  backedBuilder$1();
}

}());
