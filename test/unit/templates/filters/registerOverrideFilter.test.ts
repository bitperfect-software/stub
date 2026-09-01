import { describe, expect, it } from "vitest";
import { makeEngine } from "test/support/makeEngine.ts";

const engine = makeEngine();

const render = (scope: Record<string, unknown>): string =>
    String(engine.parseAndRenderSync("{{ value | override: given }}", scope));

describe("registerOverrideFilter", () => {
    it("returns the override when set", () => {
        expect(render({ value: "derived", given: "explicit" })).toBe("explicit");
    });

    it("returns the value when the override is undefined", () => {
        expect(render({ value: "derived" })).toBe("derived");
    });

    it("returns the value when the override is null", () => {
        expect(render({ value: "derived", given: null })).toBe("derived");
    });

    it("returns an empty-string override", () => {
        expect(render({ value: "derived", given: "" })).toBe("");
    });
});
