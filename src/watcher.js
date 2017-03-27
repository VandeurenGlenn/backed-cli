'use strict';
const {fork} = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const EventEmitter = require('events');
const {readFileSync, writeFileSync} = require('fs');
// const {merge} = require('lodash');
import logger from './logger.js';
const time = () => {
  return new Date().toLocaleTimeString();
};

/**
 * @extends EventEmitter
 */
class Watcher extends EventEmitter {

  /**
   * @param {object} config {@link Config}
   */
  watch(config) {
    return new Promise((resolve, reject) => {
      if (!config.watch) {
        logger.warn('nothing to watch');
        reject('nothing to watch');
        return process.kill(process.pid, 'SIGINT');
      }
      logger.log(`[${time()}] ${logger._chalk('Configuring demo', 'cyan')}`);

      if (config.server) {
        let demoPath = path.join(process.cwd(), config.server.demo);

        if (!demoPath.includes('index.html')) {
          demoPath = path.join(demoPath, 'index.html');
        }
        let demo = readFileSync(demoPath, 'utf-8');
        if (!demo.includes('/reload/reload.js')) {
          demo = demo.replace('</body>', '\t<script src="/reload/reload.js"></script>\n</body>');
          writeFileSync(demoPath, demo);
        }
      }

      logger.log(`[${time()}] ${logger._chalk('Starting initial build', 'cyan')}`);
      this.runWorker(config);

      logger.log(`[${time()}] ${logger._chalk('Watching files for changes', 'cyan')}`);
      const watcher = chokidar.watch(config.watch.src, config.watch.options);
      watcher.on('change', () => {
        this.runWorker(config);
      });

      resolve();
    });
  }

  runWorker(config) {
    let worker;
    worker = fork(path.join(__dirname, 'workers/watcher-worker.js'));
    worker.on('message', message => {
      logger.log(`[${time()}] ${logger._chalk('Reloading browser', 'cyan')}`);
      this.emit(message);
    });
    worker.send(config);
  }

  // on(event, fn) {
  //   this.on(event, fn);
  // }

    // this.watcher = chokidar.watch(config.watchers, config.options);
    // this.watcher.on('change', path => logger.log(`File ${path} has been changed`));
}
export default new Watcher();
