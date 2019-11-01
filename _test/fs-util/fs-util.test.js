'use strict';
const Taste = require('@jikurata/taste');
const fsUtil = require('../../src/fs-util.js');

Taste.flavor('Check if a filepath is a directory')
.test(profile => {
  profile.isDir = fsUtil.isDir('_test/fs-util');
})
.expect('isDir').toBeTruthy();

Taste.flavor('Check if a filepath is a file')
.test(profile => {
  profile.isFile = fsUtil.isFile('_test/fs-util/fs-util.test.js');
})
.expect('isFile').toBeTruthy();

Taste.flavor('Get project root path')
.test(profile => {
  profile.root = fsUtil.getProjectRoot();
})
.expect('root').toBeTruthy();
