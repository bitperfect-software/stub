import { describe, expect, it } from "vitest";
import type { ResolvedTarget } from "templates/ResolvedTarget.ts";
import { templateTargetsScopeKey } from "templates/templateTargetsScopeKey.ts";
import { makeEngine } from "test/support/makeEngine.ts";

const engine = makeEngine();

const target = (path: string, references: Record<string, string>, defaultReference: string | null): ResolvedTarget => ({
    path,
    references,
    defaultReference,
});

const renderWith = (targets: Record<string, ResolvedTarget>, source: string): string =>
    String(engine.parseAndRenderSync(source, {}, { globals: { [templateTargetsScopeKey]: targets } }));

const unnamed = { formData: target("src/FormData.ts", {}, "@/FormData.ts") };
const named = {
    formData: target("src/FormData.ts", { module: "@/FormData.ts", url: "/FormData.ts" }, null),
};
const withDefault = {
    formData: target("src/FormData.ts", { default: "D", url: "/FormData.ts" }, "D"),
};
const none = { formData: target("src/FormData.ts", {}, null) };

describe("registerReferenceTag", () => {
    it("emits the single unnamed format", () => {
        expect(renderWith(unnamed, '{% reference "formData" %}')).toBe("@/FormData.ts");
    });

    it("errors when as: is used and the manifest declares one unnamed format", () => {
        expect(() => renderWith(unnamed, '{% reference "formData" as: "module" %}')).toThrow(
            'declares a single unnamed format, so drop the "as:"',
        );
    });

    it("emits the named format requested with as:", () => {
        expect(renderWith(named, '{% reference "formData" as: "url" %}')).toBe("/FormData.ts");
    });

    it("errors and lists the declared names when named formats exist and as: is omitted", () => {
        expect(() => renderWith(named, '{% reference "formData" %}')).toThrow(
            "needs a format name — templates.json declares module, url",
        );
    });

    it('uses the format named "default" when as: is omitted', () => {
        expect(renderWith(withDefault, '{% reference "formData" %}')).toBe("D");
    });

    it("errors and lists the declared names for an as: name that is not declared", () => {
        expect(() => renderWith(named, '{% reference "formData" as: "typo" %}')).toThrow(
            "is not a declared reference format — templates.json declares module, url",
        );
    });

    it('errors with "declares no reference formats" when as: is used and none are declared', () => {
        expect(() => renderWith(none, '{% reference "formData" as: "module" %}')).toThrow(
            "declares no reference formats",
        );
    });

    it("falls back to the raw path when the manifest declares no reference field", () => {
        expect(renderWith(none, '{% reference "formData" %}')).toBe("src/FormData.ts");
    });

    it("accepts an optional comma before as:", () => {
        expect(renderWith(named, '{% reference "formData", as: "url" %}')).toBe("/FormData.ts");
    });

    it("rejects an unknown keyword argument at parse time", () => {
        expect(() => renderWith(named, '{% reference "formData" using: "url" %}')).toThrow("reference expects");
    });

    it("rejects a missing colon after as", () => {
        expect(() => renderWith(named, '{% reference "formData" as "url" %}')).toThrow('expects a ":" after "as"');
    });

    it("rejects an unquoted format name", () => {
        expect(() => renderWith(named, '{% reference "formData" as: url %}')).toThrow(
            'expects a quoted format name after "as:"',
        );
    });

    it("rejects a trailing extra argument", () => {
        expect(() => renderWith(named, '{% reference "formData" as: "url" "extra" %}')).toThrow("reference expects");
    });

    it("throws when the name is not in the manifest", () => {
        expect(() => renderWith(named, '{% reference "ghost" %}')).toThrow("not in the manifest");
    });

    // Both tags are independent of `requires` and resolve any entry, including one referring back.
    it("resolves a mutual reference between two entries", () => {
        const mutual = {
            a: target("src/A.ts", {}, "@/A"),
            b: target("src/B.ts", {}, "@/B"),
        };

        expect(renderWith(mutual, '{% reference "a" %}|{% reference "b" %}')).toBe("@/A|@/B");
    });

    it("resolves an entry that is not in the current chain", () => {
        const outside = {
            root: target("src/Root.ts", {}, "@/Root"),
            sibling: target("src/Sibling.ts", {}, "@/Sibling"),
        };

        expect(renderWith(outside, '{% reference "sibling" %}')).toBe("@/Sibling");
    });
});
