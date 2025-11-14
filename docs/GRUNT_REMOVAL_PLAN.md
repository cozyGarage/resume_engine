Grunt removal plan
==================

We are migrating the HackMyResume project to Bun as the primary runtime. To
ensure a smooth transition and minimize disruption, we will stagger the
removal of Grunt as follows:

1. Stabilize Bun-first CI: Ensure the 'test' job and optional 'pdf' job run
   reliably on Bun for multiple CI runs. The current workflow runs Bun-first
   tests, Grunt compatibility, and Node fallback; we'll rely on Bun-first being
   green several times before removing Grunt.

2. Grace / observation period: After 3 successive successful Bun-first CI
   runs on the default branch, prepare a follow-up PR that removes Grunt and
   Grunt-specific devDependencies.

3. Prepare a conservation PR that:
   - Removes Grunt and Grunt plugins from `devDependencies` in `package.json`.
   - Removes any `Gruntfile.js` references and tasks used only for test orchestration.
   - Updates `package.json` scripts that depended on Grunt (e.g., `test:ci`, `test:bun`).
   - Updates documentation to remove references to Grunt.

4. Run CI & verify: The PR will run the Bun-first CI. If successful and
   the maintainers are confident, merge. If any regression appears, revert
   and address the problem; we may keep Grunt for a longer transition period.

Notes:
- We strongly prefer Bun-first test runs but will maintain Node fallback
  scripts for a while as these are harmless and help continuous integration
  with older developer setups.
- After the Grunt removal PR is merged, update `BUILDING.md`, `README.md`,
  and `CONTRIBUTING.md` to remove the compatibility references.

If you want to help with testing the removal PR, please check out the
`migrate/bun` branch and re-run `bun run test` and `npm run test:node`.

-- The HackMyResume Maintainers
