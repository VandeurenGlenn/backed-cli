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
    return new Promise((resolve, reject) => {
      if (sources) {
        try {
          let promises = [];
          for (let source of sources) {
            promises.push(this.copy(source.src, source.dest));
          }
          Promise.all(promises).then(() => {
            logger.succes(`${global.config.name}::copy finished`);
            resolve();
          });
        } catch (error) {
          logger.error(error);
          reject(error);
        }
      }
    });
  }

  /**
   * returns a destination using [vinyl](https://github.com/gulpjs/vinyl) info
   */
  destinationFromFile(file) {
    let dest = path.win32.parse(file.path).dir;
    dest = dest.replace(`${process.cwd()}\\`, '');
    dest = dest.split(path.sep);
    if (dest.length > 1) {
      dest[0] = file.dest;
    } else {
      dest[0] = file.dest;
    }
    dest.push(path.win32.basename(file.path));
    file.dest = dest.toString().replace(/,/g, '\\');

    // return console.log(file.dest);
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
          file.dest = path.win32.normalize(dest);
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
    // console.log(file);
    return new Promise((resolve, reject) => {
      if (file) {
        writeFile(file.dest, file.contents, err => {
          if (err) {
            console.log(err);
            if (global.debug) {
              logger.warn(
                  `subdirectory(s)::not existing
                  Backed will now try to create ${file.dest}`
                );
            }
            const dest = path.win32.dirname(file.dest);
            const paths = dest.split('\\');
            let prepath = '';
            for (let path of paths) {
              prepath += `${path}\\`;
              mkdir(process.cwd() + '\\' + prepath, err => {
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
