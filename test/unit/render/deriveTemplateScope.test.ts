import { describe, expect, it } from "vitest";
import { getTemplate } from "manifest/getTemplate.ts";
import { deriveTemplateScope } from "render/deriveTemplateScope.ts";
import { makeEngine } from "test/support/makeEngine.ts";
import { makeManifest } from "test/support/makeManifest.ts";

const engine = makeEngine();
const computed = (name: string, value: string) => ({ name, description: `the ${name}`, value });

describe("deriveTemplateScope", () => {
    it("derives the manifest globals before the template's own computed", () => {
        const manifest = makeManifest({
            computed: [computed("base", "{{ entity }}")],
            templates: { model: { path: "a.ts", computed: [computed("full", "{{ base }}Model")] } },
        });

        const scope = deriveTemplateScope(engine, manifest, getTemplate(manifest, "model"), { entity: "Product" });

        expect(scope.full).toBe("ProductModel");
    });

    it("lets a template's own computed shadow a global of the same name", () => {
        const manifest = makeManifest({
            computed: [computed("dir", "shared")],
            templates: { model: { path: "a.ts", computed: [computed("dir", "own")] } },
        });

        const scope = deriveTemplateScope(engine, manifest, getTemplate(manifest, "model"), {});

        expect(scope.dir).toBe("own");
    });

    it("lets a shadowing computed build on the global value it shadows", () => {
        const manifest = makeManifest({
            computed: [computed("dir", "shared")],
            templates: { model: { path: "a.ts", computed: [computed("dir", "{{ dir }}/nested")] } },
        });

        const scope = deriveTemplateScope(engine, manifest, getTemplate(manifest, "model"), {});

        expect(scope.dir).toBe("shared/nested");
    });

    it("does not leak a template's own computed into another template's scope", () => {
        const manifest = makeManifest({
            templates: {
                model: { path: "a.ts", computed: [computed("only", "mine")] },
                other: { path: "b.ts" },
            },
        });

        const scope = deriveTemplateScope(engine, manifest, getTemplate(manifest, "other"), {});

        expect(scope).not.toHaveProperty("only");
    });

    it("lets a CLI override beat a template's own computed", () => {
        const manifest = makeManifest({
            templates: { model: { path: "a.ts", computed: [computed("dir", "own")] } },
        });

        const scope = deriveTemplateScope(engine, manifest, getTemplate(manifest, "model"), { dir: "cli" });

        expect(scope.dir).toBe("cli");
    });
});
