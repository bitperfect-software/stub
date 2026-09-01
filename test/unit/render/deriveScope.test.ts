import { describe, expect, it } from "vitest";
import { deriveScope } from "render/deriveScope.ts";
import { makeEngine } from "test/support/makeEngine.ts";

const engine = makeEngine();
const computed = (name: string, value: string) => ({ name, description: `the ${name}`, value });

describe("deriveScope", () => {
    it("returns a copy of the input when nothing is computed", () => {
        expect(deriveScope(engine, [], { entity: "Product" })).toEqual({ entity: "Product" });
    });

    it("derives a computed value from a variable in the input", () => {
        expect(deriveScope(engine, [computed("plural", "{{ entity }}s")], { entity: "Product" })).toEqual({
            entity: "Product",
            plural: "Products",
        });
    });

    it("derives in declaration order so a later value can use an earlier one", () => {
        const scope = deriveScope(engine, [computed("a", "one"), computed("b", "{{ a }}-two")], {});

        expect(scope.b).toBe("one-two");
    });

    // The expression is deliberately unparseable: if it were evaluated, this would throw.
    it("uses a value passed on the CLI verbatim without evaluating the expression", () => {
        const scope = deriveScope(engine, [computed("plural", "{{ ")], { plural: "Producten" });

        expect(scope.plural).toBe("Producten");
    });

    it("treats an empty string override as an override", () => {
        expect(deriveScope(engine, [computed("suffix", "Default")], { suffix: "" }).suffix).toBe("");
    });

    it("derives when the override is null", () => {
        expect(deriveScope(engine, [computed("suffix", "Default")], { suffix: null }).suffix).toBe("Default");
    });

    it("does not mutate the input object", () => {
        const input = { entity: "Product" };

        deriveScope(engine, [computed("plural", "{{ entity }}s")], input);

        expect(input).toEqual({ entity: "Product" });
    });

    it("lets a later computed of the same name overwrite an earlier one", () => {
        const scope = deriveScope(engine, [computed("label", "first"), computed("label", "second")], {});

        expect(scope.label).toBe("second");
    });

    it("renders a computed value to a string", () => {
        expect(deriveScope(engine, [computed("count", "{{ n }}")], { n: 3 }).count).toBe("3");
    });
});
