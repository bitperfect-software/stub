import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { writeTextFile } from "io/writeTextFile.ts";
import { tempDir } from "test/support/tempDir.ts";

describe("writeTextFile", () => {
    it("writes the contents to the file", () => {
        const filePath = path.join(tempDir(), "a.txt");

        writeTextFile(filePath, "hello");

        expect(fs.readFileSync(filePath, "utf-8")).toBe("hello");
    });

    it("creates every missing parent directory", () => {
        const filePath = path.join(tempDir(), "deep", "nested", "a.txt");

        writeTextFile(filePath, "hello");

        expect(fs.readFileSync(filePath, "utf-8")).toBe("hello");
    });

    it("overwrites an existing file", () => {
        const filePath = path.join(tempDir(), "a.txt");

        writeTextFile(filePath, "first");
        writeTextFile(filePath, "second");

        expect(fs.readFileSync(filePath, "utf-8")).toBe("second");
    });
});
