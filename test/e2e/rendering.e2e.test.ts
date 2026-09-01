import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { writeStubDirectory } from "test/support/makeWorkspace.ts";
import { readTree } from "test/support/readTree.ts";
import { runStub } from "test/support/runStub.ts";
import { tempDir } from "test/support/tempDir.ts";
import { useFixture } from "test/support/useFixture.ts";

const workload = {
    manifest: {
        variables: [{ name: "entity", description: "the entity name" }],
        computed: [{ name: "entityPlural", description: "the plural form", value: "{{ entity | plural }}" }],
        switches: [{ name: "noDelete", description: "drops the delete handling" }],
        reference: "@/{{ targetPath | remove_first: 'out/' }}",
        templates: {
            page: { path: "out/{{ entityPlural | kebabCase }}/{{ entity }}Page.tsx", requires: ["formData", "api"] },
            formData: { path: "out/{{ entityPlural | kebabCase }}/{{ entity }}FormData.ts" },
            api: { path: "out/{{ entityPlural | kebabCase }}/{{ entity }}Api.ts" },
        },
    },
    bodies: {
        page: [
            'import type { {{ entity }}FormData } from "{% reference "formData" %}";',
            'import { load{{ entityPlural }} } from "{% reference "api" %}";',
            "",
            "export const {{ entity }}Page = () => null;",
            "{% unless noDelete %}export const delete{{ entity }} = () => null;",
            "{% endunless %}",
        ].join("\n"),
        formData: "export interface {{ entity }}FormData {}\n",
        api: "export const load{{ entityPlural }} = () => [];\n",
    },
};

const project = () => {
    const projectRoot = tempDir();

    writeStubDirectory(projectRoot, workload);

    return projectRoot;
};

describe("rendering", () => {
    it("writes every file in the chain and prints one line per file", () => {
        const projectRoot = project();
        const { status, stdout } = runStub(projectRoot, ["page", "Product"]);

        expect(status).toBe(0);
        expect(stdout.trim().split("\n")).toHaveLength(3);
        expect(readTree(projectRoot)).toMatchInlineSnapshot(`
          {
            "out/products/ProductApi.ts": "export const loadProducts = () => [];
          ",
            "out/products/ProductFormData.ts": "export interface ProductFormData {}
          ",
            "out/products/ProductPage.tsx": "import type { ProductFormData } from "@/products/ProductFormData.ts";
          import { loadProducts } from "@/products/ProductApi.ts";

          export const ProductPage = () => null;
          export const deleteProduct = () => null;
          ",
          }
        `);
    });

    it("renders the same tree when run from a nested subdirectory", () => {
        const fromRoot = project();
        const fromNested = project();
        const deep = path.join(fromNested, "deep", "a", "b");

        fs.mkdirSync(deep, { recursive: true });
        runStub(fromRoot, ["page", "Product"]);

        expect(runStub(deep, ["page", "Product"]).status).toBe(0);
        expect(readTree(fromNested)).toEqual(readTree(fromRoot));
    });

    it("writes only the root template under --noRequires", () => {
        const projectRoot = project();

        expect(runStub(projectRoot, ["--noRequires", "page", "Product"]).status).toBe(0);
        expect(Object.keys(readTree(projectRoot))).toEqual(["out/products/ProductPage.tsx"]);
    });

    it("propagates a computed override into every required template", () => {
        const projectRoot = project();

        expect(runStub(projectRoot, ["page", "Product", "--entityPlural", "Producten"]).status).toBe(0);
        expect(Object.keys(readTree(projectRoot))).toEqual([
            "out/producten/ProductApi.ts",
            "out/producten/ProductFormData.ts",
            "out/producten/ProductPage.tsx",
        ]);
    });

    // Byte-identical siblings are what prove the switch removed content and nothing else.
    it("omits the switched-off section from the output", () => {
        const withDelete = project();
        const withoutDelete = project();

        runStub(withDelete, ["page", "Product"]);
        runStub(withoutDelete, ["page", "Product", "--noDelete"]);

        const before = readTree(withDelete);
        const after = readTree(withoutDelete);

        expect(after["out/products/ProductPage.tsx"]).not.toContain("deleteProduct");
        expect(after["out/products/ProductFormData.ts"]).toBe(before["out/products/ProductFormData.ts"]);
        expect(after["out/products/ProductApi.ts"]).toBe(before["out/products/ProductApi.ts"]);
    });

    it("uses a template's own computed in its own path when it shadows a global", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, {
            manifest: {
                computed: [{ name: "dir", description: "the directory", value: "shared" }],
                templates: {
                    root: { path: "{{ dir }}/root.ts", requires: ["own"] },
                    own: { path: "{{ dir }}/own.ts", computed: [{ name: "dir", description: "d", value: "mine" }] },
                },
            },
            bodies: { root: "root", own: "own" },
        });

        expect(runStub(projectRoot, ["root"]).status).toBe(0);
        expect(Object.keys(readTree(projectRoot))).toEqual(["mine/own.ts", "shared/root.ts"]);
    });

    it("terminates a requires cycle and writes each file exactly once", () => {
        const projectRoot = useFixture("cycle");

        expect(runStub(projectRoot, ["a", "Product"]).status).toBe(0);
        expect(readTree(projectRoot)).toEqual({
            "out/ProductA.ts": "A of Product",
            "out/ProductB.ts": "B of Product",
        });
    });

    it("terminates a self cycle", () => {
        const projectRoot = useFixture("self-requires");

        expect(runStub(projectRoot, ["a", "Product"]).status).toBe(0);
        expect(readTree(projectRoot)).toEqual({ "out/ProductA.ts": "A of Product" });
    });

    // Both tags are independent of `requires`: a body may point at a sibling this run never writes.
    it("resolves an entry outside the chain from a body under --noRequires", () => {
        const projectRoot = useFixture("outside-chain");

        expect(runStub(projectRoot, ["--noRequires", "model", "Product"]).status).toBe(0);
        expect(readTree(projectRoot)).toEqual({
            "out/Product.ts": "path: out/ProductSibling.ts\nref: @/ProductSibling.ts\n",
        });
    });

    it("resolves mutual {% path %} references", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, {
            manifest: { templates: { a: { path: "out/a.ts", requires: ["b"] }, b: { path: "out/b.ts" } } },
            bodies: { a: '{% path "b" %}', b: '{% path "a" %}' },
        });

        expect(runStub(projectRoot, ["a"]).status).toBe(0);
        expect(readTree(projectRoot)).toEqual({ "out/a.ts": "out/b.ts", "out/b.ts": "out/a.ts" });
    });

    it("resolves a tag used inside a {% render %} partial", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, {
            manifest: { templates: { a: { path: "out/a.ts" }, b: { path: "out/b.ts" } } },
            bodies: { a: '{% render "imports" %}', b: "b", imports: '{% path "b" %}' },
        });

        expect(runStub(projectRoot, ["a"]).status).toBe(0);
        expect(readTree(projectRoot)["out/a.ts"]).toBe("out/b.ts");
    });

    // What the tag emits is the very value the run writes to, never a second rendering.
    it("emits from {% path %} exactly the path it writes to", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, {
            manifest: {
                variables: [{ name: "entity", description: "the entity name" }],
                computed: [{ name: "entityPlural", description: "the plural", value: "{{ entity | plural }}" }],
                templates: {
                    a: { path: "out/{{ entityPlural }}/a.ts", requires: ["b"] },
                    b: { path: "out/{{ entityPlural }}/{{ entity }}B.ts" },
                },
            },
            bodies: { a: '{% path "b" %}', b: "b" },
        });

        runStub(projectRoot, ["a", "Product"]);

        const tree = readTree(projectRoot);

        expect(tree).toHaveProperty(tree["out/Products/a.ts"] ?? "");
    });

    /**
     * The regression net for the phase-02 ESM fix. `pluralize` is CommonJS: the named import this
     * once used throws `SyntaxError: Named export 'plural' not found` under plain Node, which only
     * the spawned bundle exercises — Vite's interop hides it from the unit project entirely.
     */
    it("renders the plural and singular filters through the built bundle", () => {
        const projectRoot = tempDir();

        writeStubDirectory(projectRoot, {
            manifest: {
                variables: [{ name: "entity", description: "the entity name" }],
                templates: { model: { path: "out/model.ts" } },
            },
            bodies: { model: "{{ entity | plural }}|{{ entity | singular }}" },
        });

        const { status, stderr } = runStub(projectRoot, ["model", "Person"]);

        expect(stderr).toBe("");
        expect(status).toBe(0);
        expect(readTree(projectRoot)["out/model.ts"]).toBe("People|Person");
    });

    it("overwrites an existing file on a second run", () => {
        const projectRoot = project();

        runStub(projectRoot, ["--noRequires", "page", "Product"]);
        fs.writeFileSync(path.join(projectRoot, "out/products/ProductPage.tsx"), "hand-edited", "utf-8");

        expect(runStub(projectRoot, ["--noRequires", "page", "Product"]).status).toBe(0);
        expect(readTree(projectRoot)["out/products/ProductPage.tsx"]).not.toBe("hand-edited");
    });
});
