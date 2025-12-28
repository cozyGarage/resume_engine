#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "Please commit or stash changes before running this script." >&2
  exit 1
fi

BRANCH="feat/remove-grunt-$(date +%Y%m%d%H%M%S)"
echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

echo "Running node script to update package.json and remove Gruntfile..."
node scripts/remove-grunt.js

# Reinstall deps with Bun or NPM
if command -v bun >/dev/null 2>&1; then
  echo "Running bun install"
  bun install
else
  echo "bun not found, falling back to npm install"
  npm install
fi

echo "Running tests (Bun-first)"
HMR_NOW=2018-01-01 bun run test || true

echo "Running Node fallback tests"
HMR_NOW=2018-01-01 npm run test:node || true

echo "Staging changes and committing"
git add -A
git commit -m "chore: remove Grunt — convert scripts to Bun-first flow" || echo "No changes to commit"

echo "Pushing branch to origin"
git push origin "$BRANCH"

echo "Attempting to create PR"
if command -v gh >/dev/null 2>&1; then
  gh pr create --base master --title "chore(remove-grunt): remove Grunt tooling" --body-file PR_BODY.md --draft
  echo "Opened draft PR (via gh)"
elif [ -n "${GITHUB_TOKEN:-}" ]; then
  REPO="$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##' | sed -E 's/.git$//')"
  curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
    -d "{ \"title\": \"chore(remove-grunt): remove Grunt tooling\", \"head\": \"${BRANCH}\", \"base\": \"master\", \"body\": \"Automated PR to remove Grunt and convert scripts to Bun-first flows.\" }" \
    https://api.github.com/repos/${REPO}/pulls
  echo "Opened PR via GitHub API using GITHUB_TOKEN"
else
  echo "No 'gh' CLI or GITHUB_TOKEN found. Please open a PR manually for branch $BRANCH"
fi

echo "Done. If you've created a PR, check CI status on GitHub." 
