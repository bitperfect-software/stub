import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import type { ResolvedTarget } from "templates/ResolvedTarget.ts";
import { templateTargetsScopeKey } from "templates/templateTargetsScopeKey.ts";
import { makeEngine } from "test/support/makeEngine.ts";
import { tempDir } from "test/support/tempDir.ts";

const engine = makeEngine();

const targets: Record<string, ResolvedTarget> = {
    formData: { path: "src/ProductFormData.ts", references: {}, defaultReference: null },
    page: { path: "src/ProductPage.tsx", references: {}, defaultReference: null },
};

const render = (source: string, scope: Record<string, unknown> = {}): string =>
    String(engine.parseAndRenderSync(source, scope, { globals: { [templateTargetsScopeKey]: targets } }));

describe("registerPathTag", () => {
    it("emits the resolved path of the named entry", () => {
        expect(render('{% path "formData" %}')).toBe("src/ProductFormData.ts");
    });

    it("accepts single quotes", () => {
        expect(render("{% path 'formData' %}")).toBe("src/ProductFormData.ts");
    });

    // A manifest key names a template rather than being data, so only a literal is accepted.
    it("rejects a bare identifier at parse time", () => {
        expect(() => render("{% path formData %}")).toThrow("expects a quoted template name");
    });

    it("rejects a variable argument at parse time", () => {
        expect(() => render("{% path name %}", { name: "formData" })).toThrow("expects a quoted template name");
    });

    it("rejects a second argument", () => {
        expect(() => render('{% path "formData" "page" %}')).toThrow("takes exactly one argument");
    });

    it("rejects no argument", () => {
        expect(() => render("{% path %}")).toThrow("expects a quoted template name");
    });

    it("throws when the name is not in the manifest", () => {
        expect(() => render('{% path "ghost" %}')).toThrow(
            '{% path "ghost" %} refers to a template that is not in the manifest',
        );
    });

    it("throws when rendered without the targets globals", () => {
        expect(() => void engine.parseAndRenderSync('{% path "formData" %}', {})).toThrow(
            "only available in a template body",
        );
    });

    // The targets travel as globals, so a manifest name can never shadow them.
    it("does not shadow a user variable named path", () => {
        expect(render('{{ path }}|{% path "page" %}', { path: "mine" })).toBe("mine|src/ProductPage.tsx");
    });

    // Globals, unlike scope, survive the isolated context {% render %} spawns.
    it("resolves inside a {% render %} partial", () => {
        const root = tempDir();

        fs.writeFileSync(path.join(root, "partial.liquid"), '{% path "formData" %}', "utf-8");

        const rooted = makeEngine(root);

        expect(
            String(
                rooted.parseAndRenderSync(
                    '{% render "partial" %}',
                    {},
                    {
                        globals: { [templateTargetsScopeKey]: targets },
                    },
                ),
            ),
        ).toBe("src/ProductFormData.ts");
    });

    // A tag's output cannot be piped; {% capture %} is the documented workaround.
    it("is not pipeable", () => {
        expect(() => render('{% path "formData" | upcase %}')).toThrow("takes exactly one argument");
    });
});
