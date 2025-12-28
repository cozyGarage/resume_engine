#!/usr/bin/env node
/*
 * remove-grunt.js
 * Automatically remove Grunt references from package.json, scripts, and docs.
 * This script edits package.json, removes Grunt-related devDependencies, and updates scripts.
 * Use in combination with remove-grunt.sh which handles git operations.
 */

const fs = require('fs');
const p = require('path');

const root = p.resolve(__dirname, '..');
const pkgPath = p.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Remove devDependencies that reference grunt
if (pkg.devDependencies) {
  Object.keys(pkg.devDependencies).forEach(k => {
    if (k.startsWith('grunt') || k.includes('grunt-')) {
      delete pkg.devDependencies[k];
    }
  });
}

// Update scripts: replace grunt invocations with direct bunx mocha
const scripts = pkg.scripts || {};
const replaceScript = (name, replacement) => {
  if (scripts[name] && scripts[name].includes('grunt')) {
    scripts[name] = scripts[name].replace(/bunx grunt test/g, replacement);
  }
};

replaceScript('test:bun', 'bunx mocha --exit');
replaceScript('test:ci', 'HMR_NOW=2018-01-01 bunx mocha --exit');
replaceScript('test:ci:2025', 'HMR_NOW=2025-11-14 bunx mocha --exit');
replaceScript('test:bun', 'bunx mocha --exit');

// For test:node, ensure it doesn't reference Grunt
if (scripts['test:node'] && scripts['test:node'].includes('grunt')) {
  scripts['test:node'] = scripts['test:node'].replace(/\&\&\s*.*grunt.*\n?/g, '');
}

// Remove any explicit 'grunt' top-level script (e.g., "grunt": "grunt")
if (scripts['grunt']) {
  delete scripts['grunt'];
}

pkg.scripts = scripts;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json — removed Grunt devDependencies and scripts');

// Remove Gruntfile.js if exists
const gruntfile = p.join(root, 'Gruntfile.js');
if (fs.existsSync(gruntfile)) {
  fs.unlinkSync(gruntfile);
  console.log('Removed Gruntfile.js');
} else {
  console.log('No Gruntfile.js found — nothing to delete');
}

// Replace references in docs
const docs = ['README.md', 'BUILDING.md', 'CONTRIBUTING.md'];
docs.forEach(file => {
  const path = p.join(root, file);
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/\bgrunt\b/g, 'bunx');
    content = content.replace(/Grunt-based/gi, 'legacy Grunt');
    fs.writeFileSync(path, content);
    console.log('Updated docs file:', file);
  }
});

console.log('Completed Grunt removal preparation (package.json and docs updated).');
process.exit(0);
