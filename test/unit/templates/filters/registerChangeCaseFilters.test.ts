import { describe, expect, it } from "vitest";
import { makeEngine } from "test/support/makeEngine.ts";

const engine = makeEngine();

const render = (source: string, scope: Record<string, unknown> = {}): string =>
    String(engine.parseAndRenderSync(source, scope));

const cases: Array<[string, string]> = [
    ["camelCase", "twoWords"],
    ["capitalCase", "Two Words"],
    ["constantCase", "TWO_WORDS"],
    ["dotCase", "two.words"],
    ["kebabCase", "two-words"],
    ["noCase", "two words"],
    ["pascalCase", "TwoWords"],
    ["pascalSnakeCase", "Two_Words"],
    ["pathCase", "two/words"],
    ["sentenceCase", "Two words"],
    ["snakeCase", "two_words"],
    ["trainCase", "Two-Words"],
];

describe("registerChangeCaseFilters", () => {
    it.each(cases)('%s turns "two words" into %s', (filterName, expected) => {
        expect(render(`{{ "two words" | ${filterName} }}`)).toBe(expected);
    });

    // The same table against a camel-cased input: the filters split words, they do not only respace.
    it.each(cases)('%s turns "twoWords" into %s', (filterName, expected) => {
        expect(render(`{{ "twoWords" | ${filterName} }}`)).toBe(expected);
    });

    it("coerces a non-string value to a string", () => {
        expect(render("{{ n | kebabCase }}", { n: 42 })).toBe("42");
    });

    it("ignores extra Liquid arguments", () => {
        expect(render('{{ "a b" | kebabCase: "x" }}')).toBe("a-b");
    });
});
