'use strict';
const Taste = require('@jikurata/taste');
const Path = require('path');
const pathUtil = require('../src/path-util.js');

const test = new Promise((resolve, reject) => {
  Taste.flavor('Find common root paths')
  .test(profile => {
    profile.test1 = pathUtil.findCommonRootPath('a/b/c/d', 'a/e/f');
    profile.test2 = pathUtil.findCommonRootPath('a/b/c/d', '/a/b/e');
    profile.test3 = pathUtil.findCommonRootPath('a/b/c/d', 'b/c/d');
    profile.test4 = pathUtil.findCommonRootPath('a/b/c/d', 'e/f/g');
  })
  .expect('test1').toEqual(Path.normalize('a'))
  .expect('test2').toEqual(Path.normalize('a/b'))
  .expect('test3').toEqual('')
  .expect('test4').toEqual('')

  Taste.flavor('Appending paths together')
  .test(profile => {
    profile.test1 = pathUtil.appendPath('a/b/c/d/e', 'a/b/c/d/e/text.html');
  })
  .expect('test1').toEqual(Path.normalize('a/b/c/d/e/text.html'))
});


module.exports = test;
