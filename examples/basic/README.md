# basic

The smallest manifest that does something: one variable, a path rendered as Liquid, and two filters.

## The manifest

`.stub/templates.json` declares one input and one template:

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

The `greeting` key becomes the `greeting` command, and its body is the file of the same name:

```liquid
{% comment %} .stub/greeting.liquid {% endcomment %}
Hello, {{ name | capitalCase }}!
```

## Running it

```bash
cd examples/basic
stub greeting "world peace"
```

Writes one file:

```
out/world-peace.txt
```

containing:

```
Hello, World Peace!
```

`name` is a **variable**, so it is a required positional argument. It reaches both the `path` and the
body, run through a different filter in each — `kebabCase` for the filename, `capitalCase` for the
greeting.
