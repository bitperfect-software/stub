import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { findProjectRoot } from "workspace/findProjectRoot.ts";
import { tempDir } from "test/support/tempDir.ts";

/** Randomly named, so the walk to `/` cannot find a real `.stub` on the machine running the tests. */
const marker = () => `.stub-test-${randomUUID()}`;

const makeDirectory = (...segments: Array<string>): string => {
    const directory = path.join(...segments);

    fs.mkdirSync(directory, { recursive: true });

    return directory;
};

describe("findProjectRoot", () => {
    it("returns the start directory when it contains the marker directory", () => {
        const root = tempDir();
        const name = marker();

        makeDirectory(root, name);

        expect(findProjectRoot(root, name)).toBe(root);
    });

    it("walks up and returns the closest ancestor that contains the marker", () => {
        const root = tempDir();
        const name = marker();

        makeDirectory(root, name);

        expect(findProjectRoot(makeDirectory(root, "deep", "a", "b"), name)).toBe(root);
    });

    it("returns the nearest of two ancestors that contain the marker", () => {
        const root = tempDir();
        const name = marker();
        const nearer = makeDirectory(root, "nested");

        makeDirectory(root, name);
        makeDirectory(nearer, name);

        expect(findProjectRoot(makeDirectory(nearer, "deep"), name)).toBe(nearer);
    });

    it("returns null when no ancestor contains the marker", () => {
        expect(findProjectRoot(tempDir(), marker())).toBeNull();
    });

    it("searches from the containing directory when given a file path", () => {
        const root = tempDir();
        const name = marker();
        const filePath = path.join(root, "a.txt");

        makeDirectory(root, name);
        fs.writeFileSync(filePath, "x", "utf-8");

        expect(findProjectRoot(filePath, name)).toBe(root);
    });

    it("ignores a marker that is a file rather than a directory", () => {
        const root = tempDir();
        const name = marker();

        fs.writeFileSync(path.join(root, name), "x", "utf-8");

        expect(findProjectRoot(root, name)).toBeNull();
    });

    // Defect #2, resolved in phase 02: a deleted working directory simply has no project.
    it("returns null when the start path does not exist", () => {
        expect(findProjectRoot(path.join(tempDir(), "gone", "deeper"), marker())).toBeNull();
    });
});
