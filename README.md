# stub

[![CI](https://github.com/bitperfect-software/stub/actions/workflows/ci.yml/badge.svg)](https://github.com/bitperfect-software/stub/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@bitperfect-software/stub)](https://www.npmjs.com/package/@bitperfect-software/stub)
[![Node](https://img.shields.io/node/v/@bitperfect-software/stub)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)](./LICENSE)

**A stack-agnostic stub generator.** Drop a `.stub` directory into any project, describe your stubs as
[LiquidJS](https://liquidjs.com/) templates plus a `templates.json` manifest, and `stub` turns each
manifest entry into a CLI command that renders those stubs into the project.

The output is just text — TSX, PHP, C#, CSS, SQL, anything. `stub` makes no assumptions about the
technology being generated: everything it knows about your stack lives in your project's `.stub`
directory, never in `stub` itself. It is built for stubs **too large to keep as editor snippets** — one
command that emits a page plus its hooks, its form, its types and its API layer.

## Install

```bash
npx @bitperfect-software/stub guide        # try it without installing
npm install -g @bitperfect-software/stub   # then just: stub
```

Requires Node **>= 22.12**.

## 30 seconds

```
your-project/
  .stub/
    templates.json
    greeting.liquid
```

`.stub/templates.json`:

```json
{
    "project": "stub basic example",
    "variables": [{ "name": "name", "description": "Who the greeting is for" }],
    "templates": {
        "greeting": {
            "description": "Writes a greeting file",
            "path": "out/{{ name | kebabCase }}.txt"
        }
    }
}
```

`.stub/greeting.liquid` — the body of the `greeting` entry, named after its manifest key:

```liquid
Hello, {{ name | capitalCase }}!
```

That is one command:

```bash
$ stub greeting "world peace"
rendered to out/world-peace.txt
```

```
Hello, World Peace!
```

This is [`examples/basic`](./examples/basic), verbatim.
[`examples/module`](./examples/module) is the interesting one.

## What a stub is parameterised by

- **variables** — required inputs, passed positionally (the entity name).
- **computed** — values derived from them by convention, each overridable with a CLI option.
- **switches** — boolean flags that include or exclude parts of the output.

Entries can `require` other entries, so one command renders a whole related set from a single input,
and two tags — `{% path %}` and `{% reference %}` — let one body import another's output without
retyping its path.

## Documentation

| | |
|---|---|
| Full reference | <https://bitperfect-software.github.io/stub/> |
| Offline | `stub guide`, or `stub --help` |
| For an LLM | [`docs/documentation.md`](./docs/documentation.md) |
| Worked examples | [`examples/`](./examples) |

## Good to know

- **`stub` overwrites existing files without asking.** There is no `--force` and no prompt. Generate
  into a clean tree, or commit before you regenerate.
- **Nothing is written unless everything renders.** A failure anywhere leaves the tree untouched.
- **A switch removes content, not files.** It drops a block inside a body; it cannot drop an entry from
  the run.
- **`--noRequires` is a program option**, so it goes before the command name.

## Roadmap

Planned, and explicitly **not** in 0.1.0:

- `stub validate` — check every manifest entry, path and cross-reference without rendering.
- `--dry-run` — print the files a run would write, and write none of them.
- `stub init` — scaffold a `.stub` directory from one of the shipped examples.
- Overwrite protection — refuse by default, with `--force`, or show a diff first.
- Conditional `requires`, so a switch can remove a file rather than only content inside one.
- Settings overrides — a configurable directory name and manifest filename.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the architecture, the conventions and how to run the
suite, and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for what is expected of participants. Security
problems go through [SECURITY.md](./SECURITY.md), not the issue tracker — note in particular that a
`.stub` directory is executable content and should be trusted exactly as far as the rest of the
repository it lives in.

## License

```
stub — a stack-agnostic stub generator
Copyright (C) 2026 bitperfect GmbH <https://bitperfect.at>

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later version.
```

The full text is in [LICENSE](./LICENSE).

> **What `stub` generates is yours.** `stub` renders your own templates and writes plain text. It is not
> linked into your program, so nothing it outputs is a derivative work of `stub`.

## Built with

[Commander](https://www.npmjs.com/package/commander) ·
[LiquidJS](https://liquidjs.com/) ·
[Zod](https://zod.dev/) ·
[change-case](https://www.npmjs.com/package/change-case) ·
[pluralize](https://www.npmjs.com/package/pluralize)
