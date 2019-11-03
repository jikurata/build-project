'use strict';
const EventEmitter = require('events');
const Path = require('path');
const fs = require('fs-extra');
const fsUtil = require('./fs-util.js');
const pathUtil = require('./path-util.js');
const Build = require('./Build.js');
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
    Object.defineProperty(this, 'handlers', {
      value: [],
      enumerable: true,
      writable: false,
      configurable: false
    });
  }
  
  /**
   * Create a new Build
   * @param {String|Array[String]} sources
   * @returns {Promise:Build}
   */
  build(sources) {
    // Iterator function that retrieves every file to be built and passes it the execute function
    const fileIterator = (queue) => {
      return new Promise((resolve, reject) => {
        if ( !queue.length ) {
          return resolve();
        }
        const filepath = queue.pop();
        const currentFile = Path.normalize(filepath);
        const fileInfo = Path.parse(currentFile);
        fileInfo.path = currentFile;

        this[execute](fileInfo)
        .then(() => fileIterator(queue))
        .then(() => resolve())
        .catch(err => reject(err));
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
   * Pass a FileInfo object through the handler
   * @param {Object} fileInfo
   * @param {Array[Function]} handlers
   * @returns {Promise:Void}
   */
  [execute](fileInfo) {
    let index = 0;
    // Iterator function that passes the file object through each registered handler
    const handlerIterator = () => {
      return new Promise((iteratorResolve, iteratorReject) => {
        if ( index >= this.handlers.length ) {
          return iteratorResolve();
        }
        const handler = this.handlers[index];
        ++index;
        // If the handler returns a promise, wait for the promise to resolve
        try {
          new Promise((handlerResolve, handlerReject) => {
            let nextHasBeenCalled = false;
            // Instructs iterator to move to next handler
            const next = () => {
              nextHasBeenCalled = true;
              handlerResolve(nextHasBeenCalled);
            };
            try {
              const returnValue = handler(fileInfo, next);
              if ( returnValue instanceof Promise ) {
                returnValue
                .then(() => handlerResolve(nextHasBeenCalled))
                .catch(err => handlerReject(err));
              }
              else {
                return handlerResolve(nextHasBeenCalled);
              }
            }
            catch(err) {
              handlerReject(err);
            }
          })
          .then(nextHasBeenCalled => {
            // Only proceed to the next handler if next() was called in the previous handler
            if ( nextHasBeenCalled ) {
              return handlerIterator();
            }
          })
          .then(() => iteratorResolve())
          .catch(err => iteratorReject(err))
        }
        catch(err) {
          return iteratorReject(err);
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.emit('file-start', fileInfo);
      handlerIterator(fileInfo)
      .then((fileInfo) => {
        this.emit('file-complete', fileInfo);
        return resolve();
      })
      .catch(err => reject(err));
    });
  }

  /**
   * Add a build function to the builder.
   * Build functions have two arguments: (fileInfo, next)
   * - fileInfo is an object from path.parse()
   * - next is a function that moves the build process to the next handler
   * @param {Function} handler 
   */
  use(handler) {
    BuildError.InvalidHandler.throwCheck(handler);
    this.handlers.push(handler);
  }

  /**
   * Performs a deep search of the paths provided
   * and pushes any files found into the queue
   * Returns a Promise<String[]>
   * @param {String[]} sources 
   */
  [searchSources](sources = []) {
    return new Promise((resolve, reject) => {
      try {
        if ( sources && !Array.isArray(sources) ) {
          sources = [sources];
        }

        const paths = [...sources];
        const queue = [];
        this.emit('search-start', paths);

        // Iterate through each source path and inspect every single file
        while ( paths.length > 0 ) {
          const currpath = Path.normalize(paths.pop());

          // Check if the path exists
          BuildError.PathDoesNotExist.throwCheck(currpath);

          if ( fsUtil.isDir(currpath) ) {
            // Push all the subpaths of the directory into the search queue
            const subpaths = fs.readdirSync(currpath);
            for ( let i = 0; i < subpaths.length; ++i ) {
              const abspath = Path.join(currpath, subpaths[i]);
              paths.push(abspath);
            }
          }
          else if ( fsUtil.isFile(currpath) && queue.indexOf(currpath) === -1 ) {
            // Push files into the build queue
            queue.push(currpath);
          }
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
