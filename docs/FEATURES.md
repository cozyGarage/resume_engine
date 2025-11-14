FEATURES
========

Core features of HackMyResume
-----------------------------

- CLI & Programmatic API: Both a command-line and programmatic library-based interface to manipulate, analyze, validate, convert, and generate resumes.
- Supports multiple input formats: FRESH, JSON Resume (JRS).
- Output formats: HTML, Markdown, LaTeX, MS Word, PDF, Plain text, JSON, XML, YAML, PNG, LaTeX.
- Theming: Support for FRESH & JSON Resume themes (modern, positive, compact, awesome, basis, and third-party themes).
- Deterministic testing: `HMR_NOW` allows pinning system 'now' for test stability.
- Bun-first developer experience: `bun install` / `bun run test` primary flow; Node fallback supported.
- Programmatic API: Verb classes (`HMR.verbs.*`) expose operations such as build, analyze, validate, convert, new, and peek.
- CI Workflow: GitHub Actions workflow with caching and PDF job for wkhtmltopdf.
- Linting and tests: ESLint and Mocha-driven test-suite; tests use hermetic CLI invocation.
- Migration-friendly: We've prepared support to remove Grunt after stable Bun-first CI runs.

Advanced
--------

- PDF generation via wkhtmltopdf / PhantomJS / WeasyPrint.
- Bulk resume generation & multi-resume merging support.
- Plugin/theme architecture enabling new theme formats.
