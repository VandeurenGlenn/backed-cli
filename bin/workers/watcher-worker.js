
const builder = require('backed-builder');
const fs = require('backed-fs');
const logger = require('backed-logger');

process.on('message', message => {
  const config = message.config;
  const task = message.task;
  switch (task) {
    case 'build':
      builder.build(config).then(() => {
        process.send('reload');
      });
      break;
    case 'copy':
    case 'sources':
      fs.copySources(config.sources).then(() => {
        logger.succes(`${config.name}::copy finished`);
        process.send('done');
      });
      break;
  }
});
