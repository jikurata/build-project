'use strict';

class Queue {
  constructor() {
    Object.defineProperty(this, 'list', {
      value: [],
      enumerable: true,
      writable: false,
      configurable: false
    });
  }

  next() {
    return this.list.shift();
  }

  push(item) {
    this.list.push(item);
  }
}

module.exports = Queue;
