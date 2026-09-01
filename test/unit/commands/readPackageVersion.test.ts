import { describe, expect, it } from "vitest";
import { readPackageVersion } from "commands/readPackageVersion.ts";
import { readJsonFile } from "io/readJsonFile.ts";

describe("readPackageVersion", () => {
    // The regression test for the hardcoded ".version(\"0.0.1\")" this replaced.
    it("returns the version in package.json", () => {
        const { version } = readJsonFile("package.json") as { version: string };

        expect(readPackageVersion()).toBe(version);
    });
});
