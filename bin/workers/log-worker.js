'use strict';
const elegantSpinner = require('elegant-spinner');
const logUpdate = require('log-update');
let frame = elegantSpinner();
let text = 'Building';

let interval = () => {
  setInterval(() => {
    logUpdate(`${text} ${frame()}`);
  }, 50);
};
process.on('message', message => {
  if (message === 'start') {
    interval();
  } else {
    text = message;
  }
});
