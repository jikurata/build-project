'use strict';
const fsUtilTest = require('./fs-util/fs-util.test.js');
const builderTest = require('./builder.test.js');

fsUtilTest
.then(() => builderTest())
