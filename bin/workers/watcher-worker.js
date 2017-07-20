'use strict';
const webup = require('webup');
const builder = require('backed-builder');
const fs = require('backed-fs');
const logger = require('backed-logger');

process.on('message', message => {
  const config = message.config;
  const task = message.task;
  switch (task) {
    case 'build':
      if (config.fragments) {
        webup(config).then(() => {
          process.send('reload');
        });
      } else {
        builder.build(config).then(() => {
          process.send('reload');
        });
      }
      break;
    case 'copy':
      fs.copySources(config.copy).then(() => {
        logger.succes(`${config.name}::copy finished`);
        process.send('done');
      });
      break;
  }
});
