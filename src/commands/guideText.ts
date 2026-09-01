/**
 * What `stub guide` prints: the whole format reference, sized for a terminal. The README carries the same
 * material in long form; these two are kept in sync by hand so that `commands/` stays free of file reads.
 */
export const guideText = `
stub — generate project files from your own Liquid stubs


WHAT IT IS

  stub turns a directory of templates into CLI commands. It is stack-agnostic: the output
  is just text — TSX, PHP, C#, CSS, SQL, anything — and everything stub knows about your
  stack lives in your project, never in stub.

  It is built for stubs too large to keep as editor snippets: one command that emits a
  page plus its hooks, its form, its types and its API layer, parameterised by an entity
  name and a handful of flags.


SETTING UP

  Create a .stub directory in your project root. stub walks up from the current directory
  until it finds one, so you can run it from anywhere inside the project.

    .stub/
      templates.json          the manifest — the catalogue of what can be generated
      component.liquid        the body of the "component" entry
      componentTest.liquid    the body of the "componentTest" entry

  A template's body file is its manifest key plus ".liquid".


THE MANIFEST

    {
        "variables": [
            { "name": "name", "description": "The component name" }
        ],
        "computed": [
            {
                "name": "dir",
                "description": "Where the component goes",
                "value": "src/components/{{ name | kebabCase }}"
            }
        ],
        "reference": "@/{{ targetPath | remove_first: 'src/' }}",
        "templates": {
            "component": {
                "description": "Creates a component and its test",
                "path": "{{ dir }}/{{ name | pascalCase }}.tsx",
                "switches": [
                    { "name": "noProps", "description": "Omits the props interface" }
                ],
                "requires": ["componentTest"]
            },
            "componentTest": {
                "path": "{{ dir }}/{{ name | pascalCase }}.test.tsx"
            }
        }
    }

  That manifest gives you two commands:

    $ stub component Button        src/components/button/Button.tsx + Button.test.tsx
    $ stub component-test Button   src/components/button/Button.test.tsx


TOP-LEVEL FIELDS

  templates    required. Manifest key -> template. Each key becomes a command.
  variables    inputs every command asks for.
  computed     values every command derives.
  switches     flags every command accepts.
  reference    how {% reference %} formats a path. See REFERRING TO ANOTHER TEMPLATE.
  project      a name for this manifest. Parsed, currently unused.

TEMPLATE FIELDS

  path         required. Where the file goes, relative to the project root. Rendered as
               Liquid, so it can use variables, computed and filters.
  description  shown in --help. Defaults to "Create a new <key>".
  variables    inputs only this template asks for.
  computed     values only this template derives.
  switches     flags only this template accepts.
  requires     other manifest keys to render in the same run.

  Every array field is optional and defaults to []. Unknown fields are ignored.


INPUTS

  variables become required positional arguments, in declaration order.

    { "name": "entity", "description": "The entity to generate" }
    $ stub page Product

  computed become optional overrides. "value" is a Liquid expression evaluated against
  the input; passing the option skips the expression entirely.

    { "name": "entityPlural", "description": "...", "value": "{{ entity | plural }}" }
    $ stub page Person --entityPlural People

  switches become boolean flags, and are simply truthy inside the body.

    { "name": "noDelete", "description": "Omits the delete handler" }
    $ stub page Product --noDelete
    {% unless noDelete %}...{% endunless %}

  Top-level declarations are merged into every command and the template's own are added
  on top; the first declaration of a name wins. computed are derived in order, so a later
  expression can build on an earlier one.

  Command names are kebab-cased (useColumnsHook -> use-columns-hook). Option names are
  used exactly as declared (--entityPlural, --noDelete).


REQUIRES

  "requires": ["componentTest"] renders that entry in the same run, from the same input.
  It is transitive, each entry is rendered once, and cycles terminate safely. A command
  exposes the options of everything it requires, so one override reaches the whole chain.

    $ stub --noRequires component Button      renders only the component

  --noRequires is a program option, so it goes before the command name.


FILTERS

  Case      camelCase capitalCase constantCase dotCase kebabCase noCase pascalCase
            pascalSnakeCase pathCase sentenceCase snakeCase trainCase
              {{ "two words" | pascalCase }}          ->  TwoWords
  Number    plural singular (English only)
              {{ "person" | plural }}                 ->  people
  Fallback  override
              {{ entityPlural | override: custom }}   ->  custom if set, else entityPlural

  Every standard LiquidJS filter is available as well.


REFERRING TO ANOTHER TEMPLATE

  A stub usually imports its siblings. Rather than retyping their paths, point at the
  manifest key and let stub answer:

    {% path "component" %}                   src/components/button/Button.tsx
    {% reference "component" %}              @/components/button/Button.tsx
    {% reference "component" as: "url" %}    /components/button/Button.tsx

  {% path %} emits the file this run writes, relative to the project root. {% reference %}
  runs that through the top-level "reference" field, which is one expression:

    "reference": "@/{{ targetPath | remove_first: 'src/' }}"

  or a set of named ones:

    "reference": {
        "module": "@/{{ targetPath | remove_first: 'src/' }}",
        "url": "/{{ targetPath | remove_first: 'public/' }}"
    }

  targetPath is the target's rendered path, and a format also sees the target's own
  variables and computed. With one unnamed format, "as:" is an error. With named formats,
  "as:" is required unless one of them is called "default". With no reference field at
  all, {% reference %} falls back to the raw path.

  Both tags take a quoted manifest key, never a variable, and resolve any entry — even one
  this run does not write.


GOOD TO KNOW

  - Nothing is written unless everything renders. A failure leaves the tree untouched.
  - The tags do not work inside a manifest path, computed value or reference format.
  - A tag's output cannot be piped. Trim inside the reference format, or capture first:
      {% capture target %}{% path "component" %}{% endcapture %}
  - Wrap literal braces Liquid must not touch in {% raw %} ... {% endraw %}.
  - {% path "x" %} is the tag; {{ path }} is still your own variable called path.

  The same documentation, in long form: https://bitperfect-software.github.io/stub/
`;
