'use strict';
const fs = require('fs');
const Logger = require('@jikurata/logger');
const execute = Symbol('execute');

class ProjectBuilder {
  constructor() {
    this._middleware = [];
    this._buildQueue = [];
    this._cache = {};
  }

  [execute](curr = null) {
    return new Promise(async (resolve, reject) => {
      try {
        for ( let handler of this.middleware ) {
          let next = true;
          await handler(curr, (bool = true) => {
            next = bool;
          });
          if ( !next ) break; 
        }
        resolve();
      }
      catch(err) { reject(err); }
    });
  }

  build() {
    Logger.info(`Starting build process: ${this.buildQueue.length} files in queue...`);
    const start = Date.now();
    return new Promise(async (resolve, reject) => {
      while ( this.buildQueue.length > 0 ) {
        const currpath = this.buildQueue.shift();
        if ( this.isFile(currpath) ) {
          try {
            await this[execute](this.pathInfo(currpath))
          }
          catch(err) { Logger.error(err); }
        }
        else Logger.warn(`${currpath} is not a file.`);
      }
      resolve();
    })
    .then(() => Logger.info(`Build finished in ${Date.now() - start}ms`))
    .catch(err => Logger.error(err));
  }

  use(fn) {
    if ( typeof fn === 'function' ) return this.middleware.push(fn);
    Logger.error(`use() expected a function, but got a ${typeof fn}`);
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
        if ( !Array.isArray(paths) ) paths = [paths];
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

  pathInfo(path) {
    const a = path.split('.');
    const filetype = (a.length > 1) ? a.pop() : null;
    return {
      'path': path,
      'filetype': filetype
    };
  }

  pathExists(path) {
    try {
      return fs.existsSync(path);
    }
    catch(err) {
      Logger.error(err); 
      return false;
    }
  }

  isDir(path) {
    try {
      const stat = fs.statSync(path);
      return stat.isDirectory();
    }
    catch(err) {
      Logger.error(err); 
      return false;
    }
  }

  isFile(path) {
    try {
      const stat = fs.statSync(path);
      return stat.isFile();
    }
    catch(err) {
      Logger.error(err); 
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
