
const FS = require('fs');
const PATH = require('path');
FS.mkdirSync(PATH.join(__dirname, '/sandbox'), { recursive: true });

require('./scripts/test-cli');
require('./scripts/test-jrs-sheet');
require('./scripts/test-verbs');
require('./scripts/test-output');
require('./scripts/test-dates');
require('./scripts/test-core');
