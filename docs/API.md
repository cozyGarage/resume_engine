# HackMyResume — Programmatic API Reference

This document describes the programmatic API exported by HackMyResume for use in other projects (upload/download/analyze pipelines, CI, or integration platforms).

## Importing

- Bun/Node (when published as package):

```js
const HMR = require('hackmyresume'); // or import HMR from 'hackmyresume';
```

- From source (for local development):

```js
const HMR = require('./src/index');
```

## Exports

`HMR` exposes common functionality and a set of verb classes in `HMR.verbs`.

Main exports:
- `HMR.verbs` — Classes for verbs: `build`, `analyze`, `validate`, `convert`, `new`, `peek`
- `HMR.FluentDate` — Date helper used by libs and tests
- `HMR.ResumeFactory` — Load/convert FRESH and JRS resumes programmatically
- `HMR.HtmlGenerator`, `HMR.TextGenerator`, etc. — Specific generator modules

## Using the verbs

Verbs are implemented as classes that extend `Verb`. To invoke a verb programmatically:

```js
const BuildVerb = HMR.verbs.build;
const build = new BuildVerb();

// Subscribe to status and error events for progress tracking
build.on('status', info => console.log('status:', info));
build.on('error', err => console.error('error:', err));

build.invoke(['path/to/resume.json'], ['out/resume.html'], { theme: 'modern', pdf: 'none' })
  .then(result => console.log('build result', result))
  .catch(err => console.error('failed', err));
```

`invoke` returns a Promise and can be awaited with `async/await`.

### Analyze verb example

```js
const Analyze = HMR.verbs.analyze;
const a = new Analyze();
const result = await a.invoke(['path/to/resume.json'], null, { private: true });
console.log('metric results:', result);
```

### Validate verb example

```js
const Validate = HMR.verbs.validate;
const v = new Validate();
const result = await v.invoke(['path/to/resume.json'], null, { assert: true });
console.log('validate result:', result);
```

## Event subscription

The verbs support events via `.on('status', handler)` and `.on('error', handler)` to receive progress updates and errors.

## Publishing / Packaging notes

- The `main` entry in `package.json` points to `src/index.js` which provides the programmatic exports (CJS compatible).
- We prefer to publish using Bun for developers (`bun install`, `bun run test`), but the package remains compatible with Node/npm consumers.
- If you are publishing to a package registry, check `package.json` `exports` and `main` fields properly so both `require()` and `import` consumers can use the package.

## Examples

- See `examples/programmatic.js` for a minimal sample that analyzes and builds a resume.

## Integration ideas

- Use the programmatic API in a server endpoint to accept resume uploads, analyze them, and return metrics.
- Use the programmatic API in a batch pipeline to validate, normalize/convert, and generate outputs for uploaded resumes.
- Combine the `analyze` results with a suggestion or recommendation engine for CV improvements.