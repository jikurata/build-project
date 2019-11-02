'use strict';
const fsUtilTest = require('./fs-util.test.js');
const pathUtilTest = require('./path-util.test.js');
const builderTest = require('./builder.test.js');

fsUtilTest
.then(() => pathUtilTest())
.then(() => builderTest())
