'use strict';
const fs = require('fs');
const Taste = require('@jikurata/taste');
const ProjectBuilder = require('../lib/ProjectBuilder.js');
const Logger = require('@jikurata/logger');
Logger.printMessage = false;


Taste.flavor('Adding middleware to the builder')
.describe('use() adds the passed function as middleware')
.test(() => {
  const builder = new ProjectBuilder();
  builder.use((curr, next) => {});
  Taste.profile.middlewareCount = builder.middleware.length;
})
.expect('middlewareCount').toBe(1);

Taste.flavor('Path resolution')
.describe('Builder resolves relative paths')
.test(() => {
  const builder = new ProjectBuilder('app/client', ['src', 'lib/script', 'lib']);
  Taste.profile.path1 = builder.resolveToDest('src/script/foo.js');
  Taste.profile.path2 = builder.resolveToDest('lib/script/foo.js');
  Taste.profile.path3 = builder.resolveToDest('dev/src/script/foo.js');
  Taste.profile.path4 = builder.resolveToDest('src\\script/foo.js');
})
.expect('path1').toEqual('app/client/script/foo.js')
.expect('path2').toEqual('app/client/script/foo.js')
.expect('path3').toEqual('app/client/script/foo.js')
.expect('path4').toEqual('app/client/script/foo.js');

Taste.flavor('Path details')
.describe('Converts a path into structured info')
.test(() => {
  const builder = new ProjectBuilder('dist', 'src');
  Taste.profile.info1 = builder.pathInfo('src/script/foo.bar.js').name;
  Taste.profile.info2 = builder.pathInfo('src/.config').name;
  Taste.profile.info3 = builder.pathInfo('src/script/foo.bar.js').type;
  Taste.profile.info4 = builder.pathInfo('src/script/foo.bar.js').dest;
})
.expect('info1').toEqual('foo.bar')
.expect('info2').toEqual('.config')
.expect('info3').toEqual('js')
.expect('info4').toEqual('dist/script/foo.bar.js');

Taste.flavor('Cleaning the build location')
.describe('Removes all existing files from the dest path')
.test(() => {
  const builder = new ProjectBuilder('test/example/dist');
  builder.clearDest()
  .then(() => {
    Taste.profile.beforeBuildFileCount = fs.readdirSync('test/example/dist').length;
  })
  .catch(err => console.error(err));
})
.expect('beforeBuildFileCount').toEqual(0);

Taste.flavor('Building a project')
.describe('Builds all valid files from the src locations to dest')
.test(() => {
  const builder = new ProjectBuilder('test/example/dist', 'test/example/src');
  builder.use((curr, next) => {
    const dir = curr.dest.replace(`${curr.name}.${curr.type}`, '');
    if ( !ProjectBuilder.pathExists(dir) ) fs.mkdirSync(dir);
    fs.copyFileSync(curr.path, curr.dest);
    return next();
  });
  builder.build()
  .then(() => {
    Taste.profile.afterBuildFileCount = fs.readdirSync('test/example/dist').length;
  })
  .catch(err => console.error(err));
})
.expect('afterBuildFileCount').toEqual(3)
