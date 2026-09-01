import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { executeWritePlan } from "render/executeWritePlan.ts";
import { readTree } from "test/support/readTree.ts";
import { tempDir } from "test/support/tempDir.ts";

const write = (root: string, relativePath: string, contents: string) => ({
    templateName: relativePath,
    targetPath: path.join(root, relativePath),
    contents,
});

describe("executeWritePlan", () => {
    it("writes every planned file and returns the paths in order", () => {
        const root = tempDir();
        const plan = [write(root, "a.ts", "A"), write(root, "b.ts", "B")];

        expect(executeWritePlan(plan)).toEqual([plan[0]?.targetPath, plan[1]?.targetPath]);
        expect(readTree(root)).toEqual({ "a.ts": "A", "b.ts": "B" });
    });

    it("creates missing parent directories", () => {
        const root = tempDir();

        executeWritePlan([write(root, "deep/nested/a.ts", "A")]);

        expect(readTree(root)).toEqual({ "deep/nested/a.ts": "A" });
    });

    // Defect #3: deliberate 0.1.0 behaviour, documented in the README. There is no --force yet.
    it("overwrites an existing file without warning", () => {
        const root = tempDir();

        fs.writeFileSync(path.join(root, "a.ts"), "hand-edited", "utf-8");
        executeWritePlan([write(root, "a.ts", "generated")]);

        expect(readTree(root)).toEqual({ "a.ts": "generated" });
    });

    it("writes nothing and returns an empty array for an empty plan", () => {
        const root = tempDir();

        expect(executeWritePlan([])).toEqual([]);
        expect(readTree(root)).toEqual({});
    });
});
