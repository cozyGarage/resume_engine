#!/usr/bin/env node
/*
 * remove-fresh.js
 * Prepare package.json & docs to remove FRESH-related dependencies and prefer JRS.
 * The script doesn't remove code automatically; it removes packages and updates docs.
 */
const fs = require('fs');
const p = require('path');

const root = p.resolve(__dirname, '..');
const pkgPath = p.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Packages to remove (fresh-related)
const removeDeps = [
  'fresh-jrs-converter',
  'fresh-resume-schema',
  'fresh-resume-starter',
  'fresh-resume-validator',
  'fresh-themes',
  'fresh-test-resumes',
  'fresh-test-themes',
  'fresh-theme-underscore'
];

if (pkg.dependencies) {
  removeDeps.forEach(dep => delete pkg.dependencies[dep]);
}
if (pkg.devDependencies) {
  removeDeps.forEach(dep => delete pkg.devDependencies[dep]);
}

// Update README/BUILDING/CONTRIBUTING to prefer JRS only
const docsFiles = ['README.md', 'BUILDING.md', 'CONTRIBUTING.md'];
docsFiles.forEach(f => {
  const path = p.join(root, f);
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/FRESH\s+and\s+JSON Resume/gi, 'JSON Resume');
  content = content.replace(/FRESH\s+or\s+JSON Resume/gi, 'JSON Resume');
  content = content.replace(/FRESH/gi, '');
  fs.writeFileSync(path, content);
});

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Prepared package.json and docs for FRESH removal (dependencies removed; docs updated).');
process.exit(0);
