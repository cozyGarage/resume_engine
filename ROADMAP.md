Development Roadmap
===================

## Short-Term

### GitHub Integration

HackMyResume will offer GitHub integration for versioned resume storage and
retrieval via the `COMMIT` or `STORE` command(s) starting in 1.7.0 or 1.8.0.

### JSON Resume Themes 1.0.0

The **JSON Resume themes 1.0** ecosystem continues to grow with more themes and
tools. HackMyResume supports all JSON Resume themes from NPM.

### Better LaTeX support

Including Markdown-to-LaTeX translation and more LaTeX-driven themes / formats.

### StackOverflow and LinkedIn support

Will start appearing in v1.7.0, with incremental improvements in 1.8.0 and
beyond.

### Improved resume sorting and arranging

**Better resume sorting** of items and sections: ascending, descending, by
date or other criteria ([#67][i67]).

### Remote resume / theme loading

Support remote loading of themes and resumes over `http`, `https`, and
`git://`. Enable these usage patterns:

    ```bash
    hackmyresume build https://somesite.com/my-resume.json -t informatic

    hackmyresume build resume.json -t npm:fresh-theme-ergonomic

    hackmyresume analyze https://github.com/foo/my-resume
    ```

### 100% code coverage

Should reduce certain classes of errors and allow HMR to display a nifty 100%
code coverage badge.

### Improved **documentation and samples**

Expanded documentation and samples throughout.

## Mid-Term

### Cover letters and job descriptions

Add support for schema-driven **cover letters** and **job descriptions**.

### Character Sheets

HackMyResume 2.0 will ship with support for, yes, RPG-style character sheets.
This will demonstrate the tool's ability to flow arbitrary JSON to concrete
document(s) and provide unique albeit niche functionality around various games
([#117][i117]).

### Rich text (.rtf) output formats

Basic support for **rich text** `.rtf` output formats.

### Investigate: groff support

Investigate adding [**groff**][groff] support, because that would, indeed, be
[dope][d] ([#37][i37]).

### Investigate: org-mode support

Investigate adding [**org mode**][om] support ([#38][i38]).

### Investigate: Scribus

Investigate adding [**Scribus SLA**][scri] support ([#54][i54]).

### Support JSON Resume 1.0.0

When released.

## Bun migration plan (RFC)

This RFC-style plan documents the concrete steps, milestones, risks, and
acceptance criteria for migrating the repository's developer and CI tooling to
Bun, and for incrementally removing Grunt.

Scope
- Replace test/lint/build developer workflows that currently run via Grunt
    with Bun-friendly scripts and CI jobs. Maintain runtime compatibility for
    end users (do not change CLI semantics in this phase).

Goals & success criteria
- Developer `bun install` + `bunx` flows reproduce test runs locally.
- CI jobs run deterministic tests with `HMR_NOW=2018-01-01` and pass.
- At least one CI job exercises PDF generation with `wkhtmltopdf` installed.
- A migration branch is merged with tests and docs updated; Grunt is
    deprecated and removable in a follow-up cleanup PR.
 - The long-term aim is a Bun-first workflow (Bun as primary runtime/tooling). Node.js is retained only as a fallback option for environments where Bun is not available or incompatible.

Milestones
1. Prototype and get tests green under Bun (COMPLETE).
2. Add CI workflows that use Bun and exercise PDFs in a separate job
     (COMPLETE).
3. Add Bun-native npm scripts to `package.json` for clean, lint, and test
     flows (IN-PROGRESS).
4. Convert project contributors' documented dev workflow in `README.md` to
     describe Bun steps (COMPLETE).
5. Run dependency audit and pin ESM-only packages or provide wrappers for
     compatibility (PENDING).
6. Replace Grunt usage in repo (e.g., in `package.json` scripts and CI) and
     remove the Grunt devDependency in a follow-up PR (POST-MIGRATION).

Detailed task list
 - Implemented `scripts/test` npm script that runs, in order:
    (Bun-first):
    1. clean (remove sandbox temp directories)
    2. lint (eslint via bunx)
    3. test (mocha via bunx with `HMR_NOW` pinned)

- Replaced `package.json`'s `test` script to call the new script once tested (COMPLETE).

 - Update `.github/workflows/bun.yml` to call the new `test` script instead of
    `bunx grunt test` and simplify the workflow by removing Grunt install. (IN-PROGRESS: CI now runs Bun-first `bun run test` and Grunt compatibility checks to verify parity.)

- Run tests locally using `bun run test:ci` and `bun run test:bun:direct` to
    validate parity.

Risks & mitigations
- ESM-only dependencies causing runtime errors under Bun. Mitigation: audit
    and pin or replace, and add shims where necessary.
- PDF engines vary across platforms. Mitigation: keep PDF test in a separate
    CI job that installs a known-good engine (`wkhtmltopdf`) on ubuntu-latest.
- Subtle behavioral differences between runtimes (node vs bun). Mitigation:
    keep code changes minimal, prefer environment-variable shims (e.g., `HMR_NOW`)
    and add tests to catch regressions.

Acceptance criteria for removing Grunt
1. All tests pass when run via the new Bun-native script locally.
2. CI green on `main` for the Bun workflow that calls the new script.
3. A PR that removes Grunt files and devDependency is merged with review and
     no functional regressions.

Follow-up work
- Consider migrating HTML→PDF generation to Puppeteer for better rendering,
    or to a JSON→PDF approach (pdfmake/react-pdf) for programmatic PDFs — this
    is an orthogonal feature workstream and should be planned separately.

Audit-first recommendation

Before removing Grunt or making sweeping script changes, perform a focused
dependency audit. The audit will identify ESM-only packages (or packages
whose latest versions are ESM) that can break CommonJS-based test harnesses
when run with Bun or when modules are loaded via `require()`.

Audit checklist (concrete)
1. Run `bun install` and capture any runtime warnings/errors when executing
    `bunx grunt test` or `bunx mocha`.
2. Run `npm ls` (or `bun pm ls`) to get dependency trees; flag packages that
    are known ESM-only (e.g., look for "type":"module" in package.json).
3. For each flagged package, determine:
    - Can we pin to a CJS-compatible older version? If yes, pin and test.
    - If not, can we lazy-load the ESM package with dynamic `import()` in the
      small codepath under test? If yes, create a compatibility shim.
    - If neither option works, list it as a migration blocker and schedule a
      refactor to ESM for that module (larger effort).
4. Create a PR per group of package pins/shims so that changes are reviewable
    and easily reversible.

HMR_NOW guidance

Recommendation: keep the default pinned `HMR_NOW=2018-01-01` for CI and the
main project scripts until test data and expectations are updated. This
ensures parity with historically authored tests and avoids churn during the
tooling migration.

If you want to evaluate behavior with a current date (2025), add a
non-default script that runs the same test pipeline with `HMR_NOW=2025-11-14`.
This lets you test current-date assumptions without changing CI or the main
developer experience.

Ordering: audit first, then Grunt→Bun migration

Why audit first?
- Auditing first reduces surprises: many test failures during runtime migration
  stem from ESM-only deps or other package-level changes. If we migrate
  Grunt before auditing, we risk spending effort on script conversion only to
  be blocked by dependency incompatibilities.

Practical flow
1. Dependency audit (make small, reviewable changes: pins/shims).
2. Update `package.json` with Bun-native scripts (clean, lint, test) and add
    an experimental script that runs tests with a 2025 `HMR_NOW` for parity
    checks.
3. Update CI to call the new scripts and run the audit-fixed code.
4. Remove Grunt devDependency and Gruntfile in a cleanup PR once CI is green
    and developers are comfortable with the Bun-native workflow.



### Migration: JSON → PDF (post-migration)

After the Bun migration and an initial refactor phase, plan a targeted
workstream to prototype converting one or more themes from HTML→PDF to a
JSON→PDF pipeline (for example using `pdfmake` or `react-pdf`). This will be
evaluated after CI is stable and the codebase no longer depends on Grunt.

Rationale:
- JSON→PDF removes the external binary dependency for PDF generation and
    enables programmatic, data-driven layouts.
- Start with a proof-of-concept for a single theme (e.g., `modern`) and
    compare output to existing PDFs. If parity is acceptable, expand the
    migration.


## Long-Term

- TBD

[groff]: http://www.gnu.org/software/groff/
[om]: http://orgmode.org/
[scri]: https://en.wikipedia.org/wiki/Scribus
[d]: https://github.com/hacksalot/HackMyResume/issues/37#issue-123818674
[i37]: https://github.com/hacksalot/HackMyResume/issues/37
[i38]: https://github.com/hacksalot/HackMyResume/issues/38
[i54]: https://github.com/hacksalot/HackMyResume/issues/54
[i67]: https://github.com/hacksalot/HackMyResume/issues/67
[i107]: https://github.com/hacksalot/HackMyResume/issues/107
[i117]: https://github.com/hacksalot/HackMyResume/issues/117
