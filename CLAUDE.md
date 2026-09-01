# CLAUDE.md

Guidance for Claude Code (claude.ai/code) and any other agent working in this repository.

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the architecture, the layer boundaries and the test
strategy, and [docs/documentation.md](./docs/documentation.md) for what the tool does. This file is only
the rules that are easy to break without noticing.

## What this is

`stub` is a stack-agnostic stub generator: a `.stub/` directory of LiquidJS templates plus a
`templates.json` manifest becomes CLI commands that render files into the project. The output is just
text. **All knowledge of any particular technology lives in the consuming project's `.stub/`, never in
`src/`.** Commander, LiquidJS, Zod, change-case and pluralize are implementation details of the
generator itself.

## The gate

```bash
pnpm run check:all      # typecheck + lint + format check + tests. Keep it green.
```

Behaviour is checked by the suite, not by hand. `examples/` is the happy-path workload and is executed
by `test/e2e/examples.e2e.test.ts`; `test/fixtures/` holds pathological cases only.

## Rules

- **The word `config` is banned in `src/`.** Use `settings` (stub's own knobs), `manifest` (the user's
  `templates.json`), `definition` (one entry), `workspace`, `input` (what the user typed), `scope`
  (input plus derived values), `plan`, `target`, `reference`. The `input`/`scope` distinction is
  load-bearing — never blur it with a name like `args`.
- **No relative imports.** `import { writeTextFile } from "io/writeTextFile.ts"`, from the `src` root
  with the `.ts` extension. Tests use the `test/*` alias for the same reason.
- **One exported function per file, named after it.** Type-only modules are PascalCase; schemas are
  camelCase values with PascalCase inferred types; a lone constant follows the same rule in camelCase.
- **Write `Array<T>`, never `T[]`** (`array-type: generic`), and `interface`, never `type`, for object
  shapes.
- **Layer boundaries** — all four are ESLint rules, not just prose: `node:fs` only in `io/` and
  `workspace/findProjectRoot.ts`; `liquidjs` constructed only in `templates/createTemplateEngine.ts`;
  `commander` only in `commands/`; `console` only in `commands/` and `index.ts`.
- **No `utils/`, `helpers/` or `types/` folders, no barrel files, no classes, no `this`** — the single
  exception is `templates/tags/register*Tag.ts`, where LiquidJS's extension point is an abstract class.
- **Prettier: 4-space tabs, 120 columns.** Markdown is not Prettier-formatted; prose is hand-wrapped.
- **Comments explain the why, not the how.** Keep them sparse and match the surrounding density.
- **No AI attribution** in commit messages, PR titles or PR descriptions.

## Things that will bite

- **`no-restricted-imports` replaces rather than merges**, across config blocks too. A second block
  matching the same files silently deletes the first one's patterns, and the rule then reports nothing
  while enforcing nothing. If you touch `eslint.config.mjs`, verify by importing the forbidden thing on
  purpose and counting the errors.
- **`prettier --check` exits 2 on a glob that matches nothing**, even when its other globs match. Only
  add a glob for a directory that exists.
- **The unit project cannot see module-format or dependency-interop problems.** Vite rewrites CommonJS
  interop there, so an import that is broken under plain Node still passes. Only `test/e2e/`, which
  spawns the built bundle, catches those. Never guard one with a unit test.
- **Plan, then execute.** `planTemplateWrites` touches no disk; `executeWritePlan` is the only writer.
  A failed render must leave the tree untouched. Don't merge them.
- **`resolveTemplateChain` is the only graph traversal**, and its de-duplication is what makes
  `requires` cycles terminate. Don't add a second one.
- **The custom tags are non-recursive by construction**: `renderExpression` gets no globals, so
  `{% path %}` cannot appear in a manifest `path`, `computed.value` or `reference`. Don't lift that.
- **Documentation is drift-tested.** `test/docs/documentationSurface.test.ts` derives the filters and
  manifest fields from the code; adding either without documenting it in `docs/documentation.md`,
  `docs/index.html` and `src/commands/guideText.ts` fails the gate. It counts marked-up code only, since
  `path`, `reference` and `project` are ordinary English in that prose.
