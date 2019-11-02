'use strict';
const Taste = require('@jikurata/taste');
const fs = require('fs-extra');
const ProjectBuilder = require('../src/ProjectBuilder.js');

const test = new Promise((resolve, reject) => {
  Taste.flavor('Add handler to the builder')
  .test(profile => {
    const builder = new ProjectBuilder();
    builder.use((file, next) => {});
    profile.handlers = builder.handlers.length;
    resolve();
  })
  .expect('handlers').toEqual(1);
})
.then(() => new Promise((resolve, reject) => {
  Taste.flavor('Build Events')
  .test(profile => {
    const builder = new ProjectBuilder();
    builder.use((file, next) => {});
    builder.on('search-start', (file) => {
      profile.searchStart = true;
    });
    builder.on('search-complete', (file) => {
      profile.searchComplete = true;
    });
    builder.on('file-start', (file) => {
      profile.fileStart = true;
    });
    builder.on('file-complete', (file) => {
      profile.fileComplete = true;
    });
    builder.on('build-start', (file) => {
      profile.buildStart = true;
    });
    builder.on('build-complete', (file) => {
      profile.buildComplete = true;
    });
    builder.build(['_test/example/src/index.html'])
    .then(() => resolve());
  })
  .expect('searchStart').toBeTruthy()
  .expect('searchComplete').toBeTruthy()
  .expect('fileStart').toBeTruthy()
  .expect('fileComplete').toBeTruthy()
  .expect('buildStart').toBeTruthy()
  .expect('buildComplete').toBeTruthy();
}))
.then(() => new Promise((resolve, reject) => {
  Taste.flavor('Scanning source paths')
  .describe('Retrieves filepaths for all files within the sources')
  .test(profile => {
    const builder = new ProjectBuilder();
    builder.on('search-complete', (queue) => {
      profile.search = queue.length;
      resolve();
    })
    builder.build(['_test/example/src']);
  })
  .expect('search').toEqual(3);
}))
.then(() => new Promise((resolve, reject) => {
  Taste.flavor('Building a project')
  .describe('Iterate through every source file')
  .test(profile => {
    const builder = new ProjectBuilder();
    let counter = 0;
    builder.use((file, next) => {
      ++counter;
    });
    // Expect three files in the source location
    builder.build(['_test/example/src'])
    .then(() => {
      profile.afterBuildFileCount = counter;
      resolve();
    });
  })
  .expect('afterBuildFileCount').toEqual(3);
}))
.then(() => new Promise((resolve, reject) => {
  Taste.flavor('Iterates through every handler')
  .test(profile => {
    const builder = new ProjectBuilder();
    let counter = 0;
    builder.use((file, next) => {
      ++counter;
    });
    builder.use((file, next) => {
      ++counter;
    });
    builder.build(['_test/example/src/index.html'])
    .then(() => {
      profile.handlerCount = counter;
      resolve();
    });
  })
  .expect('handlerCount').toEqual(2);
}))
.then(() => new Promise((resolve, reject) => {
  Taste.flavor('Builder throws when no source is provided')
  .test(profile => {
    const builder = new ProjectBuilder();
    builder.build()
    .then(() => {
      profile.error = '';
    })
    .catch(err => {
      profile.error = err;
    })
  })
  .expect('error').toBeTruthy();
}))

module.exports = test;
