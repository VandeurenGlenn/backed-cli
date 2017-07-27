#!/usr/bin/env node

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var _possibleConstructorReturn = _interopDefault(require('babel-runtime/helpers/possibleConstructorReturn'));
var _inherits = _interopDefault(require('babel-runtime/helpers/inherits'));

function __async(g) {
  return new Promise(function (s, j) {
    function c(a, x) {
      try {
        var r = g[x ? "throw" : "next"](a);
      } catch (e) {
        j(e);return;
      }r.done ? s(r.value) : Promise.resolve(r.value).then(c, d);
    }function d(e) {
      c(e, 1);
    }c();
  });
}
function __asyncGen(g) {
  var q = [],
      T = ["next", "throw", "return"],
      I = {};for (var i = 0; i < 3; i++) {
    I[T[i]] = a.bind(0, i);
  }I[Symbol ? Symbol.asyncIterator || (Symbol.asyncIterator = Symbol()) : "@@asyncIterator"] = function () {
    return this;
  };function a(t, v) {
    return new Promise(function (s, j) {
      q.push([s, j, v, t]);q.length === 1 && c(v, t);
    });
  }function c(v, t) {
    try {
      var r = g[T[t | 0]](v),
          w = r.value && r.value.__await;w ? Promise.resolve(w).then(c, d) : n(r, 0);
    } catch (e) {
      n(e, 1);
    }
  }function d(e) {
    c(e, 1);
  }function n(r, s) {
    q.shift()[s](r);q.length && c(q[0][2], q[0][3]);
  }return I;
}

var _require$1 = require('fs');
var readFileSync = _require$1.readFileSync;

var path = require('path');

var _require2 = require('lodash');
var merge = _require2.merge;

var logger$1 = require('backed-logger');

/**
 * @param {string} config.name name off your project
 * @param {string} config.server.entry path to where your build is located
 * @param {string} config.server.entry path to where your build is located
 * @param {string} config.server.docs path to where your docs are located
 * @param {string} config.server.bowerPath path to bower_components
 * @param {string} config.server.nodeModulesPath path to node_modules
 * @param {string} config.server.demo path to the demo
 * @param {string} config.server.index path to your index.html file we serve a helper/docs index by default (not support for now)
 * @param {array} config.server.use static files to include [{path: some/path, static: some//path}] when static is undefined path will be used.
 */

var Config = function () {
  function Config() {
    var _this = this;

    _classCallCheck(this, Config);

    return new Promise(function (resolve, reject) {
      _this.importConfig().then(function (config) {
        _this.name = config.name;
        _this.cleanup = config.cleanup || true;
        _this.babel = config.babel || true;
        if (config.bundles) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = config.bundles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var bundle = _step.value;

              bundle.plugins = _this.defaultPlugins(bundle.plugins);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
        return resolve(_this.updateConfig(config));
      });
    });
  }

  /**
   * @param {array} plugins
   */


  _createClass(Config, [{
    key: 'defaultPlugins',
    value: function defaultPlugins() {
      var plugins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var defaults = ['babel', 'cleanup'];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = defaults[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          if (this[key] && !plugins[key]) {
            plugins[key] = {};
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return plugins;
    }

    /**
     *  Default bundles config
     *
     * @return {array} [{src: `src/${name}.js`, dest: `dist/${name}.js`, format: 'es'}
     */

  }, {
    key: 'require',


    /**
     * wrapper around cjs require
     * try's to read file from current working directory
     * @param {string} path path to file/module
     * @return {object|array|function|class} module or file
     */
    value: function (_require3) {
      function require(_x) {
        return _require3.apply(this, arguments);
      }

      require.toString = function () {
        return _require3.toString();
      };

      return require;
    }(function (path) {
      return new Promise(function (resolve, reject) {
        var root = process.cwd();
        root += '/' + path;
        try {
          var required = require(root);
          resolve(required);
        } catch (error) {
          reject(error);
        }
      });
    })

    /**
     * @return {object} value of 'backed.json'
     */

  }, {
    key: 'importConfig',
    value: function importConfig() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        function generator(fn) {
          return __async(_regeneratorRuntime.mark(function _callee() {
            var pkg, config, name;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return fn('package.json').catch(function (error) {
                      if (global.debug) {
                        logger$1.error(error);
                      }
                    });

                  case 2:
                    pkg = _context.sent;
                    _context.next = 5;
                    return fn('backed.json').catch(function (error) {
                      if (global.debug) {
                        logger$1.warn('backed.json::not found, ignore this when using backed in package.json');
                      }
                    });

                  case 5:
                    config = _context.sent;

                    if (!(!config && !pkg)) {
                      _context.next = 9;
                      break;
                    }

                    logger$1.warn('No backed.json or backed section in package.json, using default options.');
                    return _context.abrupt('return', resolve({ name: process.cwd() }));

                  case 9:
                    if (!config) {
                      _context.next = 17;
                      break;
                    }

                    name = config.name;

                    if (!(!name && pkg && pkg.name && !pkg.backed)) {
                      _context.next = 15;
                      break;
                    }

                    return _context.abrupt('return', resolve(merge(config, { name: pkg.name })));

                  case 15:
                    if (!(!name && !pkg)) {
                      _context.next = 17;
                      break;
                    }

                    return _context.abrupt('return', resolve(merge(config, { name: process.cwd() })));

                  case 17:
                    if (!(pkg && pkg.backed)) {
                      _context.next = 19;
                      break;
                    }

                    return _context.abrupt('return', resolve(merge(pkg.backed, { name: pkg.name })));

                  case 19:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          })());
        }
        generator(_this2.require);
      });
    }

    /**
     * @return {string} name from 'package.json'
     */

  }, {
    key: 'importPackageName',
    value: function importPackageName() {
      try {
        return JSON.parse(readFileSync(process.cwd() + '/package.json')).name;
      } catch (e) {
        if (global.debug) {
          logger$1.warn('no package.json found');
        }
      }
      return undefined;
    }

    /**
     * @return {string} name from 'bower.json'
     */

  }, {
    key: 'importBowerName',
    value: function importBowerName() {
      try {
        return JSON.parse(readFileSync(process.cwd() + '/bower.json')).name;
      } catch (e) {
        if (global.debug) {
          logger$1.warn('no bower.json found');
        }
      }
      return undefined;
    }

    /**
     * @param {object} config - the config to be updated
     * @param {string} name - the name of the element, component, etc
     *
     * @example
      * config.updateConfig({
     *   bundles: [{
     *     src: 'src',
     *     dest: 'dist'
     *   }]
     * });
     *
     * @todo create method for building atom app with atom-builder
     * @todo implement element, app & atom-app config
     * @todo handle sourceMap at bundle level
     */

  }, {
    key: 'updateConfig',
    value: function updateConfig(config, name) {
      config.sourceMap = config.sourceMap || true;
      if (config.entry && config.sources) {
        delete config.bundles;
      } else {
        config.bundles = merge(this.bundles, config.bundles);
      }
      config.server = merge(this.server, config.server);
      config.watch = merge(this.watch, config.watch);
      global.config = config;
      return config;
    }
  }, {
    key: 'bundles',
    get: function get() {
      return [{
        src: 'src/' + this.name + '.js',
        dest: 'dist/' + this.name + '.js',
        format: 'es'
      }];
    }

    /**
     *  Default server config
     *
     * @return {object} {
     *                    port: 3000,
     *                    entry: '/',
     *                    demo: 'demo',
     *                    docs: 'docs',
     *                    bowerPath: 'bower_components',
     *                    nodeModulesPath: 'node_modules',
     *                    index: null
     *                  }
     */

  }, {
    key: 'server',
    get: function get() {
      return {
        port: 3000,
        entry: '/',
        demo: 'demo',
        docs: 'docs',
        bowerPath: 'bower_components',
        nodeModulesPath: 'node_modules',
        index: null };
    }

    /**
     *  Default watcher config
     *
     * @return {array} [{task: 'build', src: ['./src'], options: {}}
     */

  }, {
    key: 'watch',
    get: function get() {
      return [{
        task: 'build',
        src: ['./src'],
        options: {}
      }];
    }
  }]);

  return Config;
}();

var _require$2 = require('rollup');
var rollup = _require$2.rollup;

var _require2$1 = require('path');
var join = _require2$1.join;
var dirname = _require2$1.dirname;
var basename = _require2$1.basename;

var _require3 = require('child_process');
var fork = _require3.fork;

var logger$2 = require('backed-logger');
var iterator = void 0;
var cache = void 0;
var warnings = [];

var logWorker = fork(join(__dirname, 'workers/log-worker.js'));
/**
 * convert hyphen to a javascript property srting
 */
var toJsProp = function toJsProp(string) {
  var parts = string.split('-');
  if (parts.length > 1) {
    string = parts[0];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var part = _step.value;

        if (parts[0] !== part) {
          var upper = part.charAt(0).toUpperCase();
          string += upper + part.slice(1).toLowerCase();
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
  return string;
};

function bundler(bundles, fn, cb) {
  return __asyncGen(_regeneratorRuntime.mark(function _callee() {
    var fns, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, bundle, dest;

    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            fns = [];
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 4;

            for (_iterator2 = bundles[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              bundle = _step2.value;
              dest = bundle.dest;

              bundle = bundle.bundle || bundle;
              bundle.dest = dest;
              fns.push(fn(bundle));
            }

            _context.next = 12;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context['catch'](4);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t0;

          case 12:
            _context.prev = 12;
            _context.prev = 13;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 15:
            _context.prev = 15;

            if (!_didIteratorError2) {
              _context.next = 18;
              break;
            }

            throw _iteratorError2;

          case 18:
            return _context.finish(15);

          case 19:
            return _context.finish(12);

          case 20:
            _context.next = 22;
            return { __await: Promise.all(fns).then(function (bundles) {
                // TODO: Decide to implement or not, a method for transforming content
                // TODO: When not transforming, return bundles.code or bundles...
                logWorker.kill('SIGINT');
                if (global.debug) {
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                    for (var _iterator3 = warnings[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var warning = _step3.value;

                      logger$2.warn(warning);
                    }
                  } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                      }
                    } finally {
                      if (_didIteratorError3) {
                        throw _iteratorError3;
                      }
                    }
                  }
                }
                cb(bundles);
              }).catch(function (error) {
                logWorker.kill('SIGINT');
                logger$2.error(error);
              }) };

          case 22:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 8, 12, 20], [13,, 15, 19]]);
  })());
}

var Builder = function () {
  function Builder() {
    _classCallCheck(this, Builder);
  }

  _createClass(Builder, [{
    key: 'build',
    value: function build(config) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        logWorker.send('start');
        logWorker.send(logger$2._chalk('building', 'cyan'));
        _this.promiseBundles(config).then(function (bundles) {
          iterator = bundler(bundles, _this.bundle, function (bundles) {
            resolve(bundles);
          });
          iterator.next();
        }).catch(function (error) {
          logger$2.warn(error);
          reject(error);
        });
      });
    }
  }, {
    key: 'handleFormats',
    value: function handleFormats(bundle) {
      return new Promise(function (resolve, reject) {
        try {
          var format = bundle.format;
          var dest = bundle.dest;
          var formats = [];
          // TODO: Check for two iife configs, throw error!
          if (bundle.shouldRename) {
            switch (format) {
              case 'iife':
                if (!bundle.moduleName) {
                  bundle.moduleName = toJsProp(bundle.name);
                }
                break;
              case 'cjs':
                dest = bundle.dest.replace('.js', '-node.js');
                break;
              case 'es':
              case 'amd':
                dest = bundle.dest.replace('.js', '-' + format + '.js');
                break;
              default:
                break;
              // do nothing
            }
          }
          resolve({ bundle: bundle, dest: dest, format: format });
        } catch (err) {
          reject(err);
        }
      });
    }
  }, {
    key: 'forBundles',
    value: function forBundles(bundles, cb) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = bundles[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var bundle = _step4.value;

          cb(bundle);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }

    /**
     * Checks if another bundle has the same destintation, when true,
     * checks if the formats are the same
     * @param {array} bundles
     *
     * @example
     * [{
     *    dest: 'dist/index.js',
     *    format: 'es'
     *  }, {
     *    dest: 'dist/index.js',
     *    format: 'es'
     *  }]
     * // would result in true
     */

  }, {
    key: 'compareBundles',
    value: function compareBundles(bundles, cb) {
      this.forBundles(bundles, function (bundle) {
        // itterate trough the bundles
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = bundles[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var i = _step5.value;

            // ensure we are not comaring against the same bundle
            if (bundles.indexOf(i) !== bundles.indexOf(bundle)) {
              // compare destination between the current bundle & other bundles;
              if (i.dest === bundle.dest) {
                // compare the format
                if (i.format !== bundle.format) {
                  // rename dest so we don't conflict with other bundles
                  bundle.shouldRename = true;
                  return cb(bundle);
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        cb(bundle);
      });
    }
  }, {
    key: 'handleViews',
    value: function handleViews(views, cb) {
      if (views) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = views[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var view = _step6.value;

            cb(view);
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
    }
  }, {
    key: 'promiseBundles',
    value: function promiseBundles(config) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var formats = [];
        var bundles = config.bundles;
        try {
          _this2.compareBundles(bundles, function (bundle) {
            bundle.name = bundle.name || config.name;
            bundle.babel = bundle.babel || config.babel;
            bundle.sourceMap = bundle.sourceMap || config.sourceMap;

            var views = bundle.views || config.views;
            var format = bundle.format || config.format;

            if (format && typeof format !== 'string') {
              var _iteratorNormalCompletion7 = true;
              var _didIteratorError7 = false;
              var _iteratorError7 = undefined;

              try {
                for (var _iterator7 = config.format[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                  var _format = _step7.value;

                  bundle.format = _format;
                  formats.push(_this2.handleFormats(bundle));

                  _this2.handleViews(views, function (view) {
                    bundle.src = view;
                    bundle.dest = join(dirname(bundle.dest), basename(view));
                    bundle.moduleName = view.moduleName || toJsProp(basename(view, '.html'));
                    formats.push(_this2.handleFormats(bundle));
                  });
                }
              } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion7 && _iterator7.return) {
                    _iterator7.return();
                  }
                } finally {
                  if (_didIteratorError7) {
                    throw _iteratorError7;
                  }
                }
              }
            } else {
              formats.push(_this2.handleFormats(bundle));

              _this2.handleViews(views, function (view) {
                bundle.src = view;
                bundle.dest = join(dirname(bundle.dest), basename(view));
                bundle.moduleName = view.moduleName || toJsProp(basename(view, '.html'));
                formats.push(_this2.handleFormats(bundle));
              });
            }
          });
          Promise.all(formats).then(function (bundles) {
            resolve(bundles);
          });
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * @param {object} config
     * @param {string} config.src path/to/js
     * @param {string} config.dest destination to write to
     * @param {string} config.format format to build ['es', 'iife', 'amd', 'cjs']
     * @param {string} config.name the name of your element/app
     * @param {string} config.moduleName the moduleName for your element/app (not needed for es & cjs)
     * @param {boolean} config.sourceMap Wether or not to build sourceMaps defaults to 'true'
     * @param {object} config.plugins rollup plugins to use [see](https://github.com/rollup/rollup/wiki/Plugins)
     */

  }, {
    key: 'bundle',
    value: function bundle() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { src: null, dest: 'bundle.js', format: 'iife', name: null, plugins: [], moduleName: null, sourceMap: true, external: [] };

      return new Promise(function (resolve, reject) {
        var plugins = [];
        var requiredPlugins = {};

        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = Object.keys(config.plugins)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var plugin = _step8.value;

            var required = void 0;
            try {
              required = require('rollup-plugin-' + plugin);
            } catch (error) {
              try {
                required = require(join(process.cwd(), '/node_modules/rollup-plugin-' + plugin));
              } catch (error) {
                reject(error);
              }
            }
            var conf = config.plugins[plugin];
            var name = toJsProp(plugin);
            requiredPlugins[name] = required;

            plugins.push(requiredPlugins[name](conf));
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }

        rollup({
          entry: process.cwd() + '/' + config.src,
          plugins: plugins,
          external: config.external,
          cache: cache,
          // Use the previous bundle as starting point.
          onwarn: function onwarn(warning) {
            warnings.push(warning);
          }
        }).then(function (bundle) {
          cache = bundle;
          bundle.write({
            // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
            format: config.format,
            moduleName: config.moduleName,
            sourceMap: config.sourceMap,
            dest: process.cwd() + '/' + config.dest
          });
          setTimeout(function () {
            logWorker.send(logger$2._chalk(config.name + '::build finished', 'cyan'));
            logWorker.send('done');
            logWorker.on('message', function () {
              resolve(bundle);
            });
          }, 100);
        }).catch(function (err) {
          var code = err.code;
          logWorker.send('pauze');
          logger$2.error(err);
          if (code === 'PLUGIN_ERROR' || code === 'UNRESOLVED_ENTRY') {
            logWorker.kill('SIGINT');
          } else {
            logger$2.warn('trying to resume the build ...');
            logWorker.send('resume');
          }
          reject(err);
        });
      });
    }
  }]);

  return Builder;
}();

var builder = new Builder();

var express = require('express');
var http = require('http');
var reload = require('reload');
var glob = require('glob');
var opn = require('opn');

var app = express();
var server = http.createServer(app);
var reloadServer = reload(server, app);
var logger$3 = require('backed-logger');

/**
 * glob file path
 * @param {string} string
 */
var src = function src(string) {
  return new Promise(function (resolve, reject) {
    glob(string, function (error, files) {
      if (error) {
        reject(error);
      }
      if (files.length > 0) {
        resolve(files);
      }
    });
  });
};

var Server = function () {
  function Server() {
    _classCallCheck(this, Server);
  }

  _createClass(Server, [{
    key: 'serve',


    /**
     * @param {object} config - configuration
     * @param {string} config.entry path to where your build is located
     * @param {string} config.docs path to where your docs are located
     * @param {string} config.bowerPath path to bower_components
     * @param {string} config.nodeModulesPath path to node_modules
     * @param {string} config.demo path to the demo
     * @param {string} config.index path to your index.html file we serve a helper/docs index by default (not support for now)
     * @param {array} config.use static files to include [{path: some/path, static: some//path}] when static is undefined path will be used.
     */
    value: function serve() {
      var _this = this;

      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        entry: '/',
        demo: 'demo',
        docs: 'docs',
        use: [{ path: null, static: null }],
        bowerPath: 'bower_components',
        nodeModulesPath: 'node_modules',
        index: null };

      return new Promise(function (resolve, reject) {
        if (config) {
          _this.handleOldOptions(config);
          if (config.use) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = config.use[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var use = _step.value;

                app.use(use.path, express.static(_this.appLocation(use.static || use.path)));
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }

          app.use('/', express.static(_this.appLocation(config.entry)));

          app.use('/bower_components', express.static(_this.appLocation(config.bowerPath, 'bower_components')));

          app.use('/node_modules', express.static(_this.appLocation(config.nodeModulesPath, 'node_modules')));

          app.use('/demo/node_modules', express.static(_this.appLocation(config.nodeModulesPath, 'node_modules')));

          app.use('/demo', express.static(_this.appLocation(config.demo, 'demo')));

          app.use('/docs', express.static(_this.appLocation(config.docs, 'docs')));

          app.use('/package.json', express.static(_this.appLocation('package.json')));

          // serve backed-cli documentation
          app.use('/backed-cli/docs', express.static(__dirname.replace('bin', 'docs')));

          // serve backed documentation
          app.use('/backed/docs', express.static(_this.appLocation('node_modules/backed/docs')));

          // TODO: Add option to override index
          app.use('/', express.static(__dirname.replace('bin', 'node_modules\\backed-client\\dist')));

          // TODO: implement copyrighted by package author & package name if no file is found
          src(process.cwd() + '/license.*').then(function (files) {
            app.use('/license', express.static(files[0]));
          });

          server.listen(3000, function (error) {
            if (error) {
              return logger$3.warn(error);
            }
            logger$3.log(global.config.name + '::serving from http://localhost:' + config.port + '/' + config.entry.replace('/', ''));
            opn('http://localhost:' + config.port + '/' + config.entry.replace('/', ''));
          });
        } else {
          reject(logger$3.warn(global.config.name + '::server config not found [example](https://raw.githubusercontent.com/VandeurenGlenn/backed-cli/master/config/backed.json)'));
        }
      });
    }

    /**
     * @param {string} path - location of the file
     * @param {string} alternate - returns when path is undefined
     * @param {string} disableAlternate - current working directory is ignored when true, defaults to false
     */

  }, {
    key: 'appLocation',
    value: function appLocation(path, alternate) {
      var disableAlternate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var root = process.cwd();
      if (!path && !disableAlternate) {
        path = alternate;
      } else if (!path && disableAlternate) {
        // when we disable alternate we return the value of alternate
        return alternate;
      }
      root += '\\' + path;
      return root;
    }
  }, {
    key: 'handleOldOptions',
    value: function handleOldOptions(options) {
      if (options.path || options.elementLocation) {
        logger$3.warn((options.path ? 'server.path' : 'server.elementLocation') + ' is no longer supported, [visit](https://github.com/vandeurenglenn/backed-cli#serve) to learn more\'');
      } else if (options.bowerPath) {
        logger$3.warn('server.bowerPath::deprecated: removal planned @1.0.0+');
      }
    }
  }, {
    key: 'reload',
    value: function reload() {
      reloadServer.reload();
    }
  }]);

  return Server;
}();

var server$1 = new Server();

var _require$3 = require('child_process');
var fork$1 = _require$3.fork;

var chokidar = require('chokidar');
var path$1 = require('path');
var EventEmitter = require('events');

var _require2$2 = require('fs');
var readFileSync$1 = _require2$2.readFileSync;
var writeFileSync = _require2$2.writeFileSync;
// const {merge} = require('lodash');


var logger$4 = require('backed-logger');
var time = function time() {
  return new Date().toLocaleTimeString();
};
var worker = void 0;

var ensureArray = function ensureArray(array) {
  if (Array.isArray(array)) {
    return array;
  }
  if (!array) {
    return [];
  }
  return [array];
};

/**
 * @extends EventEmitter
 */

var Watcher = function (_EventEmitter) {
  _inherits(Watcher, _EventEmitter);

  function Watcher() {
    _classCallCheck(this, Watcher);

    return _possibleConstructorReturn(this, (Watcher.__proto__ || Object.getPrototypeOf(Watcher)).apply(this, arguments));
  }

  _createClass(Watcher, [{
    key: 'watch',


    /**
     * @param {object} config {@link Config}
     */
    value: function watch(config) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (!config.watch) {
          logger$4.warn('nothing to watch');
          reject('nothing to watch');
          return process.kill(process.pid, 'SIGINT');
        }
        _this2.server = config.server;
        _this2.configureDemo(_this2.server);

        logger$4.log('[' + time() + '] ' + logger$4._chalk('Starting initial build', 'cyan'));
        _this2.runWorker(config);

        logger$4.log('[' + time() + '] ' + logger$4._chalk('Watching files for changes', 'cyan'));

        var watchers = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          var _loop = function _loop() {
            var watch = _step.value;

            watchers[watch.task] = chokidar.watch(watch.src, watch.options);
            watchers[watch.task].on('change', function () {
              // allow developers to select wich build they want to rebuild when watching (this results in a quicker browser refresh...)
              if (watch.options.presets) {
                config.presets = ensureArray(watch.options.presets);
              }
              _this2.runWorker(watch.task, config);
            });
          };

          for (var _iterator = config.watch[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
          }
          // resolve();
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      });
    }
  }, {
    key: 'configureDemo',
    value: function configureDemo(server) {
      logger$4.log('[' + time() + '] ' + logger$4._chalk('Configuring demo', 'cyan'));

      if (server) {
        var demoPath = path$1.join(process.cwd(), server.demo);

        if (!demoPath.includes('index.html')) {
          demoPath = path$1.join(demoPath, 'index.html');
        }
        var demo = readFileSync$1(demoPath, 'utf-8');
        if (!demo.includes('/reload/reload.js')) {
          demo = demo.replace('</body>', '\t<script src="/reload/reload.js"></script>\n</body>');
          writeFileSync(demoPath, demo);
        }
      }
    }
  }, {
    key: 'runWorker',
    value: function runWorker(task, config) {
      var _this3 = this;

      if (this.busy) {
        worker.kill();
        this.busy = false;
      }
      this.busy = true;
      worker = fork$1(path$1.join(__dirname, 'workers/watcher-worker.js'));
      worker.on('message', function (message) {
        if (message === 'done') {
          _this3.configureDemo(_this3.server);
          message = 'reload';
        }
        logger$4.log('[' + time() + '] ' + logger$4._chalk('Reloading browser', 'cyan'));
        _this3.emit(message);
        worker.kill();
        _this3.busy = false;
      });
      worker.send({ task: task, config: config });
    }

    // on(event, fn) {
    //   this.on(event, fn);
    // }

    // this.watcher = chokidar.watch(config.watchers, config.options);
    // this.watcher.on('change', path => logger.log(`File ${path} has been changed`));

  }]);

  return Watcher;
}(EventEmitter);

var watcher = new Watcher();

var fs = require('backed-fs');
var webup$1 = require('webup');
var build = function build(config) {
  return new Promise(function (resolve, reject) {
    if (config.entry && config.sources) {
      return webup$1(config).then(function () {
        return resolve();
      });
    }
    builder.build(config).then(function () {
      return resolve();
    });
  });
};

var copy = function copy(config) {
  return new Promise(function (resolve, reject) {
    return fs.copySources(config.copy).then(function () {
      return resolve();
    });
  });
};

var serve = function serve(config) {
  return server$1.serve(config.server);
};

var watch = function watch(config) {
  watcher.on('reload', function () {
    server$1.reload();
  });
  return watcher.watch(config);
};

var tasks = {
  build: build,
  copy: copy,
  serve: serve,
  watch: watch
};

process.title = 'backed';
var commander = require('commander');

var _require = require('./../package.json');
var version = _require.version;

var webup = require('webup');
var logger = require('backed-logger');

commander.version(version).option('-w, --watch', 'watch for file changes & rebuild on change').option('-b, --build', 'build your app/component').option('-s, --serve', 'serve your app/component').option('-c, --copy', 'copy files from your app/component src folder to it distribution folder').option('-d, --debug', 'show all warnings').option('-v, --version', 'current version').parse(process.argv);

var commands = {
  build: Boolean(commander.build),
  serve: Boolean(commander.serve) || Boolean(commander.watch),
  watch: Boolean(commander.watch),
  copy: Boolean(commander.build) || Boolean(commander.copy)
};

global.debug = commander.debug;

/**
 * @param {object} config {@link Config}
 */
new Config().then(function (config) {
  function run(config) {
    return __async(_regeneratorRuntime.mark(function _callee() {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, task, name, enabled, done;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 3;
              _iterator = Object.entries(commands)[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context.next = 26;
                break;
              }

              task = _step.value;
              name = task[0];
              enabled = task[1];

              if (!enabled) {
                _context.next = 23;
                break;
              }

              _context.prev = 10;

              if (!(name === 'serve' && commands.watch)) {
                _context.next = 15;
                break;
              }

              tasks[name](config);
              _context.next = 18;
              break;

            case 15:
              _context.next = 17;
              return tasks[name](config);

            case 17:
              done = _context.sent;

            case 18:
              _context.next = 23;
              break;

            case 20:
              _context.prev = 20;
              _context.t0 = _context['catch'](10);

              logger.warn('task::function ' + name + ' ' + _context.t0);

            case 23:
              _iteratorNormalCompletion = true;
              _context.next = 5;
              break;

            case 26:
              _context.next = 32;
              break;

            case 28:
              _context.prev = 28;
              _context.t1 = _context['catch'](3);
              _didIteratorError = true;
              _iteratorError = _context.t1;

            case 32:
              _context.prev = 32;
              _context.prev = 33;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 35:
              _context.prev = 35;

              if (!_didIteratorError) {
                _context.next = 38;
                break;
              }

              throw _iteratorError;

            case 38:
              return _context.finish(35);

            case 39:
              return _context.finish(32);

            case 40:
              process.exit(0);

            case 41:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[3, 28, 32, 40], [10, 20], [33,, 35, 39]]);
    })());
  }
  run(config);
});
