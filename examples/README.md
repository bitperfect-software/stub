# Examples

Two self-contained projects, each with its own `.stub/` directory. Copy one into a scratch directory,
or run it in place — `stub` walks up from the current directory to find the nearest `.stub`, so
running it from inside an example uses that example's manifest.

| Example | What it shows |
|---|---|
| [`basic`](./basic) | The smallest thing that works: one variable, a Liquid-rendered path, two filters. |
| [`module`](./module) | The whole 0.1.0 surface in four templates: computed values, a template-local computed that shadows a global, a switch, transitive `requires`, both cross-reference tags, named reference formats, and a `{% render %}` partial. |

## Running one

```bash
npm install -g @bitperfect-software/stub

cd examples/basic
stub --help                    # the commands this manifest defines
stub greeting "world peace"
```

Each example's README states the exact command and the exact tree it writes.

`stub` **overwrites existing files without asking**, so run these in a copy if you have edited the
output. The generated `out/`, `src/` and `tests/` directories are gitignored; delete them when you are
done.
