'use strict';
const {writeFile, mkdir} = require('fs');
const vinylRead = require('vinyl-read');
const path = require('path');
import logger from './logger.js';

export default class {
  /**
   * @param {object} sources {src: ["some/glob/exp"], dest: "some/dest"}
   */
  copySources(sources) {
    if (sources) {
      let promises = [];
      for (let source of sources) {
        promises.push(this.copy(source.src, source.dest));
      }
      return Promise.all(promises).then(() => {
        logger.succes(`${global.config.name}::copy finished`);
      });
    }
    return;
  }

  /**
   * returns a destination using [vinyl](https://github.com/gulpjs/vinyl) info
   */
  destinationFromFile(file) {
    let dest = file.path;
    dest = dest.replace(`${file.base}/`, '');
    dest = dest.split(path.sep);
    if (dest.length > 1) {
      dest[0] = file.dest;
    } else {
      dest[1] = dest[0];
      dest[0] = dest;
    }
    file.dest = dest.toString().replace(/,/g, '/');
    return file;
  }

  /**
   * @param {string} src "some/src/path"
   * @param {string} dest "some/dest/path"
   */
  copy(src, dest) {
    return new Promise(resolve => {
      let promises = [];
      vinylRead(src, {
        cwd: process.cwd()
      }).then(files => {
        for (let file of files) {
          file.dest = dest;
          promises.push(this.write(this.destinationFromFile(file)));
        }
        Promise.all(promises).then(() => {
          resolve();
        });
      });
    });
  }

  /**
   * @param {object} file {src: "some/src/path", dest: "some/dest/path"}
   */
  write(file) {
    return new Promise((resolve, reject) => {
      if (file) {
        writeFile(file.dest, file.contents, err => {
          if (err) {
            if (global.debug) {
              logger.warn(
                  `subdirectory(s)::not existing
                  Backed will now try to create ${file.dest}`
                );
            }
            const dest = file.dest.replace(/\/(?:.(?!\/))+$/, '');
            const paths = dest.split('/');
            let prepath = '';
            for (let path of paths) {
              prepath += `${path}/`;
              mkdir(prepath, err => {
                if (err) {
                  if (err.code !== 'EEXIST') {
                    reject(err);
                  }
                }
              });
            }
            this.write(file).then(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
