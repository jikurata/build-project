'use strict';
const fs = require('fs');
const execute = Symbol('execute');

class ProjectBuilder {
  constructor() {
    this._middleware = [];
    this._buildQueue = [];
    this._cache = {};
  }

  [execute](curr = null) {
    for ( let handler of this.middleware ) {
      let next = true;
      handler(curr, (bool = true) => {
        next = bool;
      });
      if ( !next ) return;
    }
  }

  build() {
    this[execute]();
  }

  use(f) {
    if ( typeof f === 'function' ) return this.middleware.push(f);
    console.error(`use() expected a function, but got a ${typeof f}`);
  }

  /**
   * Performs a deep search of the paths provided
   * and pushes any files found into the queue
   * Returns a Promise<String[]>
   * @param {String} path 
   */
  search(paths) {
    return new Promise((resolve, reject) => {
      try {
        if ( Array.isArray(paths) ) paths = [paths];
        while ( paths.length > 0 ) {
          const currpath = paths.shift();
          // Push directory paths into the search queue
          if ( this.isDir(currpath) ) fs.readdirSync(currpath).forEach(p => paths.push(`${currpath}\\${p}`));
          // Push file paths into the build queue
          else if ( this.isFile(currpath) && !this.buildQueue.includes(currpath) ) this.buildQueue.push(currpath);
        }
        resolve(this.buildQueue);
      }
      catch(err) { reject(err); }
    });
  }

  read(path) {
    if ( this.isDir(path) ) {
      fs.readdirSync(path);
    }
  }

  pathExists(path) {
    try {
      return fs.existsSync(path);
    }
    catch(err) {
      console.log(err); 
      return false;
    }
  }

  isDir(path) {
    try {
      const stat = fs.statSync(path);
      return stat.isDirectory();
    }
    catch(err) {
      console.log(err); 
      return false;
    }
  }

  isFile(path) {
    try {
      const stat = fs.statSync(path);
      return stat.isFile();
    }
    catch(err) {
      console.log(err); 
      return false;
    }
  }
  
  get middleware() {
    return this._middleware;
  }

  get buildQueue() {
    return this._buildQueue;
  }

  get cache() {
    return this._cache;
  }
}

module.exports = ProjectBuilder;
