/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');

// Remove the test sandbox directory used by Grunt tasks so tests are hermetic
const sandboxDir = path.resolve(__dirname, '..', 'test', 'sandbox');

fs.remove(sandboxDir, (err) => {
  if (err) {
    console.error('Failed to clean test sandbox:', err);
    process.exit(1);
  }
  console.log('Test sandbox cleaned:', sandboxDir);
});
