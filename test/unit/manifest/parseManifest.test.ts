import { describe, expect, it } from "vitest";
import { parseManifest } from "manifest/parseManifest.ts";

const source = "/project/.stub/templates.json";

const parse = (data: unknown) => parseManifest(data, source);

describe("parseManifest", () => {
    it("parses a manifest that declares nothing but templates", () => {
        const manifest = parse({ templates: { model: { path: "src/{{ entity }}.ts" } } });

        expect(manifest.templates.model?.path).toBe("src/{{ entity }}.ts");
    });

    it("defaults the top-level variables, computed and switches to empty arrays", () => {
        const manifest = parse({ templates: {} });

        expect(manifest.variables).toEqual([]);
        expect(manifest.computed).toEqual([]);
        expect(manifest.switches).toEqual([]);
    });

    it("defaults a template's variables, computed, switches and requires to empty arrays", () => {
        const definition = parse({ templates: { model: { path: "a.ts" } } }).templates.model;

        expect(definition?.variables).toEqual([]);
        expect(definition?.computed).toEqual([]);
        expect(definition?.switches).toEqual([]);
        expect(definition?.requires).toEqual([]);
    });

    it("defaults reference to an empty record", () => {
        expect(parse({ templates: {} }).reference).toEqual({});
    });

    it("keeps project when declared and leaves it undefined otherwise", () => {
        expect(parse({ project: "demo", templates: {} }).project).toBe("demo");
        expect(parse({ templates: {} }).project).toBeUndefined();
    });

    it("ignores an unknown top-level field", () => {
        expect(parse({ templates: {}, somethingElse: 1 })).not.toHaveProperty("somethingElse");
    });

    it("ignores an unknown field inside a template", () => {
        expect(parse({ templates: { model: { path: "a.ts", extra: true } } }).templates.model).not.toHaveProperty(
            "extra",
        );
    });

    it("accepts a string reference", () => {
        expect(parse({ reference: "@/{{ targetPath }}", templates: {} }).reference).toBe("@/{{ targetPath }}");
    });

    it("accepts a record of named references", () => {
        const reference = { module: "@/{{ targetPath }}", url: "/{{ targetPath }}" };

        expect(parse({ reference, templates: {} }).reference).toEqual(reference);
    });

    it("accepts an empty templates record", () => {
        expect(parse({ templates: {} }).templates).toEqual({});
    });

    it("rejects a manifest with no templates field", () => {
        expect(() => parse({})).toThrow("Invalid manifest");
    });

    it("rejects a template with no path", () => {
        expect(() => parse({ templates: { model: {} } })).toThrow("Invalid manifest");
    });

    it("rejects a variable with no description", () => {
        expect(() => parse({ variables: [{ name: "entity" }], templates: {} })).toThrow("Invalid manifest");
    });

    it("rejects a computed with no value", () => {
        expect(() => parse({ computed: [{ name: "plural", description: "d" }], templates: {} })).toThrow(
            "Invalid manifest",
        );
    });

    it("rejects a reference that is neither a string nor a record", () => {
        expect(() => parse({ reference: 42, templates: {} })).toThrow("Invalid manifest");
    });

    it("rejects a requires entry that is not a string", () => {
        expect(() => parse({ templates: { model: { path: "a.ts", requires: [1] } } })).toThrow("Invalid manifest");
    });

    it("names the source path in the error message", () => {
        expect(() => parse({})).toThrow(source);
    });

    it("names the offending field path in the error message", () => {
        expect(() => parse({ templates: { model: {} } })).toThrow(/templates\.model\.path/);
    });
});
