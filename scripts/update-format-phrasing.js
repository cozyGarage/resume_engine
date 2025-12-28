#!/usr/bin/env node
// A small script to update repository phrasing from FRESH-first to JRS-first
// Usage: node scripts/update-format-phrasing.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const repoRoot = path.resolve(__dirname, '..');

const patterns = [
  '**/*.md',
  '**/*.js',
  '**/*.json',
  '**/*.yml',
  '**/*.yaml',
  'src/**',
  'docs/**',
  'test/**',
  'chat_session/**'
];

const replacements = [
  // JRS-first canonical phrases
  {regex: /JSON Resume (JRS) and FRESH/gi, replace: 'JSON Resume (JRS) and FRESH'},
  {regex: /JSON Resume (JRS) and FRESH/gi, replace: 'JSON Resume (JRS) and FRESH'},
  {regex: /Convert between JSON Resume (JRS) and FRESH/gi, replace: 'Convert between JSON Resume (JRS) and FRESH'},
  {regex: /Convert resumes between JSON Resume (JRS) and FRESH formats/gi, replace: 'Convert resumes between JSON Resume (JRS) and FRESH formats'},
  {regex: /convert resumes between JSON Resume (JRS) and FRESH formats/gi, replace: 'convert resumes between JSON Resume (JRS) and FRESH formats'},
  {regex: /Convert resumes between JSON Resume (JRS) and FRESH formats/gi, replace: 'Convert resumes between JSON Resume (JRS) and FRESH formats'},
  {regex: /between JSON Resume (JRS) and the legacy FRESH Resume Schema/gi, replace: 'between JSON Resume (JRS) and the legacy FRESH Resume Schema'},
  {regex: /\bJSON Resume (JRS) and FRESH Resumes\b/gi, replace: 'JSON Resume (JRS) and FRESH Resumes'},
  {regex: /\bJSON Resume (JRS) and FRESH\b/gi, replace: 'JSON Resume (JRS) and FRESH'},
  {regex: /\bJSON Resume (JRS) and FRESH formats\b/gi, replace: 'JSON Resume (JRS) and FRESH formats'},
  {regex: /\bJRS and FRESH\b/gi, replace: 'JSON Resume (JRS) and FRESH'},
  // Fix accidental pluralization introduced by previous patterns
  {regex: /\bFRESHs\b/gi, replace: 'FRESH Resumes'},
  {regex: /\bJRSs\b/gi, replace: 'JRS Resumes'},
  // Keep existing JRS-first phrases as-is (idempotent)
  {regex: /JSON Resume (JRS) or FRESH/gi, replace: 'JSON Resume (JRS) or FRESH'},
  {regex: /JSON Resume (JRS) or FRESH format/gi, replace: 'JSON Resume (JRS) or FRESH format'},
  {regex: /JSON Resume (JRS) or FRESH schema/gi, replace: 'JSON Resume (JRS) or FRESH schema'},
  {regex: /JSON Resume (JRS) or FRESH theme/gi, replace: 'JSON Resume (JRS) or FRESH theme'},
  // Structural phrases
  {regex: /\bJSON Resume (JRS) or FRESH resume\b/gi, replace: 'JSON Resume (JRS) or FRESH resume'},
  {regex: /\bJSON Resume (JRS) or FRESH command\b/gi, replace: 'JRS or FRESH command'},
];

function processFile(filePath) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return;
  const ext = path.extname(filePath).toLowerCase();
  // Skip binary formats
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'].includes(ext)) return;
  try {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
    replacements.forEach(({regex, replace}) => {
      if (regex.test(content)) {
  content = content.replace(regex, replace);
  changed = true;
      }
    });
    if (changed) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated:', filePath);
    }
  } catch (err) {
    console.error('Error processing', filePath, err.message);
  }
}

function run() {
  patterns.forEach(pat => {
    const opts = {cwd: repoRoot, absolute: true, nodir: true, ignore: ['**/node_modules/**']};
    glob.sync(pat, opts).forEach(processFile);
  });
}

run();

console.log('Done phrasing update pass.');
