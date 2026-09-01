import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { planTemplateWrites } from "render/planTemplateWrites.ts";
import { makeWorkspace, type StubDirectory } from "test/support/makeWorkspace.ts";
import { readTree } from "test/support/readTree.ts";
import { tempDir } from "test/support/tempDir.ts";

const plan = (contents: StubDirectory, templateName: string, includeRequires = true) => {
    const projectRoot = tempDir();
    const workspace = makeWorkspace(projectRoot, contents);

    return {
        projectRoot,
        run: () => planTemplateWrites(workspace, { templateName, input: { entity: "Product" }, includeRequires }),
    };
};

const chain: StubDirectory = {
    manifest: {
        variables: [{ name: "entity", description: "the entity" }],
        templates: {
            page: { path: "src/{{ entity }}Page.tsx", requires: ["formData"] },
            formData: { path: "src/{{ entity }}FormData.ts" },
        },
    },
    bodies: { page: "page of {{ entity }}", formData: "data of {{ entity }}" },
};

describe("planTemplateWrites", () => {
    it("plans one write per entry in the chain, in chain order", () => {
        expect(
            plan(chain, "page")
                .run()
                .map(({ templateName }) => templateName),
        ).toEqual(["page", "formData"]);
    });

    it("plans only the root when includeRequires is false", () => {
        expect(
            plan(chain, "page", false)
                .run()
                .map(({ templateName }) => templateName),
        ).toEqual(["page"]);
    });

    it("resolves every target path against the project root", () => {
        const { projectRoot, run } = plan(chain, "page");

        expect(run().map(({ targetPath }) => targetPath)).toEqual([
            path.join(projectRoot, "src/ProductPage.tsx"),
            path.join(projectRoot, "src/ProductFormData.ts"),
        ]);
    });

    // The core guarantee of the plan/execute split.
    it("writes nothing to disk", () => {
        const { projectRoot, run } = plan(chain, "page");
        const before = readTree(projectRoot);

        run();

        expect(readTree(projectRoot)).toEqual(before);
    });

    it("throws when the requested template is not in the manifest", () => {
        expect(plan(chain, "ghost").run).toThrow("Unknown template ghost");
    });

    it("throws when a required template is not in the manifest", () => {
        const broken: StubDirectory = {
            manifest: { templates: { page: { path: "a.tsx", requires: ["ghost"] } } },
            bodies: { page: "x" },
        };

        expect(plan(broken, "page").run).toThrow("Unknown template ghost");
    });

    it("throws when a body file is missing, and writes nothing", () => {
        const { projectRoot, run } = plan({ manifest: { templates: { page: { path: "a.tsx" } } } }, "page");
        const before = readTree(projectRoot);

        expect(run).toThrow("ENOENT");
        expect(readTree(projectRoot)).toEqual(before);
    });

    it("throws when a body has a Liquid syntax error, and writes nothing", () => {
        const { projectRoot, run } = plan(
            { manifest: { templates: { page: { path: "a.tsx" } } }, bodies: { page: "{% if x %}" } },
            "page",
        );
        const before = readTree(projectRoot);

        expect(run).toThrow(/not closed/);
        expect(readTree(projectRoot)).toEqual(before);
    });

    it("throws when a body references an unknown manifest key, and writes nothing", () => {
        const { projectRoot, run } = plan(
            { manifest: { templates: { page: { path: "a.tsx" } } }, bodies: { page: '{% path "ghost" %}' } },
            "page",
        );
        const before = readTree(projectRoot);

        expect(run).toThrow("not in the manifest");
        expect(readTree(projectRoot)).toEqual(before);
    });

    // What `{% path %}` emits *is* the file written, because both read the same resolved target.
    it("makes a body's {% path %} equal the planned targetPath for that entry", () => {
        const { projectRoot, run } = plan(
            {
                manifest: {
                    variables: [{ name: "entity", description: "the entity" }],
                    templates: {
                        page: { path: "src/{{ entity }}Page.tsx", requires: ["formData"] },
                        formData: { path: "src/{{ entity }}FormData.ts" },
                    },
                },
                bodies: { page: '{% path "formData" %}', formData: "x" },
            },
            "page",
        );

        const [page, formData] = run();

        expect(path.join(projectRoot, page?.contents ?? "")).toBe(formData?.targetPath);
    });

    it("renders each body with its own scope, not the root's", () => {
        const { run } = plan(
            {
                manifest: {
                    templates: {
                        page: {
                            path: "a.tsx",
                            requires: ["formData"],
                            computed: [{ name: "who", description: "d", value: "page" }],
                        },
                        formData: { path: "b.ts", computed: [{ name: "who", description: "d", value: "formData" }] },
                    },
                },
                bodies: { page: "{{ who }}", formData: "{{ who }}" },
            },
            "page",
        );

        expect(run().map(({ contents }) => contents)).toEqual(["page", "formData"]);
    });
});
