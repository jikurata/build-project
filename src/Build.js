'use strict';
const EventEmitter = require('events');

class Build extends EventEmitter {
  constructor(param = {}) {
    super();
    Object.defineProperty(this, 'root', {
      value: param.root,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'buildPath', {
      value: param.buildPath,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'sources', {
      value: param.sources,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'queue', {
      value: param.queue,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'map', {
      value: {},
      enumerable: true,
      writable: false,
      configurable: false
    });
    this.dateStarted = null;
    this.dateCompleted = null;
    this.elapsedTime = null;
  }

  get fileCount() {
    return Object.keys(this.map).length;
  }
}

module.exports = Build;
