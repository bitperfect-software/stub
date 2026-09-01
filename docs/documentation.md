# stub

> `stub` turns a directory of Liquid templates into CLI commands that render project files. It is
> stack-agnostic: the output is just text, and everything it knows about your stack lives in your
> project, never in `stub`.

This is the complete reference. The same material is available offline as `stub guide`, and a shorter
introduction is in the [README](https://github.com/bitperfect-software/stub#readme).

## What it is

`stub` reads a `.stub` directory from your project and turns every entry in its manifest into a
subcommand. Running one renders that entry's Liquid body — and, optionally, a whole chain of related
entries — into files in your project.

The output is just text: TSX, PHP, C#, CSS, SQL, Terraform, anything. `stub` has no opinion about it.

It is built for stubs **too large to keep as editor snippets**: one command that emits a page plus its
hooks, its form, its types and its API layer, parameterised by an entity name and a handful of flags.
For a single file with two substitutions, an editor snippet is the better tool.

A stub is parameterised by three things:

- **variables** — required inputs the user passes positionally.
- **computed** — values derived from those variables by convention, overridable with a CLI option.
- **switches** — boolean flags that include or exclude parts of the output.

## Setting up

Create a `.stub` directory in your project root. `stub` walks up from the current directory until it
finds one, so you can run it from anywhere inside the project.

```
.stub/
  templates.json          the manifest — the catalogue of what can be generated
  component.liquid        the body of the "component" entry
  componentTest.liquid    the body of the "componentTest" entry
```

A template's body file is **its manifest key plus `.liquid`**. There is no `templates` field pointing at
a filename; the key is the filename.

A `.liquid` file that no manifest entry names is not a command and is never written on its own. It can
still be pulled into another body as a partial with Liquid's `{% render %}`, which is how a shared
banner or header is done — see [`examples/module`](https://github.com/bitperfect-software/stub/tree/main/examples/module).

Bodies are standard [LiquidJS](https://liquidjs.com/) templates. Every LiquidJS tag and filter works,
plus the [filters](#filters) and [tags](#referring-to-another-template) `stub` adds.

## The manifest

`templates.json` is the catalogue. Its top level declares the inputs and conventions shared by
everything; `templates` lists the entries themselves. This is
[`examples/module`](https://github.com/bitperfect-software/stub/tree/main/examples/module)'s manifest,
which exercises every feature in this document:

```json
{
    "project": "stub module example",
    "variables": [{ "name": "entity", "description": "The record type to generate, e.g. Invoice" }],
    "computed": [
        { "name": "entityPlural", "description": "Plural form of the entity", "value": "{{ entity | plural }}" },
        { "name": "dir", "description": "Directory the generated files go in", "value": "src/{{ entityPlural | kebabCase }}" }
    ],
    "switches": [{ "name": "noDelete", "description": "Omits the remove function from the store" }],
    "reference": {
        "default": "@/{{ targetPath | remove_first: 'src/' | replace_last: '.ts', '' }}",
        "relative": "./{{ targetPath | split: '/' | last | replace_last: '.ts', '' }}"
    },
    "templates": {
        "model": {
            "description": "Creates a record type, its store and its test",
            "path": "{{ dir }}/{{ entity | pascalCase }}.ts",
            "requires": ["store", "modelTest"]
        },
        "store": {
            "description": "Creates an in-memory store for a record type",
            "path": "{{ dir }}/{{ entity | camelCase }}Store.ts"
        },
        "modelTest": {
            "description": "Creates a test for a record type",
            "path": "{{ dir }}/{{ entity | pascalCase }}.test.ts",
            "computed": [
                { "name": "dir", "description": "Tests live in their own tree", "value": "tests/{{ entityPlural | kebabCase }}" }
            ]
        }
    }
}
```

That manifest gives you three commands — `model`, `store` and `model-test`.

### Top-level fields

| Field | | Meaning |
|---|---|---|
| `templates` | **required** | Manifest key → template. Each key becomes a command. |
| `variables` | | Inputs every command asks for. |
| `computed` | | Values every command derives. |
| `switches` | | Flags every command accepts. |
| `reference` | | How `{% reference %}` formats a path — see [Reference formats](#reference-formats). |
| `project` | | A name for this manifest. Parsed, currently unused. |

### Template fields

| Field | | Meaning |
|---|---|---|
| `path` | **required** | Where the file goes, relative to the project root. Rendered as Liquid, so it can use variables, computed values and filters. |
| `description` | | Shown in `--help`. Defaults to `Create a new <key>`. |
| `variables` | | Inputs only this template asks for. |
| `computed` | | Values only this template derives. |
| `switches` | | Flags only this template accepts. |
| `requires` | | Other manifest keys to render in the same run. |

Every array field is optional and defaults to `[]`. Unknown fields are ignored rather than rejected, so
a comment key like `"//"` is harmless.

## Inputs

`variables`, `computed` and `switches` all take `name` and `description`; `computed` additionally takes
`value`. `name` is used verbatim as the option name, and `description` is what `--help` prints.

### variables

Required positional arguments, in declaration order:

```json
{ "name": "entity", "description": "The record type to generate" }
```

```bash
stub model Invoice
```

An argument with a space needs quoting, like any shell argument. Its value reaches the templates
exactly as typed — apply [filters](#filters) to normalise it.

### computed

Optional overrides. `value` is a Liquid expression evaluated against the input, and passing the option
**skips the expression entirely**:

```json
{ "name": "entityPlural", "description": "Plural form of the entity", "value": "{{ entity | plural }}" }
```

```bash
stub model Person                      # entityPlural is "People"
stub model Person --entityPlural Leute # entityPlural is "Leute"; the expression never runs
```

`--help` prints the expression as the option's default, so it is visible without reading the manifest.

### switches

Boolean flags. Inside a body a switch is simply truthy:

```json
{ "name": "noDelete", "description": "Omits the remove function from the store" }
```

```bash
stub model Invoice --noDelete
```

```liquid
{%- unless noDelete %}
export const remove{{ entity | pascalCase }} = (id: string): boolean => …;
{%- endunless %}
```

**A switch removes content, not files.** It can drop a block inside a body, but it cannot drop an entry
from the run — a template whose whole body is switched off still writes an empty file. Conditional
`requires` is planned; see [Not yet implemented](#not-yet-implemented).

### Merging and order

A command's inputs are the manifest globals, plus the template's own declarations, plus those of
everything it [requires](#requires), deduplicated by name. **The first declaration of a name wins**, so
a global beats a template-local one *for what the command exposes*.

At render time each template derives the globals plus **its own** `computed` — and there the later
declaration wins, so a template-local `computed` shadows a global of the same name in its own output.
In the manifest above, `modelTest` redeclares `dir`, so `stub model Invoice` writes:

```
src/invoices/Invoice.ts
src/invoices/invoiceStore.ts
tests/invoices/Invoice.test.ts      <- modelTest's own dir
```

That asymmetry is deliberate: every template derives its scope from the same raw input, never from a
parent's scope, so an override reaches the whole chain. It also means passing `--dir` on the command
line short-circuits derivation **everywhere**, collapsing the shadowing — an override is a value, not
an expression.

Values are derived left to right, so a later expression can build on an earlier one: `dir` above uses
`entityPlural`, which is declared before it.

### Naming

Command names are **kebab-cased** from the manifest key: `useColumnsHook` becomes
`stub use-columns-hook`. Option names are used **exactly as declared**: `--entityPlural`, `--noDelete`.

## requires

```json
"requires": ["store", "modelTest"]
```

renders those entries in the same run, from the same input. It is **transitive**, each entry is
rendered **once**, and cycles terminate safely — `a` requiring `b` requiring `a` renders both files, one
time each.

A command exposes the options of everything it requires, so a single override reaches the whole chain.

```bash
stub --noRequires model Invoice     # renders only the model
```

`--noRequires` is a **program option**, so it goes *before* the command name.

## Filters

On top of [every standard LiquidJS filter](https://liquidjs.com/filters/overview.html):

| Family | Filters | Example |
|---|---|---|
| Case | `camelCase` `capitalCase` `constantCase` `dotCase` `kebabCase` `noCase` `pascalCase` `pascalSnakeCase` `pathCase` `sentenceCase` `snakeCase` `trainCase` | `{{ "two words" \| pascalCase }}` → `TwoWords` |
| Number | `plural` `singular` (English only) | `{{ "person" \| plural }}` → `people` |
| Fallback | `override` | `{{ entityPlural \| override: custom }}` → `custom` if set, else `entityPlural` |

All twelve case filters, applied to `two words`:

| Filter | Result | | Filter | Result |
|---|---|---|---|---|
| `camelCase` | `twoWords` | | `pascalCase` | `TwoWords` |
| `capitalCase` | `Two Words` | | `pascalSnakeCase` | `Two_Words` |
| `constantCase` | `TWO_WORDS` | | `pathCase` | `two/words` |
| `dotCase` | `two.words` | | `sentenceCase` | `Two words` |
| `kebabCase` | `two-words` | | `snakeCase` | `two_words` |
| `noCase` | `two words` | | `trainCase` | `Two-Words` |

They accept `twoWords` as readily as `two words`; the input is split on case boundaries first.

## Referring to another template

A stub rarely stands alone: a store imports its model, a test imports both. Each of those files is its
own manifest entry with its own `path`, so without help every body ends up retyping a sibling's path —
and the moment that entry's `path` changes, every hand-written copy silently points at nothing.

Two tags let a body **ask the manifest** instead.

### {% path %}

```liquid
{% path "model" %}
```

emits the target file **project-root-relative** — byte-for-byte the path this run writes that entry to:

```
src/invoices/Invoice.ts
```

### {% reference %}

```liquid
{% reference "model" %}                  @/invoices/Invoice
{% reference "model" as: "relative" %}   ./Invoice
```

emits the same target run through a [reference format](#reference-formats), which is how you bridge
"the file lives at `src/invoices/…`" and "the import reads `@/invoices/…`".

The argument to both tags is the **manifest key** of the entry you are pointing at — the name under
`templates`, not a filename.

### Reference formats

Add a top-level `reference` field. It is a Liquid expression in which **`targetPath`** is the target
entry's rendered path. One format does the whole job for a project whose sources live under `src/` and
whose imports use an `@/` alias:

```json
{ "reference": "@/{{ targetPath | remove_first: 'src/' }}" }
```

If one is not enough — imports use an alias, links need a URL — use named formats:

```json
{
    "reference": {
        "default": "@/{{ targetPath | remove_first: 'src/' | replace_last: '.ts', '' }}",
        "relative": "./{{ targetPath | split: '/' | last | replace_last: '.ts', '' }}"
    }
}
```

A format is rendered with the **target's** own scope — its variables and its `computed`, so `{{ entity }}`
inside a format means the *target's* entity — plus `targetPath`.

### The rules

| `reference` declares | `{% reference "x" %}` | `{% reference "x" as: "y" %}` |
|---|---|---|
| nothing | falls back to the raw path, exactly like `{% path %}` | error |
| one unnamed format | uses it | error — drop the `as:` |
| named formats, one called `default` | uses `default` | uses `y`, or errors if `y` is not declared |
| named formats, none called `default` | error — names the formats you did declare | uses `y`, or errors if `y` is not declared |

So you can start with no `reference` field at all and add one when you need it.

## Good to know

- **`stub` overwrites existing files without asking.** Running a command twice destroys hand-edits, with
  no warning and no `--force`. Generate into a clean tree, or commit before you regenerate.
  Overwrite protection is planned; see [Not yet implemented](#not-yet-implemented).
- **Nothing is written unless everything renders.** A run computes every target path and every file body
  before it touches disk, so a failure anywhere leaves the tree exactly as it was.
- **The extension is emitted verbatim.** `{% reference "model" %}` ends in `.ts` if the entry's `path`
  does. Trim it *inside the format* — a tag's output cannot be piped.
- **A tag's output cannot be piped.** To pipe a raw path, capture it first:

  ```liquid
  {% capture target %}{% path "model" %}{% endcapture %}
  {{ target | remove_first: "src/" }}
  ```

- **Both tags take a quoted literal only.** `{% path model %}` and `{% path myVar %}` are rejected at
  parse time. A manifest key names a template rather than being data, and keeping it literal means every
  reference is checkable without running anything.
- **Both are independent of `requires`.** They resolve any entry in the manifest — including one this
  invocation does not write (under `--noRequires`, say), the current template itself, and an entry that
  points back at this one. Nothing loops.
- **The tags work in template bodies only** — not inside a manifest `path`, `computed.value` or
  `reference` expression. That restriction is what keeps them non-recursive.
- **They work inside a `{% render %}` partial**, even though `{% render %}` gives the partial an isolated
  scope that sees none of your variables.
- **Tags and variables do not collide.** `{% path "x" %}` is the tag; `{{ path }}` is still your own
  `path` variable or computed, if you declared one.
- **Wrap literal braces Liquid must not touch** in `{% raw %} … {% endraw %}`.

## Errors

Every message below is a problem with the project, not with `stub`, and is printed without a stack
trace. Set `STUB_DEBUG=1` to get the stack anyway. Anything reported as *"This is a defect in stub"* is
worth [an issue](https://github.com/bitperfect-software/stub/issues).

| Message | What it means |
|---|---|
| `Could not find a .stub directory in … or any parent directory` | You are outside a project that has one. `stub guide`, `--help` and `--version` still work. |
| `File not found: …/templates.json` | The `.stub` directory exists but has no manifest. |
| `Invalid JSON in file: …` | `templates.json` does not parse. The parser's own message follows. |
| `Invalid manifest …` | It parses but does not match the schema. Zod's field-by-field output follows. |
| `Unknown template x` | A `requires` entry, or a command, names a key the manifest does not declare. |
| `ENOENT: Failed to lookup "x" in "…"` | The manifest declares `x` but `.stub/x.liquid` is missing. |
| `tag {% if x %} not closed, line:1, col:1` | A Liquid syntax error in a body, with its file, line and column. |
| `{% path %} expects a quoted template name` | The argument was a variable or was unquoted. Both tags take a literal. |
| `{% path "x" %} refers to a template that is not in the manifest` | Typo in a manifest key. |
| `{% path %} is only available in a template body, not in a manifest expression` | A tag was used in a `path`, `computed.value` or `reference`. |
| `{% reference "x" %} needs a format name — templates.json declares …` | Named formats, none called `default`. Add `as:`. |
| `… but templates.json declares a single unnamed format, so drop the "as:"` | `as:` was passed where there is nothing to pick between. |
| `… is not a declared reference format` | Typo in the format name; the message lists the ones that exist. |
| `cannot add command 'x' as already have command 'x'` | Two manifest keys kebab-case to the same command name. |
| `Cannot add option '--x' … due to conflicting flag` | A `computed` and a `switch` share a name. |

A broken manifest does not take `stub guide`, `stub --help` or `stub --version` down with it — the help
output carries the reason as a footer instead. Those are the commands you run *because* the project is
broken.

## Not yet implemented

Planned, and deliberately not in 0.1.0. Nothing in this document or in `stub --help` promises them.

| | |
|---|---|
| `stub validate` | Check every manifest entry, path and cross-reference without rendering. |
| `--dry-run` | Print the files a run would write, and write none of them. |
| `stub variables <template>` | List the inputs a command takes, as data. |
| `stub docs` | Per-template Markdown generated from the manifest. |
| `stub init` | Scaffold a `.stub` directory from one of the shipped examples. |
| Settings overrides | A configurable directory name and manifest filename, read from the project. |
| Overwrite protection | Refuse by default, with `--force`, or show a diff first. |
| Conditional `requires` | So a switch can remove a *file*, not only content inside one. |
