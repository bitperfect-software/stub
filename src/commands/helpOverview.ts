/**
 * Appended to the root `--help`. Deliberately short: enough to tell a newcomer what stub is and where its
 * configuration lives, then hand off to `stub guide` for the format reference.
 */
export const helpOverview = `
How it works:
  stub renders your own LiquidJS stubs into your own project. It is stack-agnostic — the
  output is just text — and everything it knows about your stack lives in a .stub directory
  in your project root, never in stub itself.

    .stub/
      templates.json      the manifest: what can be generated, and the inputs it needs
      component.liquid    the body of the "component" entry

  Every entry under "templates" becomes one of the commands listed above:

    {
        "variables": [{ "name": "name", "description": "The component name" }],
        "templates": {
            "component": { "path": "src/components/{{ name | pascalCase }}.tsx" }
        }
    }

    $ stub component Button      ->  src/components/Button.tsx

  Run \`stub guide\` for the manifest format, the filters and the cross-reference tags.
`;
