'use strict';
const fs = require('fs');
const Logger = require('@jikurata/logger');
const execute = Symbol('execute');
const clearDir = Symbol('clearDir');

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
   * Passes a build path through the middleware chain
   * @param {PathInfo} curr 
   */
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

  /**
   * Initializes the build process
   * executes the middleware chain for each item
   */
  build() {
    const start = Date.now();
    return new Promise(async (resolve, reject) => {
      if ( this.buildQueue.length === 0 ) await this.search();
      this.clearDest();
      Logger.info(`Starting build process: ${this.buildQueue.length} files in queue...`);
      while ( this.buildQueue.length > 0 ) {
        const currpath = this.buildQueue.shift();
        if ( ProjectBuilder.isFile(currpath) ) {
          try { await this[execute](this.pathInfo(currpath)); }
          catch(err) { Logger.error(err); }
        }
        else Logger.warn(`${currpath} is not a file.`);
      }
      this.cache.search = {};
      resolve();
    })
    .then(() => Logger.info(`Build finished in ${Date.now() - start}ms`))
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

  read(path) {
    if ( ProjectBuilder.isDir(path) ) {
      fs.readdirSync(path);
    }
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
    return new Promise((resolve, reject) => {
      try {
        if ( !this.dest ) return resolve();
        if ( !ProjectBuilder.pathExists(this.dest) ) fs.mkdirSync(this.dest);
        else if ( !ProjectBuilder.isDir(this.dest) ) {
          Logger.error(`Build destination '${this.dest}' is not a directory.`);
          return resolve();
        }
        const paths = [];
        fs.readdirSync(this.dest).forEach(p => paths.push(`${this.dest}\\${p}`));
        clearDir(paths);
        resolve();
      }
      catch(err) { reject(err); }
    })
    .catch(err => Logger.error(err));

    function clearDir(paths) {
      if ( !Array.isArray(paths) ) paths = [paths];
      while ( paths.length > 0 ) {
        try {
          const currpath = paths.shift();
          console.log(currpath);
          if ( ProjectBuilder.isDir(currpath) ) {
            const subpaths = [];
            fs.readdirSync(currpath).forEach(p => subpaths.push(`${currpath}\\${p}`));
            clearDir(subpaths);
            fs.rmdirSync(currpath);
          }
          else if ( ProjectBuilder.isFile(currpath) ) fs.unlinkSync(currpath);
        }
        catch(err) { Logger.error(err); }
      }
    }
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

  get cache() {
    return this._cache;
  }
}

module.exports = ProjectBuilder;
