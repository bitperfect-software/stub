import { describe, expect, it } from "vitest";
import { readTree } from "test/support/readTree.ts";
import { runStub } from "test/support/runStub.ts";
import { useFixture } from "test/support/useFixture.ts";

/** The whole point of the plan/execute split: a run that fails anywhere leaves the tree untouched. */
describe("nothing is written unless everything renders", () => {
    it.each([
        ["broken-json", ["model", "Invoice"], "Invalid JSON in file"],
        ["broken-schema", ["model", "Invoice"], "Invalid manifest"],
        ["missing-body", ["model", "Invoice"], "ENOENT"],
        ["liquid-syntax-error", ["model", "Invoice"], "tag"],
        ["unknown-path-key", ["model", "Invoice"], "not in the manifest"],
        ["undeclared-format", ["model", "Invoice"], "is not a declared reference format"],
        ["duplicate-command", ["use-columns-hook"], "cannot add command"],
        ["duplicate-flag", ["model", "Invoice"], "conflicting flag"],
    ])("leaves the tree unwritten when %s fails", (fixture, args, expected) => {
        const projectRoot = useFixture(fixture);
        const before = readTree(projectRoot);

        const { status, stderr } = runStub(projectRoot, args);

        expect(status).toBe(1);
        expect(stderr).toContain(expected);
        expect(stderr).not.toContain("\n    at ");
        expect(readTree(projectRoot)).toEqual(before);
    });

    it("exits 1 and writes nothing when a required positional is missing", () => {
        const projectRoot = useFixture("nested");
        const before = readTree(projectRoot);

        expect(runStub(projectRoot, ["model"]).status).toBe(1);
        expect(readTree(projectRoot)).toEqual(before);
    });

    it("exits 1 and writes nothing for an unknown option", () => {
        const projectRoot = useFixture("nested");
        const before = readTree(projectRoot);

        expect(runStub(projectRoot, ["model", "Product", "--nope"]).status).toBe(1);
        expect(readTree(projectRoot)).toEqual(before);
    });

    it("exits 1 for an unknown command", () => {
        expect(runStub(useFixture("nested"), ["nonsense"]).status).toBe(1);
    });

    it("names the missing manifest key in the {% path %} failure", () => {
        expect(runStub(useFixture("unknown-path-key"), ["model", "Invoice"]).stderr).toContain('{% path "nope" %}');
    });

    it("lists the declared formats in the {% reference %} failure", () => {
        expect(runStub(useFixture("undeclared-format"), ["model", "Invoice"]).stderr).toContain(
            "templates.json declares module, url",
        );
    });

    it("prints a stack trace when STUB_DEBUG=1", () => {
        const { status, stderr } = runStub(useFixture("broken-json"), ["model", "Invoice"], { STUB_DEBUG: "1" });

        expect(status).toBe(1);
        expect(stderr).toContain("\n    at ");
    });
});
