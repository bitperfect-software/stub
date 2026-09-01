import { describe, expect, it } from "vitest";
import { getTemplate } from "manifest/getTemplate.ts";
import { makeManifest } from "test/support/makeManifest.ts";

const manifest = makeManifest({ templates: { model: { path: "a.ts" } } });

describe("getTemplate", () => {
    it("returns the definition for a declared key", () => {
        expect(getTemplate(manifest, "model").path).toBe("a.ts");
    });

    it("throws Unknown template for a key the manifest does not declare", () => {
        expect(() => getTemplate(manifest, "nope")).toThrow("Unknown template nope");
    });

    // A plain index would resolve these off Object.prototype and fail much later, blaming stub.
    it("throws Unknown template for an inherited Object.prototype key", () => {
        expect(() => getTemplate(manifest, "toString")).toThrow("Unknown template toString");
    });

    it('throws Unknown template for "constructor"', () => {
        expect(() => getTemplate(manifest, "constructor")).toThrow("Unknown template constructor");
    });
});
