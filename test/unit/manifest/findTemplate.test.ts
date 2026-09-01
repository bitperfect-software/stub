import { describe, expect, it } from "vitest";
import { findTemplate } from "manifest/findTemplate.ts";
import { makeManifest } from "test/support/makeManifest.ts";

const manifest = makeManifest({ templates: { model: { path: "a.ts" } } });

describe("findTemplate", () => {
    it("returns the definition for a declared key", () => {
        expect(findTemplate(manifest, "model")?.path).toBe("a.ts");
    });

    it("returns undefined for a key the manifest does not declare", () => {
        expect(findTemplate(manifest, "nope")).toBeUndefined();
    });

    it("returns undefined for an inherited Object.prototype key", () => {
        expect(findTemplate(manifest, "toString")).toBeUndefined();
    });
});
