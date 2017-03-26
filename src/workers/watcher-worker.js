
const builder = require('backed-builder');
process.on('message', message => {
  if (message) {
    builder.build(message);
    process.send('reload');
  }
  return;
});
