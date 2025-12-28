# FRESH Removal Audit — 2025-11-14

Purpose: capture every remaining reference to the FRESH format/theme stack so we can safely convert the project to JSON Resume (JRS) only.

---

## 1. Dependencies & lockfiles

- `bun.lock`, `npm-shrinkwrap.json`: still pin runtime FRESH packages like `fresh-jrs-converter`, `fresh-resume-schema`, `fresh-resume-starter`, `fresh-resume-validator`, and `fresh-themes` (these may still be required if FRESH support is retained). Dev-only fixtures such as `fresh-test-resumes`, `fresh-test-themes`, and the sample fresh themes were removed and replaced by in-repo JRS fixtures.
- Runtime `require(...)` calls for `fresh-jrs-converter`, `fresh-resume-schema`, `fresh-resume-starter`, `fresh-themes` appear in `src/core/*`, `src/generators/json-generator.js`, `src/renderers/handlebars-generator.js`, and `src/verbs/build.js`.
- CLI diagnostics in `src/cli/main.js` and scripts in `scripts/remove-fresh.js` / `scripts/prepare-remove-fresh.sh` still assume these packages are installed.

## 2. Core runtime/API surface

- `src/index.js`: exports `FRESHResume`, `FRESHTheme`, and `Sheet` pointing at `core/fresh-resume`.
- `src/core/fresh-resume.js`, `src/core/fresh-theme.js`, and `src/utils/fresh-version-regex.js` implement FRESH-only logic, schema validation (`fresh-resume-schema`), and starter data (`fresh-resume-starter`).
- `src/core/jrs-resume.js` and `src/core/resume-factory.js` still depend on `fresh-jrs-converter` for cross-format operations; `resume-factory` tries to detect and convert between FRESH/JRS.
- `src/utils/resume-detector.js` returns meta formats such as `fresh` when present; `src/helpers/generic-helpers.js` contains helpers referencing “FRESH resume sections” and section-title overrides.

## 3. Verbs, CLI, and analyzer pipeline

- Verbs: `src/verbs/build.js`, `convert.js`, `create.js`, `validate.js`, `analyze.js`, and `verbs/verb.js` comments all mention FRESH. `build` loads both `FRESH` and `JRS` resume classes, detects mixed sheets, picks theme engine (`theme.engine === 'jrs' ? 'JRS' : 'FRESH'`), and fetches `fresh-themes`. `create` accepts `opts.format` (“JSON Resume (JRS) or FRESH”). `convert` still describes conversion “between JSON Resume (JRS) and FRESH”. `analyze` reports format-specific telemetry (`FRESH` vs `JRS`).
- CLI artifacts: `src/cli/main.js`, `src/cli/msg.yml`, and every help topic in `src/cli/help/*.txt` explain how to work with FRESH vs JRS themes/resumes.
- `src/cli/analyze.hbs`, `src/cli/out.js`, and `src/cli/msg.js` include localized strings referencing FRESH support.

## 4. Generators, renderers, and theme plumbing

- `src/generators/json-generator.js`: toggles between FRESH/JRS using `fresh-jrs-converter` before producing JSON text.
- `src/generators/template-generator.js` and downstream renderers (`renderers/handlebars-generator.js`, `renderers/jrs-generator.js`, `renderers/underscore-generator.js`) assume the theme’s `engine` can be `fresh` or `jrs`. The Handlebars renderer imports `fresh-themes/partials` globally.
- `src/renderers/handlebars-generator.js` and `src/verbs/build.js` dynamically resolve “preinstalled FRESH themes” (compact, modern, awesome, positive, etc.).
- Theme metadata in `src/core/default-formats.js`, `src/core/default-options.js`, and helper modules reference “FRESH themes” in comments/examples.

## 5. Documentation, FAQ, and help text

- Top-level markdown: `FAQ.md`, `CHANGELOG.md`, `ROADMAP.md`, `docs/API.md`, `docs/FEATURES.md`, `docs/USAGE.md` all describe dual-format workflows, how to install FRESH themes, and how to choose between FRESH/JRS.
- CLI help topics (`src/cli/help/analyze.txt`, `build.txt`, `convert.txt`, `help.txt`, `new.txt`, `peek.txt`, `use.txt`, `validate.txt`) explicitly instruct users on FRESH usage.
- Example guidance in `README.md` indirectly references “FRESH themes” via links (needs re-check once conversion is done).

## 6. Tests, fixtures, and sandboxes

- Automated tests: `test/scripts/test-fresh-sheet.js`, `test/scripts/test-verbs.js`, `test/scripts/test-dates.js`, `test/scripts/test-output.js`, `test/scripts/test-themes.js`, `test/scripts/test-jrs-sheet.js`, `test/scripts/test-hmr.txt`, `test/scripts/test-programmatic.js`, and `test/all.js` all load `FRESHResume`, `fresh-test-resumes`, or `fresh themes` paths.
- Fixtures under `test/sandbox/FRESH/` (multiple themes per sample resume) plus `test/sandbox/cli-test/new-empty-resume.fresh.json` and other `.fresh.*` artifacts will be obsolete once FRESH is dropped.
- `test/expected/modern/resume.yml` references “FRESH” inside generated YAML output.
- External dev deps: The project previously relied on `node_modules/fresh-test-resumes`, `fresh-test-themes`, `fresh-theme-underscore`, etc. Those dev-only packages have been removed and replaced by local JRS fixtures under `test/fixtures/jrs/`. Remaining references to runtime FRESH packages should be audited to make them optional if removing FRESH entirely.

## 7. Examples, scripts, and misc assets

- `examples/programmatic.js` analyzes/builds the `fresh-test-resumes` samples.
- `scripts/prepare-remove-fresh.sh` + `scripts/remove-fresh.js` were proto-automation for this migration but still assume FRESH packages exist; we should either delete or repurpose them.
- `test/scripts/test-hmr.txt` and other manual test docs describe running FRESH/JRS combos.
- Sample resumes under `test/sandbox/JRS/` mention converting from FRESH to JRS.

## 8. Observations & next steps

- Removing `fresh-jrs-converter` requires rewriting the JSON generator and any code paths that expect to toggle between schemas (`ResumeFactory`, `JRSResume`, analyzers, validators).
- Theme discovery should collapse to JSON Resume themes only, which means `renderers/handlebars-generator.js` and `verbs/build.js` can drop `fresh-themes` partials and `FRESHTheme` instantiation.
- CLI/help/docs/tests must be rewritten to describe a JRS-only workflow; automated fixtures should switch to `jsonresume` sample data checked into the repo instead of `fresh-test-resumes`.
- Lockfiles and `node_modules` cleanup should follow once code stops requiring FRESH packages, so Bun/npm installs no longer pull them in.

This audit feeds directly into the remaining TODOs:
1. **Simplify detection/conversion** — assume JRS input; strip meta-format switching; remove `fresh-jrs-converter` usage.
2. **Remove fresh themes/generators** — delete `core/fresh-*`, `renderers` branches, and bundled FRESH themes/partials.
3. **Update tests & docs** — migrate fixtures, CLI help, FAQ/docs, and programmatic examples to JRS.
