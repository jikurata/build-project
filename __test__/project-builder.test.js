'use strict';
const fs = require('fs');
const ProjectBuilder = require('../lib/ProjectBuilder.js');
const Logger = require('@jikurata/logger');
Logger.printMessage = false;

describe('Project Builder functional tests', () => {
  describe('use adds a build handler to builder\'s middleware', () => {
    test('middleware\'s length is 1', () => {
      const builder = new ProjectBuilder();
      builder.use((curr, next) => {});
      expect(builder.middleware.length).toBe(1);
    });
  });
  describe('Resolves src paths to their intended build path', () => {
    test('Returns app/client/script/foo.js', () => {
      const builder = new ProjectBuilder('app/client', 'src');
      const path = builder.resolveToDest('src/script/foo.js');
      expect(path).toEqual('app/client/script/foo.js');
    });
    test('Returns app/client/script/foo.js', () => {
      const builder = new ProjectBuilder('app/client', ['src', 'lib']);
      const path = builder.resolveToDest('lib/script/foo.js');
      expect(path).toEqual('app/client/script/foo.js');
    });
    test('Returns app/client/script/foo.js', () => {
      const builder = new ProjectBuilder('app/client', ['src', 'lib/script', 'lib']);
      const path = builder.resolveToDest('lib/script/foo.js');
      expect(path).toEqual('app/client/script/foo.js');
    });
    test('Returns app/client/script/foo.js', () => {
      const builder = new ProjectBuilder('app/client', ['src', 'lib']);
      const path = builder.resolveToDest('dev/src/script/foo.js');
      expect(path).toEqual('app/client/script/foo.js');
    });
  });
  describe('Converts a path into structured info', () => {
    test('returns name as foo.bar', () => {
      const builder = new ProjectBuilder('dist', 'src');
      const info = builder.pathInfo('src/script/foo.bar.js');
      expect(info.name).toEqual('foo.bar');
    });
    test('returns name as foo.bar.bundle', () => {
      const builder = new ProjectBuilder('dist', 'src');
      const info = builder.pathInfo('src/script/foo.bar.bundle.js');
      expect(info.name).toEqual('foo.bar.bundle');
    });
    test('returns name as .config', () => {
      const builder = new ProjectBuilder('dist', 'src');
      const info = builder.pathInfo('src/.config');
      expect(info.name).toEqual('.config');
    });
    test('returns type as js', () => {
      const builder = new ProjectBuilder('dist', 'src');
      const info = builder.pathInfo('src/script/foo.bar.js');
      expect(info.type).toEqual('js');
    });
    test('returns dest as dist/script/foo.bar.js', () => {
      const builder = new ProjectBuilder('dist', 'src');
      const info = builder.pathInfo('src/script/foo.bar.js');
      expect(info.dest).toEqual('dist/script/foo.bar.js');
    });
  });
  describe('Clears dest path of any existing files', () => {
    test('Expect build location to be empty', (done) => {
      const builder = new ProjectBuilder('__test__/example/dist');
      builder.clearDest()
      .then(() => {
        expect(fs.readdirSync('__test__/example/dist').length).toEqual(0)
        done();
      })
      .catch(err => console.error(err));
    });
  });
  describe('Builds src files to dest', () => {
    test('Expect build location to have two files', (done) => {
      const builder = new ProjectBuilder('__test__/example/dist', '__test__/example/src');
      builder.use((curr, next) => {
        if ( curr.type === 'html' || curr.type === 'js' ) {
          fs.copyFileSync(curr.path, curr.dest);
        }
        return next();
      });
      builder.build()
      .then(() => {
        expect(fs.readdirSync('__test__/example/dist').length).toEqual(2)
        done();
      })
      .catch(err => console.error(err));
    });
  });
});
