Contributing
============

*Note: HackMyResume is also available as [FluentCV][fcv]. Contributors are
credited in both.*

## How To Contribute

*See [BUILDING.md][building] for instructions on setting up a HackMyResume
development environment.*

1. Optional: [**open an issue**][iss] identifying the feature or bug you'd like
to implement or fix. This step isn't required — you can start hacking away on
HackMyResume without clearing it with us — but helps avoid duplication of work
and ensures that your changes will be accepted once submitted.
2. **Fork and clone** the HackMyResume project.
3. Ideally, **create a new feature branch** (eg, `feat/new-awesome-feature` or
similar; call it whatever you like) to perform your work in.
4. **Install dependencies** by running `bun install` in the top-level
HackMyResume folder (preferred). If Bun is not available, run `npm install`.
5. Make your **commits** as usual.
6. **Verify** your changes locally with `bun run test` (Bun-first). You can also run `bunx bunx test` as a compatibility check (fallback) or `npm run test:node` for Node-only verification. After 3 successful Bun-first CI runs we plan to remove the Grunt compatibility path entirely. Use `./scripts/prepare-bunx-removal.sh` to get a checklist that helps prepare the removal PR when you're ready.
7. **Push** your commits.
7. **Submit a pull request** from your feature branch to the HackMyResume `master` branch. If you are targeting an alternate development branch, please create PRs there first per team policy.
8. We'll typically **respond** within 24 hours.
9. Your awesome changes will be **merged** after verification.

## Project Maintainers

HackMyResume is currently maintained by [hacksalot][ha] with assistance from
[tomheon][th] and our awesome [contributors][awesome]. Please direct all official
or internal inquiries to:

```
admin@fluentdesk.com
```

You can reach hacksalot directly at:

```
hacksalot@indevious.com
```

Thanks for your interest in the HackMyResume project.

[fcv]: https://github.com/fluentdesk/fluentcv
[flow]: https://guides.github.com/introduction/flow/
[iss]: https://github.com/hacksalot/HackMyResume/issues
[ha]: https://github.com/hacksalot
[th]: https://github.com/tomheon
[awesome]: https://github.com/hacksalot/HackMyResume/graphs/contributors
[building]: https://github.com/hacksalot/HackMyResume/blob/master/BUILDING.md
