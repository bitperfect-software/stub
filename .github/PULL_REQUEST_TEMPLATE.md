## What changed

<!-- And why. The diff already says what; the body should say why. -->

## How you verified it

<!-- Which tests, and anything you ran by hand. -->

## Checklist

- [ ] `pnpm run check:all` is green
- [ ] Tests cover the change — unit for pure modules, `test/e2e/` for anything about the built bundle,
      module format or dependency interop (the unit project cannot see those)
- [ ] If this changes what gets written into a user's repository, the description says so
- [ ] If this adds a filter or a manifest field, it is documented in `docs/documentation.md`,
      `docs/index.html` and `src/commands/guideText.ts` — `test/docs/documentationSurface.test.ts`
      fails otherwise
- [ ] No AI attribution in the commits, the title or this description
