Migration: Bun-first CI + caching, docs, and Grunt removal preparation
===============================================================

Summary
-------
This branch migrates the repository to prefer Bun as the primary runtime and adds CI improvements, deterministic test pinning, programmatic API tests, and a plan to safely remove Grunt after a brief observation period.

What changed
------------
- Add Bun-first CI improvements (installing Bun, using Bun to run tests) and caching for Bun store and Node artifacts.
- Fix a few test issues: deterministic `HMR_NOW` support and hermetic CLI invocation.
- Add `scripts/prepare-grunt-removal.sh` and `docs/GRUNT_REMOVAL_PLAN.md` detailing a safe plan to remove Grunt after 3+ green Bun-first CI runs.
- Update `README.md`, `BUILDING.md`, and `CONTRIBUTING.md` to prefer Bun-first flows and document the plan to remove Grunt.
- Add a PR template and progress notes.

Verification
------------
Locally, verify the Bun-first test flow (preferred):

```bash
bun install
HMR_NOW=2018-01-01 bun run test
```

Node fallback (optional):

```bash
npm install
HMR_NOW=2018-01-01 npm run test:node
```

The CI workflow will run on this branch and should report cached installs and Bun-first tests for validation.

Next steps
----------
1. Observe CI for 3+ stable Bun-first runs.
2. After 3 successful runs, run `./scripts/prepare-grunt-removal.sh`, create a `feat/remove-grunt` branch, and prepare a PR to remove Grunt and its devDependencies.
3. Optionally add a `bun.lockb` to the repo, then update CI caching keys to use it for better determinism.

Notes for maintainers
---------------------
- The `scripts/prepare-grunt-removal.sh` is non-destructive and prints a checklist to help prepare the final removal PR.
- PDF tests require wkhtmltopdf or other PDF engines; the `pdf` CI job installs `wkhtmltopdf` to exercise those paths.
- Please review `docs/GRUNT_REMOVAL_PLAN.md` for steps & criteria to remove Grunt safely.
