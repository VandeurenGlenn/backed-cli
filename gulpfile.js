'use strict';
var path = require('path');
var {task, src, dest, watch, series} = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var rollup = require('rollup');
var json = require('rollup-plugin-json');
var babel = require('rollup-plugin-babel');
var fs = require('fs');
var del = require('del');
var merge = require('merge-stream');
var async = require('rollup-plugin-async');

let cache;

task('static', () => {
  return src('**/*.js')
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

task('nsp', cb => {
  nsp({package: path.resolve('package.json')}, cb);
});

task('pre-test', () => {
  return src('lib/**/*.js')
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});
task('test:after', cb => {
  var mochaErr;

  src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', err => {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', () => {
      cb(mochaErr);
    });
});
task('test', series('pre-test', 'test:after'));

task('watch', () => {
  watch(['lib/**/*.js', 'test/**'], ['test']);
});

task('coveralls:after', () => {
  if (!process.env.CI) {
    return;
  }

  return src(path.join(__dirname, 'coverage/lcov.info'))
    .pipe(coveralls());
});

task('coveralls', series('test', 'coveralls:after'));

task('rollup:run', () => {
  return rollup.rollup({
    entry: 'src/backed.js',
     // Use the previous bundle as starting point.
    cache: cache,
    acorn: {
      allowReserved: true
    },
    plugins: [json(), async(), babel({runtimeHelpers: true})]
  }).then(bundle => {
    var result = bundle.generate({
      format: 'cjs',
      moduleName: 'backed'
    });
     // Cache our bundle for later use (optional)
    cache = bundle;
    fs.writeFileSync('.tmp/backed.js', result.code);
  });
});

task('rollup:before', cb => {
  fs.mkdirSync('.tmp');
  cb();
});

task('rollup:after', () => {
  var string = fs.readFileSync('.tmp/backed.js').toString();
  string = string.replace(`'use strict';`, `#!/usr/bin/env node`);
  fs.unlinkSync('.tmp/backed.js');
  fs.writeFileSync('.tmp/backed.js', string);
  var cli = src('.tmp/backed.js').pipe(dest('bin'));

  return merge(cli);
});

task('clean', cb => {
  del.sync(['.tmp/', 'bin/**/*']);
  cb();
});

task('copy', () => {
  const workers = src('src/workers/*.js').pipe(dest('bin/workers'));

  const asycRuntimeHelpers = src([
    'node_modules/babel-runtime/helpers/{classCallCheck,createClass,regenerator,asyncGenerator}.js'
  ]).pipe(dest('bin/node_modules/babel-runtime/helpers'));

  const asyncRegenerator = src([
    'node_modules/babel-runtime/regenerator/*.js'
  ]).pipe(dest('bin/node_modules/babel-runtime/regenerator'));

  const asyncRuntimeCore = src([
    'node_modules/babel-runtime/core-js/object/define-property.js'
  ]).pipe(dest('bin/node_modules/babel-runtime/core-js/object'));

  return merge(workers, asycRuntimeHelpers, asyncRegenerator, asyncRuntimeCore);
});

task('watch', () => {
  watch('src/*.js', series('build'));
  watch('src/workers/*.js', series('copy'));
});

task('rollup', series('rollup:before', 'rollup:run', 'rollup:after'));

task('build', series('clean', 'rollup', 'copy'));
task('prepublish', series('nsp', 'build'));
task('default', series('static', 'test', 'coveralls'));
