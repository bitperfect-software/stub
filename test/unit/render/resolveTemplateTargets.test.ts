import { describe, expect, it } from "vitest";
import { resolveTemplateTargets } from "render/resolveTemplateTargets.ts";
import { makeEngine } from "test/support/makeEngine.ts";
import { makeManifest } from "test/support/makeManifest.ts";

const engine = makeEngine();
const computed = (name: string, value: string) => ({ name, description: `the ${name}`, value });

const resolve = (declaration: unknown, input: Record<string, unknown> = {}) =>
    resolveTemplateTargets(engine, makeManifest(declaration), input);

describe("resolveTemplateTargets", () => {
    it("resolves every entry in the manifest, not only the requested chain", () => {
        const targets = resolve({ templates: { a: { path: "a.ts" }, b: { path: "b.ts" } } });

        expect(Object.keys(targets)).toEqual(["a", "b"]);
    });

    it("renders each path with that entry's own scope", () => {
        const targets = resolve({
            computed: [computed("dir", "shared")],
            templates: {
                a: { path: "{{ dir }}/a.ts" },
                b: { path: "{{ dir }}/b.ts", computed: [computed("dir", "own")] },
            },
        });

        expect(targets.a?.path).toBe("shared/a.ts");
        expect(targets.b?.path).toBe("own/b.ts");
    });

    it("puts a single unnamed reference into defaultReference and leaves references empty", () => {
        const targets = resolve({ reference: "@/{{ targetPath }}", templates: { a: { path: "src/a.ts" } } });

        expect(targets.a?.defaultReference).toBe("@/src/a.ts");
        expect(targets.a?.references).toEqual({});
    });

    it("renders every named reference format into references", () => {
        const targets = resolve({
            reference: { module: "@/{{ targetPath }}", url: "/{{ targetPath }}" },
            templates: { a: { path: "src/a.ts" } },
        });

        expect(targets.a?.references).toEqual({ module: "@/src/a.ts", url: "/src/a.ts" });
    });

    it('takes defaultReference from a format literally named "default"', () => {
        const targets = resolve({
            reference: { default: "D:{{ targetPath }}", url: "/{{ targetPath }}" },
            templates: { a: { path: "src/a.ts" } },
        });

        expect(targets.a?.defaultReference).toBe("D:src/a.ts");
    });

    it("sets defaultReference to null when named formats do not include a default", () => {
        const targets = resolve({ reference: { url: "/{{ targetPath }}" }, templates: { a: { path: "src/a.ts" } } });

        expect(targets.a?.defaultReference).toBeNull();
    });

    it("sets defaultReference to null when the manifest declares no reference", () => {
        expect(resolve({ templates: { a: { path: "src/a.ts" } } }).a?.defaultReference).toBeNull();
    });

    it("exposes targetPath to a reference format", () => {
        const targets = resolve({ reference: "<{{ targetPath }}>", templates: { a: { path: "src/a.ts" } } });

        expect(targets.a?.defaultReference).toBe("<src/a.ts>");
    });

    it("renders a reference format against the target's own scope", () => {
        const targets = resolve({
            reference: "{{ dir }}!",
            templates: { a: { path: "a.ts", computed: [computed("dir", "own")] } },
        });

        expect(targets.a?.defaultReference).toBe("own!");
    });

    // Liquid is not strict here, so a sibling this run never supplied inputs for still resolves.
    it("renders an entry whose path uses a variable this run never supplied as an empty segment", () => {
        expect(resolve({ templates: { a: { path: "src/{{ nope }}/a.ts" } } }).a?.path).toBe("src//a.ts");
    });

    it("throws when a path expression is not valid Liquid", () => {
        expect(() => resolve({ templates: { a: { path: "{{ " } } })).toThrow(/not closed/);
    });
});
