import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { renderExpression, renderTemplateFile } from "templates/renderLiquid.ts";
import { makeEngine } from "test/support/makeEngine.ts";
import { tempDir } from "test/support/tempDir.ts";

const engine = makeEngine();

describe("renderExpression", () => {
    it("renders an inline expression against the scope", () => {
        expect(renderExpression(engine, "src/{{ entity }}.ts", { entity: "Product" })).toBe("src/Product.ts");
    });

    it("returns a string even when the expression yields a number", () => {
        expect(renderExpression(engine, "{{ n }}", { n: 3 })).toBe("3");
    });

    // No globals reach an expression, which is what keeps {% path %} out of manifest expressions.
    it("gives the tags no targets, so they cannot be used in a manifest expression", () => {
        expect(() => renderExpression(engine, '{% path "a" %}', {})).toThrow("only available in a template body");
    });
});

describe("renderTemplateFile", () => {
    it("renders the body the engine resolves from root and extension", () => {
        const root = tempDir();

        fs.writeFileSync(path.join(root, "model.liquid"), "class {{ entity }} {}", "utf-8");

        expect(renderTemplateFile(makeEngine(root), "model", { entity: "Product" }, {})).toBe("class Product {}");
    });

    it("hands the targets to the tags as globals", () => {
        const root = tempDir();

        fs.writeFileSync(path.join(root, "model.liquid"), '{% path "other" %}', "utf-8");

        const targets = { other: { path: "src/Other.ts", references: {}, defaultReference: null } };

        expect(renderTemplateFile(makeEngine(root), "model", {}, targets)).toBe("src/Other.ts");
    });
});
