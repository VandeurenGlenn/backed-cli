'use strict';
const {fork} = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const EventEmitter = require('events');
const {readFileSync, writeFileSync} = require('fs');
// const {merge} = require('lodash');
const logger = require('backed-logger');
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
      this.server = config.server;
      this.configureDemo(this.server);

      logger.log(`[${time()}] ${logger._chalk('Starting initial build', 'cyan')}`);
      this.runWorker(config);

      logger.log(`[${time()}] ${logger._chalk('Watching files for changes', 'cyan')}`);

      let watchers = {};
      for (let watch of config.watch) {
        watchers[watch.task] = chokidar.watch(watch.src, watch.options);
        watchers[watch.task].on('change', () => {
          this.runWorker(watch.task, config);
        });
      }
      resolve();
    });
  }

  configureDemo(server) {
    logger.log(`[${time()}] ${logger._chalk('Configuring demo', 'cyan')}`);

    if (server) {
      let demoPath = path.join(process.cwd(), server.demo);

      if (!demoPath.includes('index.html')) {
        demoPath = path.join(demoPath, 'index.html');
      }
      let demo = readFileSync(demoPath, 'utf-8');
      if (!demo.includes('/reload/reload.js')) {
        demo = demo.replace('</body>', '\t<script src="/reload/reload.js"></script>\n</body>');
        writeFileSync(demoPath, demo);
      }
    }
  }

  runWorker(task, config) {
    let worker;
    worker = fork(path.join(__dirname, 'workers/watcher-worker.js'));
    worker.on('message', message => {
      if (message === 'done') {
        this.configureDemo(this.server);
        message = 'reload';
      }
      logger.log(`[${time()}] ${logger._chalk('Reloading browser', 'cyan')}`);
      this.emit(message);
    });
    worker.send({task: task, config: config});
  }

  // on(event, fn) {
  //   this.on(event, fn);
  // }

    // this.watcher = chokidar.watch(config.watchers, config.options);
    // this.watcher.on('change', path => logger.log(`File ${path} has been changed`));
}
export default new Watcher();
