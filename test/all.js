
var MKDIRP = require('mkdirp');
var PATH = require('path');
MKDIRP( PATH.join( __dirname, '/sandbox' ) );

require('./scripts/test-cli');
require('./scripts/test-jrs-sheet');
require('./scripts/test-verbs');
require('./scripts/test-output');
require('./scripts/test-dates');
