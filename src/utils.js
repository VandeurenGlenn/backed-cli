'use strict';
const {readFile, writeFile, mkdir} = require('fs');
const glob = require('glob');

export default class {
  copySources(sources) {
    return new Promise((resolve, reject) => {
      if (sources) {
        const base = sources.dest;
        for (let src of sources.src) {
          glob(src, (err, files) => {
            if (err) {
              reject(err);
            }
            let promises = [];
            for (let file of files) {
              const dest = sources.dest += file;
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

  copy(path, dest) {
    return new Promise(resolve => {
      this.read({src: path, dest: dest}).then(source => {
        this.write(source).then(() => {
          resolve();
        });
      });
    });
  }

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

  write(source) {
    console.log(source);
    return new Promise((resolve, reject) => {
      writeFile(source.dest, source.data, err => {
        if (err) {
          const dest = source.dest.replace(/\/(?:.(?!\/))+$/, '');
          mkdir(dest, () => {
            this.write(source).then(() => {
              resolve();
            });
          });
          reject(err);
        }
        resolve();
      });
    });
  }
}
