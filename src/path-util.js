'use strict';
const Path = require('path');

/**
 * Compares two absolute paths and returns the common path starting from its root
 * @param {String} p1 
 * @param {String} p2
 * @returns {String}
 */
function findCommonRootPath(p1, p2) {
  // Ignore any path blocks that are empty strings
  const path1 = Path.normalize(p1).split(Path.sep).filter(value => value);
  const path2 = Path.normalize(p2).split(Path.sep).filter(value => value);
  const common = []

  // Iterate through the shorter path
  const itr = (path1.length >= path2.legnth) ? path1.length : path2.length;
  for ( let i = 0; i < itr; ++i ) {
    if ( path1[i] === path2[i] ) {
      common.push(path1[i]);
    }
    else {
      break;
    }
  }
  return common.join(Path.sep);
}

/**
 * Combines two paths together, merging matching path levels
 * @param {String} path 
 * @param {String} append
 * @returns {String}
 */
function appendPath(path, append) {
  path = Path.normalize(path);
  append = Path.normalize(append);
  // Check if the buildRoot has a common root with path
  const common = this.findCommonRootPath(path, append);
  if ( common ) {
    append = append.replace(common, '');
  }
  return Path.join(path, append);
}

module.exports = {
  findCommonRootPath: findCommonRootPath,
  appendPath: appendPath
};
