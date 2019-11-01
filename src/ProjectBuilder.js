'use strict';
const Path = require('path');
const fsUtil = require('./fs-util.js');
const pathUtil = require('./path-util.js');
const BuildError = require('./BuildError.js');
const execute = Symbol('execute');
const searchSources = Symbol('searchSources');

class ProjectBuilder extends EventEmitter {
  constructor() {
    super();
    Object.defineProperty(this, 'root', {
      value: fsUtil.getProjectRoot(),
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'sources', {
      value: [],
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'middleware', {
      value: [],
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'cache', {
      value: {},
      enumerable: true,
      writable: false,
      configurable: false
    });
  }
  
  /**
   * Create a new Build
   * @param {String} buildRoot 
   * @param {String|Array[String]} sources
   * @returns {Promise:Build}
   */
  build(buildRoot, sources) {
    // Iterate through eaech file in the queue
    const fileIterator = (queue) => {
      return new Promise((resolve, reject) => {
        const filepath = queue.pop();
        if ( filepath ) {
          const currentFile = Path.normalize(filepath);
          const fileInfo = Path.format(currentFile);
          fileInfo.buildPath = pathUtil.resolveBuildPath(buildRoot, currentFile);

          this[execute](fileInfo, this.middlewares)
          .then(() => {
            if ( queue.length ) {
              // Proceed to next file in queue once the current file build is finished
              return fileIterator(queue);
            }
            else {
              return resolve(queue);
            }
          })
          .catch(err => reject(err));
        }
        else {
          return resolve(queue);
        }
      });
    };

    return new Promise((resolve, reject) => {
      if ( !Array.isArray(sources) ) {
        sources = [sources];
      }
      let build = null;
      this[searchSources](sources)
      .then(queue => {
        build = new Build({
          root: this.root,
          buildRoot: buildRoot,
          sources: sources,
          queue: queue
        });
        build.dateStarted = Date.now();
        this.emit('build-start', build);
        // Start building each file in the queue
        return fileIterator(queue);
      })
      .then(() => {
        build.dateCompleted = Date.now();
        build.elapsedTime = build.dateCompleted - build.dateStarted;
        this.emit('build-complete', build);
        return resolve(build);
      })
      .catch(err => reject(err));
    })
    .catch(err => {
      this.emit('error', err);
      return err;
    });
  }

  /**
   * Pass a FileInfo object through the middleware
   * @param {Object} fileInfo
   * @param {Array[Function]} middlewares
   * @returns {Promise:Void}
   */
  [execute](fileInfo, middlewares) {
    const middlewareIterator = (file, queue) => {
      return new Promise((resolve, reject) => {
        const middleware = queue.shift();
        if ( middleware ) {
          const next = () => {
            resolve(file, queue);
          };
          // If the middleware returns a promise, wait for the promise to resolve
          try {
            const returnValue = middleware(fileInfo, next);
            if ( returnValue instanceof Promise ) {
              returnValue
              .then(() => resolve(file, queue))
              .catch(err => reject(err));
            }
            else {
              return resolve(file, queue);
            }
          }
          catch(err) {
            return reject(err);
          }
        }
        else {
          return resolve(file, queue);
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.emit('file-start', fileInfo);
      middlewareIterator(fileInfo, middlewares)
      .then(queue => {
        if ( queue.length ) {
          // If there are still middleware in the process queue, continue iterating
          return middlewareIterator(queue)
        }
        else {
          // If the queue is empty, all middleware have been processed
          this.emit('file-complete', fileInfo);
          return resolve();
        }
      })
      .catch(err => reject(err));
    });
  }

  use(listener) {
    BuildError.InvalidListener.throwCheck(listener);
    this.middleware.push(listener);
  }

  /**
   * Performs a deep search of the paths provided
   * and pushes any files found into the queue
   * Returns a Promise<String[]>
   * @param {String[]} src 
   */
  [searchSources](src = []) {
    return new Promise((resolve, reject) => {
      try {
        if ( src && !Array.isArray(src) ) {
          src = [src];
        }

        const paths = [...this.sources];
        const queue = [];
        this.emit('search-start', paths);

        // Iterate through each source path and inspect every single file
        while ( paths.length > 0 ) {
          const currpath = Path.normalize(paths.pop());
          let status = 'invalid';

          if ( !this.cache[currpath] ) {
            // Check if the path exists
            BuildError.PathDoesNotExist.throwCheck(currpath);

            if ( fsUtil.isDir(currpath) ) {
              status = 'directory';
              // Push all the subpaths of the directory into the search queue
              const subpaths = fs.readdirSync(currpath);
              for ( let i = 0; i < subpaths.length; ++i ) {
                const abspath = Path.join(currpath, subpaths[i]);
                paths.push(abspath);
              }
            }
            else if ( fsUtil.isFile(currpath) && queue.indexOf(currpath) === -1 ) {
              status = 'file';
              // Push files into the build queue
              queue.push(currpath);
              ++c;
            }
          }
          // Add the current path to the cache, along with its status
          this.cache[currpath] = status;
        }
        this.emit('search-complete', queue);
        resolve(queue);
      }
      catch(err) {
        reject(err);
      }
    });
  }
}

module.exports = ProjectBuilder;
