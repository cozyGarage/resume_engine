## Summary

Describe the change in this PR and why it's needed.

## Related Issues
- Fixes or addresses: [link to issue or task]

## Checklist
- [ ] CI (Bun-first) is green.
- [ ] All tests pass locally with `HMR_NOW=2018-01-01 bun run test`.
- [ ] Node fallback: `npm run test:node` passes or reasonably OK.
- [ ] If this PR removes Grunt, ensure there have been at least 3 Bun-first CI runs without regression.
- [ ] Update `BUILDING.md`, `CONTRIBUTING.md`, and `README.md` to reflect the removal of Grunt, if applicable.

## Additional Notes
Add any additional notes for reviewers here. If this is a Grunt removal PR, also verify `scripts/prepare-grunt-removal.sh` has been run locally and you captured the checklist changes in your commit.
