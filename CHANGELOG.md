# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 — 2026-09-04

Initial public release.

### Added

- **A `.stub/` directory becomes CLI commands.** Every entry in `.stub/templates.json` is registered as
  its own `stub <name>` command, with its own arguments, options and `--help`. The manifest is
  discovered by walking up from the working directory, so a command works from anywhere in the project.
- **Three ways to parameterise a stub.** `variables` are required positional inputs; `computed` values
  are derived from them by convention and each one gets a CLI option that overrides it; `switches` are
  boolean flags that include or exclude parts of a body.
- **`requires`,** so one command renders a whole related set from a single input. The chain is resolved
  transitively and de-duplicated, which is what makes a cycle terminate rather than hang.
  `--noRequires` renders the entry alone.
- **Two cross-reference tags.** `{% path %}` yields another entry's rendered output path and
  `{% reference %}` yields an importable reference to it, so a body never has to retype a sibling's
  location. `{% reference %}` renders through a `reference` format declared in the manifest, so the
  same target can be emitted as an aliased import in one place and a relative one in another.
- **Fifteen filters** on top of LiquidJS's own: twelve `change-case` conversions
  (`camelCase`, `capitalCase`, `constantCase`, `dotCase`, `kebabCase`, `noCase`, `pascalCase`,
  `pascalSnakeCase`, `pathCase`, `sentenceCase`, `snakeCase`, `trainCase`), `plural` and `singular`
  from `pluralize`, and `override`, which lets an
  optional CLI value win over a derived one.
- **Atomic runs.** Every write is planned before any write is performed, so a template that fails to
  render leaves the working tree untouched.
- **`stub guide`,** the full reference offline, and a `--help` overview that lists the project's own
  commands rather than a generic one.
- **Shipped examples.** [`examples/basic`](./examples/basic) is one variable and two filters;
  [`examples/module`](./examples/module) covers computed values, a template-local computed that shadows
  a global, a switch, transitive `requires`, both cross-reference tags and a `{% render %}` partial.
  Both are executed by the end-to-end suite.
- **`STUB_DEBUG=1`** to turn the full stack trace back on when an error is not self-explanatory.

### Fixed

These are fixes relative to the unreleased internal tool this package grew out of; there is no earlier
published version.

- `guide`, `--help` and `--version` now work even when `.stub/templates.json` is malformed. They used to
  fail along with everything else, which meant the one command that explains the manifest format was
  unavailable exactly when you needed it.
- The `plural` and `singular` filters now work on Node. `pluralize` is CommonJS and the named-import
  form only ever resolved under Bun, so every template using either filter crashed.
- Errors are a clean one-line message instead of a stack trace.

### Known limitations

- `stub` overwrites existing files without asking. There is no `--force` and no prompt.
- A switch removes content inside a body; it cannot remove a file from the run.
- `{% path %}` and `{% reference %}` are deliberately non-recursive: they cannot appear in a manifest
  `path`, a `computed.value` or a `reference`.
- `stub validate`, `--dry-run`, `stub init` and settings overrides are on the roadmap and not in this
  release.
