import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Liquid } from "liquidjs";
import { describe, expect, it } from "vitest";
import { guideText } from "commands/guideText.ts";
import { helpOverview } from "commands/helpOverview.ts";
import { manifestSchema, templateDefinitionSchema } from "manifest/manifestSchema.ts";
import { makeEngine } from "test/support/makeEngine.ts";

const repoFile = (relativePath: string): string =>
    fs.readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), "utf-8");

/**
 * Every filter stub adds, derived by diffing a configured engine against a bare one. Reading it off
 * the engine rather than from a list here is the whole point: adding a filter and forgetting the docs
 * has to fail, and a list in this file would only be one more place to forget.
 */
const stubFilterNames = (): Array<string> => {
    const builtIn = new Set(Object.keys(new Liquid().filters));

    return Object.keys(makeEngine().filters).filter((name) => !builtIn.has(name));
};

const manifestFieldNames = [...Object.keys(manifestSchema.shape), ...Object.keys(templateDefinitionSchema.shape)];

const identifiers = (text: string): Array<string> => [...text.matchAll(/[A-Za-z_][\w-]*/g)].map(([word]) => word);

/**
 * Only what a document marks up as code counts as documenting a name. A plain substring search does
 * not work here and looks like it does: `reference`, `path` and `project` are ordinary English in this
 * prose, so deleting a whole table row still leaves every one of them "mentioned".
 */
const markedUpNames = (text: string, span: RegExp): Set<string> =>
    new Set([...text.matchAll(span)].flatMap(([, content]) => identifiers(content ?? "")));

/**
 * A quoted example is not documentation of the names inside it — the manifest sample alone contains
 * every field there is, so counting it would make the field assertions pass no matter what the tables
 * say. Markdown's fenced blocks are excluded by the single-line span pattern; HTML needs it spelled out.
 */
const withoutExamples = (html: string): string => html.replace(/<pre>[\s\S]*?<\/pre>/g, "");

const references = {
    "docs/documentation.md": markedUpNames(repoFile("docs/documentation.md"), /`([^`\n]+)`/g),
    "docs/index.html": markedUpNames(withoutExamples(repoFile("docs/index.html")), /<code>([\s\S]*?)<\/code>/g),
};

/** The guide's sections, keyed by their all-caps heading. Everything else in it is indented. */
const guideSections = ((): Record<string, string> => {
    const sections: Record<string, Array<string>> = {};
    let current: Array<string> = [];

    for (const line of guideText.split("\n")) {
        if (/^[A-Z][A-Z -]*[A-Z]$/.test(line)) sections[line] = current = [];
        else current.push(line);
    }

    return Object.fromEntries(Object.entries(sections).map(([heading, lines]) => [heading, lines.join("\n")]));
})();

/** A field reference row is `  name    meaning`, so the name is the first token of an indented line. */
const rowNames = (section: string): Set<string> =>
    new Set([...section.matchAll(/^ {2}(\S+)/gm)].map(([, name]) => name ?? ""));

describe("documentation surface", () => {
    it("finds fifteen filters, so the diff against a bare engine is finding them at all", () => {
        expect(stubFilterNames()).toHaveLength(15);
    });

    it.each(Object.entries(references))("%s documents every filter", (_, documented) => {
        expect(stubFilterNames().filter((name) => !documented.has(name))).toEqual([]);
    });

    it.each(Object.entries(references))("%s documents every manifest field", (_, documented) => {
        expect(manifestFieldNames.filter((field) => !documented.has(field))).toEqual([]);
    });

    it("stub guide lists every filter in its FILTERS section", () => {
        const documented = new Set(identifiers(guideSections.FILTERS ?? ""));

        expect(stubFilterNames().filter((name) => !documented.has(name))).toEqual([]);
    });

    it("stub guide lists every manifest field in its two field sections", () => {
        const documented = new Set([
            ...rowNames(guideSections["TOP-LEVEL FIELDS"] ?? ""),
            ...rowNames(guideSections["TEMPLATE FIELDS"] ?? ""),
        ]);

        expect(manifestFieldNames.filter((field) => !documented.has(field))).toEqual([]);
    });

    it("keeps the README's example manifest byte-identical to examples/basic", () => {
        const fenced = /```json\n([\s\S]*?)\n```/.exec(repoFile("README.md"));

        expect(fenced?.[1]).toBeDefined();
        expect(`${fenced?.[1] ?? ""}\n`).toBe(repoFile("examples/basic/.stub/templates.json"));
    });

    /**
     * The guard against a deferred feature creeping back into the prose. It covers what the tool itself
     * prints; the docs may — and do — list these under "Not yet implemented".
     */
    it.each([
        ["stub guide", guideText],
        ["stub --help", helpOverview],
    ])("%s promises no command stub does not register", (_, text) => {
        expect(
            ["validate", "--dry-run", "stub variables", "stub docs"].filter((claim) => text.includes(claim)),
        ).toEqual([]);
    });

    /**
     * What replaces generating the terminal guide from the Markdown: both stay hand-written, but they
     * cannot drift into different shapes without failing here.
     */
    it("gives every section of the terminal guide a heading in docs/documentation.md", () => {
        const documented = new Set(
            [...repoFile("docs/documentation.md").matchAll(/^#{2,3} (.+)$/gm)].map(([, heading]) =>
                (heading ?? "").toUpperCase(),
            ),
        );

        expect(Object.keys(guideSections).filter((heading) => !documented.has(heading))).toEqual([]);
    });
});
