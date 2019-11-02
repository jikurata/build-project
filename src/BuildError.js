'use strict';
const FS = require('fs-extra');

class PathDoesNotExist extends Error {
  constructor(path) {
    super(`Path does not exist: ${path}`);
  }

  static throwCheck(path) {
    if ( !FS.pathExistsSync(path) ) {
      throw new PathDoesNotExist(path);
    }
  }
}

class InvalidHandler extends TypeError {
  constructor(arg) {
    super(`Invalid Listener: Expected a function, but received typeof ${arg}.`);
  }

  static throwCheck(arg) {
    if ( typeof arg !== 'function' ) {
      throw new InvalidHandler(arg);
    }
  }
}

module.exports.PathDoesNotExist = PathDoesNotExist
module.exports.InvalidHandler = InvalidHandler;
