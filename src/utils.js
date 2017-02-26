'use strict';
const {readFile, writeFile, mkdir} = require('fs');
const glob = require('glob');

export default class {
  /**
   * @param {object} sources {src: ["some/glob/exp"], dest: "some/dest"}
   */
  copySources(sources) {
    return new Promise((resolve, reject) => {
      if (sources) {
        for (let src of sources.src) {
          glob(String(src), (err, files) => {
            if (err) {
              reject(err);
            }
            let promises = [];
            for (let file of files) {
              const base = file.replace(/\/(?:.(?!\/))+$/, '');
              const dest = sources.dest += file.replace(base, '');
              promises.push(this.copy(file, dest));
            }
            Promise.all(promises).then(() => {
              resolve();
            });
          });
        }
      } else {
        resolve();
      }
    });
  }

  /**
   * @param {string} src "some/src/path"
   * @param {string} dest "some/dest/path"
   */
  copy(src, dest) {
    return new Promise(resolve => {
      // TODO: decide to clean dest dir or not
      this.read({src: src, dest: dest}).then(source => {
        this.write(source).then(() => {
          resolve();
        });
      });
    });
  }

  /**
   * @param {object} source {src: "some/src/path", dest: "some/dest/path"}
   */
  read(source) {
    return new Promise((resolve, reject) => {
      readFile(source.src, (err, data) => {
        if (err) {
          reject(err);
        }
        source.data = data;
        resolve(source);
      });
    });
  }

  /**
   * @param {object} source {src: "some/src/path", dest: "some/dest/path"}
   */
  write(source) {
    return new Promise((resolve, reject) => {
      writeFile(source.dest, source.data, err => {
        if (err) {
          const dest = source.dest.replace(/\/(?:.(?!\/))+$/, '');
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
          this.write(source).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
}
