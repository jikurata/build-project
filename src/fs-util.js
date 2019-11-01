'use strict';
const fs = require('fs-extra');
const Path = require('path');


function isDir(path) {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory();
  }
  catch(err) {
    return false;
  }
}

function isFile(path) {
  try {
    const stat = fs.statSync(path);
    return stat.isFile();
  }
  catch(err) {
    return false;
  }
}

/**
 * Scans path or the current working directory of process for package.json
 * Returns the current path when package.json exists in the directory
 * @returns {String}
 */
function getProjectRoot() {
  let path = Path.normalize(process.cwd());
  if ( isFile(path) ) {
    path = Path.dirname(path);
  }
  const a = path.split(Path.sep)
  while (a.length) {
    const dirpath = a.join(Path.sep);
    const content = fs.readdirSync(dirpath);
    for ( let i = 0; i < content.length; ++i ) {
      // If the directory contains package.json return the directory
      if ( content[i].match('package.json') ) {
        return dirpath;
      }
    }
    a.pop();
  }
  return null;
}

module.exports = {
  getProjectRoot: getProjectRoot,
  isDir: isDir,
  isFile: isFile
};
