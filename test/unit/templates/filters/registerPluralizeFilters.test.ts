import { describe, expect, it } from "vitest";
import { makeEngine } from "test/support/makeEngine.ts";

const engine = makeEngine();

const render = (source: string, scope: Record<string, unknown> = {}): string =>
    String(engine.parseAndRenderSync(source, scope));

/**
 * These cover the filters' behaviour, **not** the phase-02 ESM fix. Vite rewrites CommonJS interop
 * for the unit project, so a named `import { plural } from "pluralize"` passes here and fails only
 * under plain Node — verified by reverting the import and watching this file stay green. The bundle
 * is what has to be checked, so the guard lives in `test/e2e/rendering.e2e.test.ts`.
 */
describe("registerPluralizeFilters", () => {
    it.each([
        ["person", "people"],
        ["box", "boxes"],
        ["people", "people"],
    ])('plural turns "%s" into "%s"', (input, expected) => {
        expect(render(`{{ "${input}" | plural }}`)).toBe(expected);
    });

    it.each([
        ["people", "person"],
        ["person", "person"],
    ])('singular turns "%s" into "%s"', (input, expected) => {
        expect(render(`{{ "${input}" | singular }}`)).toBe(expected);
    });

    it("coerces a non-string value", () => {
        expect(render("{{ n | plural }}", { n: 42 })).toBe("42s");
        expect(render("{{ n | singular }}", { n: 42 })).toBe("42");
    });
});
