const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
}

const pkg = readJSON('package.json');
const shrink = readJSON('npm-shrinkwrap.json');

function isPinnedRange(v) {
  // consider exact semver as pinned (e.g., 1.2.3)
  return /^\d+\.\d+\.\d+(-.+)?$/.test(v);
}

function findResolvedVersion(name) {
  if (shrink.dependencies && shrink.dependencies[name] && shrink.dependencies[name].version) {
    return shrink.dependencies[name].version;
  }
  return null;
}

function analyze(map) {
  const results = [];
  for (const [name, spec] of Object.entries(map || {})) {
    const pinned = isPinnedRange(spec);
    const resolved = findResolvedVersion(name);
    if (!pinned) {
      results.push({ name, spec, resolved });
    }
  }
  return results;
}

const depsToPin = analyze(pkg.dependencies);
const devDepsToPin = analyze(pkg.devDependencies);

console.log('Dependency audit report');
console.log('========================');
console.log('Note: This report lists top-level deps/devDeps that are NOT pinned to an exact semver in package.json.');
console.log('You may want to pin these to the resolved versions listed in npm-shrinkwrap.json, or otherwise choose compatible CJS-friendly versions.');
console.log('\nTop-level dependencies to consider pinning:');
if (depsToPin.length === 0) console.log('  (none)');
depsToPin.forEach(d => {
  console.log(`  - ${d.name}: spec="${d.spec}" resolved="${d.resolved || 'UNKNOWN'}"`);
});

console.log('\nTop-level devDependencies to consider pinning:');
if (devDepsToPin.length === 0) console.log('  (none)');
devDepsToPin.forEach(d => {
  console.log(`  - ${d.name}: spec="${d.spec}" resolved="${d.resolved || 'UNKNOWN'}"`);
});

console.log('\nSuggested immediate actions (safe, small):');
console.log('- Pin wildcards and loose ranges (e.g., "*", "^x.x.x") in devDependencies such as `mocha`, `grunt`, or other task runner/test libs to the resolved versions shown above.');
console.log('- For any package where resolved is UNKNOWN, run `bun install` locally and re-run this script to populate shrinkwrap/resolved versions.');
console.log('- After pinning, run `bun install` and `bunx grunt test` (or `bunx mocha`) to verify behavior.');

process.exit(0);
