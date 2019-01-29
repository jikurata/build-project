'use strict';
const Logger = require('@jikurata/logger');
const fs = require('fs-extra');
const execute = Symbol('execute');

class ProjectBuilder {
  constructor(dest, src = []) {
    this._src = (!src) ? [] : (Array.isArray(src)) ? src : [src];
    this._dest = dest;
    this._middleware = [];
    this._buildQueue = [];
    this._cache = {
      'search': {}
    };
  }

  /**
   * Initializes the build process.
   * Executes the middleware chain for each item
   */
  build() {
    const iterator = (queue) => {
      return new Promise((resolve, reject) => {
        if ( index < queue.length ) {
          const currpath = queue[index];
          ++index;
          if ( ProjectBuilder.isFile(currpath) ) {
            Logger.info(`Processing ${currpath}`);
            this[execute](this.pathInfo(currpath))
            .then(() => iterator(queue))
            .then(() => resolve())
            .catch(err => reject(err));
          }
          else {
            Logger.warn(`${currpath} is not a file.`);
            iterator(queue)
            .then(() => resolve())
            .catch(err => reject(err));
          }
        }
        else resolve();
      });
    };

    const start = Date.now();
    let index = 0;
    return this.clearDest()
    .then(() => this.search())
    .then(() => {
      Logger.info(`Starting build process: ${this.buildQueue.length} files in queue...`);
      return iterator(this.buildQueue);
    })
    .then(() => Logger.info(`Build finished in ${Date.now() - start}ms. Async processes might still be executing.`))
    .catch(err => Logger.error(err));
  } 

  /**
   * Passes a build path through the middleware chain
   * @param {PathInfo} curr 
   */
  [execute](curr) {
    const iterator = (middleware) => {
      return new Promise(async (resolve, reject) => {
        let resolved = false;
        let next = true;
        const callback = (bool = true) => {
          if ( resolved ) return;
          resolved = true;
          next = bool;
          if ( next && ++index < middleware.length ) {
            iterator(middleware)
            .then(() => resolve())
            .catch(err => reject(err));
          }
          else resolve();
        };
        try {
          await middleware[index](curr, callback);
        }
        catch(err) { Logger.error(err); }
        callback();
      });
    };
    let index = 0;
    return iterator(this.middleware)
    .catch(err => Logger.error(err));
  }

  /**
   * Registers middleware for ProjectBuilder to execute
   * @param {Function} fn 
   */
  use(fn) {
    if ( typeof fn === 'function' ) return this.middleware.push(fn);
    Logger.error(`use() expected a function, but got a ${typeof fn}`);
  }

  /**
   * Performs a deep search of the paths provided
   * and pushes any files found into the queue
   * Returns a Promise<String[]>
   * @param {String[]} src 
   */
  search(src = []) {
    return new Promise((resolve, reject) => {
      try {
        if ( src && !Array.isArray(src) ) src = [src];
        src.forEach(s => this.src.push(s));
        const paths = [...this.src];
        if ( paths.length > 0 ) Logger.info(`Searching paths [${paths}] for files to build...`);
        else return reject('Unable to perform search: No src locations defined.');
        let c = 0;
        while ( paths.length > 0 ) {
          const currpath = paths.shift();
          if ( this.cache.search.hasOwnProperty(currpath) ) continue;
          let status = 'invalid';
          if ( !ProjectBuilder.pathExists(currpath) ) Logger.warn(`Alert: Path '${currpath}' does not exist`);
          // Push directory paths into the search queue
          else if ( ProjectBuilder.isDir(currpath) ) {
            fs.readdirSync(currpath).forEach(p => paths.push(`${currpath}\\${p}`));
            status = 'directory';
          }
            // Push file paths into the build queue
          else if ( ProjectBuilder.isFile(currpath) && !this.buildQueue.includes(currpath) ) {
            this.buildQueue.push(currpath);
            status = 'file';
            ++c;
          }
          this.cache.search[currpath] = status;
        }
        Logger.info(`Search complete: ${c} ${(c === 1) ? 'file' : 'files'} found.`);
        resolve(this.buildQueue);
      }
      catch(err) { reject(err); }
    })
    .catch(err => Logger.error(err));
  }

  /**
   * Returns basic information as an object
   * on a provided file path
   * @param {String} path 
   */
  pathInfo(path) {
    const isFile = ProjectBuilder.isFile(path);
    const splitpath = path.split(/\\+|\/+/);
    const filename = splitpath[splitpath.length - 1];
    const splitname = filename.split('.');
    const basename = (filename[0] === '.') ? filename : splitname.slice(0, splitname.length - 1).join('.');
    const filetype = (filename[0] === '.') ? '' : splitname[splitname.length -1];
    const dest = this.resolveToDest(path);
    return {
      'path': path,
      'dest': dest,
      'name': basename,
      'type': filetype,
      'isFile': isFile
    };
  }

  /**
   * Mirrors the src path and replaces
   * its src root to the build root.
   * Returns a src path resolved to its build path
   * @param {String} path 
   */
  resolveToDest(path) {
    for ( let src of this.src ) {
      // Check if path contains a src path
      if ( path.includes(src) ) {
        let existingmatch = false;
        // Verify current src path is not a subdirectory of another src
        for ( let p of this.src ) {
          if ( src === p ) continue;
          else if ( src.includes(p) ) existingmatch = true;
        };
        const regexp = new RegExp(`^(.*?)${src}`);
        if ( !existingmatch ) return path.replace(regexp, this.dest);
      }
    }
    return null;
  }

  clearDest() {
    return fs.remove(this.dest)
      .then(() => fs.ensureDir(this.dest))
      .catch(err => Logger.error(err));
  }

  static pathExists(path) {
    try {
      fs.accessSync(path);
      return true;
    }
    catch(err) {
      return false;
    }
  }

  static isDir(path) {
    try {
      const stat = fs.statSync(path);
      return stat.isDirectory();
    }
    catch(err) {
      Logger.error(err); 
      return false;
    }
  }

  static isFile(path) {
    try {
      const stat = fs.statSync(path);
      return stat.isFile();
    }
    catch(err) {
      Logger.error(err); 
      return false;
    }
  }

  get src() {
    return this._src;
  }
  
  get dest() {
    return this._dest;
  }

  get middleware() {
    return this._middleware;
  }

  get buildQueue() {
    return this._buildQueue;
  }

  get events() {
    return this._events;
  }

  get cache() {
    return this._cache;
  }
}

module.exports = ProjectBuilder;
