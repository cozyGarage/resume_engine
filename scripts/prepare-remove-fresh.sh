#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "Please commit or stash changes before running this script." >&2
  exit 1
fi

BRANCH="feat/remove-fresh-$(date +%Y%m%d%H%M%S)"
echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

echo "Listing files containing the word 'fresh' (case-insensitive) in the repo..."
grep -Rin --line-number "\bfresh\b" || true

echo "Preparing remove-fresh README updates and package.json cleanup..."
node scripts/remove-fresh.js

echo "Attempting to run tests (Bun-first)"
HMR_NOW=2018-01-01 bun run test || true

echo "Attempting Node fallback tests"
HMR_NOW=2018-01-01 npm run test:node || true

echo "Staging & committing changes (if any)"
git add -A
git commit -m "chore(remove-fresh): update docs & remove fresh dependencies" || echo "No changes to commit"

echo "Pushing branch to origin"
git push origin "$BRANCH"

echo "Attempting to create PR"
if command -v gh >/dev/null 2>&1; then
  gh pr create --base master --title "chore(remove-fresh): remove FRESH dependencies & docs" --body-file PR_BODY.md --draft
  echo "Opened draft PR (via gh)"
elif [ -n "${GITHUB_TOKEN:-}" ]; then
  REPO="$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##' | sed -E 's/.git$//')"
  curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
    -d "{ \"title\": \"chore(remove-fresh): remove FRESH dependencies & docs\", \"head\": \"${BRANCH}\", \"base\": \"master\", \"body\": \"Automated PR to remove FRESH related dependencies and update docs to default to JSON Resume (JRS)\" }" \
    https://api.github.com/repos/${REPO}/pulls
  echo "Opened PR via GitHub API using GITHUB_TOKEN"
else
  echo "No 'gh' CLI or GITHUB_TOKEN found. Please open a PR manually for branch $BRANCH"
fi

echo "Done — a PR has been created (if possible); please review and test before merging."
