#!/usr/bin/env bash
# Helper script to prepare for Grunt removal. This script does not delete or
# modify any files, but instead prints a checklist and the commands you can run
# to perform the removal once CI parity is verified.

set -euo pipefail

echo "Grunt removal preparation script"
echo "--------------------------------"
echo "This script checks for usages of 'grunt' in repo and prints the steps to remove it once you are ready."
echo

echo "Checking for grunt usages..."
grep -R --line-number "grunt" | sed -n '1,200p' || true
echo
echo "Suggestions to remove Grunt (run only after 3+ green Bun-first CI runs):"
echo "1) Remove Grunt and plugins from package.json devDependencies" 
echo "   e.g. in package.json: delete lines referencing grunt, grunt-* packages" 
echo "2) Remove or update any scripts that reference grunt (e.g., test:bun/test:ci/test:ci:2025)" 
echo "3) Remove the Gruntfile: rm Gruntfile.js" 
echo "4) Update docs: BUILDING.md, README.md, CONTRIBUTING.md to remove references to Grunt" 
echo "5) Run the Bun-first test suite: HMR_NOW=2018-01-01 bun run test" 
echo "6) Remove package-lock or shrinkwrap steps if you rely on bun.lockb instead" 
echo "7) Commit and open a PR with the changes" 

echo "If you want to automate a baseline diff to review prior to committing, run:" 
echo "  git checkout -b feat/remove-grunt" 
echo "  # Apply manual edits to package.json and Gruntfile.js, then run:"
echo "  git add -A && git commit -m 'chore: remove Grunt after Bun migration parity'"

echo "Done. This script only prints recommended commands and does not modify your repository."

exit 0
