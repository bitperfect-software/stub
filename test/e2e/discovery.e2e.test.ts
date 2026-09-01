import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { readTree } from "test/support/readTree.ts";
import { runStub } from "test/support/runStub.ts";
import { tempDir } from "test/support/tempDir.ts";
import { useFixture } from "test/support/useFixture.ts";

describe("project discovery", () => {
    it("finds the project root from the root itself", () => {
        const projectRoot = useFixture("nested");

        expect(runStub(projectRoot, ["model", "Product"]).status).toBe(0);
        expect(Object.keys(readTree(projectRoot))).toContain("out/products/Product.ts");
    });

    it("finds the project root from a nested subdirectory", () => {
        const projectRoot = useFixture("nested");

        expect(runStub(path.join(projectRoot, "deep", "a", "b"), ["model", "Product"]).status).toBe(0);
        expect(Object.keys(readTree(projectRoot))).toContain("out/products/Product.ts");
    });

    it("exits 1 with a helpful message when there is no .stub anywhere", () => {
        const { status, stderr } = runStub(tempDir(), ["model", "Product"]);

        expect(status).toBe(1);
        expect(stderr).toContain("Could not find a .stub directory");
        expect(stderr).toContain("Run `stub guide`");
    });

    it("exits 1 when .stub exists but has no templates.json", () => {
        const { status, stderr } = runStub(useFixture("no-manifest"), ["model", "Product"]);

        expect(status).toBe(1);
        expect(stderr).toContain("File not found");
        expect(stderr).not.toContain("\n    at ");
    });
});
