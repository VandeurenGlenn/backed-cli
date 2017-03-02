# backed-cli [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> A command line interface for fast es6 development

## Installation

```sh
$ npm install --global backed-cli
```

## Usage
- Create a 'backed.json' file in your projects root [example](https://github.com/vandeurenglenn/backed-cli/config/backed.json)

### Commands

#### Build[--build, -b]
Bundle your app/component
```sh
  backed --build
```

#### Copy[--copy, -c]
Copy resources
```sh
  backed --copy
```

#### Serve[--serve, -s]
Serve a localhost for your app/component
```sh
  backed --serve
```

## API

### backed[{options}]
#### options

#### bundles
Type: `array`<br>
Default: `undefined`<br>
Options: `src, dest, format, babel`

An array of objects with each object containing a src & dest property
```json
// minimal
{
  "bundles": [{
    "src": "some/path/to/index",
    "dest": "some/path/to/index"
  }]
}

// minimal with multiple bundles
{
  "bundles": [{
    "src": "some/path/to/index",
    "dest": "some/path/to/index"
  }, {
    "src": "some/other/path/to/element",
    "dest": "some/other/path/to/element"
  }]
}

// all options
{
  "bundles": [{
    "src": "some/path/to/index",
    "dest": "some/path/to/index",
    "format": "iife"
  }, {
    "src": "some/other/path/to/element",
    "dest": "some/other/path/to/element",
    "format": ["iife", "es"],
    "babel": {"babel-config"}
  }]
}

```

#### format
Type: `array`<br>
Default: `iife`<br>
Options: `iife, es, cjs, amd`

The format to build.
```json
{
  "format": "es"
}

// multiple

{
  "format": ["iife", "es"]
}
```

#### server (documentation not finished check [backed.json](https://github.com/VandeurenGlenn/backed-cli/blob/master/config/backed.json) or when using next [next-backed.json](https://github.com/VandeurenGlenn/backed-cli/blob/master/config/next-backed.json))
Type: `object`<br>
Default: `undefined`<br>
Options: `demo, use, docs`

Serve your component/app documentation & demo

## TODO

- [ ] Add more documentation & examples
- [ ] Add support for plugins `example:` <br>
  - backed-plugin-todo <br>
  - backed-plugin-atom <br>
  - ...
- [ ] Add support for presets `example:` <br>
  - backed-preset-element <br>
  - backed-preset-app <br>
  - backed-preset-atom <br>
  - ...
- [ ] Serve app after build & copy
- [ ] Handle errors
- [ ] Run tests with [Travis CI](https://travis-ci.org/) & [SAUCELABS](https://saucelabs.com/)


## Projects using Backed CLI

### components
- [custom-marked](https://github.com/VandeurenGlenn/custom-marked)
- [reef-controller](https://github.com/Reeflight/reef-controller) RPI reeflight controller

### frameworks
- [Backed](https://github.com/VandeurenGlenn/backed) - Small web framework for quick app & component development

## License

MIT © [Glenn Vandeuren]()

[npm-image]: https://badge.fury.io/js/backed-cli.svg
[npm-url]: https://npmjs.org/package/backed-cli
[travis-image]: https://travis-ci.org/VandeurenGlenn/backed-cli.svg?branch=master
[travis-url]: https://travis-ci.org/VandeurenGlenn/backed-cli
[daviddm-image]: https://david-dm.org/VandeurenGlenn/backed-cli.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/VandeurenGlenn/backed-cli
[coveralls-image]: https://coveralls.io/repos/VandeurenGlenn/backed-cli/badge.svg
[coveralls-url]: https://coveralls.io/r/VandeurenGlenn/backed-cli
