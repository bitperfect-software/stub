# Contributing

Thanks for looking. `stub` is small on purpose — 47 files in `src/`, no framework, no runtime
cleverness — and the aim is to keep it that way.

## Getting set up

```bash
git clone https://github.com/bitperfect-software/stub.git
cd stub
pnpm install
pnpm run check:all
```

Node **22.13+** for development, which is what pnpm 11 itself requires; the published package
supports **>= 22.12**, and CI proves it by installing the tarball on that version. The pnpm version is
pinned by `packageManager` in `package.json` — `corepack enable` will honour it. There is no
watch-mode build: `pnpm run dev` runs the TypeScript sources directly through `tsx`.

| Script | |
|---|---|
| `pnpm run dev -- <args>` | Run the CLI from source. |
| `pnpm run build` | Bundle to `dist/index.js` with esbuild, shebang and executable bit included. |
| `pnpm test` | The whole suite — unit and end-to-end. |
| `pnpm run test:unit` / `test:watch` | Just the unit project; the watch variant for a tight loop. |
| `pnpm run coverage` | Unit coverage against the thresholds in `vitest.config.ts`. |
| `pnpm run typecheck` / `lint` / `format` | Individually. `lint:fix` and `format` write. |
| **`pnpm run check:all`** | **The gate: typecheck, lint, format check, tests. Keep it green.** |

## Verifying a change

Run `pnpm run check:all`. It is the whole story — there is no manual checklist any more.

The suite has two projects, and the split matters:

- **`test/unit/`** exercises the modules in process, through the real Liquid engine and the real Zod
  schema. Most behaviour belongs here.
- **`test/e2e/`** spawns the **built bundle** (`test/support/buildCli.ts` rebuilds it first). Anything
  that depends on the module format, on a dependency's CommonJS/ESM interop, on the shebang or on the
  process exit code is only visible here. A unit test cannot see those: Vite rewrites interop for the
  unit project, so an import that is broken under plain Node can still pass there.

Three fixture sets, each with a different job:

| | |
|---|---|
| `examples/` | The happy path. Also what the docs quote and what a user copies, so it is the one place a change to the rendered output shows up in three places at once. |
| `test/fixtures/` | **Pathological cases only** — a manifest that will not parse, a `requires` cycle, two keys that kebab-case to the same command. One directory per case, copied to a temp dir by `useFixture`; nothing is ever run inside `test/fixtures/` itself. |
| inline, via `writeStubDirectory` | One-off workloads a single test needs. |

To add a failure case: create `test/fixtures/<name>/.stub/templates.json` (plus any `.liquid` bodies),
then add a row to the table in `test/e2e/failures.e2e.test.ts`. That test asserts the exit code, the
message, the **absence of a stack trace**, and that the tree is left unwritten — all four matter.

Changing what the examples render will fail `test/e2e/examples.e2e.test.ts` and, if you touched a
filter or a manifest field, `test/docs/documentationSurface.test.ts`. Both are supposed to: update the
example READMEs and `docs/` in the same commit.

## Architecture

`src/index.ts` is a thin composition root: resolve settings, find the project root, load the workspace,
register commands, hand over to Commander. Everything else is a small function it wires together.

```
src/
  index.ts       composition root
  settings/      stub's OWN configuration — built-in defaults today, user overrides later
  workspace/     "where am I running?" — resolved once at startup
  manifest/      templates.json: its schema, its types, and pure queries over it
  templates/     the only folder that constructs LiquidJS (+ filters/, tags/)
  render/        manifest + input -> plan -> the one write step
  commands/      the only folder that knows Commander, and the only one that prints
  errors/        classifying and formatting whatever reaches the top level
  io/            the generic file read/write primitives
```

One invocation, with the I/O edges marked:

```
resolveSettings()                          pure
findProjectRoot(cwd, stubDirName)          READS fs
loadWorkspace(projectRoot, settings)       READS fs   (manifest + Liquid engine)
collectInputDefinitions(manifest, name)    pure       -> what the CLI accepts
readGlobalOptions(program)                 the one Commander boundary
resolveTemplateChain(manifest, name)       pure       -> render order, cycle-free
deriveScope(engine, computed, input)       reads .stub -> the Liquid variables
resolveTemplateTargets(engine, m, input)   reads .stub -> every entry's path, for {% path %}
planTemplateWrites(workspace, request)     reads .stub -> Array<PlannedWrite>
executeWritePlan(plan)                     WRITES fs  <- the only mutation in the program
console.log                                commands/ only
```

Four properties worth preserving:

- **Plan, then execute.** `planTemplateWrites` computes every target path and file body without touching
  disk; `executeWritePlan` is the only function that writes. A template that fails to render therefore
  leaves *nothing* behind rather than a half-written tree, and the planning half is reusable on its own.
  Don't collapse them back together.
- **`resolveTemplateChain` is the single graph traversal.** It returns the template plus everything it
  `requires`, transitively, pre-order, each name once — and that de-duplication is what breaks
  `requires` cycles. Both the renderer (render order) and the CLI (which options to expose) use it.
  There used to be two traversals plus a process-wide mutable `Set`; don't add a second one back.
- **Targets are resolved once, before anything renders.** `resolveTemplateTargets` renders every entry's
  `path` and every `reference` format up front, and `planTemplateWrites` takes each write's target out
  of that map. So what `{% path %}` emits *is* the file written, not a second rendering that has to
  agree. The map reaches bodies as Liquid **globals** (`templateTargetsScopeKey`), never in the scope:
  globals can't be shadowed by a manifest name and survive the isolated context `{% render %}` spawns.
  `renderExpression` is given no globals, which is what keeps `{% path %}` out of the expressions the
  map is built from — so the tags cannot recurse and need no cycle guard.
- **A broken project must not break the tool.** `guide`, `--help` and `--version` are what someone runs
  *because* their manifest is broken, so nothing on the way to them may depend on a readable manifest.
  `needsWorkspace` and `tryRegisterTemplateCommands` are what enforce that; `errors/isInternalError.ts`
  is what decides whether a failure is reported as the user's problem or as a defect in `stub`.

### Manifest shape

Top level: `project?`, `variables?`, `computed?`, `switches?`, `reference?`, `templates` (record of key
→ template). A template has `path` (required, Liquid-rendered), `description?`, `variables?`,
`computed?`, `switches?`, `requires?`. Globals are merged into every command; a template's own entries
are added on top, and the first declaration of a name wins.

The array fields are `.default([])` in the schema, so they are optional in the JSON but **always present
after parsing**. Downstream code never needs `?? []`; don't add it back.

A template's *command* exposes the `computed` of everything it requires, but at render time each
template derives only the globals plus *its own* `computed`. That asymmetry is intentional: a
`--someChildComputed` override still reaches the child, because every template derives its scope from
the same raw input.

`templates` comes from `z.record`, which carries `Object.prototype` — so `"requires": ["toString"]`
would sail through a plain lookup. Every keyed lookup goes through `manifest/findTemplate.ts`; keep it
that way.

### Vocabulary

The word **`config` is banned in `src/`** — it used to mean three different things at once.

| Concept | Word | Type | Lives in |
|---|---|---|---|
| stub's own knobs (`.stub`, `templates.json`, `.liquid`) | **settings** | `Settings` | `settings/` |
| the user's `templates.json` — the catalogue of what can be generated | **manifest** | `Manifest` | `manifest/` |
| one entry in the manifest | **definition** | `TemplateDefinition`, `VariableDefinition`, … | `manifest/` |
| the resolved project this run operates on | **workspace** | `Workspace` | `workspace/` |
| raw values the user typed for one invocation | **input** | `RenderScope` | `render/` |
| input **plus** the derived computed values, handed to Liquid | **scope** | `RenderScope` | `templates/renderLiquid.ts` |
| what a run intends to write | **plan** / **planned write** | `Array<PlannedWrite>` | `render/` |
| one entry's rendered path plus its rendered `reference` formats | **target** | `ResolvedTarget` | `render/resolveTemplateTargets.ts` |
| how a body points at another entry's target | **reference** | `string` (a Liquid expression) | `manifest/` |

The `input` vs `scope` distinction is load-bearing: `input` is what the user supplied, `scope` is what a
template actually sees. Don't reintroduce a name like `args` that blurs the two.

## Conventions

Most of these are enforced by ESLint; the rest are enforced by review.

- **No relative imports.** Import from the `src` root with an explicit `.ts` extension:
  `import { writeTextFile } from "io/writeTextFile.ts"`. Tests use a `test/*` alias for the same reason,
  so the rule holds repo-wide with no exception.
- **One exported function per file, and the file is named after it.** Type-only modules are PascalCase,
  named after the type (`Workspace.ts`, `PlannedWrite.ts`). Schemas are camelCase values; inferred types
  are PascalCase. A module whose one export is a constant follows the same rule in camelCase
  (`defaultSettings.ts`, `templateTargetsScopeKey.ts`).
- **Layer boundaries**, all greppable and all machine-checked by `no-restricted-imports`:
  `node:fs` only in `io/` and `workspace/findProjectRoot.ts`; `liquidjs` *constructed* only in
  `templates/createTemplateEngine.ts` (elsewhere `import type { Liquid }` and go through
  `templates/renderLiquid.ts`, which also confines LiquidJS's `any` return types); `commander` only in
  `commands/`; `console` only in `commands/` and `index.ts`. Node built-ins take the `node:` prefix.
- No `utils/`, `helpers/` or `types/` folders, no barrel re-exports, no classes, no `this` — with one
  confined exception: a custom Liquid tag must subclass LiquidJS's abstract `Tag`, so
  `templates/tags/register*Tag.ts` holds the only classes and the only `this` in `src/`.
  (`createTagClass`, the alternative, is typed with `any` plus an index signature and does not survive
  `strictTypeChecked`.) A tag's `render` stays a plain synchronous method: every render path here is
  sync, so a promise would never be awaited and a generator would trip `require-yield`.
- ESLint runs `strictTypeChecked` + `stylisticTypeChecked`. Two rules bite often:
  `@typescript-eslint/array-type` is set to `generic`, so write `Array<T>` and never `T[]`; and
  `consistent-type-definitions` requires `interface` (not `type`) for object shapes.
- Prettier: 4-space tabs, 120 columns. Markdown is deliberately **not** formatted by Prettier — prose is
  hand-wrapped.
- **Comments explain the why, not the how.** Keep them sparse; the existing doc comments are the
  reference for tone.
- English throughout: code, comments, docs, commit messages.

### A note on `no-restricted-*` rules

`no-restricted-imports` **replaces rather than merges**, including across config blocks. Two blocks that
both match a file mean the later one wins outright and the earlier one's patterns silently vanish — the
rule then reports nothing and looks like a passing boundary. `eslint.config.mjs` is structured so the
blocks that *lift* a restriction are disjoint, and each states its whole pattern list. If you touch it:
a rule that reports nothing has not been verified. Import the forbidden thing on purpose and count the
errors.

## Adding a command

Each command family is one `commands/register*.ts` plus one line in `src/index.ts`. Most of the pure
parts already exist: `parseManifest` for a `validate` command, `collectInputDefinitions` +
`resolveTemplateChain` for `variables` or `docs`, `planTemplateWrites` without `executeWritePlan` for
`--dry-run`. Those four are on the roadmap rather than imminent — see the README.

Settings come from `resolveSettings()`, which returns the built-in defaults. Reading them from a user's
home directory, `package.json` or `.stub/settings.json` means changing that one function; its signature
and every caller stay as they are.

## Commits and pull requests

- One concern per commit. Imperative subject, and a body that says **why**, not what the diff already
  shows.
- No AI attribution in commit messages, PR titles or PR descriptions.
- `pnpm run check:all` green before you push.
- A pull request should say what changed and how you verified it. If it changes rendered output, say so
  — that is the part that reaches users' repositories.

## Releasing

Releases are cut by pushing a tag; nothing is published from a laptop.

```bash
pnpm version <patch|minor|major>   # commit + v-prefixed tag, matching package.json
git push --follow-tags
```

`.github/workflows/release.yml` fires on `v<major>.<minor>.<patch>` and on the prerelease form
`v<major>.<minor>.<patch>-<something>`. It re-checks that the tag matches `package.json`, runs the
whole gate, smoke-tests the built bundle, and publishes with `--provenance`. A prerelease version goes
out under the `next` dist-tag, everything else under `latest`. A malformed tag (`v1.2`, `release-1`)
does not start a run at all, and a mismatched one fails before anything is published.

Locally, `prepublishOnly` runs `check:all` and `prepack` runs the build, so a release cannot go out on
a red tree or without a fresh bundle. `files: ["dist"]` keeps everything else — `examples/`, `docs/`,
`test/` — out of the tarball; check with `pnpm pack --dry-run` if you change it.

Also update `CHANGELOG.md` before tagging. The GitHub release notes are generated from the commits, so
the changelog is the place where a change is described in terms of what it does to a user's templates.

## Continuous integration

Three workflows, all under `.github/workflows/`:

| | Trigger | What it does |
|---|---|---|
| `ci.yml` | push to `main`, every pull request | `check` runs the gate plus the build on Node 22 and 24. `pack` builds the tarball once; `consume` installs it with npm and runs the CLI on Linux and Windows, on the `engines` floor and on current. The split exists because pnpm needs Node 22.13+, a hair above the package's own 22.12 floor. |
| `docs.yml` | push to `main` touching `docs/**` | Uploads `docs/` verbatim as a Pages artifact and deploys it. |
| `release.yml` | a `v*` tag | Above. |

The `consume` job is the one that matters. It is the only place that catches a missing entry in
`files`, a broken `bin` path, a shebang or executable-bit problem, or a dependency that does not import
as ESM under plain Node — the last of which is a bug this project has actually shipped.

Workflow YAML is inside the Prettier gate (`.github/**/*.yml`), so run `pnpm run format` after editing
one. `prettier --check` exits 2 on a glob that matches nothing, so never add a glob for a directory
that does not exist yet.

## Licence

```
stub — a stack-agnostic stub generator
Copyright (C) 2026 bitperfect GmbH <https://bitperfect.at>

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later version.
```

By contributing you agree that your contribution is licensed under GPL-3.0-or-later, the same licence as
the project.

The licence covers `stub` itself, not its output: `stub` renders the user's own templates and is not
linked into the program they are generating, so nothing it writes is a derivative work.
