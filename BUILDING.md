If you want to prepare for the eventual removal of Grunt, run the non-destructive helper script:

```bash
./scripts/prepare-grunt-removal.sh
```

This will print the checklist to perform the removal once CI parity is stable.

Building
========

*See [CONTRIBUTING.md][contrib] for more information on contributing to the
HackMyResume or FluentCV projects.*

HackMyResume is a standard Node.js command line app implemented in a mix of
CoffeeScript and JavaScript. Setting up a build environment is easy:


## Prerequisites ##

1. OS: Linux, OS X, or Windows

2. Install Bun (preferred). If Bun is unavailable, install [Node.js][node]. Grunt is currently retained for compatibility but will be removed after a short transition period once CI runs are proving stable.


## Set up a build environment ###

1. Fork [hacksalot/HackMyResume][hmr] to your GitHub account.

2. Clone your fork locally.

3. From within the top-level HackMyResume folder, run `bun install` to install
project dependencies (preferred). If Bun is unavailable, run `npm install`.

5. Run `npm link` in the HackMyResume folder so that the `hackmyresume` command
will reference your local installation (you may need to
`npm uninstall -g hackmyresume` first).

## Making changes

1. HackMyResume sources live in the [`/src`][src] folder.

4. When you're ready to submit your changes, run `bun run test` to run the
	HMR test suite (Bun-first). Use `bunx grunt test` or `npm run test:node` as
	fallback compatibility checks if needed. After a short transition period
	and 3+ successful Bun-first CI runs, Grunt may be removed and contributors
	should run `HMR_NOW=2018-01-01 bun run test` locally before submitting GitHub PRs.

Caching in CI
-------------

CI uses cache for Bun store & Node artifacts to speed up installs. If you
want to force a fresh install locally for testing, remove `~/.bun` and
`node_modules` before running `bun install` or `npm install`.

3. Commit and push your changes.

4. Submit a pull request targeting the HackMyResume `dev` branch.


[node]: https://nodejs.org/en/
[grunt]: http://gruntjs.com/
[hmr]: https://github.com/hacksalot/HackMyResume
[src]: https://github.com/hacksalot/HackMyResume/tree/master/src
[contrib]: https://github.com/hacksalot/HackMyResume/blob/master/CONTRIBUTING.md
