'use strict';
const ProjectBuilder = require('../lib/ProjectBuilder.js');

describe('Project Builder functional tests', () => {
  describe('use adds a build handler to builder\'s middleware', () => {
    test('middleware\'s length is 1', () => {
      const builder = new ProjectBuilder();
      builder.use((curr, next) => {});
      expect(builder.middleware.length).toBe(1);
    });
    test('Calling next(false) will end the middleware chain execution', () => {
      const builder = new ProjectBuilder();
      let val = 0;
      builder.use((curr, next) => {
        val = 1;
      });
      builder.use((curr, next) => {
        val = 2;
        next();
      });
      builder.use((curr, next) => {
        val = 3;
        next(false);
      });
      builder.use((curr, next) => {
        val = 4;
      });
      builder.build();
      expect(val).toEqual(3);
    });
  });
});
