import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { readJsonFile } from "io/readJsonFile.ts";
import { tempDir } from "test/support/tempDir.ts";

describe("readJsonFile", () => {
    it("parses the JSON in a file", () => {
        const root = tempDir();
        const filePath = path.join(root, "data.json");

        fs.writeFileSync(filePath, '{ "a": 1 }', "utf-8");

        expect(readJsonFile(filePath)).toEqual({ a: 1 });
    });

    it("throws File not found with the absolute path", () => {
        const filePath = path.join(tempDir(), "missing.json");

        expect(() => readJsonFile(filePath)).toThrow(`File not found: ${filePath}`);
    });

    it("throws Invalid JSON in file for malformed JSON", () => {
        const root = tempDir();
        const filePath = path.join(root, "data.json");

        fs.writeFileSync(filePath, "{", "utf-8");

        expect(() => readJsonFile(filePath)).toThrow(`Invalid JSON in file: ${filePath}`);
    });

    // existsSync passes, readFileSync does not: a directory is the reachable way in.
    it("throws Failed to read file when the path is not readable as a file", () => {
        const root = tempDir();
        const directory = path.join(root, "nested");

        fs.mkdirSync(directory);

        expect(() => readJsonFile(directory)).toThrow(`Failed to read file: ${directory}`);
    });

    it("resolves a relative path against the current directory", () => {
        const relativePath = path.relative(process.cwd(), path.join(process.cwd(), "package.json"));

        expect(readJsonFile(relativePath)).toHaveProperty("name", "@bitperfect-software/stub");
    });
});
