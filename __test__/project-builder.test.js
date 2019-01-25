'use strict';
const ProjectBuilder = require('../lib/ProjectBuilder.js');

describe('Project Builder functional tests', () => {
  describe('use adds a build handler to builder\'s middleware', () => {
    test('middleware\'s length is 1', () => {
      const builder = new ProjectBuilder();
      builder.use((curr, next) => {});
      expect(builder.middleware.length).toBe(1);
    });
  });
});
