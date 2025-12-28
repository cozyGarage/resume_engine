USAGE
=====

This document describes how to use the HackMyResume CLI and programmatic API.

Prerequisites
-------------
- Bun (preferred): https://bun.sh
- Node.js & npm (fallback)
- Optional PDF engines: wkhtmltopdf, PhantomJS, WeasyPrint

Quickstart (Bun-first)
----------------------

Install Bun (if not installed):

```bash
curl -fsSL https://bun.sh/install | bash
# Restart your shell if necessary to add $HOME/.bun/bin to PATH
```

Install dependencies:

```bash
bun install
```

Run the test suite (deterministic):

```bash
HMR_NOW=2018-01-01 bun run test
```

CLI Usage
---------

The primary CLI entrypoint is `hackmyresume`.

Examples

Create a new resume (JSON Resume - JRS):

```bash
hackmyresume new my-resume.json
```

Analyze a resume:

```bash
hackmyresume analyze my-resume.json
```

Build a resume to HTML & PDF (using a theme):

```bash
	hackmyresume build my-resume.json TO resume.html --theme modern --pdf wkhtmltopdf
```

Programmatic Usage - CommonJS
----------------------------

```js
const HMR = require('hackmyresume');

// Programmatic Analyze
const Analyze = HMR.verbs.analyze;
const a = new Analyze();
a.on('status', s => console.log('status', s));
a.invoke(['path/to/resume.json'], null, {}).then(result => console.log(result));

// Programmatic Build
const Build = HMR.verbs.build;
const b = new Build();
b.invoke(['path/to/resume.json'], ['path/to/out.html'], {theme: 'modern', pdf: 'none'})
 .then(result => console.log('built', result));
```

Notes
-----
- Use `HMR_NOW` to pin time sensitive tests when needed (e.g. 2018-01-01).
- Programmatic API uses an event-emitter model and `invoke` returns a Promise.
- Some PDF generation paths require native binaries; skip if not needed locally.
