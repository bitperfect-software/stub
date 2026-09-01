import { describe, expect, it } from "vitest";
import { resolveTemplateChain } from "manifest/resolveTemplateChain.ts";
import { makeManifest } from "test/support/makeManifest.ts";

const chainOf = (templates: Record<string, Array<string>>, root: string): Array<string> =>
    resolveTemplateChain(
        makeManifest({
            templates: Object.fromEntries(
                Object.entries(templates).map(([name, requires]) => [name, { path: `${name}.ts`, requires }]),
            ),
        }),
        root,
    );

describe("resolveTemplateChain", () => {
    it("returns just the root when it requires nothing", () => {
        expect(chainOf({ a: [] }, "a")).toEqual(["a"]);
    });

    it("returns the root followed by its requires in declaration order", () => {
        expect(chainOf({ a: ["b", "c"], b: [], c: [] }, "a")).toEqual(["a", "b", "c"]);
    });

    it("resolves requires transitively, depth first, pre-order", () => {
        expect(chainOf({ a: ["b", "d"], b: ["c"], c: [], d: [] }, "a")).toEqual(["a", "b", "c", "d"]);
    });

    it("returns each name once when two entries require the same one", () => {
        expect(chainOf({ a: ["b", "c"], b: ["d"], c: ["d"], d: [] }, "a")).toEqual(["a", "b", "d", "c"]);
    });

    // De-duplication is what breaks cycles; there is no separate visited set to keep in sync.
    it("terminates on a direct cycle a to b to a", () => {
        expect(chainOf({ a: ["b"], b: ["a"] }, "a")).toEqual(["a", "b"]);
    });

    it("terminates on a self cycle a to a", () => {
        expect(chainOf({ a: ["a"] }, "a")).toEqual(["a"]);
    });

    it("terminates on a three-node cycle a to b to c to a", () => {
        expect(chainOf({ a: ["b"], b: ["c"], c: ["a"] }, "a")).toEqual(["a", "b", "c"]);
    });

    it("returns a required name the manifest does not declare as a leaf", () => {
        expect(chainOf({ a: ["ghost"] }, "a")).toEqual(["a", "ghost"]);
    });

    it("returns an unknown root name as the only element", () => {
        expect(chainOf({ a: [] }, "ghost")).toEqual(["ghost"]);
    });
});
